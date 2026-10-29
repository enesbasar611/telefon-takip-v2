"use client";

import { useRouter } from "next/navigation";
import { CountingNumber } from "@/components/ui/counting-number";

interface ServiceStatusChartProps {
  data: { status: string; name: string; value: number; color: string }[];
}

export function ServiceStatusChart({ data }: ServiceStatusChartProps) {
  const router = useRouter();
  const chartData = (data ?? []).filter((d) => d.value > 0);
  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  const handleStatusClick = (status: string) => {
    router.push(`/servis/liste?status=${status}`);
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p className="text-xs">Aktif cihaz bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Sleek Segmented Progress Bar */}
      <div className="flex w-full h-2.5 rounded-full overflow-hidden gap-1 p-0.5 bg-muted/30 border border-border/30 shadow-inner">
        {chartData.map((entry, i) => (
          <div
            key={i}
            onClick={() => handleStatusClick(entry.status)}
            className="h-full rounded-full transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
            style={{
              width: `${(entry.value / total) * 100}%`,
              backgroundColor: entry.color,
            }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 border border-border">
              {entry.name}: {entry.value}
            </div>
          </div>
        ))}
      </div>

      {/* Compact Legend Rows */}
      <div className="space-y-1">
        {chartData.map((entry, i) => {
          const pct = Math.round((entry.value / total) * 100);
          return (
            <div
              key={i}
              onClick={() => handleStatusClick(entry.status)}
              className="flex items-center gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-all duration-150 group"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground/85 group-hover:text-primary transition-colors truncate uppercase tracking-tight">
                    {entry.name}
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: entry.color }}>
                      <CountingNumber value={pct} suffix="%" />
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums uppercase">
                      <CountingNumber value={entry.value} suffix=" Cihaz" />
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: entry.color, opacity: 0.85 }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
