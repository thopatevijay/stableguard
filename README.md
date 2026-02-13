# StableGuard

**Autonomous Stablecoin Risk Intelligence Agent for Solana**

StableGuard monitors USDC, USDT, and PYUSD stablecoin prices in real-time via Pyth Network oracles, computes composite risk scores, and autonomously executes protective swaps via Jupiter when depeg risk exceeds configurable thresholds. All state — treasury holdings, risk scores, action history — is recorded on-chain in Anchor PDAs.

> Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2-13, 2026)

**Live Dashboard:** [stableguard-app.vercel.app](https://stableguard-app.vercel.app)

---

## The Problem

Every dollar in Solana's $15B+ stablecoin ecosystem is one black swan event away from catastrophic loss:

- **Dec 2025**: USX on Solana crashed to $0.10 (90% loss) — DEX liquidity evaporated in minutes
- **Mar 2023**: USDC hit $0.87 during SVB crisis — 3,400 liquidations, $24M in collateral losses
- **May 2022**: UST collapse wiped $50B+

Today, stablecoin holders must manually monitor prices, check liquidity, and execute swaps — often too late. **No autonomous agent on Solana combines real-time depeg risk scoring with protective action.** StableGuard fills this gap.

---

## How It Works: The Autonomous Flow

### The Agent Has Its Own Wallet

StableGuard runs with its own Solana keypair. It doesn't need the user to be online or connected. The agent perceives market conditions, reasons about risk, and acts — all without human input.

```
USER (one-time setup)                        AGENT (runs 24/7, no human needed)
─────────────────────                        ──────────────────────────────────
1. Deposits USDC/USDT/PYUSD                  Monitors Pyth oracle prices every 10s
   into StableGuard vault (PDA)              Checks Jupiter liquidity depth
                                             Tracks volume anomalies & whale flows
2. Sets risk thresholds                      Computes composite risk score (0-100)
   (or uses defaults)
                                             Risk > 26 → ALERT (increase monitoring to 3s)
3. Goes to sleep                             Risk > 51 → AUTO-REBALANCE (swap to safer coin)
                                             Risk > 76 → EMERGENCY EXIT (exit to safest asset)
4. Wakes up, checks dashboard
   to see what agent did overnight            Every action logged on-chain in PDA
```

### Three Trust Models

| Model | How It Works | Trust Level |
|-------|-------------|-------------|
| **Agent-Owned Treasury** (hackathon MVP) | Agent has its own wallet, manages a treasury PDA. Swaps executed directly by the agent's keypair. | Custodial — user trusts agent |
| **Delegated Vault** (production) | User deposits into Anchor vault PDA. Agent pubkey authorized as "manager" with constraints: can ONLY swap between whitelisted stablecoins via Jupiter. User can withdraw anytime. | Semi-custodial — smart contract enforced limits |
| **Alert Only** (non-custodial) | Agent monitors and sends alerts. User must act manually. | Non-custodial — but NOT truly autonomous |

For the hackathon, we demonstrate **Model A** on devnet. Swaps show real Jupiter quotes but are marked `[SIMULATED]` since devnet lacks real stablecoin liquidity. The decision-making, risk scoring, and on-chain logging are fully live and autonomous.

### What Happens During a Depeg (End-to-End)

```
1. USDC price drops to $0.994 on Pyth oracle
2. Agent detects: price deviation score = 50 (0.6% from peg)
3. Agent checks Jupiter: USDC→USDT slippage rising to 1.2% → liquidity score = 50
4. Composite risk = 0.40×50 + 0.30×50 + 0.20×25 + 0.10×0 = 40 (MEDIUM)
5. Agent sends ALERT, increases polling to every 3 seconds

6. USDC drops further to $0.985 → price deviation = 75, liquidity = 75
7. Composite risk = 62 (HIGH) → exceeds rebalance threshold (51)
8. Agent fetches Jupiter quote: swap $10K USDC → 9,988 USDT (0.12% slippage)
9. Agent signs and submits swap TX with its keypair
10. Action logged on-chain: "REBALANCE: USDC→USDT, risk 62/100"

11. If USDC crashes to $0.95 → risk = 89 (CRITICAL) → EMERGENCY EXIT
12. Agent swaps ALL remaining USDC to safest asset
13. Total time from detection to action: < 10 seconds
```

---

## User Stories

### Depeg Protection

**As a DeFi user holding $50K in USDC across Kamino and MarginFi,**
I want an agent that monitors stablecoin peg health 24/7, so that I don't lose funds to a depeg event while I'm sleeping.

**As a treasury manager holding $200K in USDT,**
I want the agent to auto-swap to a safer stablecoin when depeg risk exceeds my threshold, so that my funds are protected before I even see the headline.

**As a PYUSD holder on Solana,**
I want the agent to detect when DEX liquidity is evaporating (like the USX crash in Dec 2025), so that I can exit before slippage makes it impossible.

### Risk Intelligence

**As a DeFi user managing multiple stablecoins,**
I want a dashboard showing real-time risk gauges for each stablecoin, so that I can assess my portfolio risk at a glance.

**As a risk-conscious DeFi user,**
I want to see live price charts showing deviation from $1.00 peg, so that I can spot trends before they become critical.

**As a user whose funds are managed by an autonomous agent,**
I want to see a log of every action the agent has taken (alerts, swaps, exits) with full reasoning, so that I can trust and verify its decisions.

### Yield Optimization

**As a stablecoin holder looking to maximize returns,**
I want to see current APYs across Kamino and MarginFi side-by-side, so that I can find the best risk-adjusted yield.

**As a DAO treasury manager,**
I want the agent to recommend optimal stablecoin allocation based on both yield AND risk, so that I'm not chasing yield into a stablecoin that's about to depeg.

### On-Chain Transparency

**As a DAO member whose treasury is managed by StableGuard,**
I want all portfolio state stored on-chain in Anchor PDAs, so that anyone can verify the agent's holdings and decisions trustlessly.

**As a hackathon judge evaluating StableGuard,**
I want to see that the agent runs a continuous loop without human input, so that I can confirm this is genuinely autonomous — not just automation with a fancy UI.

---

## What Makes This Autonomous (Not Just Automation)

A cron job that checks prices is **automation**. StableGuard is an **agent** — it perceives, reasons, decides, acts, and explains without human intervention.

### The OODA Loop Architecture

```
Every 10 seconds (3 seconds when risk elevated):

 OBSERVE          ORIENT            DECIDE            ACT
 ─────────       ──────────       ──────────       ──────────
 Pyth prices  →  Composite     →  Regime-aware  →  Jupiter
 Jupiter         risk scoring     strategy          swap exec
 liquidity       (4 weighted      selection         On-chain
 Yield rates     factors)                           logging
 Peer prices     Regime detect                      Alert
                 Correlation
                 Time-of-day
                      │
                      ▼
                  EXPLAIN
                  ──────────
                  Structured reasoning
                  for every decision
```

### 7 Autonomous Behaviors (Zero Human Intervention)

| # | Behavior | How It Works |
|---|----------|--------------|
| 1 | **Multi-source perception** | Synthesizes Pyth oracles + Jupiter liquidity + protocol yields + peer prices — not just one metric |
| 2 | **Composite reasoning** | Weighted risk scoring across 4 dimensions (price deviation 40%, liquidity 30%, volume anomaly 20%, whale flow 10%) |
| 3 | **Market regime detection** | Classifies market as NORMAL / STRESSED / CRISIS and dynamically adjusts thresholds (20-40% more sensitive in crisis) |
| 4 | **Cross-stablecoin correlation** | Detects contagion — if multiple stablecoins deviate simultaneously, risk scores increase (+10/+20 bonus) |
| 5 | **Time-of-day awareness** | Higher sensitivity during weekends (+5) and low-liquidity hours UTC 0-6 (+3) — USX crashed on Dec 26 |
| 6 | **Adaptive polling** | 10s normal → 3s when risk elevated or regime is stressed/crisis |
| 7 | **Explainable decisions** | Every action includes structured reasoning: factor breakdown, alternatives considered, threshold context |

### Example Agent Reasoning

When the agent takes an action, it generates structured reasoning like this:

```
REBALANCE: USDC risk at 62/100 (price: $0.9940) [STRESSED regime]

Factors:
  Price Deviation:  55  (40%)  — Price $0.9940 (0.60% from peg)
  Liquidity:        45  (30%)  — Jupiter slippage 1.2% for $100K
  Volume Anomaly:   50  (20%)  — Volatility significantly above baseline
  Whale Flow:        0  (10%)  — No large transfers detected

Alternatives: USDT (risk: 12/100), PYUSD (feed unavailable)
Threshold: Current 62. Emergency exit at 46 (crisis-adjusted).
Action: Swap $10,000 USDC → 9,988.50 USDT (slippage: 0.12%)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                            │
│  Pyth Hermes    │  Jupiter v6 API  │  Kamino / MarginFi     │
│  Price Feeds    │  Swap Quotes     │  Yield Rates           │
└────────┬────────────────┬──────────────────┬────────────────┘
         │                │                  │
┌────────▼────────────────▼──────────────────▼────────────────┐
│              STABLEGUARD AGENT (TypeScript)                   │
│              Port 3001 — HTTP API                             │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────┐    │
│  │ Price      │  │ Risk Score  │  │ Swap Executor     │    │
│  │ Monitor    │─▶│ Engine      │─▶│ (Jupiter)         │    │
│  │ (Pyth SDK) │  │ (Composite) │  │ + Action Logger   │    │
│  └────────────┘  └─────────────┘  └───────────────────┘    │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────┐    │
│  │ Regime     │  │ Decision    │  │ Yield             │    │
│  │ Detector   │  │ Explainer   │  │ Tracker           │    │
│  └────────────┘  └─────────────┘  └───────────────────┘    │
│                                                              │
│  API: GET /api/state  │  GET /api/health                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────▼──────┐  ┌─────▼──────┐  ┌──────▼──────────────┐
│ Solana Devnet  │  │ Dashboard  │  │ On-Chain Anchor     │
│ (Helius RPC)   │  │ (Next.js)  │  │ Program             │
│                │  │ Port 3000  │  │ - Treasury PDA      │
│                │  │            │  │ - ActionLog PDA     │
│                │  │            │  │ - RiskConfig PDA    │
└────────────────┘  └────────────┘  └─────────────────────┘
```

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
| RPC | Helius (optional) | Reliable Solana devnet access |
| Wallet | AgentWallet (Frames.ag) | Secure agent wallet management |
| Network | Solana Devnet | Blockchain deployment |

---

## Project Structure

```
stableguard/
├── agent/                         # TypeScript monitoring agent
│   └── src/
│       ├── index.ts               # Main loop + HTTP API (port 3001)
│       ├── config.ts              # Constants, feed IDs, thresholds, types
│       ├── monitor.ts             # Pyth Hermes price feed polling
│       ├── risk-engine.ts         # Composite risk scoring + correlation + time-of-day
│       ├── executor.ts            # Jupiter swap execution + logging
│       ├── decision-explainer.ts  # Structured reasoning for every action
│       ├── regime-detector.ts     # Market regime classification (normal/stressed/crisis)
│       ├── yield-tracker.ts       # Kamino/MarginFi yield fetching
│       └── on-chain.ts            # Anchor PDA initialization + logging
├── app/                           # Next.js dashboard
│   └── src/
│       ├── app/page.tsx           # Main dashboard layout
│       ├── components/            # RiskGauge, PriceChart, ActionLog, YieldTable, Header
│       ├── hooks/                 # useAgentState (polling hook + demo mode)
│       └── lib/types.ts           # Shared TypeScript types
├── programs/stableguard/          # Anchor on-chain program (Rust)
│   └── src/lib.rs                 # Treasury, ActionLog, RiskConfig PDAs
├── package.json                   # npm workspaces (agent + app)
└── Anchor.toml                    # Devnet deployment config
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust + Solana CLI + Anchor CLI
- Solana wallet with devnet SOL

### 1. Clone & Install

```bash
git clone https://github.com/thopatevijay/stableguard.git
cd stableguard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Add your keys:
# HELIUS_API_KEY=your_helius_key (optional, improves RPC reliability)
# AGENTWALLET_TOKEN=mf_your_token (optional, for AgentWallet integration)
```

### 3. Start the Agent

```bash
npm run agent:dev
```

The agent starts monitoring USDC, USDT, and PYUSD prices, computing risk scores every 10 seconds, and serving state via HTTP API on port 3001.

### 4. Start the Dashboard

```bash
npm run app:dev
```

Open [http://localhost:3000](http://localhost:3000) to see real-time risk gauges, price charts, action logs with expandable reasoning, and yield comparisons.

### 5. (Optional) Build & Deploy Anchor Program

```bash
npm run anchor:build
npm run anchor:deploy
```

---

## Dashboard Features

- **Risk Gauges** — Color-coded circular gauges per stablecoin with factor breakdown bars
- **Price Feed (Live)** — Real-time Pyth oracle price chart with $1.00 peg reference line
- **Agent Actions** — Expandable cards showing structured reasoning, factor scores, alternatives, and threshold context
- **Yield Comparison** — Kamino & MarginFi APYs with highlighted best rates
- **Regime Badge** — NORMAL (green) / STRESSED (yellow) / CRISIS (red) indicator in header
- **Demo Mode** — Auto-activates with simulated data when agent is offline (Vercel deployment)

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
| `GET /api/state` | Full agent state: stablecoins, risk scores, actions with reasoning, yields, regime |
| `GET /api/health` | Health check + uptime |

---

## Solana Integration

StableGuard deeply integrates with the Solana ecosystem:

- **Pyth Network** — Real-time oracle price feeds for USDC, USDT, PYUSD (via Hermes REST API)
- **Jupiter** — DEX aggregator for swap quoting, execution, and liquidity depth measurement
- **Anchor** — On-chain program storing treasury state, action logs, and risk configuration in PDAs
- **Kamino & MarginFi** — DeFi yield data for cross-protocol comparison
- **Helius** — Reliable RPC access (auto-detected when `HELIUS_API_KEY` is set)
- **AgentWallet** — Secure wallet management for agent signing operations

---

## Future Vision

- **Multi-chain expansion** — Extend to Ethereum L2s via Pyth cross-chain feeds
- **On-chain risk scoring** — Deploy risk classifier via Cauldron (RISC-V on Solana)
- **Webhook alerts** — Telegram/Discord notifications for risk events
- **Portfolio optimization** — Risk-adjusted yield allocation across protocols
- **Historical learning** — Track rebalance profitability and auto-adjust sensitivity

---

## License

MIT
