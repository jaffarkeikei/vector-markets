import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { prisma } from '../lib/prisma.js';

// Store nonces temporarily (in production, use Redis)
const nonceStore = new Map<string, { nonce: string; expiresAt: Date }>();

const nonceRequestSchema = z.object({
  walletAddress: z.string(),
});

const connectRequestSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Generate nonce for wallet to sign
  fastify.post('/nonce', async (request, reply) => {
    const body = nonceRequestSchema.parse(request.body);

    // Validate wallet address
    try {
      new PublicKey(body.walletAddress);
    } catch {
      return reply.status(400).send({ error: 'invalid_address', message: 'Invalid wallet address' });
    }

    const nonce = `Sign this message to authenticate with Vector Markets: ${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    nonceStore.set(body.walletAddress, { nonce, expiresAt });

    return { nonce, expiresAt: expiresAt.toISOString() };
  });

  // Verify signature and issue JWT
  fastify.post('/connect', async (request, reply) => {
    const body = connectRequestSchema.parse(request.body);

    // Get stored nonce
    const stored = nonceStore.get(body.walletAddress);
    if (!stored) {
      return reply.status(400).send({ error: 'nonce_not_found', message: 'Request a nonce first' });
    }

    if (new Date() > stored.expiresAt) {
      nonceStore.delete(body.walletAddress);
      return reply.status(400).send({ error: 'nonce_expired', message: 'Nonce has expired' });
    }

    if (stored.nonce !== body.nonce) {
      return reply.status(400).send({ error: 'invalid_nonce', message: 'Nonce does not match' });
    }

    // Verify signature
    try {
      const publicKey = new PublicKey(body.walletAddress);
      const message = new TextEncoder().encode(body.nonce);
      const signature = bs58.decode(body.signature);

      const isValid = nacl.sign.detached.verify(message, signature, publicKey.toBytes());

      if (!isValid) {
        return reply.status(401).send({ error: 'invalid_signature', message: 'Signature verification failed' });
      }
    } catch {
      return reply.status(401).send({ error: 'invalid_signature', message: 'Could not verify signature' });
    }

    // Clean up nonce
    nonceStore.delete(body.walletAddress);

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: body.walletAddress },
      include: { balance: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: body.walletAddress,
          balance: {
            create: {
              available: 0,
              locked: 0,
              inYield: 0,
            },
          },
        },
        include: { balance: true },
      });
    }

    // Generate JWT
    const token = fastify.jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      { expiresIn: '24h' }
    );

    return {
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt.toISOString(),
      },
    };
  });

  // Disconnect (invalidate token - in production, use token blacklist)
  fastify.post('/disconnect', async (request, reply) => {
    // In production, add token to blacklist in Redis
    return { success: true };
  });
}
