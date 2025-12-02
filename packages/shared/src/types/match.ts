export type Sport = 'soccer' | 'basketball' | 'tennis' | 'american_football' | 'baseball' | 'hockey' | 'mma';

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type MarketType =
  | 'match_result'
  | 'asian_handicap'
  | 'over_under'
  | 'both_to_score'
  | 'double_chance'
  | 'correct_score'
  | 'half_time_result'
  | 'first_goalscorer';

export type MarketStatus = 'open' | 'suspended' | 'settled' | 'void';

export type OutcomeResult = 'pending' | 'win' | 'lose' | 'void' | 'half_win' | 'half_lose';

export interface League {
  id: string;
  name: string;
  country: string;
  sport: Sport;
  logo?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

export interface Match {
  id: string;
  sport: Sport;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
}

export interface MatchWithOdds extends Match {
  bestOdds: {
    home: number | null;
    draw: number | null;
    away: number | null;
  };
  marketsCount: number;
}

export interface Outcome {
  id: string;
  name: string;
  odds: number;
  previousOdds?: number;
  movement?: 'up' | 'down' | 'stable';
}

export interface Market {
  id: string;
  name: string;
  type: MarketType;
  line?: number;
  status: MarketStatus;
  outcomes: Outcome[];
}

export interface MatchDetail extends Match {
  markets: Market[];
}
