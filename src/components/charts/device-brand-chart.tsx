"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DeviceBrandChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-sm">
                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
                <p className="text-lg font-extrabold" style={{ color: payload[0].payload.fill }}>
                    {payload[0].value} cihaz
                </p>
            </div>
        );
    }
    return null;
};

export function DeviceBrandChart({ data }: DeviceBrandChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {data.slice(0, 8).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                        <span className="text-[10px]  text-muted-foreground truncate uppercase tracking-wide">{item.name}</span>
                        <span className="text-[10px]  ml-auto" style={{ color: COLORS[index % COLORS.length] }}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}



