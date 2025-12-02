import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { Prisma, Match, League, Team, Market, Outcome } from '@prisma/client';

const listQuerySchema = z.object({
  sport: z.string().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'FINISHED']).optional(),
  league: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

type MatchWithRelations = Match & {
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  markets: (Market & { outcomes: Outcome[] })[];
};

export async function matchRoutes(fastify: FastifyInstance) {
  // List matches
  fastify.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);

    const where: Prisma.MatchWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'UPCOMING';
    }

    if (query.league) {
      where.league = { externalId: query.league };
    }

    if (query.sport) {
      where.league = { ...where.league as Prisma.LeagueWhereInput, sport: query.sport.toUpperCase() as any };
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
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
        take: query.limit,
        skip: query.offset,
      }),
      prisma.match.count({ where }),
    ]);

    return {
      matches: matches.map((match: MatchWithRelations) => {
        const matchResultMarket = match.markets[0];
        const outcomes = matchResultMarket?.outcomes || [];

        return {
          id: match.id,
          sport: match.league.sport.toLowerCase(),
          league: {
            id: match.league.id,
            name: match.league.name,
            country: match.league.country,
          },
          homeTeam: {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logo: match.homeTeam.logo,
          },
          awayTeam: {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logo: match.awayTeam.logo,
          },
          startTime: match.startTime.toISOString(),
          status: match.status.toLowerCase(),
          bestOdds: {
            home: outcomes.find((o: Outcome) => o.name === 'Home')?.odds || null,
            draw: outcomes.find((o: Outcome) => o.name === 'Draw')?.odds || null,
            away: outcomes.find((o: Outcome) => o.name === 'Away')?.odds || null,
          },
          marketsCount: match.markets.length,
        };
      }),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  });

  // Get match details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        league: true,
        homeTeam: true,
        awayTeam: true,
        markets: {
          where: { status: 'OPEN' },
          include: { outcomes: true },
        },
      },
    });

    if (!match) {
      return reply.status(404).send({ error: 'not_found', message: 'Match not found' });
    }

    return {
      id: match.id,
      sport: match.league.sport.toLowerCase(),
      league: {
        id: match.league.id,
        name: match.league.name,
        country: match.league.country,
      },
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        logo: match.homeTeam.logo,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        logo: match.awayTeam.logo,
      },
      startTime: match.startTime.toISOString(),
      status: match.status.toLowerCase(),
      venue: match.venue,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      markets: match.markets.map((market: Market & { outcomes: Outcome[] }) => ({
        id: market.id,
        name: market.name,
        type: market.type.toLowerCase(),
        line: market.line,
        outcomes: market.outcomes.map((outcome: Outcome) => ({
          id: outcome.id,
          name: outcome.name,
          odds: outcome.odds,
          previousOdds: outcome.previousOdds,
        })),
      })),
    };
  });
}
