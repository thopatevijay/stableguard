# StableGuard - Product Requirements Document (PRD)

## Project Overview

**Name:** StableGuard
**Tagline:** Autonomous Stablecoin Risk Intelligence Agent for Solana
**Tags:** `stablecoins`, `ai`, `security`
**Hackathon:** Colosseum Agent Hackathon (Feb 2-13, 2026)
**Prize Pool:** $100,000 USDC

---

## Timeline & Deadline

| Milestone | Time (IST) | Hours Left |
|-----------|-----------|------------|
| **NOW** | Feb 12, ~5:30 PM IST | ~29 hours |
| Phase 1: Foundation | Feb 12, 5:30 PM - 11:30 PM IST | 6 hours |
| Phase 2: Core Agent | Feb 13, 12:00 AM - 8:00 AM IST | 8 hours |
| Phase 3: Dashboard | Feb 13, 8:00 AM - 2:00 PM IST | 6 hours |
| Phase 4: Polish & Deploy | Feb 13, 2:00 PM - 6:00 PM IST | 4 hours |
| Phase 5: Submit | Feb 13, 6:00 PM - 8:00 PM IST | 2 hours |
| **BUFFER** | Feb 13, 8:00 PM - 10:00 PM IST | 2 hours |
| **DEADLINE** | **Feb 13, 10:30 PM IST** | 0 |

---

## Problem Statement

Every dollar in Solana's $15B+ stablecoin ecosystem is one black swan event away from catastrophic loss. Just 6 weeks ago, USX on Solana crashed to $0.10 (90% loss) due to a liquidity drain on DEXs. In 2023, USDC hit $0.87 during the SVB crisis. The UST collapse wiped $50B+.

Today, no autonomous agent on Solana monitors stablecoin depeg risk in real-time AND takes protective action. Users must manually track prices, check liquidity, and execute swaps -- often too late. StableGuard solves this by providing an autonomous AI agent that monitors, analyzes, and acts on stablecoin risk before humans even see the headline.

---

## Target Audience

A Solana DeFi user or DAO treasury manager holding $10K-$500K+ in stablecoins (USDC, USDT, PYUSD) across lending protocols like Kamino and MarginFi. Today they manually check stablecoin prices, compare yields across protocols, and rebalance positions by hand. They've experienced depeg anxiety (USDC/SVB, UST) and know they can't monitor 24/7. StableGuard is their always-on risk guardian that watches, warns, and acts while they sleep.

---

## Core Features (MVP Scope)

### Feature 1: Real-Time Stablecoin Risk Monitoring
- Monitor USDC, USDT, PYUSD prices via Pyth Network oracles
- Track price deviations from $1.00 peg in real-time
- Poll every ~10 seconds for price updates

### Feature 2: Risk Score Engine
- Composite risk score (0-100) for each stablecoin
- Weights: Oracle price deviation (40%) + DEX liquidity depth (30%) + Volume anomaly (20%) + Large transfer detection (10%)
- Risk levels: LOW (0-25), MEDIUM (26-50), HIGH (51-75), CRITICAL (76-100)

### Feature 3: Autonomous Protective Actions
- **Auto-rebalance**: When risk score > 50, swap at-risk stablecoin to safer alternative via Jupiter
- **Emergency exit**: When risk score > 75, exit to most stable asset
- All actions logged on-chain in a PDA (treasury state)

### Feature 4: Yield Comparison
- Fetch current APYs from Kamino and MarginFi for each stablecoin
- Display yield opportunities alongside risk scores
- Recommend optimal stablecoin allocation (best risk-adjusted yield)

### Feature 5: Web Dashboard
- Real-time risk score gauges for each stablecoin
- Price deviation charts (live from Pyth)
- Action history log (swaps executed, alerts fired)
- Yield comparison table across protocols
- Connect wallet to view personalized positions

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Pyth   │  │ Jupiter  │  │  Helius  │              │
│  │ Oracles  │  │ DEX API  │  │   RPC    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼──────────────┼─────────────┼────────────────────┘
        │              │             │
