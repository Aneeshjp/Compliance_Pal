"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import PageShell from "@/components/layout/PageShell";
import KPICard from "@/components/ui/KPICard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import MonthlyChart from "@/components/charts/MonthlyChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import ITCTrendChart from "@/components/charts/ITCTrendChart";
import Button from "@/components/ui/Button";
import { useAnalyticsSummary, useMonthlyAnalytics, useITCTrend } from "@/lib/hooks/useAnalytics";
import { useAuth } from "@/lib/hooks/useAuth";
import { seedAPI } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";


const currencyFormatter = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const { data: summary, isLoading } = useAnalyticsSummary();
  const { data: monthlyData } = useMonthlyAnalytics();
  const { data: itcTrend } = useITCTrend();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Check if data is seeded
    seedAPI.getStatus().then((res) => {
      if (!res.data.seeded) {
        if (user?.email === "example@gmail.com" && !sessionStorage.getItem("data_reset")) {
          handleSeedDemo();
        } else {
          setShowWelcome(true);
        }
      }
    }).catch(() => {});
  }, [user]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedAPI.seedDemo();
      toast("success", "Dashboard data loaded successfully!");
      setShowWelcome(false);
      window.location.reload();
    } catch {
      toast("error", "Failed to load dashboard data. Please try again.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <PageShell title="Dashboard" subtitle="Your GST compliance overview">

      {seeding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Preparing Your Dashboard</h3>
            <p className="text-slate-500 text-sm">We are securely setting up your ITC reconciliation dashboard...</p>
          </div>
        </div>
      )}

      {/* Abstract Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-pink-400/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(109,92,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { title: "Total Invoices", icon: <FileText size={16} className="text-[#7c6aff]" />, variant: "violet" as const, val: summary?.total_invoices ?? 0 },
            { title: "Total GST Paid", icon: <TrendingUp size={16} className="text-[#38bdf8]" />, variant: "sky" as const, val: summary?.total_gst_paid ?? 0, formatter: currencyFormatter },
            { title: "ITC Claimable", icon: <CheckCircle size={16} className="text-[#2dd4bf]" />, variant: "teal" as const, val: summary?.itc_claimable ?? 0, formatter: currencyFormatter },
            { title: "ITC at Risk", icon: <AlertTriangle size={16} className="text-[#f472b6]" />, variant: "rose" as const, val: summary?.itc_at_risk ?? 0, formatter: currencyFormatter },
            { title: "Matched", icon: <CheckCircle size={16} className="text-[#a3e635]" />, variant: "lime" as const, val: summary?.matched_count ?? 0 },
            { title: "Issues", icon: <XCircle size={16} className="text-[#fbbf24]" />, variant: "amber" as const, val: (summary?.mismatch_count ?? 0) + (summary?.missing_count ?? 0) },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
            >
              <KPICard title={kpi.title} icon={kpi.icon} variant={kpi.variant} className="h-full">
                <AnimatedCounter value={kpi.val} formatter={kpi.formatter} />
              </KPICard>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}>
            <MonthlyChart data={monthlyData?.months ?? []} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}>
            <StatusPieChart
              matched={summary?.matched_count ?? 0}
              mismatch={summary?.mismatch_count ?? 0}
              missing={summary?.missing_count ?? 0}
            />
          </motion.div>
        </div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
          <div className="grid grid-cols-1 gap-6">
            <ITCTrendChart data={itcTrend?.trend ?? []} />
          </div>
        </motion.div>
      </motion.div>
    </PageShell>
  );
}
