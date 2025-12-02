# Vector Markets

Crypto-native sports betting platform with AI-powered insights, built on Solana.

## Overview

Vector Markets aggregates odds from multiple bookmakers, provides best available prices, and settles instantly via USDC on Solana. Open to everyone.

### Key Features

- **Best Odds Aggregation** - Compare and bet at the best available odds
- **Instant Settlement** - USDC deposits/withdrawals in seconds
- **AI Insights** - Predictions and value detection (Phase 2)
- **Yield on Idle Funds** - Earn while your bankroll waits (Phase 2)

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Fastify, Prisma, PostgreSQL
- **Blockchain**: Solana, Anchor Framework
- **AI**: Claude API, XGBoost (Phase 2)

## Project Structure

```
vector-markets/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── shared/       # Shared types & utils
│   └── contracts/    # Solana programs
├── docs/             # Documentation
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local database)
- Solana CLI (for contracts)
- Rust (for contracts)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/jaffarkeikei/vector-markets.git
   cd vector-markets
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start local services**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit .env with your values
   ```

5. **Initialize database**
   ```bash
   pnpm db:push
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## Development

### Commands

```bash
# Start all services in development
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm check-types

# Database operations
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to database
pnpm db:studio     # Open Prisma Studio
```

### Solana Contracts

```bash
cd packages/contracts

# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Documentation

- [Product Requirements](./docs/Product_Requirements.md)
- [Architecture](./docs/Architecture.md)
- [API Specification](./docs/API_Specification.md)
- [Database Schema](./docs/Database_Schema.md)
- [MVP Roadmap](./docs/MVP_Roadmap.md)

## License

MIT
