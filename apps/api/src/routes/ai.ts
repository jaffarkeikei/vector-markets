import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AIAnalyzer } from '../services/ai-analyzer.js';

const valueQuerySchema = z.object({
  minEdge: z.coerce.number().min(0).max(100).default(3),
  sport: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function aiRoutes(fastify: FastifyInstance) {
  const analyzer = new AIAnalyzer();

  // Get AI prediction for a match
  fastify.get('/predictions/:matchId', async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        markets: {
          where: { type: 'MATCH_RESULT', status: 'OPEN' },
          include: { outcomes: true },
        },
      },
    });

    if (!match) {
      return reply.status(404).send({ error: 'not_found', message: 'Match not found' });
    }

    const prediction = analyzer.generatePrediction(
      match.homeTeam.name,
      match.awayTeam.name,
      match.league.name
    );

    // Calculate value bets based on current odds
    const market = match.markets[0];
    const outcomes = market?.outcomes || [];
    const homeOdds = Number(outcomes.find(o => o.name === 'Home')?.odds) || 0;
    const drawOdds = Number(outcomes.find(o => o.name === 'Draw')?.odds) || 0;
    const awayOdds = Number(outcomes.find(o => o.name === 'Away')?.odds) || 0;

    const valueBets = [];

    if (homeOdds > 0) {
      const fairOdds = 1 / prediction.home;
      const edge = ((homeOdds - fairOdds) / fairOdds) * 100;
      if (edge > 0) {
        valueBets.push({
          outcome: 'home',
          currentOdds: homeOdds,
          fairOdds: Math.round(fairOdds * 100) / 100,
          edge: Math.round(edge * 10) / 10,
          recommendation: edge > 5 ? 'strong_value' : edge > 2 ? 'slight_value' : 'marginal',
        });
      }
    }

    if (drawOdds > 0) {
      const fairOdds = 1 / prediction.draw;
      const edge = ((drawOdds - fairOdds) / fairOdds) * 100;
      if (edge > 0) {
        valueBets.push({
          outcome: 'draw',
          currentOdds: drawOdds,
          fairOdds: Math.round(fairOdds * 100) / 100,
          edge: Math.round(edge * 10) / 10,
          recommendation: edge > 5 ? 'strong_value' : edge > 2 ? 'slight_value' : 'marginal',
        });
      }
    }

    if (awayOdds > 0) {
      const fairOdds = 1 / prediction.away;
      const edge = ((awayOdds - fairOdds) / fairOdds) * 100;
      if (edge > 0) {
        valueBets.push({
          outcome: 'away',
          currentOdds: awayOdds,
          fairOdds: Math.round(fairOdds * 100) / 100,
          edge: Math.round(edge * 10) / 10,
          recommendation: edge > 5 ? 'strong_value' : edge > 2 ? 'slight_value' : 'marginal',
        });
      }
    }

    return {
      matchId: match.id,
      predictions: {
        home: prediction.home,
        draw: prediction.draw,
        away: prediction.away,
      },
      confidence: prediction.confidence,
      modelVersion: 'v1.0.0-mock',
      valueBets,
      generatedAt: new Date().toISOString(),
    };
  });

  // Get AI insights for a match
  fastify.get('/insights/:matchId', async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      return reply.status(404).send({ error: 'not_found', message: 'Match not found' });
    }

    const insight = analyzer.generateInsight(
      match.homeTeam.name,
      match.awayTeam.name,
      match.league.name
    );

    return {
      matchId: match.id,
      insight: insight.text,
      keyFactors: insight.factors,
      generatedAt: new Date().toISOString(),
    };
  });

  // Get value bets across all matches
  fastify.get('/value-bets', async (request) => {
    const query = valueQuerySchema.parse(request.query);

    const where: any = {
      status: 'UPCOMING',
      startTime: { gt: new Date() },
    };

    if (query.sport) {
      where.league = { sport: query.sport.toUpperCase() };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        markets: {
          where: { type: 'MATCH_RESULT', status: 'OPEN' },
          include: { outcomes: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });

    const valueBets = [];

    for (const match of matches) {
      const prediction = analyzer.generatePrediction(
        match.homeTeam.name,
        match.awayTeam.name,
        match.league.name
      );

      const market = match.markets[0];
      if (!market) continue;

      const outcomes = market.outcomes;
      const homeOdds = Number(outcomes.find(o => o.name === 'Home')?.odds) || 0;
      const drawOdds = Number(outcomes.find(o => o.name === 'Draw')?.odds) || 0;
      const awayOdds = Number(outcomes.find(o => o.name === 'Away')?.odds) || 0;

      const checkValue = (name: string, odds: number, prob: number) => {
        if (odds <= 0) return null;
        const fairOdds = 1 / prob;
        const edge = ((odds - fairOdds) / fairOdds) * 100;
        if (edge >= query.minEdge) {
          return {
            match: {
              id: match.id,
              homeTeam: match.homeTeam.name,
              awayTeam: match.awayTeam.name,
              startTime: match.startTime.toISOString(),
            },
            outcome: name,
            currentOdds: odds,
            fairOdds: Math.round(fairOdds * 100) / 100,
            edge: Math.round(edge * 10) / 10,
            confidence: prediction.confidence,
            suggestedStake: analyzer.calculateKellyStake(prob, odds),
          };
        }
        return null;
      };

      const homeValue = checkValue('home', homeOdds, prediction.home);
      const drawValue = checkValue('draw', drawOdds, prediction.draw);
      const awayValue = checkValue('away', awayOdds, prediction.away);

      if (homeValue) valueBets.push(homeValue);
      if (drawValue) valueBets.push(drawValue);
      if (awayValue) valueBets.push(awayValue);
    }

    // Sort by edge descending
    valueBets.sort((a, b) => b.edge - a.edge);

    return {
      valueBets: valueBets.slice(0, query.limit),
      generatedAt: new Date().toISOString(),
    };
  });

  // Get team analysis
  fastify.get('/team/:teamId', async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { league: true },
    });

    if (!team) {
      return reply.status(404).send({ error: 'not_found', message: 'Team not found' });
    }

    // Get recent matches for this team
    const recentMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
        status: 'FINISHED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    const analysis = analyzer.analyzeTeam(team.name, recentMatches);

    return {
      team: {
        id: team.id,
        name: team.name,
        league: team.league.name,
      },
      analysis,
      recentForm: recentMatches.map(m => ({
        opponent: m.homeTeamId === teamId ? m.awayTeam.name : m.homeTeam.name,
        isHome: m.homeTeamId === teamId,
        score: `${m.homeScore}-${m.awayScore}`,
        result: m.homeTeamId === teamId
          ? (m.homeScore! > m.awayScore! ? 'W' : m.homeScore! < m.awayScore! ? 'L' : 'D')
          : (m.awayScore! > m.homeScore! ? 'W' : m.awayScore! < m.homeScore! ? 'L' : 'D'),
        date: m.startTime.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    };
  });
}
