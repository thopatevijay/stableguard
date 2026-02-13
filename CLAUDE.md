# StableGuard - Project Context

## What is this?
StableGuard is an **Autonomous Stablecoin Risk Intelligence Agent for Solana**, built for the **Colosseum Agent Hackathon** (Feb 2-13, 2026, $100K USDC prizes).

It monitors USDC, USDT, and PYUSD stablecoin prices in real-time via Pyth Network oracles, calculates composite risk scores, and autonomously executes protective swaps via Jupiter when depeg risk exceeds thresholds.

## Hackathon Details
- **Deadline**: Feb 13, 2026 at 12:00 PM EST (10:30 PM IST)
- **Submission**: Public GitHub repo + project metadata via Colosseum API
- **Skill file**: /Users/vijay/solana-agent-hackathon/Colosseum-Agent-Hackathon.md
- **Research**: /Users/vijay/solana-agent-hackathon/COMPETITIVE-ANALYSIS.md
- **Idea comparison**: /Users/vijay/solana-agent-hackathon/IDEA-COMPARISON.md
- **PRD**: ./PRD.md
- **Tags**: `stablecoins`, `ai`, `security`

## Architecture
```
agent/         → TypeScript monitoring agent (Pyth + Jupiter + risk engine)
  src/
    index.ts        → Main loop + HTTP API server (port 3001)
    config.ts       → Constants, feed IDs, thresholds, types
    monitor.ts      → Pyth Hermes price feed monitoring
    risk-engine.ts  → Composite risk scoring (0-100)
    executor.ts     → Jupiter swap execution + action logging
    yield-tracker.ts → Kamino/MarginFi yield fetching

app/           → Next.js dashboard (TailwindCSS, Recharts)
programs/      → Anchor on-chain program (Treasury PDA, ActionLog PDA)
```

## Commands
```bash
# Agent
npm run agent:dev          # Start agent in dev mode (tsx watch)
npm run agent:build        # Compile TypeScript
npm run agent:start        # Run compiled agent

# Dashboard
npm run app:dev            # Start Next.js dev server
npm run app:build          # Build for production

# Anchor
npm run anchor:build       # Build Solana program
npm run anchor:deploy      # Deploy to devnet
```

## Agent API (port 3001)
- `GET /api/state` - Full agent state (stablecoins, actions, yields)
- `GET /api/health` - Health check

## Key Dependencies
- `@pythnetwork/hermes-client` - Pyth oracle price feeds
- `@jup-ag/api` - Jupiter DEX swap quotes
- `@solana/web3.js` - Solana blockchain interaction
- Next.js 14 + TailwindCSS - Dashboard

## Git Config (local only)
```
user.name = thopatevijay
user.email = thopatevijay@gmail.com
```

## Known Issues
- PYUSD Pyth feed ID may be invalid - fetch individually and skip if unavailable

## Colosseum API
- Base URL: https://agents.colosseum.com/api
- API key is stored in .env (NEVER commit)
- Required submission fields: name, description, repoLink, solanaIntegration, problemStatement, technicalApproach, targetAudience, businessModel, competitiveLandscape, futureVision, tags
