"use client";

import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer, Legend, Area
} from "recharts";

interface CashflowChartProps {
    data: { date: string; income: number; expense: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/50 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-sm space-y-2">
                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs  text-muted-foreground capitalize">
                            {p.dataKey === "income" ? "Gelir" : "Gider"}:
                        </span>
                        <span className="text-sm font-extrabold" style={{ color: p.color }}>
                            ₺{Number(p.value).toLocaleString("tr-TR")}
                        </span>
                    </div>
                ))}
                <div className="border-t border-border/30 pt-2 mt-1">
                    <span className="text-xs  text-muted-foreground">Net: </span>
                    <span className={`text-sm font-extrabold ${(payload[0]?.value - (payload[1]?.value || 0)) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        ₺{(Number(payload[0]?.value || 0) - Number(payload[1]?.value || 0)).toLocaleString("tr-TR")}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function CashflowChart({ data }: CashflowChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="currentColor" className="text-border/20" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.4 }} axisLine={false} tickLine={false} dy={12} />
                <YAxis tick={{ fontSize: 9, fill: "currentColor", fontWeight: 700, opacity: 0.4 }} tickFormatter={(v) => `₺${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}



