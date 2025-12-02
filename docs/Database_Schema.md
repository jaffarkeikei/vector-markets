# Vector Markets - Database Schema

## Overview

PostgreSQL database with Prisma ORM.

---

## Schema Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     League      │       │      Team       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ walletAddress   │       │ externalId      │       │ externalId      │
│ createdAt       │       │ name            │       │ name            │
│ updatedAt       │       │ country         │       │ shortName       │
└────────┬────────┘       │ sport           │       │ logo            │
         │                │ logo            │       │ leagueId        │
         │                └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Balance      │       │     Match       │◄──────│                 │
├─────────────────┤       ├─────────────────┤       │                 │
│ id              │       │ id              │       │                 │
│ userId          │───┐   │ externalId      │       │                 │
│ available       │   │   │ leagueId        │       │                 │
│ locked          │   │   │ homeTeamId      │───────┘                 │
│ inYield         │   │   │ awayTeamId      │─────────────────────────┘
└─────────────────┘   │   │ startTime       │
                      │   │ status          │
                      │   │ homeScore       │
                      │   │ awayScore       │
                      │   └────────┬────────┘
                      │            │
                      │            ▼
                      │   ┌─────────────────┐
                      │   │     Market      │
                      │   ├─────────────────┤
                      │   │ id              │
                      │   │ matchId         │
                      │   │ type            │
                      │   │ name            │
                      │   │ line            │
                      │   │ status          │
                      │   └────────┬────────┘
                      │            │
                      │            ▼
                      │   ┌─────────────────┐
                      │   │    Outcome      │
                      │   ├─────────────────┤
                      │   │ id              │
                      │   │ marketId        │
                      │   │ name            │
                      │   │ odds            │
                      │   │ result          │
                      │   └────────┬────────┘
                      │            │
                      ▼            ▼
                ┌─────────────────────────┐
                │          Bet            │
                ├─────────────────────────┤
                │ id                      │
                │ userId                  │
                │ outcomeId               │
                │ stake                   │
                │ odds                    │
                │ potentialReturn         │
                │ status                  │
                │ settledAt               │
                └─────────────────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & BALANCE
// ============================================

model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  balance      Balance?
  bets         Bet[]
  transactions Transaction[]

  @@index([walletAddress])
}

