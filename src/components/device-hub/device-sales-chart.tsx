"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

export function DeviceSalesChart({ data }: { data: any[] }) {
    // Veriyi son 7 gün için varsayılan olarak biçimlendir
    const chartData = useMemo(() => {
        return data;
    }, [data]);

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }}
                        dy={5}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const dayData = payload[0].payload;
                                return (
                                    <div className="bg-card border border-border p-3 rounded-xl shadow-xl space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label} Tarihli Özet</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-[11px] text-emerald-500 font-medium">Satılan Cihaz:</span>
                                                <span className="text-[11px] font-bold">{dayData.salesCount} Adet</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-[11px] text-blue-500 font-medium">Alınan Cihaz:</span>
                                                <span className="text-[11px] font-bold">{dayData.purchaseCount} Adet</span>
                                            </div>
                                            <div className="pt-2 border-t border-border mt-1">
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-[11px] text-muted-foreground">Günlük Ciro:</span>
                                                    <span className="text-[11px] font-bold text-emerald-500">{Number(dayData.total).toLocaleString("tr-TR")} ₺</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="salesCount"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                    <Bar
                        dataKey="purchaseCount"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}



