# Technical Architecture Reference

This document provides technical depth on the key systems discussed in the research.

---

## 1. Axiom's Technical Stack (Reverse-Engineered)

Based on job postings and public information:

### Frontend
```
Framework: Next.js (React)
Language: TypeScript
Styling: Tailwind CSS (dark theme, terminal aesthetic)
State: React Query + Zustand (real-time data)
Charts: TradingView Lightweight Charts / Custom D3
WebSocket: For real-time price feeds
```

### Backend
```
Language: Rust (performance-critical paths)
Framework: Actix-web or Axum
Database:
  - PostgreSQL (user data, positions)
  - Redis (caching, rate limiting)
  - ClickHouse (analytics, time-series)
Message Queue: Kafka or NATS (event streaming)
```

### Blockchain Integration
```
Solana:
  - RPC: Helius, Triton, or private nodes
  - SDK: @solana/web3.js + Anchor
  - Programs: Custom Rust programs for vault logic

Hyperliquid:
  - REST + WebSocket API integration
  - Cross-chain messaging for position sync
```

### Key Technical Challenges Solved

**1. Cross-Chain Abstraction**
```
User Action: "Open 10x BTC short"
Backend Flow:
  1. Check user USDC balance (Solana)
  2. Calculate required margin
  3. Sign cross-chain message to Hyperliquid
  4. Open position via Hyperliquid API
  5. Update internal ledger
  6. Reflect position in UI (real-time)

User sees: Instant position, no bridging visible
```

**2. Liquidity Aggregation**
```
User Action: "Buy $50k BONK"
Backend Flow:
  1. Query Raydium, Orca, Jupiter for quotes
  2. Calculate optimal split (minimize slippage)
  3. Execute parallel transactions
  4. Aggregate fill prices
  5. Report blended execution price
```

---

## 2. Intent-Based Architecture Pattern

### Intent Data Structure
```typescript
interface Intent {
  id: string;
  user: PublicKey;
  type: 'swap' | 'stake' | 'bet' | 'yield' | 'custom';

  // What user wants
  input: {
    token: string;
    amount: number;
    maxSlippage?: number;
  };

  output: {
    token?: string;        // For swaps
    minAmount?: number;
    constraints?: string[];  // ["yield > 5%", "risk < medium"]
  };

  // Execution preferences
  preferences: {
    urgency: 'immediate' | 'patient';
    gasLimit?: number;
    deadline: number;  // Unix timestamp
  };

  // State
  status: 'pending' | 'solving' | 'executing' | 'completed' | 'failed';
  solver?: PublicKey;
  solution?: Solution;
}
```

### Solver Architecture
```typescript
interface Solver {
  id: string;
  stake: number;  // Bonded collateral
  reputation: number;  // Historical performance

  // Solver capabilities
  specializations: string[];  // ['yield', 'swaps', 'sports']
  supportedChains: string[];

  // Performance metrics
  metrics: {
    totalSolved: number;
    avgExecutionQuality: number;  // vs benchmark
    failureRate: number;
  };
}

// Solver competition flow
async function solveIntent(intent: Intent): Promise<Solution> {
  // 1. Analyze intent
  const analysis = await analyzeIntent(intent);

  // 2. Generate candidate solutions
  const candidates = await generateSolutions(analysis);

  // 3. Simulate each solution
  const simulated = await Promise.all(
    candidates.map(c => simulateExecution(c))
  );

  // 4. Score and rank
  const ranked = simulated
    .filter(s => s.meetsConstraints)
    .sort((a, b) => b.score - a.score);

  // 5. Return best solution
  return ranked[0];
}
```

---

## 3. AI Agent Architecture for Trading

### Multi-Agent System Design
```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                       │
│  - Receives user intents                                    │
│  - Delegates to specialized agents                          │
│  - Aggregates results                                       │
│  - Makes final decisions                                    │
└─────────────────────────────────────────────────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ MARKET    │ │ SENTIMENT │ │ ON-CHAIN  │ │ RISK      │
│ ANALYZER  │ │ ANALYZER  │ │ ANALYZER  │ │ MANAGER   │
│           │ │           │ │           │ │           │
│ - Price   │ │ - Twitter │ │ - Whale   │ │ - Position│
│   action  │ │ - Discord │ │   moves   │ │   sizing  │
│ - Volume  │ │ - News    │ │ - LP      │ │ - Stop    │
│ - Correl. │ │ - Reddit  │ │   flows   │ │   losses  │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

### LLM Integration Pattern
```python
from anthropic import Anthropic
import json

