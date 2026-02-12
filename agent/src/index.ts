import { PriceMonitor } from "./monitor";
import { RiskEngine } from "./risk-engine";
import { SwapExecutor } from "./executor";
import { YieldTracker } from "./yield-tracker";
import {
  ACTION_CONFIG,
  STABLECOIN_NAMES,
  type StablecoinSymbol,
  type StablecoinState,
  type AgentAction,
} from "./config";

// Global state for API consumption (dashboard reads this)
export interface AgentState {
  stablecoins: StablecoinState[];
  actions: AgentAction[];
  yields: { protocol: string; symbol: string; supplyApy: number; borrowApy: number; tvl: number }[];
  isRunning: boolean;
  lastTick: Date | null;
  tickCount: number;
}

let agentState: AgentState = {
  stablecoins: [],
  actions: [],
  yields: [],
  isRunning: false,
  lastTick: null,
  tickCount: 0,
};

export function getAgentState(): AgentState {
  return agentState;
}

class StableGuardAgent {
  private monitor: PriceMonitor;
  private riskEngine: RiskEngine;
  private executor: SwapExecutor;
  private yieldTracker: YieldTracker;
  private isRunning = false;
  private riskScores: Map<StablecoinSymbol, number> = new Map();

  constructor() {
    this.monitor = new PriceMonitor();
    this.riskEngine = new RiskEngine();
    this.executor = new SwapExecutor();
    this.yieldTracker = new YieldTracker();
  }

  async start(): Promise<void> {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║          StableGuard Agent v0.1.0                ║");
    console.log("║  Autonomous Stablecoin Risk Intelligence Agent   ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");
    console.log(`[Agent] Starting monitoring loop...`);
    console.log(`[Agent] Monitoring: USDC, USDT, PYUSD`);
    console.log(`[Agent] Interval: ${ACTION_CONFIG.MONITORING_INTERVAL_MS / 1000}s`);
    console.log(`[Agent] Alert threshold: ${ACTION_CONFIG.ALERT_THRESHOLD}`);
    console.log(`[Agent] Rebalance threshold: ${ACTION_CONFIG.REBALANCE_THRESHOLD}`);
    console.log(`[Agent] Emergency threshold: ${ACTION_CONFIG.EMERGENCY_THRESHOLD}`);
    console.log("─".repeat(52));

    this.isRunning = true;
    agentState.isRunning = true;

    // Fetch initial yields
    await this.updateYields();

    // Start main monitoring loop
    while (this.isRunning) {
      try {
        await this.tick();
      } catch (error) {
        console.error("[Agent] Tick error:", error);
      }

      // Dynamic interval based on risk level
      const maxRisk = Math.max(...Array.from(this.riskScores.values()), 0);
      const interval = maxRisk > ACTION_CONFIG.ALERT_THRESHOLD
        ? ACTION_CONFIG.FAST_MONITORING_INTERVAL_MS
        : ACTION_CONFIG.MONITORING_INTERVAL_MS;

      await this.sleep(interval);
    }
  }

  private async tick(): Promise<void> {
    agentState.tickCount++;

    // 1. Fetch latest prices
    const prices = await this.monitor.fetchPrices();
    if (prices.length === 0) {
      console.warn("[Agent] No prices received, skipping tick");
      return;
    }

    // 2. Calculate risk scores for each stablecoin
    const states: StablecoinState[] = [];

    for (const priceData of prices) {
      const history = this.monitor.getHistory(priceData.symbol);
      const state = this.riskEngine.calculateRiskScore(priceData, history);
      states.push(state);
      this.riskScores.set(priceData.symbol, state.riskScore);
    }

    // 3. Update global state
    agentState.stablecoins = states;
    agentState.lastTick = new Date();

    // 4. Log status
    this.logStatus(states);

    // 5. Evaluate actions for each stablecoin
    for (const state of states) {
      await this.evaluateAction(state);
    }

    // 6. Periodically update yields (every 30 ticks = ~5 min)
    if (agentState.tickCount % 30 === 0) {
      await this.updateYields();
    }
  }

