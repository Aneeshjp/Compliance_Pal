"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, Download, Play, ChevronDown, ChevronUp } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import KPICard from "@/components/ui/KPICard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StatusBadge from "@/components/ui/StatusBadge";
import StatusPieChart from "@/components/charts/StatusPieChart";
import Button from "@/components/ui/Button";
import {
  useReconciliationResults,
  useReconciliationRunDetail,
  useRunReconciliation,
  useITCSummary,
} from "@/lib/hooks/useReconciliation";
import { reconcileAPI } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { formatCurrency, downloadBlob } from "@/lib/utils";

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function ReconciliationPage() {
  const { data: resultsData } = useReconciliationResults();
  const { data: itcSummary } = useITCSummary();
  const runRecon = useRunReconciliation();
  const run = resultsData?.run;
  const { data: runDetail } = useReconciliationRunDetail(run?.run_id ?? "");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleRun = async () => {
    try {
      await runRecon.mutateAsync();
      toast("success", "Reconciliation completed!");
    } catch {
      toast("error", "Reconciliation failed.");
    }
  };

  const handleExport = async () => {
    try {
      const res = await reconcileAPI.exportCSV();
      downloadBlob(res.data, "reconciliation_export.csv");
      toast("success", "CSV exported");
    } catch {
      toast("error", "Export failed");
    }
  };

  const results = runDetail?.results ?? [];

  return (
    <PageShell
      title="ITC Reconciliation"
      subtitle="Match invoices against GST records and track ITC"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
          <Button variant="primary" size="sm" loading={runRecon.isPending} onClick={handleRun}>
            <Play size={14} /> Run Reconciliation
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="ITC Claimable" variant="teal">
          <AnimatedCounter value={itcSummary?.total_itc_claimable ?? 0} formatter={fmt} />
        </KPICard>
        <KPICard title="ITC at Risk" variant="rose">
          <AnimatedCounter value={itcSummary?.total_itc_at_risk ?? 0} formatter={fmt} />
        </KPICard>
        <KPICard title="Efficiency" variant="violet">
          <AnimatedCounter value={itcSummary?.itc_efficiency_rate ?? 0} suffix="%" formatter={(n) => n.toFixed(1)} />
        </KPICard>
        <KPICard title="Invoices" variant="sky">
          <AnimatedCounter value={run?.total_invoices ?? 0} />
        </KPICard>
      </div>

      {/* Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatusPieChart matched={run?.matched_count ?? 0} mismatch={run?.mismatch_count ?? 0} missing={run?.missing_count ?? 0} />
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Run Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Matched", val: run?.matched_count ?? 0, cl: "text-emerald-400" },
              { label: "Mismatch", val: run?.mismatch_count ?? 0, cl: "text-amber-400" },
              { label: "Missing", val: run?.missing_count ?? 0, cl: "text-red-400" },
              { label: "Extra in GST", val: run?.extra_in_gst_count ?? 0, cl: "text-blue-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">{item.label}</span>
                <span className={`text-lg font-bold ${item.cl}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="w-8 px-4 py-3" />
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Invoice #</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Vendor</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Inv GST</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Record GST</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">ITC</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {results.map((r: Record<string, unknown>, idx: number) => {
                  const id = (r.id || r._id || String(idx)) as string;
                  const isExp = expandedRow === id;
                  const status = r.match_status as string;
                  const bg = status === "matched" ? "bg-emerald-50/30" : status === "mismatch" ? "bg-amber-50/30" : status === "missing" ? "bg-rose-50/30" : "";
                  const disc = r.discrepancy_details as { field: string; invoice_value: number; gst_record_value: number; difference: number } | null;
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${bg}`}
                      onClick={() => setExpandedRow(isExp ? null : id)}
                    >
                      <td className="px-4 py-3">{isExp ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}</td>
                      <td className="px-4 py-3 text-sm font-mono text-violet-600 font-medium">{(r.invoice_number as string) || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">{(r.vendor_name as string) || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm text-slate-800 text-right font-mono">{formatCurrency((r.invoice_gst as number) ?? 0)}</td>
                      <td className="px-4 py-3 text-sm text-slate-800 text-right font-mono">{formatCurrency((r.gst_record_gst as number) ?? 0)}</td>
                      <td className="px-4 py-3 text-sm text-teal-600 text-right font-mono font-bold">{formatCurrency((r.itc_claimable as number) ?? 0)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3 text-center text-sm font-mono text-slate-500">{(((r.confidence_score as number) ?? 0) * 100).toFixed(0)}%</td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {results.length === 0 && (
          <div className="py-16 text-center">
            <GitCompare size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">No results yet. Click &quot;Run Reconciliation&quot; to start.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
