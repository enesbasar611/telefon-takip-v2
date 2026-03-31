"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface TopProductsChartProps {
    data: { name: string; sales: number; price: number }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/50 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 max-w-[180px] truncate">{label}</p>
                <p className="text-lg font-extrabold text-primary">{payload[0].value} adet satış</p>
            </div>
        );
    }
    return null;
};

export function TopProductsChart({ data }: TopProductsChartProps) {
    const chartData = data.map(d => ({
        ...d,
        name: d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name
    }));

    return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" horizontal={false} stroke="currentColor" className="text-border/20" />
                <XAxis type="number" tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.4 }} axisLine={false} tickLine={false} />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.6 }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)", radius: 8 }} />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
