import {
  RISK_WEIGHTS,
  RISK_THRESHOLDS,
  type StablecoinSymbol,
  type StablecoinState,
} from "./config";
import type { PriceData } from "./monitor";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export class RiskEngine {
  // Volume tracking for anomaly detection
  private volumeHistory: Map<StablecoinSymbol, number[]> = new Map();

  constructor() {
    for (const symbol of ["USDC", "USDT", "PYUSD"] as StablecoinSymbol[]) {
      this.volumeHistory.set(symbol, []);
    }
  }

  calculateRiskScore(priceData: PriceData, priceHistory: PriceData[]): StablecoinState {
    const priceDeviationScore = this.calcPriceDeviationScore(priceData.price);
    const liquidityScore = this.calcLiquidityScore(priceData);
    const volumeAnomalyScore = this.calcVolumeAnomalyScore(priceData.symbol, priceHistory);
    const whaleFlowScore = this.calcWhaleFlowScore(priceData.symbol);

    const riskScore = Math.round(
      priceDeviationScore * RISK_WEIGHTS.PRICE_DEVIATION +
      liquidityScore * RISK_WEIGHTS.LIQUIDITY +
      volumeAnomalyScore * RISK_WEIGHTS.VOLUME_ANOMALY +
      whaleFlowScore * RISK_WEIGHTS.WHALE_FLOW
    );

    return {
      symbol: priceData.symbol,
      name: priceData.symbol,
      price: priceData.price,
      confidence: priceData.confidence,
      riskScore: Math.min(100, Math.max(0, riskScore)),
      priceDeviationScore,
      liquidityScore,
      volumeAnomalyScore,
      whaleFlowScore,
      lastUpdated: new Date(),
    };
  }

  private calcPriceDeviationScore(price: number): number {
    const deviation = Math.abs(price - 1.0);

    if (deviation < 0.001) return 0;     // < 0.1% deviation
    if (deviation < 0.003) return 15;    // < 0.3%
    if (deviation < 0.005) return 30;    // < 0.5%
    if (deviation < 0.01) return 50;     // < 1%
    if (deviation < 0.02) return 75;     // < 2%
    if (deviation < 0.05) return 90;     // < 5%
    return 100;                           // >= 5% - extreme depeg
  }

  private calcLiquidityScore(priceData: PriceData): number {
    // Use confidence interval as a proxy for liquidity
    // Wider confidence = less liquidity = higher risk
    const confidenceRatio = priceData.confidence / priceData.price;

    if (confidenceRatio < 0.0001) return 0;   // Very tight spread
    if (confidenceRatio < 0.0005) return 15;
    if (confidenceRatio < 0.001) return 30;
    if (confidenceRatio < 0.005) return 50;
    if (confidenceRatio < 0.01) return 75;
    return 100;                                // Very wide spread
  }

  private calcVolumeAnomalyScore(symbol: StablecoinSymbol, history: PriceData[]): number {
    if (history.length < 10) return 0;

    // Check price volatility as proxy for volume anomaly
    const recentPrices = history.slice(-10).map(p => p.price);
    const olderPrices = history.slice(-60, -10).map(p => p.price);

    if (olderPrices.length < 5) return 0;

    const recentStdDev = this.stdDev(recentPrices);
    const olderStdDev = this.stdDev(olderPrices);

    if (olderStdDev === 0) return recentStdDev > 0 ? 50 : 0;

    const volatilityRatio = recentStdDev / olderStdDev;

    if (volatilityRatio < 1.5) return 0;
    if (volatilityRatio < 3) return 25;
    if (volatilityRatio < 5) return 50;
    if (volatilityRatio < 10) return 75;
    return 100;
  }

  private calcWhaleFlowScore(_symbol: StablecoinSymbol): number {
    // For MVP, return a baseline score
    // In production, this would track large transfers via Helius webhooks
    return 0;
  }

  getRiskLevel(score: number): RiskLevel {
    if (score <= RISK_THRESHOLDS.LOW) return "LOW";
    if (score <= RISK_THRESHOLDS.MEDIUM) return "MEDIUM";
    if (score <= RISK_THRESHOLDS.HIGH) return "HIGH";
    return "CRITICAL";
  }

  getRiskColor(level: RiskLevel): string {
    switch (level) {
      case "LOW": return "#22c55e";       // green
      case "MEDIUM": return "#eab308";    // yellow
      case "HIGH": return "#f97316";      // orange
      case "CRITICAL": return "#ef4444";  // red
    }
  }

  private stdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