model Balance {
  id        String   @id @default(cuid())
  userId    String   @unique
  available Decimal  @default(0) @db.Decimal(18, 6)
  locked    Decimal  @default(0) @db.Decimal(18, 6)
  inYield   Decimal  @default(0) @db.Decimal(18, 6)
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model Transaction {
  id        String          @id @default(cuid())
  userId    String
  type      TransactionType
  amount    Decimal         @db.Decimal(18, 6)
  status    TxStatus        @default(PENDING)
  txHash    String?
  betId     String?
  metadata  Json?
  createdAt DateTime        @default(now())

  user User @relation(fields: [userId], references: [id])
  bet  Bet? @relation(fields: [betId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BET_STAKE
  BET_WIN
  BET_REFUND
  YIELD_DEPOSIT
  YIELD_WITHDRAW
  YIELD_EARNED
}

enum TxStatus {
  PENDING
  CONFIRMED
  FAILED
}

// ============================================
// SPORTS DATA
// ============================================

model League {
  id         String   @id @default(cuid())
  externalId String   @unique
  name       String
  country    String
  sport      Sport    @default(SOCCER)
  logo       String?
  priority   Int      @default(0)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  teams   Team[]
  matches Match[]

  @@index([sport])
  @@index([isActive])
}

model Team {
  id         String   @id @default(cuid())
  externalId String   @unique
  name       String
  shortName  String?
  logo       String?
  leagueId   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  league      League  @relation(fields: [leagueId], references: [id])
  homeMatches Match[] @relation("HomeTeam")
  awayMatches Match[] @relation("AwayTeam")

  @@index([leagueId])
}

model Match {
  id         String      @id @default(cuid())
  externalId String      @unique
  leagueId   String
  homeTeamId String
  awayTeamId String
  startTime  DateTime
  status     MatchStatus @default(UPCOMING)
  homeScore  Int?
  awayScore  Int?
  venue      String?
  metadata   Json?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  league   League   @relation(fields: [leagueId], references: [id])
  homeTeam Team     @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam Team     @relation("AwayTeam", fields: [awayTeamId], references: [id])
  markets  Market[]

  @@index([leagueId])
  @@index([status])
  @@index([startTime])
}

enum Sport {
  SOCCER
  BASKETBALL
  TENNIS
  AMERICAN_FOOTBALL
  BASEBALL
  HOCKEY
  MMA
}

enum MatchStatus {
  UPCOMING
  LIVE
  FINISHED
  POSTPONED
  CANCELLED
}

// ============================================
// MARKETS & ODDS
// ============================================

model Market {
  id        String       @id @default(cuid())
  matchId   String
  type      MarketType
  name      String
  line      Decimal?     @db.Decimal(6, 2)
  status    MarketStatus @default(OPEN)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  match    Match     @relation(fields: [matchId], references: [id])
  outcomes Outcome[]

  @@unique([matchId, type, line])
  @@index([matchId])
  @@index([status])
}

model Outcome {
  id           String        @id @default(cuid())
  marketId     String
  name         String
  odds         Decimal       @db.Decimal(8, 4)
  previousOdds Decimal?      @db.Decimal(8, 4)
  result       OutcomeResult @default(PENDING)
  updatedAt    DateTime      @updatedAt

  market Market @relation(fields: [marketId], references: [id])
  bets   Bet[]

  @@index([marketId])
}

model OddsHistory {
  id        String   @id @default(cuid())
  outcomeId String
  odds      Decimal  @db.Decimal(8, 4)
  source    String?
  createdAt DateTime @default(now())

  @@index([outcomeId])
  @@index([createdAt])
}

enum MarketType {
  MATCH_RESULT        // 1X2
  ASIAN_HANDICAP
  OVER_UNDER
  BOTH_TO_SCORE
  DOUBLE_CHANCE
  CORRECT_SCORE
  HALF_TIME_RESULT
  FIRST_GOALSCORER
}

enum MarketStatus {
  OPEN
  SUSPENDED
  SETTLED
  VOID
}

enum OutcomeResult {
  PENDING
  WIN
  LOSE
  VOID
  HALF_WIN
  HALF_LOSE
}

// ============================================
// BETS
// ============================================

model Bet {
  id              String    @id @default(cuid())
  userId          String
  outcomeId       String
  stake           Decimal   @db.Decimal(18, 6)
  odds            Decimal   @db.Decimal(8, 4)
  potentialReturn Decimal   @db.Decimal(18, 6)
  actualReturn    Decimal?  @db.Decimal(18, 6)
  status          BetStatus @default(PENDING)
  settledAt       DateTime?
  createdAt       DateTime  @default(now())

  user         User          @relation(fields: [userId], references: [id])
  outcome      Outcome       @relation(fields: [outcomeId], references: [id])
  transactions Transaction[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum BetStatus {
  PENDING
  WON
  LOST
  VOID
  HALF_WON
  HALF_LOST
  CASHED_OUT
}

// ============================================
// AI PREDICTIONS (Phase 2)
// ============================================

model Prediction {
  id              String   @id @default(cuid())
  matchId         String
  modelVersion    String
  homeProb        Decimal  @db.Decimal(5, 4)
  drawProb        Decimal  @db.Decimal(5, 4)
  awayProb        Decimal  @db.Decimal(5, 4)
  confidence      Decimal  @db.Decimal(5, 4)
  features        Json?
  actualResult    String?
  createdAt       DateTime @default(now())

  @@index([matchId])
  @@index([createdAt])
}
```

---

## Key Queries

### Get user with balance
```sql
SELECT u.*, b.available, b.locked, b.in_yield
FROM "User" u
LEFT JOIN "Balance" b ON u.id = b."userId"
WHERE u."walletAddress" = $1;
```

### Get upcoming matches with best odds
```sql
SELECT
  m.id,
  m."startTime",
  ht.name as "homeTeam",
  at.name as "awayTeam",
  l.name as league,
  (
    SELECT MAX(o.odds)
    FROM "Outcome" o
    JOIN "Market" mk ON o."marketId" = mk.id
    WHERE mk."matchId" = m.id
    AND mk.type = 'MATCH_RESULT'
    AND o.name = 'Home'
  ) as "homeOdds",
  (
    SELECT MAX(o.odds)
    FROM "Outcome" o
    JOIN "Market" mk ON o."marketId" = mk.id
    WHERE mk."matchId" = m.id
    AND mk.type = 'MATCH_RESULT'
    AND o.name = 'Draw'
  ) as "drawOdds",
  (
    SELECT MAX(o.odds)
    FROM "Outcome" o
    JOIN "Market" mk ON o."marketId" = mk.id
    WHERE mk."matchId" = m.id
    AND mk.type = 'MATCH_RESULT'
    AND o.name = 'Away'
  ) as "awayOdds"
FROM "Match" m
JOIN "Team" ht ON m."homeTeamId" = ht.id
JOIN "Team" at ON m."awayTeamId" = at.id
JOIN "League" l ON m."leagueId" = l.id
WHERE m.status = 'UPCOMING'
AND m."startTime" > NOW()
ORDER BY m."startTime" ASC
LIMIT 20;
```

### Get user betting stats
```sql
SELECT
  COUNT(*) as "totalBets",
  COUNT(*) FILTER (WHERE status = 'WON') as "wonBets",
  COUNT(*) FILTER (WHERE status = 'LOST') as "lostBets",
  SUM(stake) as "totalStaked",
  SUM(COALESCE("actualReturn", 0)) as "totalReturn",
  SUM(COALESCE("actualReturn", 0) - stake) as "profit"
FROM "Bet"
WHERE "userId" = $1;
```

### Get active bets with match info
```sql
SELECT
  b.*,
  o.name as "outcomeName",
  o.odds as "currentOdds",
  mk.name as "marketName",
  m."startTime",
  m.status as "matchStatus",
  ht.name as "homeTeam",
  at.name as "awayTeam"
FROM "Bet" b
JOIN "Outcome" o ON b."outcomeId" = o.id
JOIN "Market" mk ON o."marketId" = mk.id
JOIN "Match" m ON mk."matchId" = m.id
JOIN "Team" ht ON m."homeTeamId" = ht.id
JOIN "Team" at ON m."awayTeamId" = at.id
WHERE b."userId" = $1
AND b.status = 'PENDING'
ORDER BY m."startTime" ASC;
```

### Settle bets for a match
```sql
-- First, update outcomes based on result
UPDATE "Outcome" o
SET result = CASE
  WHEN mk.type = 'MATCH_RESULT' AND o.name = 'Home' AND m."homeScore" > m."awayScore" THEN 'WIN'
  WHEN mk.type = 'MATCH_RESULT' AND o.name = 'Away' AND m."awayScore" > m."homeScore" THEN 'WIN'
  WHEN mk.type = 'MATCH_RESULT' AND o.name = 'Draw' AND m."homeScore" = m."awayScore" THEN 'WIN'
  -- Add other market type logic...
  ELSE 'LOSE'
END
FROM "Market" mk
JOIN "Match" m ON mk."matchId" = m.id
WHERE o."marketId" = mk.id
AND m.id = $1
AND m.status = 'FINISHED';

-- Then, settle bets
UPDATE "Bet" b
SET
  status = CASE WHEN o.result = 'WIN' THEN 'WON' ELSE 'LOST' END,
  "actualReturn" = CASE WHEN o.result = 'WIN' THEN b.stake * b.odds ELSE 0 END,
  "settledAt" = NOW()
FROM "Outcome" o
JOIN "Market" mk ON o."marketId" = mk.id
WHERE b."outcomeId" = o.id
AND mk."matchId" = $1
AND b.status = 'PENDING';
```

---

## Indexes Strategy

```sql
-- User lookups
CREATE INDEX idx_user_wallet ON "User"("walletAddress");

-- Match queries
CREATE INDEX idx_match_status_time ON "Match"(status, "startTime");
CREATE INDEX idx_match_league ON "Match"("leagueId");

-- Market/Outcome queries
CREATE INDEX idx_market_match ON "Market"("matchId");
CREATE INDEX idx_outcome_market ON "Outcome"("marketId");

-- Bet queries
CREATE INDEX idx_bet_user_status ON "Bet"("userId", status);
CREATE INDEX idx_bet_created ON "Bet"("createdAt" DESC);

-- Analytics
CREATE INDEX idx_odds_history_outcome_time ON "OddsHistory"("outcomeId", "createdAt");
```

---

## Data Retention

| Table | Retention | Notes |
|-------|-----------|-------|
| User | Forever | Core data |
| Balance | Forever | Current state only |
| Transaction | 2 years | Compliance |
| Match | 1 year | Archive to cold storage |
| Market/Outcome | 1 year | Archive with match |
| Bet | Forever | User history |
| OddsHistory | 90 days | Analytics only |
| Prediction | 1 year | Model evaluation |
