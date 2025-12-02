import { describe, it, expect } from 'vitest';
import { AIAnalyzer } from '../services/ai-analyzer.js';

describe('AIAnalyzer', () => {
  const analyzer = new AIAnalyzer();

  describe('generatePrediction', () => {
    it('should generate valid probabilities that sum to 1', () => {
      const prediction = analyzer.generatePrediction('Liverpool', 'Manchester City', 'Premier League');

      expect(prediction.home).toBeGreaterThan(0);
      expect(prediction.draw).toBeGreaterThan(0);
      expect(prediction.away).toBeGreaterThan(0);

      const sum = prediction.home + prediction.draw + prediction.away;
      expect(sum).toBeCloseTo(1, 2);
    });

    it('should favor home team against weaker opponent', () => {
      const prediction = analyzer.generatePrediction('Manchester City', 'Sheffield United', 'Premier League');

      expect(prediction.home).toBeGreaterThan(prediction.away);
    });

    it('should give reasonable confidence score', () => {
      const prediction = analyzer.generatePrediction('Arsenal', 'Chelsea', 'Premier League');

      expect(prediction.confidence).toBeGreaterThanOrEqual(0.5);
      expect(prediction.confidence).toBeLessThanOrEqual(0.9);
    });

    it('should handle unknown teams with default rating', () => {
      const prediction = analyzer.generatePrediction('Unknown FC', 'Mystery United', 'Some League');

      expect(prediction.home).toBeGreaterThan(0);
      expect(prediction.draw).toBeGreaterThan(0);
      expect(prediction.away).toBeGreaterThan(0);
    });
  });

  describe('generateInsight', () => {
    it('should generate text insight', () => {
      const insight = analyzer.generateInsight('Real Madrid', 'Barcelona', 'La Liga');

      expect(insight.text).toBeTruthy();
      expect(insight.text.length).toBeGreaterThan(50);
    });

    it('should generate key factors', () => {
      const insight = analyzer.generateInsight('Bayern Munich', 'Borussia Dortmund', 'Bundesliga');

      expect(insight.factors).toBeInstanceOf(Array);
      expect(insight.factors.length).toBeGreaterThan(0);
    });

    it('should mention team names in insight', () => {
      const insight = analyzer.generateInsight('Liverpool', 'Manchester United', 'Premier League');

      expect(insight.text).toContain('Liverpool');
    });
  });

  describe('calculateKellyStake', () => {
    it('should return positive stake for positive EV bet', () => {
      // Probability 50%, odds 2.20 = positive EV
      const stake = analyzer.calculateKellyStake(0.5, 2.2);

      expect(stake).not.toBe('0.5%');
    });

    it('should return minimum stake for negative EV bet', () => {
      // Probability 30%, odds 2.0 = negative EV
      const stake = analyzer.calculateKellyStake(0.3, 2.0);

      expect(stake).toBe('0.5%');
    });

    it('should cap stake at 5%', () => {
      // Very high edge bet
      const stake = analyzer.calculateKellyStake(0.7, 3.0);

      expect(stake).toBe('5%');
    });
  });

  describe('analyzeTeam', () => {
    it('should handle team with no recent matches', () => {
      const analysis = analyzer.analyzeTeam('Liverpool', []);

      expect(analysis.form).toBe('N/A');
      expect(analysis.strengths).toBeInstanceOf(Array);
      expect(analysis.weaknesses).toBeInstanceOf(Array);
    });

    it('should calculate form from recent matches', () => {
      const mockMatches = [
        {
          homeTeam: { name: 'Liverpool' },
          awayTeam: { name: 'Arsenal' },
          homeScore: 2,
          awayScore: 1,
        },
        {
          homeTeam: { name: 'Chelsea' },
          awayTeam: { name: 'Liverpool' },
          homeScore: 0,
          awayScore: 0,
        },
        {
          homeTeam: { name: 'Liverpool' },
          awayTeam: { name: 'Manchester City' },
          homeScore: 1,
          awayScore: 2,
        },
      ];

      const analysis = analyzer.analyzeTeam('Liverpool', mockMatches);

      expect(analysis.form).toBe('W-D-L');
    });

    it('should identify strengths for strong teams', () => {
      const analysis = analyzer.analyzeTeam('Manchester City', []);

      // Manchester City has high rating (92)
      expect(analysis.strengths).toContain('Elite squad quality');
    });
  });
});
