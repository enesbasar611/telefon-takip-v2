"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ServiceStatusChartProps {
  data: { name: string; value: number; color: string }[];
}

export function ServiceStatusChart({ data }: ServiceStatusChartProps) {
  // If no data, show a placeholder
  const chartData = (data ?? []).length > 0 ? data : [
    { name: "Veri yok", value: 1, color: "#1f1f23" }
  ];

  return (
    <div className="h-[350px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={10}
            dataKey="value"
            stroke="none"
            animationDuration={2500}
            animationBegin={500}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                stroke={entry.color}
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#141416] border border-white/10 p-3 rounded-xl shadow-none">
                      <p className="text-[10px] font-black   mb-1" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                      <p className="text-sm font-black text-white">{payload[0].value} Cihaz</p>
                    </div>
                  );
                }
                return null;
              }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
