export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'half_won' | 'half_lost' | 'cashed_out';

export interface BetOutcome {
  id: string;
  name: string;
  market: string;
  currentOdds?: number;
}

export interface BetMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  result?: string;
  league?: string;
}

export interface Bet {
  id: string;
  status: BetStatus;
  match: BetMatch;
  outcome: BetOutcome;
  stake: number;
  odds: number;
  potentialReturn: number;
  actualReturn?: number;
  profit?: number;
  createdAt: string;
  settledAt?: string;
}

export interface PlaceBetRequest {
  outcomeId: string;
  stake: number;
  oddsAccepted: number;
}

export interface PlaceBetResponse {
  id: string;
  status: BetStatus;
  outcome: {
    id: string;
    name: string;
    matchId: string;
  };
  stake: number;
  odds: number;
  potentialReturn: number;
  createdAt: string;
}

export interface BetSummary {
  totalStake: number;
  potentialReturn: number;
}

export interface BetHistorySummary {
  totalBets: number;
  won: number;
  lost: number;
  void: number;
  totalStake: number;
  totalReturn: number;
  profit: number;
  roi: number;
}
