# Vector Markets - MVP Development Roadmap

## MVP Scope

**Goal:** A working betting platform where users can:
1. Connect wallet + deposit USDC
2. Browse soccer matches with live odds
3. Place single bets
4. Track bets and see results
5. Withdraw winnings

**Out of Scope for MVP:**
- AI predictions (Phase 2)
- Yield vault (Phase 2)
- Live/in-play betting (Phase 2)
- Parlays (Phase 2)
- Mobile native apps (Phase 3)

---

## Development Phases

### Phase 0: Setup (Week 1)

| Task | Details |
|------|---------|
| Repository setup | Turborepo monorepo, TypeScript config |
| Development environment | Docker Compose (Postgres, Redis, Solana validator) |
| CI/CD pipeline | GitHub Actions for lint, test, build |
| Design system | Tailwind + shadcn/ui base components |
| Solana project | Anchor project initialized |

**Deliverable:** Empty but runnable project with all tooling working.

---

### Phase 1: Core Backend (Weeks 2-3)

#### Week 2: Database + Auth

| Task | Details |
|------|---------|
| Database schema | Users, matches, markets, outcomes, bets |
| Prisma setup | Models, migrations, seed data |
| Wallet auth | SIWS (Sign-In with Solana) implementation |
| User endpoints | /auth/connect, /users/me |
| Balance tracking | Internal ledger for user balances |

#### Week 3: Betting Logic

| Task | Details |
|------|---------|
| Match endpoints | GET /matches, GET /matches/:id |
| Bet placement | POST /bets with validation |
| Bet retrieval | GET /bets, GET /bets/:id |
| Balance locking | Lock funds when bet placed |
| Bet settlement | Service to mark bets won/lost |

**Deliverable:** API that can handle full betting flow (mock odds).

---

### Phase 2: Odds Integration (Week 4)

| Task | Details |
|------|---------|
| Odds API research | Evaluate OddsMatrix, The Odds API, others |
| Odds ingester service | Fetch, normalize, store odds |
| Redis caching | Latest odds in cache |
| Match sync | Auto-create matches from odds feed |
| Results integration | Fetch results for settlement |

**Deliverable:** Real odds flowing into the system.

---

### Phase 3: Frontend Core (Weeks 5-6)

#### Week 5: Pages + Wallet

| Task | Details |
|------|---------|
| Layout + navigation | Header, sidebar, responsive shell |
| Wallet integration | Connect button, balance display |
| Home page | Featured/upcoming matches |
| Match list | Browse all matches with filters |
| Match detail | Show all markets and odds |

#### Week 6: Betting UI

| Task | Details |
|------|---------|
| Betslip component | Add selections, enter stake |
| Bet placement flow | Confirmation, loading, success/error |
| My bets page | Active bets with live status |
| Bet history | Past bets with P&L |
| Profile page | Wallet, balance, settings |

**Deliverable:** Fully functional web app (without blockchain settlement).

---

### Phase 4: Blockchain Integration (Weeks 7-8)

#### Week 7: Solana Programs

| Task | Details |
|------|---------|
| VectorVault program | Deposit, withdraw, lock, settle instructions |
| Testing | Anchor tests on localnet |
| Devnet deployment | Deploy and verify |
| Program SDK | TypeScript bindings for frontend |

#### Week 8: Integration

| Task | Details |
|------|---------|
| Deposit flow | User deposits USDC to vault |
| Withdrawal flow | User withdraws USDC |
| Balance sync | On-chain ↔ off-chain reconciliation |
| Transaction history | Show on-chain txs in UI |

**Deliverable:** Real crypto deposits/withdrawals working on devnet.

---

### Phase 5: Polish + Launch Prep (Weeks 9-10)

#### Week 9: Testing + Fixes

| Task | Details |
|------|---------|
| E2E testing | Playwright tests for critical flows |
| Load testing | Simulate concurrent users |
| Bug fixes | Address issues from testing |
| Error handling | Graceful failures, retry logic |
| Logging + monitoring | Structured logs, basic alerting |

#### Week 10: Launch

| Task | Details |
|------|---------|
| Security review | Audit Solana program, API hardening |
| Mainnet deployment | Solana mainnet-beta |
| Production infra | Deploy backend, frontend |
| Geofencing | Block restricted regions |
| Soft launch | Invite-only beta users |

**Deliverable:** Live product on mainnet with real money.

---

## Tech Decisions (Locked In)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | Next.js 14 | App router, RSC, great DX |
| **Backend** | Node.js + Fastify | Fast, TypeScript native, good ecosystem |
| **Database** | PostgreSQL | Reliable, ACID, good for financial data |
| **Cache** | Redis | Odds caching, rate limiting, sessions |
| **Blockchain** | Solana | Fast, cheap, USDC native |
| **Smart Contracts** | Anchor | Standard for Solana, easier audits |
| **Hosting** | Vercel + Railway/Render | Simple, scalable, good free tiers |

---

## Team / Roles Needed

| Role | Responsibilities |
|------|------------------|
| **Full-Stack Dev** | Frontend + API development |
| **Solana Dev** | Smart contracts, on-chain integration |
| **Designer** | UI/UX, component library |
| **Data/ML** (Phase 2) | Predictions, AI features |

For solo/small team, prioritize Full-Stack + Solana knowledge.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Odds API costs** | Start with The Odds API (cheaper), scale to OddsMatrix |
| **Solana program bugs** | Extensive testing, consider audit before mainnet |
| **Regulatory issues** | Offshore entity, strict geofencing, legal counsel |
| **No users** | Build in public, crypto Twitter presence, beta waitlist |
| **Smart contract hack** | Limit vault size initially, insurance fund |

---

## Budget Estimate (MVP)

| Item | Cost/Month |
|------|------------|
| Odds API | $100-500 |
| Solana RPC (Helius) | $0-100 |
| Hosting (Vercel/Railway) | $0-50 |
| Database (Supabase/Neon) | $0-25 |
| Domain + misc | $20 |
| **Total** | **~$200-700/month** |

Solana program deployment: ~$2-5 SOL (~$300-500 one-time)

---

## Success Criteria for MVP

| Metric | Target |
|--------|--------|
| Users can deposit | ✓ Works on mainnet |
| Users can bet | ✓ Bet placed and recorded |
| Bets settle correctly | ✓ 100% accuracy |
| Withdrawals work | ✓ Funds received in wallet |
| Odds are live | ✓ < 60s delay from source |
| No critical bugs | ✓ No fund loss scenarios |

---

## Post-MVP Priorities

1. **AI Predictions** - Competitive advantage
2. **More sports** - Basketball, Tennis, MMA
3. **Yield vault** - Sticky capital
4. **Mobile apps** - React Native or Flutter
5. **Social features** - Leaderboards, copy betting
6. **Token launch** - $VECT for governance/rewards
