"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ITCTrendChartProps {
  data: { month: string; itc_claimable: number; itc_at_risk: number }[];
}

export default function ITCTrendChart({ data }: ITCTrendChartProps) {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_40px_rgba(109,92,255,0.1)]">
      {/* Background glow */}
      <div className="absolute -left-20 -top-20 w-40 h-40 bg-[#14b8a6]/10 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ITC Trend Analysis
        </h3>
        <span className="text-[10px] font-bold tracking-widest text-[#14b8a6] uppercase bg-[#14b8a6]/10 px-2 py-1 rounded-lg">
          Live Data
        </span>
      </div>

      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="claimableGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.4} vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                background: "rgba(15, 23, 42, 0.8)", 
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)", 
                borderRadius: "16px", 
                fontSize: "13px",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}
              itemStyle={{ fontWeight: 600 }}
              cursor={{ stroke: 'rgba(109,92,255,0.2)', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Area 
              type="monotone" 
              dataKey="itc_claimable" 
              name="ITC Claimable" 
              stroke="#14b8a6" 
              strokeWidth={3} 
              fill="url(#claimableGrad)" 
              activeDot={{ r: 6, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2, filter: "url(#glow)" }}
              filter="url(#glow)"
            />
            <Area 
              type="monotone" 
              dataKey="itc_at_risk" 
              name="ITC at Risk" 
              stroke="#f43f5e" 
              strokeWidth={3} 
              fill="url(#riskGrad)" 
              activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2, filter: "url(#glow)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
