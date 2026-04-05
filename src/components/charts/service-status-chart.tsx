"use client";

import { useRouter } from "next/navigation";

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
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <p className="text-xs ">Aktif cihaz bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Segmented Bar */}
      <div className="flex w-full h-4 rounded-full overflow-hidden gap-0.5 shadow-inner bg-muted/20">
        {chartData.map((entry, i) => (
          <div
            key={i}
            onClick={() => handleStatusClick(entry.status)}
            className="h-full transition-all duration-300 hover:scale-y-125 hover:z-10 cursor-pointer first:rounded-l-full last:rounded-r-full group relative"
            style={{
              width: `${(entry.value / total) * 100}%`,
              backgroundColor: entry.color,
            }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity  whitespace-nowrap">
              {entry.name}: {entry.value}
            </div>
          </div>
        ))}
      </div>

      {/* Legend list with progress */}
      <div className="space-y-2">
        {chartData.map((entry, i) => {
          const pct = Math.round((entry.value / total) * 100);
          return (
            <div
              key={i}
              onClick={() => handleStatusClick(entry.status)}
              className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors group"
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs  text-foreground/80 group-hover:text-primary transition-colors truncate uppercase tracking-tight">{entry.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-[10px] " style={{ color: entry.color }}>{pct}%</span>
                    <span className="text-[10px]  text-muted-foreground/60">{entry.value} CİHAZ</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 group-hover:opacity-100 border-r-2 border-white/20"
                    style={{ width: `${pct}%`, backgroundColor: entry.color, opacity: 0.6 }}
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




