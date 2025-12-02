# Vector Markets - Product Requirements Document

## Vision

A crypto-native sports betting platform that aggregates odds from multiple bookmakers, provides AI-powered insights, and settles instantly via blockchain. Open to anyone, not just whales.

---

## Core Value Propositions

| For User | Pain Point Solved |
|----------|-------------------|
| **Best Odds** | No more checking 10 different sites - we show the best price |
| **No Limits** | Route through sharp books that don't ban winners |
| **Instant Settlement** | USDC in/out in seconds, not days via bank wire |
| **Earn While Waiting** | Idle funds earn yield (5%+ APY) |
| **AI Edge** | Predictions, value detection, smart bankroll management |

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. CONNECT & DEPOSIT                                       │
│                                                             │
│  User connects Solana wallet (Phantom/Solflare)             │
│  Deposits USDC → Vector Vault                               │
│  Optional: Enable auto-yield on idle balance                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BROWSE & DISCOVER                                       │
│                                                             │
│  Homepage: Today's matches with best odds                   │
│  AI Picks: Model-generated value bets                       │
│  Search: Find any match (Liverpool vs Man City)             │
│  Filters: League, sport, time, odds range                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. MATCH VIEW                                              │
│                                                             │
│  Liverpool vs Manchester City                               │
│  Premier League | Dec 15, 2025 | 16:30 UTC                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MARKETS                                            │   │
│  │                                                     │   │
│  │  1X2 (Full Time)                                    │   │
│  │  ┌──────────┬──────────┬──────────┐                │   │
│  │  │ Liverpool│   Draw   │ Man City │                │   │
│  │  │   2.45   │   3.40   │   2.80   │                │   │
│  │  │ +3% EV ⚡│          │          │                │   │
│  │  └──────────┴──────────┴──────────┘                │   │
│  │                                                     │   │
│  │  Asian Handicap                                     │   │
│  │  Over/Under 2.5 Goals                              │   │
│  │  Both Teams to Score                               │   │
│  │  + More Markets                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AI INSIGHT                                         │   │
│  │  "Liverpool home form (W4-D1-L0) vs City's         │   │
│  │   away struggles. Model sees 12% edge on Liverpool │   │
│  │   or Draw double chance @ 1.52"                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. PLACE BET                                               │
│                                                             │
│  Selection: Liverpool to Win @ 2.45                         │
│  Stake: [____] USDC        or   [1%] [2%] [5%] of bankroll │
│                                                             │
│  Potential Return: $245.00                                  │
│  AI Confidence: 72% | Kelly Optimal: 2.3%                   │
│                                                             │
│  [Place Bet]                                                │
│                                                             │
│  ⚡ Routing: Pinnacle (best available)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. TRACK & SETTLE                                          │
│                                                             │
│  Active Bets: Live tracking with match updates              │
│  Settlement: Auto-credited on result (via oracle)           │
│  History: Full bet history with P&L analytics               │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Breakdown

### Phase 1: MVP (Core Betting)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Wallet Connect** | Phantom, Solflare, Backpack | P0 |
| **USDC Deposits/Withdrawals** | Solana SPL token | P0 |
| **Match Browsing** | List of upcoming matches with odds | P0 |
| **Single Bets** | Place bet on one outcome | P0 |
| **Odds Display** | Show best available odds | P0 |
| **Bet History** | View past bets and results | P0 |
| **Basic P&L** | Win/loss tracking | P0 |

### Phase 2: AI Layer

| Feature | Description | Priority |
|---------|-------------|----------|
| **Value Indicator** | Show +EV bets vs closing line | P1 |
| **AI Match Insights** | LLM-generated analysis per match | P1 |
| **Predictions** | Model win probabilities | P1 |
| **Kelly Calculator** | Optimal stake suggestions | P1 |
| **Smart Alerts** | Notify when value appears | P2 |

### Phase 3: Advanced