┌───────▼──────────────▼─────────────▼────────────────────┐
│                 STABLEGUARD AGENT                        │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Price      │  │  Risk Score  │  │  Action        │  │
│  │  Monitor    │──▶│  Engine      │──▶│  Executor     │  │
│  │  (Pyth SDK) │  │  (Composite) │  │  (Jupiter SDK) │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │  Yield      │  │  Alert       │                      │
│  │  Tracker    │  │  System      │                      │
│  │  (Protocol  │  │  (Webhook/   │                      │
│  │   APIs)     │  │   Console)   │                      │
│  └─────────────┘  └──────────────┘                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SOLANA BLOCKCHAIN (Devnet)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  StableGuard Anchor Program                        │  │
│  │  - Treasury PDA (holdings, risk state)             │  │
│  │  - Action Log PDA (swap history, alerts)           │  │
│  │  - Risk Config PDA (thresholds, weights)           │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              WEB DASHBOARD (Next.js on Vercel)           │
│  - Risk score gauges (real-time)                         │
│  - Price charts (Pyth feed)                              │
│  - Action history log                                    │
│  - Yield comparison table                                │
│  - Wallet connection (Solana wallet adapter)             │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript | All code |
| Blockchain | Solana (devnet) | On-chain program + transactions |
| Smart Contract | Anchor Framework | Treasury state, action log PDAs |
| Oracles | Pyth Network SDK | Real-time stablecoin price feeds |
| DEX | Jupiter SDK | Swap execution + liquidity data |
| RPC | Helius | Solana RPC + webhooks |
| Frontend | Next.js 14 + TailwindCSS | Dashboard |
| Charts | Recharts or Lightweight Charts | Price + risk visualization |
| Wallet | @solana/wallet-adapter | Connect user wallets |
| Deployment | Vercel | Dashboard hosting |
| Agent Framework | Custom TypeScript | Monitoring loop + decision engine |

---

## Repo Structure

```
stableguard/
├── programs/
│   └── stableguard/           # Anchor program
│       ├── src/
│       │   └── lib.rs         # Treasury PDA, action log, risk config
│       ├── Cargo.toml
│       └── Anchor.toml
├── app/                       # Next.js dashboard
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # UI components
│   │   │   ├── RiskGauge.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── ActionLog.tsx
│   │   │   ├── YieldTable.tsx
│   │   │   └── Header.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   └── styles/
│   ├── package.json
│   └── next.config.js
├── agent/                     # Core agent logic
│   ├── src/
│   │   ├── index.ts           # Agent entry point (monitoring loop)
│   │   ├── monitor.ts         # Pyth price feed monitoring
│   │   ├── risk-engine.ts     # Risk score calculation
│   │   ├── executor.ts        # Jupiter swap execution
│   │   ├── yield-tracker.ts   # Protocol yield fetching
│   │   ├── alerts.ts          # Alert/notification system
│   │   └── config.ts          # Thresholds, weights, addresses
│   ├── package.json
│   └── tsconfig.json
├── tests/                     # Integration tests
├── scripts/                   # Deploy, setup scripts
├── README.md                  # Comprehensive docs for judges
├── package.json               # Root workspace
└── .gitignore
```

---

## Build Phases

### Phase 1: Foundation (Hours 0-6) - Feb 12, 5:30-11:30 PM IST
- [x] Create PRD
- [ ] Initialize git repo + push to GitHub
- [ ] Set up monorepo (agent + app workspaces)
- [ ] Initialize Anchor project for on-chain program
- [ ] Define PDA schemas (Treasury, ActionLog, RiskConfig)
- [ ] Build + deploy Anchor program to devnet
- [ ] Register as agent on Colosseum API

### Phase 2: Core Agent (Hours 6-14) - Feb 13, 12:00-8:00 AM IST
- [ ] Implement Pyth price feed monitoring (USDC, USDT, PYUSD)
- [ ] Build risk score engine (composite weighted scoring)
- [ ] Integrate Jupiter SDK for swap execution
- [ ] Build monitoring loop (poll prices -> score -> decide -> act)
- [ ] Implement action logging to on-chain PDA
- [ ] Add yield tracking (Kamino + MarginFi APY fetching)
- [ ] Test full agent loop on devnet

### Phase 3: Dashboard (Hours 14-20) - Feb 13, 8:00 AM-2:00 PM IST
- [ ] Set up Next.js app with TailwindCSS
- [ ] Build risk gauge components (circular gauges, color-coded)
- [ ] Build price chart component (live Pyth data)
- [ ] Build action history log component
- [ ] Build yield comparison table
- [ ] Add wallet connection
- [ ] Connect dashboard to on-chain data (read PDAs)

### Phase 4: Polish & Deploy (Hours 20-24) - Feb 13, 2:00-6:00 PM IST
- [ ] Deploy dashboard to Vercel
- [ ] Write comprehensive README
- [ ] Record demo video or create presentation
- [ ] Test everything end-to-end
- [ ] Fix bugs, polish UI

### Phase 5: Submit (Hours 24-26) - Feb 13, 6:00-8:00 PM IST
- [ ] Fill all required submission fields
- [ ] Submit project via Colosseum API
- [ ] Post progress update on Colosseum forum
- [ ] Final verification

---

## Submission Fields (Pre-drafted)

