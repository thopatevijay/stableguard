import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  JUPITER_API_URL,
  TOKEN_MINTS,
  SOLANA_RPC_URL,
  type StablecoinSymbol,
  type AgentAction,
} from "./config";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
}

export class SwapExecutor {
  private connection: Connection;
  private actionLog: AgentAction[] = [];

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }

  async getQuote(
    fromToken: StablecoinSymbol,
    toToken: StablecoinSymbol,
    amountInLamports: number
  ): Promise<SwapQuote | null> {
    try {
      const inputMint = TOKEN_MINTS[fromToken].toBase58();
      const outputMint = TOKEN_MINTS[toToken].toBase58();

      const url = `${JUPITER_API_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`;

      const response = await fetch(url);
      if (!response.ok) {
        console.error("[Executor] Quote failed:", response.statusText);
        return null;
      }

      const data = await response.json() as {
        inAmount: string;
        outAmount: string;
        priceImpactPct: string;
      };
      return {
        inputMint,
        outputMint,
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        priceImpactPct: data.priceImpactPct,
        slippageBps: 50,
      };
    } catch (error) {
      console.error("[Executor] Error getting quote:", error);
      return null;
    }
  }

  async checkLiquidity(
    fromToken: StablecoinSymbol,
    toToken: StablecoinSymbol
  ): Promise<number | null> {
    // Check slippage for a $100K swap (100K USDC = 100_000_000_000 lamports for 6 decimals)
    const testAmount = 100_000 * 1_000_000; // $100K in 6-decimal lamports
    const quote = await this.getQuote(fromToken, toToken, testAmount);

    if (!quote) return null; // Return null so risk engine can fall back

    const slippage = Math.abs(parseFloat(quote.priceImpactPct));
    console.log(`[Liquidity] ${fromToken}→${toToken} slippage: ${slippage}% for $100K`);

    // Convert slippage to liquidity risk score
    if (slippage < 0.1) return 0;
    if (slippage < 0.3) return 15;
    if (slippage < 0.5) return 30;
    if (slippage < 1.0) return 50;
    if (slippage < 2.0) return 75;
    return 100;
  }

  async executeProtectiveSwap(
    fromToken: StablecoinSymbol,
    toToken: StablecoinSymbol,
    riskScore: number,
    actionType: "REBALANCE" | "EMERGENCY_EXIT"
  ): Promise<AgentAction> {
    // Get quote for a simulated $10K swap
    const amount = 10_000 * 1_000_000; // $10K in 6-decimal lamports
    const quote = await this.getQuote(fromToken, toToken, amount);

    let details: string;
    let txSignature = "simulated";

    if (quote) {
      const outAmount = (parseInt(quote.outAmount) / 1_000_000).toFixed(2);
      const slippage = Math.abs(parseFloat(quote.priceImpactPct)).toFixed(4);
      details = `${actionType}: Swap $10,000 ${fromToken} → ${outAmount} ${toToken} (slippage: ${slippage}%, risk: ${riskScore}/100) [SIMULATED on devnet]`;
      console.log(`[Executor] Quote: ${fromToken} → ${toToken} | In: $10,000 | Out: $${outAmount} | Slippage: ${slippage}%`);
    } else {
      details = `${actionType}: Would swap ${fromToken} → ${toToken} (risk: ${riskScore}/100). Jupiter quote unavailable. [SIMULATED]`;
      console.log(`[Executor] Simulated swap ${fromToken} → ${toToken} (no quote available)`);
    }

    const action: AgentAction = {
      timestamp: new Date(),
      type: actionType,
      fromToken,
      toToken,
      riskScore,
      details,
    };

    this.logAction(action);
    return action;
  }

  findSafestStablecoin(
    riskScores: Map<StablecoinSymbol, number>,
    excludeToken: StablecoinSymbol
  ): StablecoinSymbol {
    let safest: StablecoinSymbol = "USDC";
    let lowestRisk = Infinity;

    for (const [symbol, score] of riskScores) {
      if (symbol !== excludeToken && score < lowestRisk) {
        lowestRisk = score;
        safest = symbol;
      }
    }

    return safest;
  }

  logAction(action: AgentAction): void {
    this.actionLog.push(action);
    const emoji = action.type === "ALERT" ? "⚠️" :
                  action.type === "REBALANCE" ? "🔄" :
                  action.type === "EMERGENCY_EXIT" ? "🚨" : "👁️";

    console.log(
      `${emoji} [${action.type}] ${action.fromToken}${action.toToken ? ` → ${action.toToken}` : ""} | Risk: ${action.riskScore} | ${action.details}`
    );
  }

  getActionLog(): AgentAction[] {
    return [...this.actionLog];
  }

  getRecentActions(count: number = 20): AgentAction[] {
    return this.actionLog.slice(-count);
  }
}
