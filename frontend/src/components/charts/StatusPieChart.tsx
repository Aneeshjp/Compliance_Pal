"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface StatusPieChartProps {
  matched: number;
  mismatch: number;
  missing: number;
}

const COLORS = ["#14b8a6", "#f59e0b", "#f43f5e"];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<any> }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill, boxShadow: `0 0 10px ${data.payload.fill}` }} />
      <div>
        <p className="text-sm text-slate-300 font-medium">{data.name}</p>
        <p className="text-xl text-white font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{data.value}</p>
      </div>
    </div>
  );
};

export default function StatusPieChart({ matched, mismatch, missing }: StatusPieChartProps) {
  const data = [
    { name: "Matched", value: matched },
    { name: "Mismatch", value: mismatch },
    { name: "Missing", value: missing },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-center h-[368px]">
        <p className="text-slate-400 text-sm tracking-widest uppercase font-semibold">No reconciliation data</p>
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_40px_rgba(20,184,166,0.1)] h-full">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-[60px]" />
      
      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Reconciliation Status
        </h3>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <defs>
              <filter id="glowPie" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              innerRadius={70} 
              outerRadius={95} 
              paddingAngle={6} 
              dataKey="value" 
              stroke="none"
              cornerRadius={8}
            >
              {data.map((_, i) => (
                <Cell 
                  key={i} 
                  fill={COLORS[i % COLORS.length]} 
                  style={{ filter: "url(#glowPie)", outline: "none" }}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
