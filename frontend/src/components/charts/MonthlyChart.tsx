"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

interface MonthlyChartProps {
  data: { month: string; count: number; total_gst: number }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
      <p className="text-sm text-slate-300 font-medium mb-3 uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
          <p className="text-xs text-slate-400 w-24">
            {entry.name}
          </p>
          <p className="text-sm text-white font-bold tracking-wide">
            {entry.name === "GST Amount" ? `₹${entry.value.toLocaleString("en-IN")}` : entry.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_40px_rgba(109,92,255,0.1)]">
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#6d5cff]/10 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Volume & GST Trends
        </h3>
      </div>

      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} barGap={8} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#6d5cff" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
              </linearGradient>
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
              yAxisId="left" 
              stroke="#64748b" 
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#64748b" 
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
              tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              axisLine={false}
              tickLine={false}
              dx={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(109,92,255,0.05)' }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: '20px' }} 
              iconType="circle"
            />
            <Bar yAxisId="left" dataKey="count" name="Invoices" fill="url(#invGrad)" radius={[8, 8, 8, 8]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-inv-${index}`} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
            <Bar yAxisId="right" dataKey="total_gst" name="GST Amount" fill="url(#gstGrad)" radius={[8, 8, 8, 8]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-gst-${index}`} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
