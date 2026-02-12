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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Price Feed (Live)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
          <Legend />
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
            stroke="#4b5563"
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
            name="$1.00 Peg"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
