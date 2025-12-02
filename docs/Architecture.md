# Vector Markets - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│                         (Next.js + TypeScript)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Matches   │  │   Betslip   │  │   Profile   │  │   AI Chat   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │              WebSocket              REST API
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY                                  │
│                        (Authentication, Rate Limiting)                  │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  BETTING SERVICE│  │  ODDS SERVICE   │  │  USER SERVICE   │
│                 │  │                 │  │                 │
│  - Place bets   │  │  - Fetch odds   │  │  - Auth         │
│  - Settle bets  │  │  - Aggregate    │  │  - Balances     │
│  - Bet history  │  │  - Cache        │  │  - KYC          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ PostgreSQL  │  │    Redis    │  │   S3/R2     │  │ ClickHouse  │   │
│  │ (Primary)   │  │  (Cache)    │  │  (Static)   │  │ (Analytics) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────────────┐      ┌─────────────────────────────┐
│      BLOCKCHAIN LAYER       │      │        AI SERVICE           │
│                             │      │                             │
│  - Solana Programs          │      │  - Predictions API          │
│  - Vault (deposits)         │      │  - Claude Integration       │
│  - Settlement               │      │  - Feature Engineering      │
└─────────────────────────────┘      └─────────────────────────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────────────┐      ┌─────────────────────────────┐
│    EXTERNAL SERVICES        │      │      DATA PROVIDERS         │
│                             │      │                             │
│  - Ondo (Yield)             │      │  - OddsMatrix / Odds API    │
│  - Switchboard (Oracle)     │      │  - API-Football (Stats)     │
└─────────────────────────────┘      └─────────────────────────────┘
```

---

## Directory Structure

```
vector-markets/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # TypeScript types
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── services/       # Business logic
│       │   ├── models/         # Database models
│       │   ├── jobs/           # Background jobs
│       │   └── utils/
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types, utils
│   ├── ui/                     # Shared UI components
│   └── contracts/              # Solana programs
│       ├── programs/
│       │   └── vector-vault/
│       ├── tests/
│       └── Anchor.toml
│
├── services/
│   ├── odds-ingester/          # Fetches & processes odds
│   ├── settlement/             # Settles bets on results
│   └── ai-predictions/         # ML prediction service
│       ├── models/
│       ├── features/
│       └── api/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
├── docs/                       # Documentation
├── turbo.json                  # Turborepo config
├── package.json
└── README.md
```

---

## Service Details

### 1. Frontend (apps/web)

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- React Query (server state)
- @solana/wallet-adapter

**Key Pages:**
```
/                       # Home - featured matches
/matches                # All matches
/matches/[id]           # Match detail + markets
/bets                   # My active bets
/history                # Bet history
/profile                # Settings, balances
/ai                     # AI insights dashboard
```

**Real-time Updates:**
- WebSocket connection for live odds
- Optimistic UI updates for bet placement
- Push notifications for bet settlements

---

### 2. API Service (apps/api)

**Tech Stack:**
- Node.js + Fastify (or Hono)
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Redis (caching + rate limiting)
- BullMQ (job queues)

**API Endpoints:**

```
Authentication
POST   /auth/connect           # Wallet signature auth
POST   /auth/disconnect        # Logout

Users
GET    /users/me               # Current user profile
GET    /users/me/balance       # Balance details
POST   /users/me/deposit       # Initiate deposit
POST   /users/me/withdraw      # Initiate withdrawal

Matches
GET    /matches                # List matches (with filters)
GET    /matches/:id            # Match details + markets
GET    /matches/:id/odds       # All odds for match
GET    /matches/live           # Live matches

Bets
POST   /bets                   # Place bet
GET    /bets                   # My bets (active)
GET    /bets/history           # Past bets
GET    /bets/:id               # Bet details

AI
GET    /ai/predictions/:matchId    # Model predictions
GET    /ai/insights/:matchId       # LLM-generated insights
GET    /ai/value-bets              # Current +EV opportunities
```

---

### 3. Odds Ingester (services/odds-ingester)

**Purpose:** Continuously fetch odds from external providers, normalize, and store.

**Flow:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External APIs  │────▶│  Odds Ingester  │────▶│     Redis       │
│  (OddsMatrix)   │     │                 │     │  (Latest Odds)  │
└─────────────────┘     │  - Fetch        │     └─────────────────┘
                        │  - Normalize    │              │
                        │  - Validate     │              │
                        └─────────────────┘              ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │ (Odds History)  │
                                                └─────────────────┘
```

**Cron Schedule:**
- Pre-match odds: Every 30 seconds
- Live odds: Every 5 seconds (when live)
- Results: Every 1 minute (match day)

---

### 4. Settlement Service (services/settlement)

**Purpose:** Monitor match results and settle bets.

