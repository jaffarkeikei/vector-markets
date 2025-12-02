export interface UserBalance {
  available: number;
  locked: number;
  inYield: number;
  total: number;
  currency: string;
}

export interface UserStats {
  totalBets: number;
  wonBets: number;
  totalWagered: number;
  totalProfit: number;
  roi: number;
}

export interface User {
  id: string;
  walletAddress: string;
  balance: UserBalance;
  stats: UserStats;
  createdAt: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_stake'
  | 'bet_win'
  | 'bet_refund'
  | 'yield_deposit'
  | 'yield_withdraw'
  | 'yield_earned';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  txHash?: string;
  betId?: string;
  createdAt: string;
}

export interface AuthNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface AuthConnectRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
}

export interface AuthConnectResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    walletAddress: string;
    createdAt: string;
  };
}
