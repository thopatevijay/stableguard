import type { StablecoinState, MarketRegime } from "./config";
import type { PriceData } from "./monitor";

export class RegimeDetector {
  detect(
    states: StablecoinState[],
    getHistory: (symbol: string) => PriceData[]
  ): MarketRegime {
    const activeStates = states.filter((s) => !s.feedUnavailable);
    if (activeStates.length === 0) return "normal";

    // Signal 1: Average risk across all active stablecoins
    const avgRisk =
      activeStates.reduce((sum, s) => sum + s.riskScore, 0) / activeStates.length;

    // Signal 2: Count of stablecoins with elevated risk
    const elevatedCount = activeStates.filter((s) => s.riskScore > 25).length;
    const highCount = activeStates.filter((s) => s.riskScore > 40).length;

    // Signal 3: Volatility spike — compare recent vs older price stddev
    let volatilitySpike = false;
    for (const state of activeStates) {
      const history = getHistory(state.symbol);
      if (history.length >= 20) {
        const recent = history.slice(-10).map((p) => p.price);
        const older = history.slice(-60, -10).map((p) => p.price);
        if (older.length >= 5) {
          const recentStd = stdDev(recent);
          const olderStd = stdDev(older);
          if (olderStd > 0 && recentStd / olderStd > 3) {
            volatilitySpike = true;
          }
        }
      }
    }

    // Signal 4: Multiple stablecoins deviating in same direction (contagion)
    const deviations = activeStates.map((s) => s.price - 1.0);
    const allNegative = deviations.length >= 2 && deviations.every((d) => d < -0.001);
    const allPositive = deviations.length >= 2 && deviations.every((d) => d > 0.001);
    const contagion = allNegative || allPositive;

    // Crisis: avgRisk > 40 OR any coin > 60 OR 2+ coins > 40 OR contagion + volatility
    if (
      avgRisk > 40 ||
      activeStates.some((s) => s.riskScore > 60) ||
      highCount >= 2 ||
      (contagion && volatilitySpike)
    ) {
      return "crisis";
    }

    // Stressed: avgRisk 20-40 OR any coin > 40 OR elevated + volatility
    if (
      avgRisk > 20 ||
      highCount >= 1 ||
      (elevatedCount >= 1 && volatilitySpike) ||
      contagion
    ) {
      return "stressed";
    }

    return "normal";
  }

  /**
   * Returns threshold multiplier based on regime.
   * Lower multiplier = more sensitive thresholds.
   */
  getThresholdMultiplier(regime: MarketRegime): number {
    switch (regime) {
      case "crisis":
        return 0.6; // Thresholds lowered by 40%
      case "stressed":
        return 0.8; // Thresholds lowered by 20%
      default:
        return 1.0;
    }
  }
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}
