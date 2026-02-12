# StableGuard

**Autonomous Stablecoin Risk Intelligence Agent for Solana**

StableGuard monitors USDC, USDT, and PYUSD stablecoin prices in real-time via Pyth Network oracles, computes composite risk scores, and autonomously executes protective swaps via Jupiter when depeg risk exceeds configurable thresholds. All state — treasury holdings, risk scores, action history — is recorded on-chain in Anchor PDAs.

> Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2–13, 2026)

---

## The Problem

Every dollar in Solana's $15B+ stablecoin ecosystem is one black swan event away from catastrophic loss:

- **Dec 2025**: USX on Solana crashed to $0.10 (90% loss) — DEX liquidity evaporated in minutes
- **Mar 2023**: USDC hit $0.87 during SVB crisis — 3,400 liquidations, $24M in collateral losses
- **May 2022**: UST collapse wiped $50B+

Today, stablecoin holders must manually monitor prices, check liquidity, and execute swaps — often too late. **No autonomous agent on Solana combines real-time depeg risk scoring with protective action.** StableGuard fills this gap.

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                  STABLEGUARD AGENT                   │
│                                                      │
│   Pyth Oracles ──► Risk Engine ──► Jupiter Swaps     │
│   (USDC/USDT/     (0-100 score)   (auto-protect)    │
│    PYUSD prices)                                     │
│         │              │                │            │
│         ▼              ▼                ▼            │
│   ┌──────────────────────────────────────────┐       │
│   │         Solana On-Chain (Anchor)          │       │
│   │   Treasury PDA │ ActionLog PDA │ Config   │       │
│   └──────────────────────────────────────────┘       │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API
                       ▼
┌─────────────────────────────────────────────────────┐
│            NEXT.JS DASHBOARD                         │
│   Risk Gauges │ Price Charts │ Action Log │ Yields   │
└─────────────────────────────────────────────────────┘
```

### Agent Loop (every 10 seconds)

1. **Fetch** — Pull real-time prices from Pyth Network Hermes for USDC, USDT, PYUSD
2. **Score** — Compute composite risk (0–100) per stablecoin:
   - Price deviation from $1.00 peg (40% weight)
   - Liquidity depth via Jupiter quote slippage (30%)
   - Volume anomaly detection (20%)
   - Whale flow tracking (10%)
3. **Act** — Based on risk thresholds:
   | Score | Action |
   |-------|--------|
   | 0–25  | Monitor (LOW) |
   | 26–50 | Alert + increase frequency (MEDIUM) |
   | 51–75 | Auto-rebalance to safer stablecoin (HIGH) |
   | 76–100 | Emergency exit to most stable asset (CRITICAL) |
4. **Record** — Log every action on-chain via Anchor PDA (ring buffer of 20 entries)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Price Feeds | Pyth Network (Hermes) | Sub-second stablecoin prices |
| Swaps | Jupiter Aggregator API | Optimal DEX routing for protective swaps |
| On-Chain | Anchor (Rust) | Treasury, ActionLog, RiskConfig PDAs |
| Yield Data | Kamino + MarginFi APIs | Cross-protocol yield comparison |
| Agent | TypeScript (Node.js) | Monitoring loop + risk engine + HTTP API |
| Dashboard | Next.js 14 + TailwindCSS | Real-time risk visualization |
| Charts | Recharts | Live price feed + risk score charts |
| Network | Solana Devnet | Blockchain deployment |

---

## Project Structure

```
stableguard/
├── agent/                    # TypeScript monitoring agent
│   └── src/
│       ├── index.ts          # Main loop + HTTP API (port 3001)
│       ├── config.ts         # Constants, feed IDs, thresholds
│       ├── monitor.ts        # Pyth Hermes price feed polling
│       ├── risk-engine.ts    # Composite risk scoring (0-100)
│       ├── executor.ts       # Jupiter swap execution + logging
│       ├── yield-tracker.ts  # Kamino/MarginFi yield fetching
│       └── on-chain.ts       # Anchor PDA initialization + logging
├── app/                      # Next.js dashboard
│   └── src/
│       ├── app/page.tsx      # Main dashboard layout
│       ├── components/       # RiskGauge, PriceChart, ActionLog, YieldTable
│       ├── hooks/            # useAgentState (polling hook)
│       └── lib/types.ts      # Shared TypeScript types
├── programs/stableguard/     # Anchor on-chain program (Rust)
│   └── src/lib.rs            # Treasury, ActionLog, RiskConfig PDAs
├── package.json              # npm workspaces (agent + app)
└── Anchor.toml               # Devnet deployment config
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust + Solana CLI + Anchor CLI
- Solana wallet with devnet SOL (`solana airdrop 5`)

### 1. Clone & Install

```bash
git clone https://github.com/thopatevijay/stableguard.git
cd stableguard
npm install
```

### 2. Start the Agent

```bash
npm run agent:dev
```

The agent starts monitoring USDC, USDT, and PYUSD prices, computing risk scores every 10 seconds, and serving state via HTTP API on port 3001.

### 3. Start the Dashboard

```bash
npm run app:dev
```

Open [http://localhost:3000](http://localhost:3000) to see real-time risk gauges, price charts, action logs, and yield comparisons.

### 4. (Optional) Build & Deploy Anchor Program

```bash
npm run anchor:build
npm run anchor:deploy
```

---

## On-Chain Program

**Program ID:** `A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr`

[View on Solana Explorer (Devnet)](https://explorer.solana.com/address/A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr?cluster=devnet)

### PDAs

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Treasury | `["treasury", authority]` | Track portfolio holdings & balances |
| ActionLog | `["action_log", authority]` | Ring buffer of last 20 agent actions |
| RiskConfig | `["risk_config", authority]` | Configurable risk thresholds |

### Instructions

- `initialize_treasury` / `update_treasury` — Manage portfolio state
- `initialize_action_log` / `log_action` — Record agent decisions on-chain
- `initialize_risk_config` / `update_risk_config` — Adjust risk parameters

---

## Agent API

The agent exposes an HTTP API on port 3001:

| Endpoint | Description |
|----------|-------------|
| `GET /api/state` | Full agent state: stablecoin prices, risk scores, actions, yields |
| `GET /api/health` | Health check |

---

## Solana Integration

StableGuard deeply integrates with the Solana ecosystem:

- **Pyth Network** — Real-time oracle price feeds for USDC, USDT, PYUSD (via Hermes REST API)
- **Jupiter** — DEX aggregator for swap quoting and execution across all Solana liquidity
- **Anchor** — On-chain program storing treasury state, action logs, and risk configuration in PDAs
- **Kamino & MarginFi** — DeFi yield data for cross-protocol comparison
- **SPL Tokens** — Native Solana token standard for stablecoin tracking

---

## License

MIT
