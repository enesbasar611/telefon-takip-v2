"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SalesTrendPoint {
  date: string;
  total: number;
  sales?: number;
  service?: number;
}

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload as SalesTrendPoint | undefined;
    const hasBreakdown = point && (point.sales !== undefined || point.service !== undefined);

    return (
      <div className="bg-card/95 dark:bg-[#0c1015]/95 border border-border/60 px-3.5 py-2.5 rounded-xl shadow-2xl backdrop-blur-xl min-w-[140px]">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">{label}</p>
        {hasBreakdown ? (
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-foreground tabular-nums">
              Toplam: ₺{Number(point?.total || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
              <span className="text-blue-500">POS Satış</span>
              <span className="tabular-nums text-blue-500">₺{Number(point?.sales || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
              <span className="text-emerald-500">Servis</span>
              <span className="tabular-nums text-emerald-500">₺{Number(point?.service || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        ) : (
          <p className="text-base font-extrabold text-blue-500 dark:text-blue-400 tabular-nums">₺{Number(payload[0].value).toLocaleString("tr-TR")}</p>
        )}
      </div>
    );
  }
  return null;
};

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const safeData = data ?? [];
  const hasBreakdown = safeData.some((d) => d.sales !== undefined || d.service !== undefined);

  return (
    <div className="w-full h-full min-h-[140px] flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={safeData} margin={{ top: 12, right: 10, left: -15, bottom: 4 }}>
          <defs>
            <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="serviceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-border/20"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "currentColor", fontWeight: 600, opacity: 0.55 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor", fontWeight: 600, opacity: 0.55 }}
            tickFormatter={(v) => `₺${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          {hasBreakdown ? (
            <>
              <Area
                type="monotone"
                dataKey="sales"
                stackId="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#salesAreaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="service"
                stackId="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#serviceAreaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#salesAreaGrad)"
              dot={false}
              activeDot={{ r: 4.5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
