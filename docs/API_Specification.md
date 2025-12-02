# Vector Markets - API Specification

Base URL: `https://api.vectormarkets.io/v1`

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Connect Wallet

Authenticate using Sign-In with Solana (SIWS).

**Step 1: Get nonce**
```http
POST /auth/nonce
Content-Type: application/json

{
  "walletAddress": "7xKX...abc"
}
```

Response:
```json
{
  "nonce": "Sign this message to authenticate with Vector Markets: abc123xyz",
  "expiresAt": "2025-12-02T12:00:00Z"
}
```

**Step 2: Verify signature**
```http
POST /auth/connect
Content-Type: application/json

{
  "walletAddress": "7xKX...abc",
  "signature": "base58_encoded_signature",
  "nonce": "abc123xyz"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-12-03T12:00:00Z",
  "user": {
    "id": "usr_abc123",
    "walletAddress": "7xKX...abc",
    "createdAt": "2025-12-01T10:00:00Z"
  }
}
```

### Disconnect
```http
POST /auth/disconnect
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true
}
```

---

## Users

### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "usr_abc123",
  "walletAddress": "7xKX...abc",
  "balance": {
    "available": 1000.00,
    "locked": 250.00,
    "inYield": 0.00,
    "total": 1250.00
  },
  "stats": {
    "totalBets": 47,
    "wonBets": 22,
    "totalWagered": 4500.00,
    "totalProfit": 320.50,
    "roi": 7.12
  },
  "createdAt": "2025-12-01T10:00:00Z"
}
```

### Get Balance
```http
GET /users/me/balance
Authorization: Bearer <token>
```

Response:
```json
{
  "available": 1000.00,
  "locked": 250.00,
  "inYield": 0.00,
  "total": 1250.00,
  "currency": "USDC"
}
```

### Get Transactions
```http
GET /users/me/transactions?limit=20&offset=0
Authorization: Bearer <token>
```

Response:
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "type": "deposit",
      "amount": 500.00,
      "status": "confirmed",
      "txHash": "5UxB...xyz",
      "createdAt": "2025-12-01T11:00:00Z"
    },
    {
      "id": "txn_124",
      "type": "bet_stake",
      "amount": -100.00,
      "betId": "bet_abc",
      "createdAt": "2025-12-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 20,
    "offset": 0
  }
}
```

---

## Matches

