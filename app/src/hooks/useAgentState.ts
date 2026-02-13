"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AgentState } from "../lib/types";

const API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:3001";

export function useAgentState(pollInterval = 5000) {
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, { time: string; price: number }[]>
  >({});
  const historyRef = useRef(priceHistory);
  historyRef.current = priceHistory;

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AgentState = await res.json();
      setState(data);
      setError(null);

      // Accumulate price history for charts
      if (data.stablecoins?.length > 0) {
        const now = new Date().toLocaleTimeString();
        const updated: Record<string, { time: string; price: number }[]> = {
          ...historyRef.current,
        };
        for (const coin of data.stablecoins) {
          if (coin.feedUnavailable) continue; // Skip unavailable feeds
          const key = coin.symbol;
          const existing = updated[key] || [];
          const newEntry = { time: now, price: coin.price };
          updated[key] = [...existing.slice(-60), newEntry];
        }
        setPriceHistory(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, pollInterval);
    return () => clearInterval(interval);
  }, [fetchState, pollInterval]);

  return { state, error, priceHistory };
}