| Feature | Description | Priority |
|---------|-------------|----------|
| **Yield Vault** | Earn on idle USDC | P2 |
| **Parlay Builder** | Multi-leg bets | P2 |
| **Live Betting** | In-play markets | P2 |
| **Social Features** | Follow sharp bettors, copy bets | P3 |
| **Natural Language** | "Bet $50 on Liverpool" | P3 |

---

## Markets Supported (MVP)

### Sports
- **Soccer/Football** (primary focus)
  - Premier League
  - La Liga
  - Serie A
  - Bundesliga
  - Ligue 1
  - Champions League
  - Europa League

### Bet Types (MVP)
- 1X2 (Match Result)
- Asian Handicap
- Over/Under Goals
- Both Teams to Score

### Bet Types (Phase 2)
- Correct Score
- First Goalscorer
- Half-Time/Full-Time
- Player Props

---

## Technical Requirements

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: @solana/wallet-adapter
- **State**: Zustand + React Query
- **Charts**: Lightweight Charts (TradingView)

### Backend
- **Runtime**: Node.js or Rust
- **API**: REST + WebSocket (live odds)
- **Database**: PostgreSQL (users, bets) + Redis (caching)
- **Queue**: BullMQ or similar (bet processing)

### Blockchain
- **Chain**: Solana
- **Token**: USDC (SPL)
- **Programs**: Anchor framework
- **Oracle**: Switchboard or Pyth (for results)

### AI/ML
- **LLM**: Claude API (insights, NLP)
- **Predictions**: Python service (XGBoost/LightGBM)
- **Data**: Historical odds, results, stats

### External Integrations
- **Odds Feed**: OddsMatrix, The Odds API, or direct book APIs
- **Results**: API-Football, SportRadar
- **Yield**: Ondo (USDY) or similar

---

## Data Model (Core Entities)

```
User
├── id (uuid)
├── wallet_address (string)
├── created_at
├── settings (json)
└── kyc_status (optional)

Balance
├── user_id
├── available (decimal)
├── locked (decimal)  // in active bets
├── in_yield (decimal)
└── updated_at

Match
├── id
├── external_id (from odds provider)
├── sport
├── league
├── home_team
├── away_team
├── start_time
├── status (upcoming/live/finished)
└── result (json)

Market
├── id
├── match_id
├── type (1x2, over_under, asian_handicap)
├── line (for handicaps/totals)
├── status (open/suspended/settled)
└── outcomes[]

Outcome
├── id
├── market_id
├── name (Home, Draw, Away, Over, Under)
├── odds (decimal)
├── book_source
└── updated_at

Bet
├── id
├── user_id
├── outcome_id
├── stake (decimal)
├── odds_taken (decimal)
├── potential_return (decimal)
├── status (pending/won/lost/void)
├── settled_at
└── created_at

Prediction (AI)
├── id
├── match_id
├── model_version
├── probabilities (json: {home, draw, away})
├── confidence
├── features_snapshot (json)
└── created_at
```

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Latency** | Odds updates < 500ms |
| **Uptime** | 99.9% |
| **Bet Placement** | < 2 seconds confirmation |
| **Concurrent Users** | 10,000+ |
| **Mobile** | Fully responsive (mobile-first) |

---

## Regulatory Considerations

1. **Jurisdiction**: Incorporate offshore (Curacao or similar)
2. **Geofencing**: Block restricted regions (US, UK, France, Ontario)
3. **KYC**: Light KYC for withdrawals over threshold
4. **Responsible Gambling**: Deposit limits, self-exclusion options

---

## Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| **Registered Users** | 10,000 |
| **Monthly Active Users** | 2,000 |
| **Monthly Betting Volume** | $1M+ |
| **Avg Bets Per User** | 15/month |
| **User Retention (30-day)** | 40% |

---

## Open Questions

1. **Odds Source**: OddsMatrix API vs The Odds API vs direct integrations?
2. **Execution Model**: Display odds only (referral) vs actual bet routing?
3. **Liquidity**: Partner with existing books or build order book?
4. **Token**: Launch $VECT governance token? When?
5. **Mobile**: Native apps or PWA first?
