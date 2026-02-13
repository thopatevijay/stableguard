export interface StablecoinState {
  symbol: string;
  name: string;
  price: number;
  confidence: number;
  riskScore: number;
  priceDeviationScore: number;
  liquidityScore: number;
  volumeAnomalyScore: number;
  whaleFlowScore: number;
  lastUpdated: string;
  feedUnavailable?: boolean;
}

export type MarketRegime = "normal" | "stressed" | "crisis";

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface ActionReasoning {
  summary: string;
  factors: RiskFactor[];
  regime: MarketRegime;
  decision: string;
  alternatives: string[];
  thresholdContext: string;
}

export interface AgentAction {
  timestamp: string;
  type: "ALERT" | "REBALANCE" | "EMERGENCY_EXIT" | "MONITOR";
  fromToken: string;
  toToken?: string;
  riskScore: number;
  details: string;
  reasoning?: ActionReasoning;
}

export interface YieldData {
  protocol: string;
  symbol: string;
  supplyApy: number;
  borrowApy: number;
  tvl: number;
}

export interface AgentState {
  stablecoins: StablecoinState[];
  actions: AgentAction[];
  yields: YieldData[];
  isRunning: boolean;
  lastTick: string | null;
  tickCount: number;
  programId: string;
  authority: string;
  regime?: MarketRegime;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "#22c55e";
    case "MEDIUM": return "#eab308";
    case "HIGH": return "#f97316";
    case "CRITICAL": return "#ef4444";
  }
}
