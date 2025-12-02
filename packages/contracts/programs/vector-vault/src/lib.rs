use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("VecT1111111111111111111111111111111111111111");

#[program]
pub mod vector_vault {
    use super::*;

    /// Initialize the vault
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.usdc_mint = ctx.accounts.usdc_mint.key();
        vault.total_deposits = 0;
        vault.bump = ctx.bumps.vault;

        msg!("Vault initialized");
        Ok(())
    }

    /// Deposit USDC into the vault
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        // Transfer USDC from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update vault state
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits = vault.total_deposits.checked_add(amount).unwrap();

        // Update or create user position
        let position = &mut ctx.accounts.user_position;
        if position.owner == Pubkey::default() {
            position.owner = ctx.accounts.user.key();
            position.bump = ctx.bumps.user_position;
        }
        position.deposited = position.deposited.checked_add(amount).unwrap();
        position.last_update = Clock::get()?.unix_timestamp;

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            amount,
            total_deposited: position.deposited,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Deposited {} USDC", amount);
        Ok(())
    }

    /// Withdraw USDC from the vault
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let position = &ctx.accounts.user_position;
        require!(amount > 0, VaultError::InvalidAmount);
        require!(
            position.deposited >= amount,
            VaultError::InsufficientBalance
        );

        // Transfer from vault to user using PDA signing
        let vault = &ctx.accounts.vault;
        let seeds = &[
            b"vault".as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update vault state
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits = vault.total_deposits.checked_sub(amount).unwrap();

        // Update user position
        let position = &mut ctx.accounts.user_position;
        position.deposited = position.deposited.checked_sub(amount).unwrap();
        position.last_update = Clock::get()?.unix_timestamp;

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            amount,
            remaining: position.deposited,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Withdrew {} USDC", amount);
        Ok(())
    }

    /// Lock funds for a bet (called by backend with authority)
    pub fn lock_for_bet(ctx: Context<LockForBet>, amount: u64, bet_id: String) -> Result<()> {
        let position = &mut ctx.accounts.user_position;

        require!(amount > 0, VaultError::InvalidAmount);
        require!(
            position.deposited >= position.locked + amount,
            VaultError::InsufficientBalance
        );

        position.locked = position.locked.checked_add(amount).unwrap();
        position.last_update = Clock::get()?.unix_timestamp;

        emit!(BetLockedEvent {
            user: position.owner,
            amount,
            bet_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Locked {} USDC for bet", amount);
        Ok(())
    }

    /// Settle a bet (called by backend with authority)
    pub fn settle_bet(
        ctx: Context<SettleBet>,
        bet_id: String,
        stake: u64,
        won: bool,
        payout: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.user_position;

        require!(position.locked >= stake, VaultError::InvalidAmount);

        // Unlock the stake
        position.locked = position.locked.checked_sub(stake).unwrap();

        if won {
            // Add winnings (payout includes original stake)
            let winnings = payout.checked_sub(stake).unwrap_or(0);
            position.deposited = position.deposited.checked_add(winnings).unwrap();

            // Update vault total
            let vault = &mut ctx.accounts.vault;
            vault.total_deposits = vault.total_deposits.checked_add(winnings).unwrap();
        } else {
            // Deduct lost stake
            position.deposited = position.deposited.checked_sub(stake).unwrap();

            // Update vault total
            let vault = &mut ctx.accounts.vault;
            vault.total_deposits = vault.total_deposits.checked_sub(stake).unwrap();
        }

        position.last_update = Clock::get()?.unix_timestamp;

        emit!(BetSettledEvent {
            user: position.owner,
            bet_id,
            stake,
            won,
            payout,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Settled bet: won={}, payout={}", won, payout);
        Ok(())
    }
}

// ============================================
// ACCOUNTS
// ============================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = vault,
        seeds = [b"vault_token"],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_token"],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position", user.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == vault.usdc_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_token"],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.owner == user.key()
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == vault.usdc_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct LockForBet<'info> {
    #[account(
        constraint = vault.authority == authority.key()
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"position", user_position.owner.as_ref()],
        bump = user_position.bump
    )]
    pub user_position: Account<'info, UserPosition>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleBet<'info> {
    #[account(
        mut,
        constraint = vault.authority == authority.key()
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"position", user_position.owner.as_ref()],
        bump = user_position.bump
    )]
    pub user_position: Account<'info, UserPosition>,

    pub authority: Signer<'info>,
}

// ============================================
// STATE
// ============================================

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub total_deposits: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub owner: Pubkey,
    pub deposited: u64,
    pub locked: u64,
    pub last_update: i64,
    pub bump: u8,
}

// ============================================
// EVENTS
// ============================================

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub remaining: u64,
    pub timestamp: i64,
}

#[event]
pub struct BetLockedEvent {
    pub user: Pubkey,
    pub amount: u64,
    #[max_len(64)]
    pub bet_id: String,
    pub timestamp: i64,
}

#[event]
pub struct BetSettledEvent {
    pub user: Pubkey,
    #[max_len(64)]
    pub bet_id: String,
    pub stake: u64,
    pub won: bool,
    pub payout: u64,
    pub timestamp: i64,
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum VaultError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
}
