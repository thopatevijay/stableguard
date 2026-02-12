"use client";

import { getRiskLevel, getRiskColor } from "../lib/types";
import type { StablecoinState } from "../lib/types";

interface RiskGaugeProps {
  coin: StablecoinState;
}

export default function RiskGauge({ coin }: RiskGaugeProps) {
  const level = getRiskLevel(coin.riskScore);
  const color = getRiskColor(level);
  const percentage = coin.riskScore / 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - percentage);

  const deviation = ((coin.price - 1.0) * 100).toFixed(3);
  const deviationSign = Number(deviation) >= 0 ? "+" : "";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-white">{coin.symbol}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {level}
        </span>
      </div>

      {/* Circular gauge */}
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#1f2937"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{coin.riskScore}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      {/* Price info */}
      <div className="text-center mb-3">
        <p className="text-2xl font-mono font-semibold text-white">
          ${coin.price.toFixed(4)}
        </p>
        <p className="text-xs text-gray-400">
          Deviation: <span style={{ color }}>{deviationSign}{deviation}%</span>
        </p>
      </div>

      {/* Score breakdown */}
      <div className="w-full space-y-1.5 text-xs">
        <ScoreBar label="Price Dev" value={coin.priceDeviationScore} weight="40%" />
        <ScoreBar label="Liquidity" value={coin.liquidityScore} weight="30%" />
        <ScoreBar label="Vol Anomaly" value={coin.volumeAnomalyScore} weight="20%" />
        <ScoreBar label="Whale Flow" value={coin.whaleFlowScore} weight="10%" />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = value <= 25 ? "#22c55e" : value <= 50 ? "#eab308" : value <= 75 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 w-20 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-gray-500 w-8 text-right">{weight}</span>
    </div>
  );
}