class TradingAgent:
    def __init__(self):
        self.client = Anthropic()
        self.tools = self._define_tools()

    def _define_tools(self):
        return [
            {
                "name": "get_price",
                "description": "Get current price of a token",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "token": {"type": "string"}
                    }
                }
            },
            {
                "name": "execute_swap",
                "description": "Execute a token swap",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "from_token": {"type": "string"},
                        "to_token": {"type": "string"},
                        "amount": {"type": "number"},
                        "max_slippage": {"type": "number"}
                    }
                }
            },
            {
                "name": "analyze_sentiment",
                "description": "Analyze social sentiment for a token",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "token": {"type": "string"}
                    }
                }
            }
        ]

    async def process_intent(self, user_intent: str) -> dict:
        messages = [
            {
                "role": "user",
                "content": f"""
                You are a crypto trading agent. Process this intent:

                {user_intent}

                Use the available tools to:
                1. Gather necessary information
                2. Analyze the opportunity
                3. Execute if appropriate
                4. Report results
                """
            }
        ]

        # Agentic loop
        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                tools=self.tools,
                messages=messages
            )

            if response.stop_reason == "end_turn":
                return self._extract_result(response)

            # Process tool calls
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await self._execute_tool(
                        block.name,
                        block.input
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result)
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
```

---

## 4. Sports Betting Execution Engine

### Odds Aggregation System
```python
from dataclasses import dataclass
from typing import List, Optional
import asyncio

@dataclass
class OddsQuote:
    book: str
    odds: float
    max_stake: float
    latency_ms: int
    timestamp: float

@dataclass
class ExecutionPlan:
    quotes: List[tuple[OddsQuote, float]]  # (quote, stake_amount)
    total_stake: float
    weighted_odds: float
    expected_value: float

class OddsAggregator:
    def __init__(self):
        self.books = {
            'pinnacle': PinnacleAPI(),
            'isn': ISNAPI(),
            'betfair': BetfairAPI(),
            'singbet': SingbetAPI(),
        }

    async def get_best_execution(
        self,
        event_id: str,
        market: str,
        target_stake: float
    ) -> ExecutionPlan:
        # Fetch quotes from all books in parallel
        quotes = await asyncio.gather(*[
            self._fetch_quote(book, event_id, market)
            for book in self.books.values()
        ])

        # Filter valid quotes
        valid_quotes = [q for q in quotes if q is not None]

        # Sort by odds (best first)
        valid_quotes.sort(key=lambda q: q.odds, reverse=True)

        # Build execution plan (greedy allocation)
        plan = []
        remaining = target_stake

        for quote in valid_quotes:
            if remaining <= 0:
                break

            allocation = min(remaining, quote.max_stake)
            plan.append((quote, allocation))
            remaining -= allocation

        if remaining > 0:
            raise InsufficientLiquidity(f"Could only fill {target_stake - remaining}/{target_stake}")

        # Calculate weighted average odds
        weighted_odds = sum(q.odds * amt for q, amt in plan) / target_stake

        return ExecutionPlan(
            quotes=plan,
            total_stake=target_stake,
            weighted_odds=weighted_odds,
            expected_value=self._calculate_ev(weighted_odds, market)
        )

    async def execute_plan(self, plan: ExecutionPlan) -> ExecutionResult:
        # Execute all bets in parallel
        results = await asyncio.gather(*[
            self._place_bet(quote.book, quote, amount)
            for quote, amount in plan.quotes
        ], return_exceptions=True)

        # Handle partial fills, errors
        return self._aggregate_results(results)
```

### Real-Time Line Monitoring
```python
import asyncio
from collections import deque
from dataclasses import dataclass
import numpy as np

@dataclass
class LineMovement:
    book: str
    market: str
    old_odds: float
    new_odds: float
    timestamp: float

class LineMonitor:
    def __init__(self):
        self.history = {}  # market -> deque of movements
        self.alerts = []

    async def monitor(self, markets: List[str]):
        while True:
            for market in markets:
                current = await self._fetch_current_lines(market)
                movements = self._detect_movements(market, current)

                for movement in movements:
                    await self._process_movement(movement)

            await asyncio.sleep(0.5)  # 500ms polling

    def _detect_movements(self, market: str, current: dict) -> List[LineMovement]:
        movements = []

        if market not in self.history:
            self.history[market] = deque(maxlen=1000)

        last = self.history[market][-1] if self.history[market] else None

        for book, odds in current.items():
            if last and book in last:
                if abs(odds - last[book]) > 0.01:  # 1 cent threshold
                    movements.append(LineMovement(
                        book=book,
                        market=market,
                        old_odds=last[book],
                        new_odds=odds,
                        timestamp=time.time()
                    ))

        self.history[market].append(current)
        return movements

    async def _process_movement(self, movement: LineMovement):
        # Detect steam moves (sharp money)
        if self._is_steam_move(movement):
            await self._alert_steam(movement)

        # Detect arbitrage opportunities
        arb = self._check_arbitrage(movement.market)
        if arb:
            await self._alert_arbitrage(arb)
