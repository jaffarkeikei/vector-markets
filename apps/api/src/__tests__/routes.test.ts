import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';

// Mock prisma before importing routes
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        walletAddress: 'test-wallet',
        createdAt: new Date(),
        balance: { available: 1000, locked: 0, inYield: 0 },
      }),
      create: vi.fn().mockImplementation((data: any) => Promise.resolve({
        id: 'test-user-id',
        walletAddress: data.data.walletAddress,
        createdAt: new Date(),
        balance: { available: 0, locked: 0, inYield: 0 },
      })),
    },
    balance: {
      findUnique: vi.fn().mockResolvedValue({ available: 1000, locked: 0, inYield: 0 }),
    },
    match: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
    },
    bet: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _count: 0, _sum: { stake: null, actualReturn: null } }),
    },
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

// Import routes after mocking
import { authRoutes } from '../routes/auth.js';
import { matchRoutes } from '../routes/matches.js';
import { userRoutes } from '../routes/users.js';
import { aiRoutes } from '../routes/ai.js';

describe('API Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(matchRoutes, { prefix: '/matches' });
    await app.register(userRoutes, { prefix: '/users' });
    await app.register(aiRoutes, { prefix: '/ai' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should be a valid fastify instance', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Auth Routes', () => {
    describe('POST /auth/nonce', () => {
      it('should return a nonce for valid wallet address', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/nonce',
          payload: {
            walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.nonce).toBeDefined();
        expect(body.nonce).toContain('Sign this message');
        expect(body.expiresAt).toBeDefined();
      });

      it('should reject invalid wallet address', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/nonce',
          payload: {
            walletAddress: 'invalid-wallet',
          },
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('Match Routes', () => {
    describe('GET /matches', () => {
      it('should return matches list', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/matches',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.matches).toBeDefined();
        expect(Array.isArray(body.matches)).toBe(true);
        expect(body.pagination).toBeDefined();
      });

      it('should accept query parameters', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/matches?status=UPCOMING&limit=10&offset=0',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.pagination.limit).toBe(10);
      });
    });

    describe('GET /matches/:id', () => {
      it('should return 404 for non-existent match', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/matches/non-existent-id',
        });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('User Routes', () => {
    describe('GET /users/me', () => {
      it('should require authentication', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/users/me',
        });

        expect(response.statusCode).toBe(401);
      });

      it('should return user data with valid token', async () => {
        const token = app.jwt.sign({ userId: 'test-user-id', walletAddress: 'test-wallet' });

        const response = await app.inject({
          method: 'GET',
          url: '/users/me',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.id).toBe('test-user-id');
        expect(body.balance).toBeDefined();
      });
    });

    describe('GET /users/me/balance', () => {
      it('should return balance with valid token', async () => {
        const token = app.jwt.sign({ userId: 'test-user-id', walletAddress: 'test-wallet' });

        const response = await app.inject({
          method: 'GET',
          url: '/users/me/balance',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.available).toBeDefined();
        expect(body.currency).toBe('USDC');
      });
    });
  });

  describe('AI Routes', () => {
    describe('GET /ai/predictions/:matchId', () => {
      it('should return 404 for non-existent match', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/ai/predictions/non-existent-match',
        });

        expect(response.statusCode).toBe(404);
      });
    });

    describe('GET /ai/value-bets', () => {
      it('should return value bets list', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/ai/value-bets',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.valueBets).toBeDefined();
        expect(Array.isArray(body.valueBets)).toBe(true);
        expect(body.generatedAt).toBeDefined();
      });

      it('should accept query parameters', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/ai/value-bets?minEdge=5&limit=5',
        });

        expect(response.statusCode).toBe(200);
      });
    });
  });
});
