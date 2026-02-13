"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PriceChartProps {
  priceHistory: Record<string, { time: string; price: number }[]>;
}

const COLORS: Record<string, string> = {
  USDC: "#2775ca",
  USDT: "#26a17b",
  PYUSD: "#0070e0",
};

export default function PriceChart({ priceHistory }: PriceChartProps) {
  // Merge all symbols into unified time-series data
  const symbols = Object.keys(priceHistory);
  if (symbols.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Price Feed (Live)</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Waiting for price data...
        </div>
      </div>
    );
  }

  // Build merged data points using the longest history as the time axis
  const maxLen = Math.max(...symbols.map((s) => priceHistory[s]?.length || 0));
  const data: Record<string, unknown>[] = [];

  for (let i = 0; i < maxLen; i++) {
    const point: Record<string, unknown> = {};
    let time = "";
    for (const sym of symbols) {
      const arr = priceHistory[sym] || [];
      const idx = arr.length - maxLen + i;
      if (idx >= 0 && arr[idx]) {
        point[sym] = arr[idx].price;
        time = arr[idx].time;
      }
    }
    point.time = time;
    data.push(point);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="relative">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          Price Feed (Live)
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse-glow" />
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#374151" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#374151" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="url(#gridGradient)" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#6b7280"
              domain={[0.995, 1.005]}
              tickFormatter={(v: number) => `$${v.toFixed(4)}`}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={((value: number, name: string) => [`$${value.toFixed(6)}`, name]) as never}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {symbols.map((sym) => (
              <Line
                key={sym}
                type="monotone"
                dataKey={sym}
                stroke={COLORS[sym] || "#8884d8"}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
            {/* $1.00 reference line */}
            <Line
              type="monotone"
              dataKey={() => 1.0}
              stroke="#6b7280"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              name="$1.00 Peg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
