"use client";

import type { YieldData } from "../lib/types";

interface YieldTableProps {
  yields: YieldData[];
}

export default function YieldTable({ yields }: YieldTableProps) {
  if (yields.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Yield Comparison</h3>
        <p className="text-sm text-gray-500 text-center py-4">Loading yields...</p>
      </div>
    );
  }

  // Group by symbol, then show protocols side by side
  const symbols = Array.from(new Set(yields.map((y) => y.symbol)));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Yield Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Token</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Protocol</th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">Supply APY</th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">Borrow APY</th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">TVL</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => {
              const rows = yields.filter((y) => y.symbol === symbol);
              const best = rows.reduce((a, b) =>
                a.supplyApy > b.supplyApy ? a : b
              );
              return rows.map((y, i) => (
                <tr
                  key={`${y.protocol}-${y.symbol}`}
                  className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors duration-150"
                >
                  {i === 0 ? (
                    <td
                      className="py-2.5 px-3 font-medium text-white"
                      rowSpan={rows.length}
                    >
                      {symbol}
                    </td>
                  ) : null}
                  <td className="py-2.5 px-3 text-gray-300">{y.protocol}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span
                      className={
                        y === best
                          ? "text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10"
                          : "text-gray-300"
                      }
                    >
                      {y.supplyApy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                    {y.borrowApy.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                    ${formatTvl(y.tvl)}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTvl(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}