### List Matches
```http
GET /matches?sport=soccer&status=upcoming&league=premier-league&limit=20
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| sport | string | Filter by sport (soccer, basketball) |
| status | string | upcoming, live, finished |
| league | string | League slug |
| date | string | ISO date (2025-12-02) |
| limit | number | Max results (default 20) |
| offset | number | Pagination offset |

Response:
```json
{
  "matches": [
    {
      "id": "match_abc123",
      "sport": "soccer",
      "league": {
        "id": "league_epl",
        "name": "Premier League",
        "country": "England"
      },
      "homeTeam": {
        "id": "team_liv",
        "name": "Liverpool",
        "logo": "https://..."
      },
      "awayTeam": {
        "id": "team_mci",
        "name": "Manchester City",
        "logo": "https://..."
      },
      "startTime": "2025-12-15T16:30:00Z",
      "status": "upcoming",
      "bestOdds": {
        "home": 2.45,
        "draw": 3.40,
        "away": 2.80
      },
      "marketsCount": 45
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Match Details
```http
GET /matches/:id
```

Response:
```json
{
  "id": "match_abc123",
  "sport": "soccer",
  "league": {
    "id": "league_epl",
    "name": "Premier League",
    "country": "England"
  },
  "homeTeam": {
    "id": "team_liv",
    "name": "Liverpool",
    "logo": "https://...",
    "form": ["W", "W", "D", "W", "L"]
  },
  "awayTeam": {
    "id": "team_mci",
    "name": "Manchester City",
    "logo": "https://...",
    "form": ["W", "L", "W", "W", "W"]
  },
  "startTime": "2025-12-15T16:30:00Z",
  "status": "upcoming",
  "venue": "Anfield",
  "markets": [
    {
      "id": "mkt_1x2",
      "name": "Match Result",
      "type": "1x2",
      "outcomes": [
        {
          "id": "out_home",
          "name": "Liverpool",
          "odds": 2.45,
          "movement": "up",
          "previousOdds": 2.40
        },
        {
          "id": "out_draw",
          "name": "Draw",
          "odds": 3.40,
          "movement": "stable",
          "previousOdds": 3.40
        },
        {
          "id": "out_away",
          "name": "Manchester City",
          "odds": 2.80,
          "movement": "down",
          "previousOdds": 2.85
        }
      ]
    },
    {
      "id": "mkt_ou25",
      "name": "Over/Under 2.5 Goals",
      "type": "over_under",
      "line": 2.5,
      "outcomes": [
        {
          "id": "out_over",
          "name": "Over 2.5",
          "odds": 1.85
        },
        {
          "id": "out_under",
          "name": "Under 2.5",
          "odds": 1.95
        }
      ]
    }
  ],
  "stats": {
    "h2h": {
      "homeWins": 3,
      "draws": 2,
      "awayWins": 5,
      "lastMeetings": [
        {
          "date": "2025-03-10",
          "homeScore": 1,
          "awayScore": 1
        }
      ]
    }
  }
}
```

### Get Live Odds (WebSocket)

Connect to: `wss://api.vectormarkets.io/v1/ws`

Subscribe:
```json
{
  "action": "subscribe",
  "channel": "odds",
  "matchId": "match_abc123"
}
```

Receive:
```json
{
  "type": "odds_update",
  "matchId": "match_abc123",
  "updates": [
    {
      "outcomeId": "out_home",
      "odds": 2.50,
      "previousOdds": 2.45,
      "timestamp": "2025-12-02T10:30:15Z"
    }
  ]
}
```

---

## Bets

### Place Bet
```http
POST /bets
Authorization: Bearer <token>
Content-Type: application/json

{
  "outcomeId": "out_home",
  "stake": 100.00,
  "oddsAccepted": 2.45
}
```

Response (Success):
```json
{
  "id": "bet_xyz789",
  "status": "pending",
  "outcome": {
    "id": "out_home",
    "name": "Liverpool",
    "matchId": "match_abc123"
  },
  "stake": 100.00,
  "odds": 2.45,
  "potentialReturn": 245.00,
  "createdAt": "2025-12-02T10:35:00Z"
}
```

Response (Error - Odds Changed):
```json
{
  "error": "odds_changed",
  "message": "Odds have changed since selection",
  "currentOdds": 2.35,
  "requestedOdds": 2.45
}
```

Response (Error - Insufficient Balance):
```json
{
  "error": "insufficient_balance",
  "message": "Not enough available balance",
  "available": 50.00,
  "required": 100.00
}
```

### Get Active Bets
```http
GET /bets?status=pending
Authorization: Bearer <token>
```

Response:
```json
{
  "bets": [
    {
      "id": "bet_xyz789",
      "status": "pending",
      "match": {
        "id": "match_abc123",
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester City",
        "startTime": "2025-12-15T16:30:00Z",
        "status": "upcoming"
      },
      "outcome": {
        "id": "out_home",
        "name": "Liverpool",
        "market": "Match Result"
      },
      "stake": 100.00,
      "odds": 2.45,
      "potentialReturn": 245.00,
      "createdAt": "2025-12-02T10:35:00Z"
    }
  ],
  "summary": {
    "totalStake": 350.00,
    "potentialReturn": 890.00
  }
}
```

### Get Bet History
```http
GET /bets/history?limit=20&offset=0
Authorization: Bearer <token>
```

Response:
```json
{
  "bets": [
    {
      "id": "bet_abc456",
      "status": "won",
      "match": {
        "id": "match_xyz",
        "homeTeam": "Arsenal",
        "awayTeam": "Chelsea",
        "result": "2-1"
      },
      "outcome": {
        "id": "out_home",
        "name": "Arsenal",
        "market": "Match Result"
      },
      "stake": 50.00,
      "odds": 2.10,
      "potentialReturn": 105.00,
      "actualReturn": 105.00,
      "profit": 55.00,
      "createdAt": "2025-11-28T14:00:00Z",
      "settledAt": "2025-11-28T16:45:00Z"
    }
  ],
  "summary": {
    "totalBets": 47,
    "won": 22,
    "lost": 23,
    "void": 2,
    "totalStake": 4500.00,
    "totalReturn": 4820.50,
    "profit": 320.50,
    "roi": 7.12
  },
  "pagination": {
    "total": 47,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Single Bet
```http
GET /bets/:id
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "bet_xyz789",
  "status": "pending",
  "match": {
    "id": "match_abc123",
    "homeTeam": "Liverpool",
    "awayTeam": "Manchester City",
    "startTime": "2025-12-15T16:30:00Z",
    "status": "upcoming",
    "league": "Premier League"
  },
  "outcome": {
    "id": "out_home",
    "name": "Liverpool",
    "market": "Match Result",
    "currentOdds": 2.50
  },
  "stake": 100.00,
  "odds": 2.45,
  "potentialReturn": 245.00,
  "createdAt": "2025-12-02T10:35:00Z"
}
```

---

## AI (Phase 2)

### Get Match Prediction
```http
GET /ai/predictions/:matchId
```

Response:
```json
{
  "matchId": "match_abc123",
  "predictions": {
    "home": 0.42,
    "draw": 0.28,
    "away": 0.30
  },
  "confidence": 0.72,
  "modelVersion": "v2.3.1",
  "valueBets": [
    {
      "outcome": "home",
      "currentOdds": 2.45,
      "fairOdds": 2.38,
      "edge": 2.9,
      "recommendation": "slight_value"
    }
  ],
  "generatedAt": "2025-12-02T10:00:00Z"
}
```

### Get Match Insights
```http
GET /ai/insights/:matchId
```

Response:
```json
{
  "matchId": "match_abc123",
  "insight": "Liverpool's home form has been exceptional (W4-D1-L0) with an average of 2.4 goals scored per game at Anfield this season. Manchester City, despite their league position, have struggled away from home, winning just 2 of their last 5 road games. Key factor: Liverpool's pressing intensity at home averages 8.2 PPDA vs City's 12.1 when playing away, suggesting Liverpool will control tempo. The model sees value on Liverpool or Draw double chance.",
  "keyFactors": [
    "Liverpool unbeaten at home this season",
    "City's away form inconsistent",
    "H2H favors City historically but recent meetings even",
    "Both teams missing key midfielders"
  ],
  "generatedAt": "2025-12-02T10:00:00Z"
}
```

### Get Value Bets
```http
GET /ai/value-bets?minEdge=3&sport=soccer
```

Response:
```json
{
  "valueBets": [
    {
      "match": {
        "id": "match_abc123",
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester City",
        "startTime": "2025-12-15T16:30:00Z"
      },
      "outcome": "home",
      "currentOdds": 2.45,
      "fairOdds": 2.22,
      "edge": 10.4,
      "confidence": 0.75,
      "suggestedStake": "2.1%"
    }
  ],
  "generatedAt": "2025-12-02T10:00:00Z"
}
```

---

## Leagues

### List Leagues
```http
GET /leagues?sport=soccer
```

Response:
```json
{
  "leagues": [
    {
      "id": "league_epl",
      "name": "Premier League",
      "country": "England",
      "sport": "soccer",
      "logo": "https://...",
      "activeMatches": 10
    },
    {
      "id": "league_laliga",
      "name": "La Liga",
      "country": "Spain",
      "sport": "soccer",
      "logo": "https://...",
      "activeMatches": 10
    }
  ]
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {}
}
```

Common error codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| unauthorized | 401 | Invalid or missing token |
| forbidden | 403 | Action not allowed |
| not_found | 404 | Resource not found |
| validation_error | 400 | Invalid request body |
| insufficient_balance | 400 | Not enough funds |
| odds_changed | 400 | Odds moved since selection |
| market_suspended | 400 | Market not accepting bets |
| rate_limited | 429 | Too many requests |
| internal_error | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Public endpoints | 100 req/min |
| Authenticated endpoints | 300 req/min |
| Bet placement | 30 req/min |
| WebSocket messages | 60 msg/min |

Rate limit headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1701512400
```
