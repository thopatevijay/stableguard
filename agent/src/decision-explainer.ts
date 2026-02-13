import {
  ACTION_CONFIG,
  RISK_WEIGHTS,
  type StablecoinState,
  type StablecoinSymbol,
  type MarketRegime,
  type ActionReasoning,
  type RiskFactor,
} from "./config";

export class DecisionExplainer {
  explain(
    state: StablecoinState,
    allStates: StablecoinState[],
    regime: MarketRegime,
    actionType: "ALERT" | "REBALANCE" | "EMERGENCY_EXIT" | "MONITOR"
  ): ActionReasoning {
    const factors = this.buildFactors(state);
    const alternatives = this.buildAlternatives(state.symbol, allStates);
    const summary = this.buildSummary(state, actionType, regime);
    const thresholdContext = this.buildThresholdContext(state.riskScore, actionType);

    return {
      summary,
      factors,
      regime,
      decision: actionType,
      alternatives,
      thresholdContext,
    };
  }

  private buildFactors(state: StablecoinState): RiskFactor[] {
    const deviation = Math.abs(state.price - 1.0);
    const deviationPct = (deviation * 100).toFixed(2);

    return [
      {
        name: "Price Deviation",
        score: state.priceDeviationScore,
        weight: RISK_WEIGHTS.PRICE_DEVIATION,
        detail: `Price $${state.price.toFixed(4)} (${deviationPct}% from peg)`,
      },
      {
        name: "Liquidity",
        score: state.liquidityScore,
        weight: RISK_WEIGHTS.LIQUIDITY,
        detail: state.liquidityScore === 0
          ? "Jupiter slippage < 0.1% for $100K"
          : state.liquidityScore <= 15
            ? "Jupiter slippage < 0.3% for $100K"
            : state.liquidityScore <= 30
              ? "Jupiter slippage < 0.5% for $100K"
              : `Elevated slippage (score: ${state.liquidityScore})`,
      },
      {
        name: "Volume Anomaly",
        score: state.volumeAnomalyScore,
        weight: RISK_WEIGHTS.VOLUME_ANOMALY,
        detail: state.volumeAnomalyScore === 0
          ? "Volatility within normal range"
          : `Volatility ${state.volumeAnomalyScore >= 50 ? "significantly " : ""}above baseline`,
      },
      {
        name: "Whale Flow",
        score: state.whaleFlowScore,
        weight: RISK_WEIGHTS.WHALE_FLOW,
        detail: state.whaleFlowScore === 0
          ? "No large transfers detected"
          : `Large transfer activity detected (score: ${state.whaleFlowScore})`,
      },
    ];
  }

  private buildAlternatives(
    currentSymbol: StablecoinSymbol,
    allStates: StablecoinState[]
  ): string[] {
    return allStates
      .filter((s) => s.symbol !== currentSymbol)
      .map((s) => {
        if (s.feedUnavailable) return `${s.symbol} (feed unavailable)`;
        return `${s.symbol} (risk: ${s.riskScore}/100)`;
      });
  }

  private buildSummary(
    state: StablecoinState,
    actionType: string,
    regime: MarketRegime
  ): string {
    const regimeLabel = regime !== "normal" ? ` [${regime.toUpperCase()} regime]` : "";
    const pricePart = `$${state.price.toFixed(4)}`;

    switch (actionType) {
      case "EMERGENCY_EXIT":
        return `CRITICAL: ${state.symbol} risk at ${state.riskScore}/100 (price: ${pricePart}).${regimeLabel} Emergency exit initiated.`;
      case "REBALANCE":
        return `HIGH RISK: ${state.symbol} risk at ${state.riskScore}/100 (price: ${pricePart}).${regimeLabel} Protective rebalance triggered.`;
      case "ALERT":
        return `ELEVATED: ${state.symbol} risk at ${state.riskScore}/100 (price: ${pricePart}).${regimeLabel} Monitoring closely.`;
      default:
        return `${state.symbol} risk at ${state.riskScore}/100 (price: ${pricePart}).${regimeLabel}`;
    }
  }

  private buildThresholdContext(riskScore: number, currentAction: string): string {
    if (currentAction === "EMERGENCY_EXIT") {
      return `Current: ${riskScore}. Maximum severity reached.`;
    }
    if (currentAction === "REBALANCE") {
      return `Current: ${riskScore}. Emergency exit at ${ACTION_CONFIG.EMERGENCY_THRESHOLD}.`;
    }
    if (currentAction === "ALERT") {
      return `Current: ${riskScore}. Next action at ${ACTION_CONFIG.REBALANCE_THRESHOLD} (REBALANCE).`;
    }
    return `Current: ${riskScore}. Alert at ${ACTION_CONFIG.ALERT_THRESHOLD}.`;
  }
}
