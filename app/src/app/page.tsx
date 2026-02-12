"use client";

import { useAgentState } from "../hooks/useAgentState";
import Header from "../components/Header";
import RiskGauge from "../components/RiskGauge";
import PriceChart from "../components/PriceChart";
import ActionLog from "../components/ActionLog";
import YieldTable from "../components/YieldTable";

export default function Dashboard() {
  const { state, error, priceHistory } = useAgentState(5000);

  if (error && !state) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Agent Offline</h2>
          <p className="text-gray-400 text-sm mb-4">
            Cannot connect to StableGuard agent
          </p>
          <p className="text-gray-500 text-xs font-mono">{error}</p>
          <p className="text-gray-600 text-xs mt-4">
            Start the agent: <code className="text-cyan-400">npm run agent:dev</code>
          </p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Connecting to agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        isRunning={state.isRunning}
        tickCount={state.tickCount}
        programId={state.programId}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Connection error banner */}
        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 text-sm text-yellow-400">
            Connection interrupted. Retrying... Last data from{" "}
            {state.lastTick
              ? new Date(state.lastTick).toLocaleTimeString()
              : "unknown"}
          </div>
        )}

        {/* Risk Gauges */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Stablecoin Risk Scores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.stablecoins.map((coin) => (
              <RiskGauge key={coin.symbol} coin={coin} />
            ))}
            {state.stablecoins.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Waiting for first price tick...
              </div>
            )}
          </div>
        </section>

        {/* Price Chart */}
        <section>
          <PriceChart priceHistory={priceHistory} />
        </section>

        {/* Action Log + Yield Table */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActionLog actions={state.actions} />
          <YieldTable yields={state.yields} />
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-4 pb-8 flex items-center justify-between text-xs text-gray-500">
          <span>
            StableGuard v0.1.0 | Solana Devnet |{" "}
            <a
              href={`https://explorer.solana.com/address/${state.programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400"
            >
              View Program
            </a>
          </span>
          <span>
            Built for{" "}
            <a
              href="https://colosseum.com/agent-hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400"
            >
              Colosseum Agent Hackathon
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
