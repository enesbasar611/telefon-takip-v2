"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SalesTrendChartProps {
  data: { date: string; total: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-sm">
        <p className="text-[10px]  text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
        <p className="text-lg font-extrabold text-blue-500">₺{Number(payload[0].value).toLocaleString("tr-TR")}</p>
      </div>
    );
  }
  return null;
};

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const maxVal = Math.max(...(data ?? []).map((d) => d.total), 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="80%" stopColor="#3b82f6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke="currentColor"
            className="text-border/30"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.4 }}
            axisLine={false}
            tickLine={false}
            dy={12}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.4 }}
            tickFormatter={(v) => `₺${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#areaGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}



