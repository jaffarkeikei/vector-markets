/**
 * AI Analyzer Service
 *
 * This provides mock AI analysis for sports betting predictions.
 * In production, this would integrate with real ML models and external data sources.
 */

interface Prediction {
  home: number;
  draw: number;
  away: number;
  confidence: number;
}

interface Insight {
  text: string;
  factors: string[];
}

interface TeamAnalysis {
  form: string;
  homeRecord: string;
  awayRecord: string;
  goalsScored: number;
  goalsConceded: number;
  strengths: string[];
  weaknesses: string[];
}

// Mock team strength ratings (in production, this would come from ML model)
const TEAM_RATINGS: Record<string, number> = {
  // Premier League
  'Manchester City': 92,
  'Arsenal': 88,
  'Liverpool': 87,
  'Manchester United': 82,
  'Chelsea': 81,
  'Tottenham': 80,
  'Newcastle': 79,
  'Aston Villa': 77,
  'Brighton': 75,
  'West Ham': 74,
  'Crystal Palace': 72,
  'Fulham': 71,
  'Wolves': 70,
  'Everton': 69,
  'Bournemouth': 68,
  'Nottingham Forest': 67,
  'Brentford': 71,
  'Sheffield United': 62,
  'Burnley': 63,
  'Luton': 61,

  // La Liga
  'Real Madrid': 91,
  'Barcelona': 89,
  'Atletico Madrid': 84,
  'Real Sociedad': 78,
  'Athletic Bilbao': 76,
  'Villarreal': 75,
  'Real Betis': 74,
  'Sevilla': 73,

  // Bundesliga
  'Bayern Munich': 90,
  'Borussia Dortmund': 83,
  'RB Leipzig': 81,
  'Bayer Leverkusen': 85,
  'Eintracht Frankfurt': 74,

  // Serie A
  'Inter Milan': 86,
  'AC Milan': 82,
  'Juventus': 83,
  'Napoli': 84,
  'Roma': 78,
  'Lazio': 76,
  'Atalanta': 79,
};

// Home advantage factor (typically 5-10% boost)
const HOME_ADVANTAGE = 0.08;

export class AIAnalyzer {
  /**
   * Generate match prediction
   */
  generatePrediction(homeTeam: string, awayTeam: string, league: string): Prediction {
    const homeRating = this.getTeamRating(homeTeam);
    const awayRating = this.getTeamRating(awayTeam);

    // Apply home advantage
    const adjustedHomeRating = homeRating * (1 + HOME_ADVANTAGE);

    // Calculate raw probabilities based on ratings difference
    const ratingDiff = adjustedHomeRating - awayRating;
    const totalRating = adjustedHomeRating + awayRating;

    // Base probabilities
    let homeProb = 0.35 + (ratingDiff / totalRating) * 0.3;
    let awayProb = 0.30 - (ratingDiff / totalRating) * 0.3;
    let drawProb = 0.35 - Math.abs(ratingDiff / totalRating) * 0.15;

    // Ensure probabilities are within bounds
    homeProb = Math.max(0.1, Math.min(0.7, homeProb));
    awayProb = Math.max(0.1, Math.min(0.7, awayProb));
    drawProb = Math.max(0.15, Math.min(0.4, drawProb));

    // Normalize to sum to 1
    const total = homeProb + drawProb + awayProb;
    homeProb = homeProb / total;
    drawProb = drawProb / total;
    awayProb = awayProb / total;

    // Add some randomness to simulate model uncertainty
    const noise = 0.03;
    homeProb += (Math.random() - 0.5) * noise;
    drawProb += (Math.random() - 0.5) * noise;
    awayProb += (Math.random() - 0.5) * noise;

    // Re-normalize
    const total2 = homeProb + drawProb + awayProb;

    // Calculate confidence based on rating difference
    const confidence = 0.55 + Math.abs(ratingDiff) / 100 * 0.3;

    return {
      home: Math.round((homeProb / total2) * 1000) / 1000,
      draw: Math.round((drawProb / total2) * 1000) / 1000,
      away: Math.round((awayProb / total2) * 1000) / 1000,
      confidence: Math.min(0.85, Math.round(confidence * 100) / 100),
    };
  }