### problemStatement (max 1200 chars)
Solana's $15B+ stablecoin ecosystem faces existential depeg risk with no autonomous protection. On Dec 26, 2025, USX on Solana crashed to $0.10 -- a 90% loss in minutes -- despite being fully collateralized, because DEX liquidity evaporated during holiday trading. In 2023, USDC hit $0.87 during the SVB crisis, triggering 3,400 liquidations and $24M in collateral losses on Aave alone. The UST collapse wiped $50B+. Today, stablecoin holders must manually monitor prices across multiple oracles, check liquidity depth on DEXs, and execute protective swaps -- all while sleeping or offline. No autonomous agent exists on Solana that combines real-time depeg risk scoring with automatic protective action. StableGuard fills this gap.

### technicalApproach (max 1200 chars)
StableGuard runs a continuous monitoring loop: Pyth Network oracles provide sub-second price feeds for USDC, USDT, and PYUSD. Each tick, the risk engine computes a composite score (0-100) weighted across oracle price deviation (40%), Jupiter DEX liquidity depth (30%), volume anomalies (20%), and large transfer detection (10%). When risk exceeds configurable thresholds, the agent autonomously executes protective swaps via Jupiter's swap API, routing through optimal pools. All state -- treasury holdings, risk scores, action history -- is stored on-chain in Anchor PDAs. A Next.js dashboard reads PDA state in real-time, displaying risk gauges, price charts, and swap logs. The agent uses Helius RPC for reliable Solana access.

### targetAudience (max 1000 chars)
A Solana DeFi user or DAO treasury manager holding $10K-$500K+ in stablecoins across Kamino, MarginFi, or Jupiter vaults. They check prices each morning, worry about depeg events they might miss overnight, and manually rebalance between USDC/USDT/PYUSD based on gut feeling rather than data. They experienced USDC depeg anxiety during SVB and know they can't monitor 24/7. StableGuard is their always-on risk guardian.

### businessModel (max 1000 chars)
0.1% fee on each autonomous protective swap, charged in the output token. Free tier: monitoring + alerts for 1 stablecoin. Pro ($19/mo): all stablecoins, autonomous execution, yield optimization, custom thresholds. At 500 active users averaging $1K/day in protective swaps, that generates ~$15K/month in swap fees plus subscriptions. Additional revenue from protocol partnerships (Kamino, MarginFi) for directing yield-optimized deposits.

### competitiveLandscape (max 1000 chars)
DepegWatch monitors stablecoin prices but only sends alerts -- no autonomous action, not Solana-native. TRM Labs and Elliptic offer enterprise stablecoin risk tools but cost $50K+/year and don't execute swaps. Carrot Protocol aggregates stablecoin yield on Solana but has zero risk monitoring. DefiLlama tracks TVL but is view-only. No tool on Solana combines real-time depeg risk scoring with autonomous protective swaps and yield optimization in a single agent. StableGuard is the first.

### futureVision (max 1000 chars)
V2 adds cross-protocol yield optimization -- the agent automatically moves funds to the highest risk-adjusted yield across Kamino, MarginFi, and Drift. V3 introduces a stablecoin risk API that other protocols can integrate (e.g., lending protocols auto-adjust collateral factors based on StableGuard risk scores). Six-month roadmap: support for 10+ stablecoins, integration with Sanctum and Jupiter Lend, mobile alerts via Telegram/Discord. We intend to apply to the Colosseum accelerator and build this full-time.

---

## Risk Scoring Algorithm

```
RISK_SCORE = (
    PRICE_DEVIATION_SCORE * 0.40 +
    LIQUIDITY_SCORE * 0.30 +
    VOLUME_ANOMALY_SCORE * 0.20 +
    WHALE_FLOW_SCORE * 0.10
)

Where:
- PRICE_DEVIATION_SCORE:
  - |price - 1.00| < 0.001 → 0 (no risk)
  - |price - 1.00| < 0.005 → 25
  - |price - 1.00| < 0.01  → 50
  - |price - 1.00| < 0.02  → 75
  - |price - 1.00| >= 0.02 → 100

- LIQUIDITY_SCORE:
  - Based on Jupiter quote slippage for $100K swap
  - slippage < 0.1% → 0
  - slippage < 0.5% → 25
  - slippage < 1.0% → 50
  - slippage < 2.0% → 75
  - slippage >= 2.0% → 100

- VOLUME_ANOMALY_SCORE:
  - Compare current hour volume to 24h average
  - If within 2x average → 0
  - 2-5x → 25, 5-10x → 50, 10-20x → 75, >20x → 100

- WHALE_FLOW_SCORE:
  - Track large transfers (>$1M) in last hour
  - 0 transfers → 0, 1-2 → 25, 3-5 → 50, 5-10 → 75, >10 → 100
```

### Action Thresholds
| Risk Score | Action |
|-----------|--------|
| 0-25 | Monitor only (LOW) |
| 26-50 | Alert + increase monitoring frequency (MEDIUM) |
| 51-75 | Auto-rebalance to safer stablecoin (HIGH) |
| 76-100 | Emergency exit to most stable asset (CRITICAL) |