```

---

## 5. Solana Program Structure (Rust)

### Basic Vault Program
```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("VeCt0r..."); // Your program ID

#[program]
pub mod vector_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.total_deposits = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
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
        vault.total_deposits += amount;

        // Update user position
        let position = &mut ctx.accounts.user_position;
        position.deposited += amount;
        position.last_update = Clock::get()?.unix_timestamp;

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let position = &ctx.accounts.user_position;
        require!(position.deposited >= amount, ErrorCode::InsufficientBalance);

        // Transfer from vault to user (PDA signing)
        let seeds = &[
            b"vault".as_ref(),
            &[ctx.accounts.vault.bump],
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

        // Update state
        let vault = &mut ctx.accounts.vault;
        vault.total_deposits -= amount;

        let position = &mut ctx.accounts.user_position;
        position.deposited -= amount;

        Ok(())
    }
}

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

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub total_deposits: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,
    pub deposited: u64,
    pub last_update: i64,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient balance")]
    InsufficientBalance,
}
```

---

## 6. ML Model Architecture for Sports Prediction

### Feature Engineering Pipeline
```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

class FeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()

    def create_features(self, match_data: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame()

        # Team form (last 5 games)
        features['home_form'] = self._calculate_form(match_data, 'home', 5)
        features['away_form'] = self._calculate_form(match_data, 'away', 5)
        features['form_diff'] = features['home_form'] - features['away_form']

        # Goals statistics
        features['home_goals_scored_avg'] = self._rolling_avg(match_data, 'home_goals', 10)
        features['home_goals_conceded_avg'] = self._rolling_avg(match_data, 'away_goals', 10)
        features['away_goals_scored_avg'] = self._rolling_avg(match_data, 'away_goals', 10)
        features['away_goals_conceded_avg'] = self._rolling_avg(match_data, 'home_goals', 10)

        # Expected goals (if available)
        if 'home_xg' in match_data.columns:
            features['home_xg_avg'] = self._rolling_avg(match_data, 'home_xg', 10)
            features['away_xg_avg'] = self._rolling_avg(match_data, 'away_xg', 10)
            features['xg_diff'] = features['home_xg_avg'] - features['away_xg_avg']

        # Head-to-head
        features['h2h_home_wins'] = self._h2h_record(match_data, 'home_wins', 5)
        features['h2h_draws'] = self._h2h_record(match_data, 'draws', 5)

        # Market odds (closing line value)
        features['pinnacle_implied_prob'] = 1 / match_data['pinnacle_odds']
        features['market_consensus'] = match_data['avg_odds'].apply(lambda x: 1/x)

        # Situational
        features['days_rest_diff'] = match_data['home_rest'] - match_data['away_rest']
        features['travel_distance'] = match_data['away_travel_km']

        return features

class PredictionModel:
    def __init__(self):
        self.models = {
            'xgboost': XGBClassifier(
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8
            ),
            'lightgbm': LGBMClassifier(
                n_estimators=500,
                max_depth=6,
                learning_rate=0.05
            ),
            'neural_net': self._build_nn()
        }

    def _build_nn(self):
        model = Sequential([
            Dense(128, activation='relu', input_shape=(50,)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(3, activation='softmax')  # Home/Draw/Away
        ])
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        return model

    def ensemble_predict(self, features: np.ndarray) -> dict:
        predictions = {}

        for name, model in self.models.items():
            pred = model.predict_proba(features)
            predictions[name] = pred

        # Weighted ensemble
        weights = {'xgboost': 0.4, 'lightgbm': 0.35, 'neural_net': 0.25}

        ensemble = sum(
            predictions[name] * weight
            for name, weight in weights.items()
        )

        return {
            'probabilities': ensemble,
            'confidence': np.max(ensemble),
            'prediction': np.argmax(ensemble),
            'individual': predictions
        }
```

---

## Quick Reference: Tech Stack Summary

| Layer | Recommended Tech |
|-------|------------------|
| **Frontend** | Next.js, TypeScript, Tailwind, TradingView Charts |
| **Backend API** | Rust (Actix/Axum) or Node.js (Fastify) |
| **Database** | PostgreSQL + Redis + ClickHouse |
| **Blockchain** | Solana (Anchor framework) |
| **AI/ML** | Python, PyTorch/XGBoost, Claude API |
| **Data Pipelines** | Kafka, Apache Airflow |
| **Infrastructure** | AWS/GCP, Kubernetes, Terraform |
