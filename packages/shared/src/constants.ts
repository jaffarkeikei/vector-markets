// Supported sports
export const SPORTS = ['soccer', 'basketball', 'tennis'] as const;

// Major leagues (priority order)
export const MAJOR_LEAGUES = {
  soccer: [
    { id: 'epl', name: 'Premier League', country: 'England' },
    { id: 'laliga', name: 'La Liga', country: 'Spain' },
    { id: 'seriea', name: 'Serie A', country: 'Italy' },
    { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
    { id: 'ligue1', name: 'Ligue 1', country: 'France' },
    { id: 'ucl', name: 'Champions League', country: 'Europe' },
    { id: 'uel', name: 'Europa League', country: 'Europe' },
  ],
} as const;

// Bet limits
export const BET_LIMITS = {
  min: 1, // $1 minimum bet
  max: 10000, // $10,000 maximum bet
} as const;

// Fee structure
export const FEES = {
  platform: 0, // 0% platform fee for now
  withdrawal: 0, // Free withdrawals
} as const;

// Solana configuration
export const SOLANA_CONFIG = {
  devnet: {
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  },
  mainnet: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  development: 'http://localhost:3001',
  production: 'https://api.vectormarkets.io',
} as const;
