import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { Transaction } from '@prisma/client';

const transactionsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Auth middleware helper
async function authenticate(fastify: FastifyInstance, request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'unauthorized', message: 'Invalid or missing token' });
  }
}

export async function userRoutes(fastify: FastifyInstance) {
  // Get current user
  fastify.get('/me', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { balance: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'not_found', message: 'User not found' });
    }

    // Get betting stats
    const stats = await prisma.bet.aggregate({
      where: { userId },
      _count: true,
      _sum: { stake: true, actualReturn: true },
    });

    const wonCount = await prisma.bet.count({ where: { userId, status: 'WON' } });

    const totalWagered = Number(stats._sum.stake) || 0;
    const totalReturn = Number(stats._sum.actualReturn) || 0;
    const totalProfit = totalReturn - totalWagered;
    const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      balance: {
        available: user.balance?.available || 0,
        locked: user.balance?.locked || 0,
        inYield: user.balance?.inYield || 0,
        total: Number(user.balance?.available || 0) + Number(user.balance?.locked || 0) + Number(user.balance?.inYield || 0),
      },
      stats: {
        totalBets: stats._count,
        wonBets: wonCount,
        totalWagered,
        totalProfit,
        roi: Math.round(roi * 100) / 100,
      },
      createdAt: user.createdAt.toISOString(),
    };
  });

  // Get user balance
  fastify.get('/me/balance', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const balance = await prisma.balance.findUnique({
      where: { userId },
    });

    if (!balance) {
      return {
        available: 0,
        locked: 0,
        inYield: 0,
        total: 0,
        currency: 'USDC',
      };
    }

    return {
      available: balance.available,
      locked: balance.locked,
      inYield: balance.inYield,
      total: Number(balance.available) + Number(balance.locked) + Number(balance.inYield),
      currency: 'USDC',
    };
  });

  // Get user transactions
  fastify.get('/me/transactions', async (request, reply) => {
    await authenticate(fastify, request, reply);
    const { userId } = request.user as { userId: string };

    const query = transactionsQuerySchema.parse(request.query);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions: transactions.map((tx: Transaction) => ({
        id: tx.id,
        type: tx.type.toLowerCase(),
        amount: tx.amount,
        status: tx.status.toLowerCase(),
        txHash: tx.txHash,
        betId: tx.betId,
        createdAt: tx.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  });
}
