import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { matchRoutes } from './routes/matches.js';
import { betRoutes } from './routes/bets.js';
import { userRoutes } from './routes/users.js';
import { aiRoutes } from './routes/ai.js';

async function buildApp() {
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(matchRoutes, { prefix: '/matches' });
  await fastify.register(betRoutes, { prefix: '/bets' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(aiRoutes, { prefix: '/ai' });

  return fastify;
}

// Start server
const start = async () => {
  try {
    const fastify = await buildApp();
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

export { buildApp };
