"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AgentState, ActionReasoning } from "../lib/types";

const API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:3001";

function generateDemoState(): AgentState {
  const now = new Date().toISOString();
  // Simulate slight price movement around $1.00
  const usdcPrice = 0.9998 + (Math.random() - 0.5) * 0.0004;
  const usdtPrice = 0.9994 + (Math.random() - 0.5) * 0.0006;
  const pyusdPrice = 1.0001 + (Math.random() - 0.5) * 0.0008;

  return {
    stablecoins: [
      {
        symbol: "USDC",
        name: "USD Coin",
        price: usdcPrice,
        confidence: 0.0001,
        riskScore: 3,
        priceDeviationScore: 0,
        liquidityScore: 0,
        volumeAnomalyScore: 8,
        whaleFlowScore: 0,
        lastUpdated: now,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        price: usdtPrice,
        confidence: 0.0002,
        riskScore: 7,
        priceDeviationScore: 0,
        liquidityScore: 0,
        volumeAnomalyScore: 12,
        whaleFlowScore: 25,
        lastUpdated: now,
      },
      {
        symbol: "PYUSD",
        name: "PayPal USD",
        price: pyusdPrice,
        confidence: 0.0003,
        riskScore: 12,
        priceDeviationScore: 0,
        liquidityScore: 15,
        volumeAnomalyScore: 10,
        whaleFlowScore: 25,
        lastUpdated: now,
      },
    ],
    actions: [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: "MONITOR",
        fromToken: "USDC",
        riskScore: 3,
        details: "All stablecoins healthy. USDC deviation: 0.02%",
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        type: "MONITOR",
        fromToken: "USDT",
        riskScore: 7,
        details: "USDT minor whale flow detected. Monitoring closely.",
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: "ALERT",
        fromToken: "PYUSD",
        riskScore: 28,
        details: "PYUSD liquidity thinning on Jupiter. Slippage up to 0.3% for $100K.",
        reasoning: {
          summary: "ELEVATED: PYUSD risk at 28/100 (price: $1.0001). Monitoring closely.",
          factors: [
            { name: "Price Deviation", score: 0, weight: 0.40, detail: "Price $1.0001 (0.01% from peg)" },
            { name: "Liquidity", score: 15, weight: 0.30, detail: "Jupiter slippage < 0.3% for $100K" },
            { name: "Volume Anomaly", score: 10, weight: 0.20, detail: "Volatility within normal range" },
            { name: "Whale Flow", score: 25, weight: 0.10, detail: "Large transfer activity detected (score: 25)" },
          ],
          regime: "normal",
          decision: "ALERT",
          alternatives: ["USDC (risk: 3/100)", "USDT (risk: 7/100)"],
          thresholdContext: "Current: 28. Next action at 51 (REBALANCE).",
        } as ActionReasoning,
      },
    ],
    yields: [
      { protocol: "Kamino", symbol: "USDC", supplyApy: 6.82, borrowApy: 8.45, tvl: 245000000 },
      { protocol: "Kamino", symbol: "USDT", supplyApy: 5.91, borrowApy: 7.82, tvl: 189000000 },
      { protocol: "Kamino", symbol: "PYUSD", supplyApy: 8.14, borrowApy: 10.21, tvl: 42000000 },
      { protocol: "MarginFi", symbol: "USDC", supplyApy: 5.67, borrowApy: 7.89, tvl: 312000000 },
      { protocol: "MarginFi", symbol: "USDT", supplyApy: 4.93, borrowApy: 6.71, tvl: 156000000 },
      { protocol: "MarginFi", symbol: "PYUSD", supplyApy: 7.45, borrowApy: 9.88, tvl: 28000000 },
    ],
    isRunning: true,
    lastTick: now,
    tickCount: 142,
    programId: "A1NxaEoNRreaTCMaiNLfXBKj1bU13Trhwjr2h5Xvbmmr",
    authority: "HUQAKz25erBqbuMSm3e4TuNQFtMLTH3tqAPrJ9Do1HpA",
    regime: "normal",
  };
}

export function useAgentState(pollInterval = 5000) {
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, { time: string; price: number }[]>
  >({});
  const historyRef = useRef(priceHistory);
  historyRef.current = priceHistory;
  const failCountRef = useRef(0);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AgentState = await res.json();
      setState(data);
      setError(null);
      setIsDemo(false);
      failCountRef.current = 0;

      // Accumulate price history for charts
      if (data.stablecoins?.length > 0) {
        const now = new Date().toLocaleTimeString();
        const updated: Record<string, { time: string; price: number }[]> = {
          ...historyRef.current,
        };
        for (const coin of data.stablecoins) {
          if (coin.feedUnavailable) continue;
          const key = coin.symbol;
          const existing = updated[key] || [];
          const newEntry = { time: now, price: coin.price };
          updated[key] = [...existing.slice(-60), newEntry];
        }
        setPriceHistory(updated);
      }
    } catch {
      failCountRef.current++;
      // After 2 failed attempts, switch to demo mode
      if (failCountRef.current >= 2) {
        const demo = generateDemoState();
        setState(demo);
        setIsDemo(true);
        setError(null);

        const now = new Date().toLocaleTimeString();
        const updated: Record<string, { time: string; price: number }[]> = {
          ...historyRef.current,
        };
        for (const coin of demo.stablecoins) {
          const key = coin.symbol;
          const existing = updated[key] || [];
          const newEntry = { time: now, price: coin.price };
          updated[key] = [...existing.slice(-60), newEntry];
        }
        setPriceHistory(updated);
      } else {
        setError("Connecting to agent...");
      }
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, pollInterval);
    return () => clearInterval(interval);
  }, [fetchState, pollInterval]);

  return { state, error, isDemo, priceHistory };
}
