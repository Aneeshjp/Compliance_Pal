"use client";

import PageShell from "@/components/layout/PageShell";
import MonthlyChart from "@/components/charts/MonthlyChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import ITCTrendChart from "@/components/charts/ITCTrendChart";
import { useAnalyticsSummary, useMonthlyAnalytics, useITCTrend, useVendorAnalytics } from "@/lib/hooks/useAnalytics";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function AnalyticsPage() {
  const { data: summary } = useAnalyticsSummary();
  const { data: monthlyData } = useMonthlyAnalytics();
  const { data: itcTrend } = useITCTrend();
  const { data: vendorData } = useVendorAnalytics();

  return (
    <PageShell title="Analytics" subtitle="Deep-dive into your GST data">
      <div className="space-y-6">
        <MonthlyChart data={monthlyData?.months ?? []} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusPieChart
            matched={summary?.matched_count ?? 0}
            mismatch={summary?.mismatch_count ?? 0}
            missing={summary?.missing_count ?? 0}
          />
          <ITCTrendChart data={itcTrend?.trend ?? []} />
        </div>

        {/* Vendor Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Vendors by Volume</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">GSTIN</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Invoices</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Total GST</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {(vendorData?.vendors ?? []).map((v: { vendor_name: string; gstin: string; invoice_count: number; total_gst: number; total_amount: number }, i: number) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-slate-800 font-medium">{v.vendor_name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{v.gstin}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">{v.invoice_count}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono font-medium">{formatCurrency(v.total_gst)}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono font-medium">{formatCurrency(v.total_amount)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Credit Score Generate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 p-6 shadow-sm"
        >
          {/* Decorative background blobs */}
          <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full bg-violet-200/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-pink-200/40 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6d5cff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-violet-200">
              <Star size={26} className="text-white" fill="white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className="text-base font-bold text-slate-900"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Generate Your Business Credit Score
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                  <ShieldCheck size={10} /> Powered by CreditSathi
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Turn your GST compliance data into a verified business credit score. Get instant access to loans, credit lines, and financial insights tailored for MSMEs.
              </p>
            </div>

            {/* CTA Button */}
            <a
              href="https://creditsathi.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              id="credit-score-btn"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-r from-[#6d5cff] to-[#a855f7]
                         text-white text-sm font-semibold
                         shadow-md shadow-violet-200
                         hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5
                         transition-all duration-200"
            >
              Generate Credit Score
              <ArrowUpRight size={16} />
            </a>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
