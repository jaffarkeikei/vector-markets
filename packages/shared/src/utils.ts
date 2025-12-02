/**
 * Format odds to 2 decimal places
 */
export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USDC'): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Shorten a wallet address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Calculate potential return from stake and odds
 */
export function calculatePotentialReturn(stake: number, odds: number): number {
  return stake * odds;
}

/**
 * Calculate profit from stake and odds
 */
export function calculateProfit(stake: number, odds: number): number {
  return stake * (odds - 1);
}

/**
 * Convert decimal odds to implied probability
 */
export function oddsToImpliedProbability(odds: number): number {
  return 1 / odds;
}

/**
 * Convert implied probability to decimal odds
 */
export function probabilityToOdds(probability: number): number {
  return 1 / probability;
}

/**
 * Calculate Kelly criterion stake percentage
 * @param probability Your estimated probability of winning
 * @param odds Decimal odds offered
 * @returns Optimal stake as percentage of bankroll (0-1)
 */
export function kellyStake(probability: number, odds: number): number {
  const b = odds - 1; // Net odds (profit if win)
  const q = 1 - probability; // Probability of losing
  const kelly = (probability * b - q) / b;
  return Math.max(0, kelly);
}

/**
 * Calculate expected value of a bet
 * @param probability Your estimated probability of winning
 * @param odds Decimal odds offered
 * @param stake Stake amount
 * @returns Expected value (+ve is profitable)
 */
export function expectedValue(probability: number, odds: number, stake: number): number {
  const winAmount = stake * (odds - 1);
  const loseAmount = stake;
  return probability * winAmount - (1 - probability) * loseAmount;
}

/**
 * Check if odds represent positive expected value
 */
export function isPositiveEV(probability: number, odds: number): boolean {
  const impliedProb = oddsToImpliedProbability(odds);
  return probability > impliedProb;
}

/**
 * Calculate edge percentage
 */
export function calculateEdge(probability: number, odds: number): number {
  const impliedProb = oddsToImpliedProbability(odds);
  return ((probability - impliedProb) / impliedProb) * 100;
}

/**
 * Format date for display
 */
export function formatMatchDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format relative time (e.g., "in 2 hours", "yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1 && diffMins > -1) return 'now';
  if (diffMins < 60 && diffMins > 0) return `in ${diffMins}m`;
  if (diffMins > -60 && diffMins < 0) return `${Math.abs(diffMins)}m ago`;
  if (diffHours < 24 && diffHours > 0) return `in ${diffHours}h`;
  if (diffHours > -24 && diffHours < 0) return `${Math.abs(diffHours)}h ago`;
  if (diffDays < 7 && diffDays > 0) return `in ${diffDays}d`;
  if (diffDays > -7 && diffDays < 0) return `${Math.abs(diffDays)}d ago`;

  return formatMatchDate(dateString);
}
