"use client";

import type { MarketRegime } from "../lib/types";

interface HeaderProps {
  isRunning: boolean;
  tickCount: number;
  programId: string;
  regime?: MarketRegime;
}

const REGIME_STYLES: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
  normal: { label: "NORMAL", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", pulse: false },
  stressed: { label: "STRESSED", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", pulse: true },
  crisis: { label: "CRISIS", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", pulse: true },
};

export default function Header({ isRunning, tickCount, programId, regime }: HeaderProps) {
  return (
    <header className="glass-effect border-b border-gray-700/50 sticky top-0 z-50 bg-gradient-to-r from-gray-950/95 via-gray-900/95 to-gray-950/95">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-lg shadow-lg glow-cyan">
            SG
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">StableGuard</h1>
            <p className="text-xs text-gray-400">Autonomous Stablecoin Risk Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Program</p>
            <a
              href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
            >
              {programId.slice(0, 8)}...{programId.slice(-4)}
            </a>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Ticks</p>
            <p className="text-sm font-mono text-white">{tickCount}</p>
          </div>

          {regime && (
            <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wider ${REGIME_STYLES[regime]?.bg || REGIME_STYLES.normal.bg} ${REGIME_STYLES[regime]?.color || REGIME_STYLES.normal.color}`}>
              {REGIME_STYLES[regime]?.pulse && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />
              )}
              {REGIME_STYLES[regime]?.label || "NORMAL"}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isRunning ? "bg-emerald-500 animate-pulse-glow" : "bg-red-500"
              }`}
            />
            <span className={`text-sm font-medium ${isRunning ? "text-emerald-400" : "text-red-400"}`}>
              {isRunning ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
