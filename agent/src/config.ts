import { PublicKey } from "@solana/web3.js";

// Pyth price feed IDs (Hermes format)
export const PYTH_PRICE_FEEDS = {
  USDC: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT: "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
  PYUSD: "c1da1b73d7f01e7ddd54b3766cf7f556cc0e6a82d05597ef68a22e604dea4f0e",
} as const;

// Solana token mint addresses (mainnet/devnet)
export const TOKEN_MINTS = {
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  USDT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  PYUSD: new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
} as const;

// Stablecoin display names
export const STABLECOIN_NAMES: Record<string, string> = {
  USDC: "USD Coin",
  USDT: "Tether USD",
  PYUSD: "PayPal USD",
};

// Risk score weights
export const RISK_WEIGHTS = {
  PRICE_DEVIATION: 0.40,
  LIQUIDITY: 0.30,
  VOLUME_ANOMALY: 0.20,
  WHALE_FLOW: 0.10,
} as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
} as const;

// Action thresholds
export const ACTION_CONFIG = {
  ALERT_THRESHOLD: 26,       // Send alert when risk > 26
  REBALANCE_THRESHOLD: 51,   // Auto-rebalance when risk > 51
  EMERGENCY_THRESHOLD: 76,   // Emergency exit when risk > 76
  MONITORING_INTERVAL_MS: 10_000,  // Poll every 10 seconds
  FAST_MONITORING_INTERVAL_MS: 3_000, // Poll every 3s when risk is elevated
} as const;

// Pyth Hermes endpoint
export const PYTH_HERMES_URL = "https://hermes.pyth.network";

// Jupiter API (public endpoint)
export const JUPITER_API_URL = "https://public.jupiterapi.com";

// Helius RPC (devnet fallback)
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

export type StablecoinSymbol = "USDC" | "USDT" | "PYUSD";

export interface StablecoinState {
  symbol: StablecoinSymbol;
  name: string;
  price: number;
  confidence: number;
  riskScore: number;
  priceDeviationScore: number;
  liquidityScore: number;
  volumeAnomalyScore: number;
  whaleFlowScore: number;
  lastUpdated: Date;
  feedUnavailable?: boolean;
}

export interface AgentAction {
  timestamp: Date;
  type: "ALERT" | "REBALANCE" | "EMERGENCY_EXIT" | "MONITOR";
  fromToken: StablecoinSymbol;
  toToken?: StablecoinSymbol;
  riskScore: number;
  details: string;
}
