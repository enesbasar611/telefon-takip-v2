"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface SalesTrendChartProps {
  data: { date: string; total: number }[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <div className="w-full relative">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" opacity={0.1} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
            tickFormatter={(value) => `₺${value}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border p-3 rounded-xl shadow-2xl">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-bold text-primary">₺{Number(payload[0].value).toLocaleString('tr-TR')}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="total"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            animationDuration={2000}
            barSize={32}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#3b82f6' : 'url(#barGradient)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