**Flow:**
```
1. Match ends (detected via API-Football or oracle)
2. Fetch official result
3. For each unsettled bet on that match:
   a. Determine win/loss/void
   b. Calculate payout
   c. Update user balance (on-chain if needed)
   d. Mark bet as settled
4. Emit events for notifications
```

**Settlement States:**
- `pending` → `won` / `lost` / `void` / `half_won` / `half_lost`

---

### 5. AI Predictions Service (services/ai-predictions)

**Tech Stack:**
- Python 3.11+
- FastAPI
- XGBoost / LightGBM
- Anthropic Claude API
- Pandas, NumPy

**Endpoints:**
```python
GET  /predict/{match_id}      # Model probabilities
GET  /insights/{match_id}     # LLM analysis
GET  /value-bets              # Matches with +EV
POST /feedback                # Record prediction outcomes
```

**Model Pipeline:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Raw Data       │────▶│  Features       │────▶│   Model         │
│  - Stats        │     │  - Form         │     │  - XGBoost      │
│  - Odds history │     │  - H2H          │     │  - Ensemble     │
│  - Lineups      │     │  - Market       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Predictions    │
                                                │  {home: 0.45,   │
                                                │   draw: 0.28,   │
                                                │   away: 0.27}   │
                                                └─────────────────┘
```

---

### 6. Blockchain Layer (packages/contracts)

**Solana Programs:**

**VectorVault Program:**
```rust
// Core instructions
- initialize()          // Setup vault
- deposit(amount)       // User deposits USDC
- withdraw(amount)      // User withdraws USDC
- lock_for_bet(amount)  // Lock funds for pending bet
- settle_bet(bet_id, won, payout)  // Release/transfer funds
```

**Account Structure:**
```
Vault (PDA)
├── authority: Pubkey
├── usdc_mint: Pubkey
├── total_deposits: u64
└── bump: u8

UserAccount (PDA, seeds: [user_wallet])
├── owner: Pubkey
├── balance: u64
├── locked: u64
└── in_yield: u64
```

---

## Data Flow Examples

### Placing a Bet

```
1. User clicks "Place Bet" on Liverpool @ 2.45 for $100

2. Frontend:
   - Validate stake vs available balance
   - Sign transaction with wallet
   - POST /bets {outcome_id, stake, odds}

3. API:
   - Verify user balance
   - Lock funds (update user.locked)
   - Create bet record (status: pending)
   - Queue blockchain transaction

4. Blockchain:
   - Call lock_for_bet instruction
   - Move USDC from available to locked

5. Response:
   - Return bet confirmation
   - WebSocket push: bet created

6. Settlement (later):
   - Match result detected
   - If won: settle_bet(bet_id, true, 245)
   - User balance updated
   - Notification sent
```

### Fetching Match Odds

```
1. User opens /matches/liverpool-vs-man-city

2. Frontend:
   - GET /matches/:id (match details)
   - Subscribe to WebSocket: odds:{match_id}

3. API:
   - Fetch from Redis (latest odds)
   - If miss: query PostgreSQL
   - Return aggregated odds by market

4. Odds Ingester (background):
   - Polls OddsMatrix every 30s
   - Updates Redis
   - Publishes to WebSocket channel

5. Frontend receives:
   - Real-time odds updates
   - Re-renders automatically
```

---

## Infrastructure

### Development
```
- Local: Docker Compose (Postgres, Redis, Solana test validator)
- Solana: Devnet for testing
```

### Production
```
- Cloud: AWS or Cloudflare
- Database: RDS PostgreSQL + ElastiCache Redis
- Compute: ECS/Fargate or Cloudflare Workers
- Solana: Mainnet-beta with Helius RPC
- CDN: Cloudflare
- Monitoring: Datadog or Grafana
```

### CI/CD
```
- GitHub Actions
- Turborepo for monorepo builds
- Vercel for frontend preview deploys
- Docker builds for services
```

---

## Security Considerations

| Area | Approach |
|------|----------|
| **Wallet Auth** | Sign-In with Solana (SIWS) - signature verification |
| **API Auth** | JWT tokens, short-lived + refresh |
| **Rate Limiting** | Redis-based, per-wallet |
| **Funds** | Never hold private keys; users control via wallet |
| **Vault** | Audited Solana program, minimal attack surface |
| **Odds Manipulation** | Multiple source verification, anomaly detection |

---

## Scaling Strategy

**Phase 1 (MVP):**
- Single API instance
- Managed Postgres (Supabase or Neon)
- Redis Cloud
- Vercel for frontend

**Phase 2 (Growth):**
- Horizontal API scaling
- Read replicas for DB
- Dedicated odds ingester instances
- WebSocket server cluster

**Phase 3 (Scale):**
- Microservices split
- Event-driven architecture (Kafka)
- Global CDN + edge functions
- Multi-region deployment
