"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccountAnalytics } from "@/lib/actions/finance-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

const periods = [
    { value: "DAY", label: "Bugün" },
    { value: "WEEK", label: "Bu Hafta" },
    { value: "MONTH", label: "Bu Ay" },
] as const;

export function FinanceCharts() {
    const [period, setPeriod] = useState<"DAY" | "WEEK" | "MONTH">("WEEK");

    const { data, isPending } = useQuery({
        queryKey: ["finance-analytics", "ALL", period],
        queryFn: () => getAccountAnalytics("ALL", period),
    });

    const chartData = data?.chartData || [];

    return (
        <Card className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-card/50 shadow-sm col-span-1">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Gelir & Gider Analizi</CardTitle>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Dönemsel Performans Tablosu</p>
                    </div>
                </div>
                
                <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
                    {periods.map((p) => (
                        <Button
                            key={p.value}
                            variant="ghost"
                            size="sm"
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                "h-8 rounded-lg text-[11px] px-4 font-medium transition-all",
                                period === p.value 
                                    ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {isPending ? (
                    <div className="h-[300px] w-full flex items-end gap-2 pt-10">
                        {[...Array(12)].map((_, i) => (
                            <Skeleton key={i} className="w-full rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                        ))}
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
                        Bu dönem için henüz işlem kaydı bulunmuyor.
                    </div>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                                    tickFormatter={(value) => `₺${value.toLocaleString()}`}
                                />
                                <Tooltip 
                                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.2 }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, undefined]}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} iconType="circle" />
                                <Line type="monotone" dataKey="income" name="Gelir" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expense" name="Gider" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
