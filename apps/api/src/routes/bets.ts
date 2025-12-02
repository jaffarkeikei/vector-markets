import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { Prisma, Bet, Outcome, Market, Match, Team } from '@prisma/client';

const placeBetSchema = z.object({
  outcomeId: z.string(),
  stake: z.number().positive(),
  oddsAccepted: z.number().positive(),
});

const listQuerySchema = z.object({
  status: z.enum(['PENDING', 'WON', 'LOST', 'VOID']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

type BetWithRelations = Bet & {
  outcome: Outcome & {
    market: Market & {
      match: Match & {
        homeTeam: Team;
        awayTeam: Team;
      };
    };
  };
};

// Auth middleware helper
async function authenticate(fastify: FastifyInstance, request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'unauthorized', message: 'Invalid or missing token' });
  }
}

export async function betRoutes(fastify: FastifyInstance) {
  // Place bet
  fastify.post('/', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const body = placeBetSchema.parse(request.body);

    // Get outcome with market and match
    const outcome = await prisma.outcome.findUnique({
      where: { id: body.outcomeId },
      include: {
        market: {
          include: { match: true },
        },
      },
    });

    if (!outcome) {
      return reply.status(404).send({ error: 'not_found', message: 'Outcome not found' });
    }

    if (outcome.market.status !== 'OPEN') {
      return reply.status(400).send({ error: 'market_suspended', message: 'Market is not accepting bets' });
    }

    if (outcome.market.match.status !== 'UPCOMING') {
      return reply.status(400).send({ error: 'match_started', message: 'Match has already started' });
    }

    // Check if odds changed significantly (more than 5%)
    const oddsChange = Math.abs(Number(outcome.odds) - body.oddsAccepted) / body.oddsAccepted;
    if (oddsChange > 0.05) {
      return reply.status(400).send({
        error: 'odds_changed',
        message: 'Odds have changed since selection',
        currentOdds: outcome.odds,
        requestedOdds: body.oddsAccepted,
      });
    }

    // Get user balance
    const balance = await prisma.balance.findUnique({
      where: { userId },
    });

    if (!balance || Number(balance.available) < body.stake) {
      return reply.status(400).send({
        error: 'insufficient_balance',
        message: 'Not enough available balance',
        available: balance?.available || 0,
        required: body.stake,
      });
    }

    // Create bet and update balance in transaction
    const potentialReturn = body.stake * Number(outcome.odds);

    const bet = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock funds
      await tx.balance.update({
        where: { userId },
        data: {
          available: { decrement: body.stake },
          locked: { increment: body.stake },
        },
      });

      // Create bet
      const newBet = await tx.bet.create({
        data: {
          userId,
          outcomeId: body.outcomeId,
          stake: body.stake,
          odds: outcome.odds,
          potentialReturn,
          status: 'PENDING',
        },
        include: {
          outcome: {
            include: {
              market: {
                include: { match: true },
              },
            },
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'BET_STAKE',
          amount: -body.stake,
          status: 'CONFIRMED',
          betId: newBet.id,
        },
      });

      return newBet;
    });

    return {
      id: bet.id,
      status: bet.status.toLowerCase(),
      outcome: {
        id: bet.outcome.id,
        name: bet.outcome.name,
        matchId: bet.outcome.market.match.id,
      },
      stake: bet.stake,
      odds: bet.odds,
      potentialReturn: bet.potentialReturn,
      createdAt: bet.createdAt.toISOString(),
    };
  });

  // List user's bets
  fastify.get('/', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const query = listQuerySchema.parse(request.query);

    const where: Prisma.BetWhereInput = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: {
          outcome: {
            include: {
              market: {
                include: {
                  match: {
                    include: {
                      homeTeam: true,
                      awayTeam: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.bet.count({ where }),
    ]);

    const totalStake = bets.reduce((sum: number, bet: Bet) => sum + Number(bet.stake), 0);
    const potentialReturn = bets
      .filter((bet: Bet) => bet.status === 'PENDING')
      .reduce((sum: number, bet: Bet) => sum + Number(bet.potentialReturn), 0);

    return {
      bets: bets.map((bet: BetWithRelations) => ({
        id: bet.id,
        status: bet.status.toLowerCase(),
        match: {
          id: bet.outcome.market.match.id,
          homeTeam: bet.outcome.market.match.homeTeam.name,
          awayTeam: bet.outcome.market.match.awayTeam.name,
          startTime: bet.outcome.market.match.startTime.toISOString(),
          status: bet.outcome.market.match.status.toLowerCase(),
        },
        outcome: {
          id: bet.outcome.id,
          name: bet.outcome.name,
          market: bet.outcome.market.name,
        },
        stake: bet.stake,
        odds: bet.odds,
        potentialReturn: bet.potentialReturn,
        actualReturn: bet.actualReturn,
        createdAt: bet.createdAt.toISOString(),
        settledAt: bet.settledAt?.toISOString(),
      })),
      summary: {
        totalStake,
        potentialReturn,
      },
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  });

  // Get bet history
  fastify.get('/history', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const query = listQuerySchema.parse(request.query);

    const where: Prisma.BetWhereInput = {
      userId,
      status: { in: ['WON', 'LOST', 'VOID', 'HALF_WON', 'HALF_LOST'] },
    };

    const [bets, total, stats] = await Promise.all([
      prisma.bet.findMany({
        where,
        include: {
          outcome: {
            include: {
              market: {
                include: {
                  match: {
                    include: {
                      homeTeam: true,
                      awayTeam: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { settledAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.bet.count({ where }),
      prisma.bet.aggregate({
        where: { userId },
        _count: true,
        _sum: { stake: true, actualReturn: true },
      }),
    ]);

    const wonCount = await prisma.bet.count({ where: { userId, status: 'WON' } });
    const lostCount = await prisma.bet.count({ where: { userId, status: 'LOST' } });
    const voidCount = await prisma.bet.count({ where: { userId, status: 'VOID' } });

    const totalStake = Number(stats._sum.stake) || 0;
    const totalReturn = Number(stats._sum.actualReturn) || 0;
    const profit = totalReturn - totalStake;
    const roi = totalStake > 0 ? (profit / totalStake) * 100 : 0;

    return {
      bets: bets.map((bet: BetWithRelations) => ({
        id: bet.id,
        status: bet.status.toLowerCase(),
        match: {
          id: bet.outcome.market.match.id,
          homeTeam: bet.outcome.market.match.homeTeam.name,
          awayTeam: bet.outcome.market.match.awayTeam.name,
          result: bet.outcome.market.match.homeScore !== null
            ? `${bet.outcome.market.match.homeScore}-${bet.outcome.market.match.awayScore}`
            : null,
        },
        outcome: {
          id: bet.outcome.id,
          name: bet.outcome.name,
          market: bet.outcome.market.name,
        },
        stake: bet.stake,
        odds: bet.odds,
        potentialReturn: bet.potentialReturn,
        actualReturn: bet.actualReturn,
        profit: bet.actualReturn ? Number(bet.actualReturn) - Number(bet.stake) : -Number(bet.stake),
        createdAt: bet.createdAt.toISOString(),
        settledAt: bet.settledAt?.toISOString(),
      })),
      summary: {
        totalBets: stats._count,
        won: wonCount,
        lost: lostCount,
        void: voidCount,
        totalStake,
        totalReturn,
        profit,
        roi: Math.round(roi * 100) / 100,
      },
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  });

  // Get single bet
  fastify.get('/:id', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };
    const { id } = request.params as { id: string };

    const bet = await prisma.bet.findFirst({
      where: { id, userId },
      include: {
        outcome: {
          include: {
            market: {
              include: {
                match: {
                  include: {
                    homeTeam: true,
                    awayTeam: true,
                    league: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bet) {
      return reply.status(404).send({ error: 'not_found', message: 'Bet not found' });
    }

    return {
      id: bet.id,
      status: bet.status.toLowerCase(),
      match: {
        id: bet.outcome.market.match.id,
        homeTeam: bet.outcome.market.match.homeTeam.name,
        awayTeam: bet.outcome.market.match.awayTeam.name,
        startTime: bet.outcome.market.match.startTime.toISOString(),
        status: bet.outcome.market.match.status.toLowerCase(),
        league: bet.outcome.market.match.league.name,
      },
      outcome: {
        id: bet.outcome.id,
        name: bet.outcome.name,
        market: bet.outcome.market.name,
        currentOdds: bet.outcome.odds,
      },
      stake: bet.stake,
      odds: bet.odds,
      potentialReturn: bet.potentialReturn,
      actualReturn: bet.actualReturn,
      createdAt: bet.createdAt.toISOString(),
      settledAt: bet.settledAt?.toISOString(),
    };
  });
}