  /**
   * Generate match insight text
   */
  generateInsight(homeTeam: string, awayTeam: string, league: string): Insight {
    const homeRating = this.getTeamRating(homeTeam);
    const awayRating = this.getTeamRating(awayTeam);
    const prediction = this.generatePrediction(homeTeam, awayTeam, league);

    const factors: string[] = [];
    let insight = '';

    // Analyze the matchup
    if (homeRating > awayRating + 10) {
      factors.push(`${homeTeam} significantly stronger on paper`);
      factors.push('Home advantage amplifies the gap');
      insight = `${homeTeam} enters this ${league} fixture as clear favorites. `;
    } else if (awayRating > homeRating + 10) {
      factors.push(`${awayTeam} higher rated despite playing away`);
      factors.push('Potential for an upset if home team is organized');
      insight = `${awayTeam} will look to overcome the home disadvantage with their superior quality. `;
    } else {
      factors.push('Evenly matched teams');
      factors.push('Home advantage could be decisive');
      insight = `This looks set to be a closely contested ${league} encounter. `;
    }

    // Add context based on prediction
    if (prediction.home > 0.45) {
      insight += `Our model gives ${homeTeam} a ${Math.round(prediction.home * 100)}% chance of victory at home. `;
      factors.push(`Strong home win probability (${Math.round(prediction.home * 100)}%)`);
    } else if (prediction.away > 0.40) {
      insight += `${awayTeam} have a solid ${Math.round(prediction.away * 100)}% chance of taking all three points. `;
      factors.push(`Significant away win probability (${Math.round(prediction.away * 100)}%)`);
    } else {
      insight += `The draw at ${Math.round(prediction.draw * 100)}% represents interesting value. `;
      factors.push(`Draw probability elevated (${Math.round(prediction.draw * 100)}%)`);
    }

    // Add recommendation
    const bestOutcome = prediction.home >= prediction.away && prediction.home >= prediction.draw
      ? 'home'
      : prediction.away >= prediction.draw
        ? 'away'
        : 'draw';

    if (bestOutcome === 'home') {
      insight += `Consider ${homeTeam} to win or the Double Chance (1X) for added security.`;
    } else if (bestOutcome === 'away') {
      insight += `${awayTeam} or Draw (X2) could provide value depending on odds.`;
    } else {
      insight += `In tight matches like this, goals markets (Under 2.5) often provide value.`;
    }

    factors.push(`Model confidence: ${Math.round(prediction.confidence * 100)}%`);

    return { text: insight, factors };
  }

  /**
   * Analyze a team's performance
   */
  analyzeTeam(teamName: string, recentMatches: any[]): TeamAnalysis {
    const rating = this.getTeamRating(teamName);

    // Calculate form from recent matches
    let wins = 0, draws = 0, losses = 0;
    let homeWins = 0, homeGames = 0;
    let awayWins = 0, awayGames = 0;
    let goalsScored = 0, goalsConceded = 0;

    for (const match of recentMatches) {
      const isHome = match.homeTeam.name === teamName;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore !== null && oppScore !== null) {
        goalsScored += teamScore;
        goalsConceded += oppScore;

        if (teamScore > oppScore) {
          wins++;
          if (isHome) homeWins++;
          else awayWins++;
        } else if (teamScore < oppScore) {
          losses++;
        } else {
          draws++;
        }

        if (isHome) homeGames++;
        else awayGames++;
      }
    }

    // Generate form string (last 5)
    const formArray: string[] = [];
    for (const match of recentMatches.slice(0, 5)) {
      const isHome = match.homeTeam.name === teamName;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      if (teamScore !== null && oppScore !== null) {
        if (teamScore > oppScore) formArray.push('W');
        else if (teamScore < oppScore) formArray.push('L');
        else formArray.push('D');
      }
    }

    // Determine strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (rating > 80) strengths.push('Elite squad quality');
    if (wins > losses * 2) strengths.push('Strong recent form');
    if (goalsScored / Math.max(recentMatches.length, 1) > 1.8) strengths.push('Prolific attack');
    if (goalsConceded / Math.max(recentMatches.length, 1) < 1.0) strengths.push('Solid defense');
    if (homeGames > 0 && homeWins / homeGames > 0.6) strengths.push('Fortress at home');

    if (rating < 70) weaknesses.push('Limited squad depth');
    if (losses > wins) weaknesses.push('Inconsistent results');
    if (goalsConceded / Math.max(recentMatches.length, 1) > 1.5) weaknesses.push('Defensive vulnerabilities');
    if (awayGames > 0 && awayWins / awayGames < 0.3) weaknesses.push('Poor away form');

    if (strengths.length === 0) strengths.push('Competitive in most matches');
    if (weaknesses.length === 0) weaknesses.push('No major weaknesses identified');

    return {
      form: formArray.join('-') || 'N/A',
      homeRecord: homeGames > 0 ? `${homeWins}W from ${homeGames} games` : 'N/A',
      awayRecord: awayGames > 0 ? `${awayWins}W from ${awayGames} games` : 'N/A',
      goalsScored: Math.round(goalsScored / Math.max(recentMatches.length, 1) * 10) / 10,
      goalsConceded: Math.round(goalsConceded / Math.max(recentMatches.length, 1) * 10) / 10,
      strengths,
      weaknesses,
    };
  }

  /**
   * Calculate Kelly stake percentage
   */
  calculateKellyStake(probability: number, odds: number): string {
    const b = odds - 1; // Net odds
    const q = 1 - probability;
    const kelly = (probability * b - q) / b;

    // Apply fractional Kelly (25%) for safety
    const fractionalKelly = Math.max(0, kelly * 0.25);

    if (fractionalKelly < 0.005) return '0.5%';
    if (fractionalKelly > 0.05) return '5%';

    return `${Math.round(fractionalKelly * 100 * 10) / 10}%`;
  }

  /**
   * Get team rating (with fallback for unknown teams)
   */
  private getTeamRating(teamName: string): number {
    // Check exact match
    if (TEAM_RATINGS[teamName]) {
      return TEAM_RATINGS[teamName];
    }

    // Check partial match
    for (const [name, rating] of Object.entries(TEAM_RATINGS)) {
      if (teamName.includes(name) || name.includes(teamName)) {
        return rating;
      }
    }

    // Default rating for unknown teams
    return 70;
  }
}