  private async evaluateAction(state: StablecoinState): Promise<void> {
    const riskLevel = this.riskEngine.getRiskLevel(state.riskScore);

    if (state.riskScore >= ACTION_CONFIG.EMERGENCY_THRESHOLD) {
      // CRITICAL - Emergency exit
      const safest = this.executor.findSafestStablecoin(this.riskScores, state.symbol);
      const action: AgentAction = {
        timestamp: new Date(),
        type: "EMERGENCY_EXIT",
        fromToken: state.symbol,
        toToken: safest,
        riskScore: state.riskScore,
        details: `CRITICAL: ${state.symbol} risk at ${state.riskScore}/100 (price: $${state.price.toFixed(4)}). Emergency swap to ${safest}.`,
      };
      this.executor.logAction(action);
      agentState.actions = this.executor.getRecentActions(50);

    } else if (state.riskScore >= ACTION_CONFIG.REBALANCE_THRESHOLD) {
      // HIGH - Auto-rebalance
      const safest = this.executor.findSafestStablecoin(this.riskScores, state.symbol);
      const action: AgentAction = {
        timestamp: new Date(),
        type: "REBALANCE",
        fromToken: state.symbol,
        toToken: safest,
        riskScore: state.riskScore,
        details: `HIGH RISK: ${state.symbol} at ${state.riskScore}/100 (price: $${state.price.toFixed(4)}). Rebalancing to ${safest}.`,
      };
      this.executor.logAction(action);
      agentState.actions = this.executor.getRecentActions(50);

    } else if (state.riskScore >= ACTION_CONFIG.ALERT_THRESHOLD) {
      // MEDIUM - Alert only (don't spam - alert once per symbol per elevation)
      const recentActions = this.executor.getRecentActions(5);
      const alreadyAlerted = recentActions.some(
        a => a.fromToken === state.symbol && a.type === "ALERT" &&
             (Date.now() - a.timestamp.getTime()) < 60_000
      );

      if (!alreadyAlerted) {
        const action: AgentAction = {
          timestamp: new Date(),
          type: "ALERT",
          fromToken: state.symbol,
          riskScore: state.riskScore,
          details: `ELEVATED: ${state.symbol} risk at ${state.riskScore}/100 (price: $${state.price.toFixed(4)}). Monitoring closely.`,
        };
        this.executor.logAction(action);
        agentState.actions = this.executor.getRecentActions(50);
      }
    }
  }

  private async updateYields(): Promise<void> {
    try {
      const yields = await this.yieldTracker.fetchYields();
      agentState.yields = yields.map(y => ({
        protocol: y.protocol,
        symbol: y.symbol,
        supplyApy: y.supplyApy,
        borrowApy: y.borrowApy,
        tvl: y.tvl,
      }));
      console.log(`[Yields] Updated ${yields.length} yield entries`);
    } catch (error) {
      console.error("[Yields] Error fetching yields:", error);
    }
  }

  private logStatus(states: StablecoinState[]): void {
    const parts = states.map(s => {
      const level = this.riskEngine.getRiskLevel(s.riskScore);
      const icon = level === "LOW" ? "🟢" : level === "MEDIUM" ? "🟡" : level === "HIGH" ? "🟠" : "🔴";
      return `${icon} ${s.symbol}: $${s.price.toFixed(4)} (risk: ${s.riskScore})`;
    });
    console.log(`[Tick ${agentState.tickCount}] ${parts.join(" | ")}`);
  }

  stop(): void {
    console.log("\n[Agent] Shutting down...");
    this.isRunning = false;
    agentState.isRunning = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// --- HTTP API Server for Dashboard ---
import { createServer } from "http";

function startApiServer(port: number = 3001): void {
  const server = createServer((req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === "/api/state" || req.url === "/") {
      res.writeHead(200);
      res.end(JSON.stringify(agentState, null, 2));
    } else if (req.url === "/api/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    console.log(`[API] Agent state API running at http://localhost:${port}`);
    console.log(`[API] Dashboard endpoint: http://localhost:${port}/api/state`);
  });
}

// --- Main ---
async function main(): Promise<void> {
  const agent = new StableGuardAgent();

  // Start API server for dashboard
  startApiServer(3001);

  // Handle graceful shutdown
  process.on("SIGINT", () => agent.stop());
  process.on("SIGTERM", () => agent.stop());

  // Start the agent
  await agent.start();
}

main().catch(console.error);
