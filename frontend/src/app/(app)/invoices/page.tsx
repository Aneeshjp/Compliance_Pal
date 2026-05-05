"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Search, Download, Trash2, CheckCircle, Eye } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { useInvoices, useUploadInvoice, useDeleteInvoice } from "@/lib/hooks/useInvoices";
import { useValidateBulk } from "@/lib/hooks/useReconciliation";
import { invoiceAPI } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, downloadBlob } from "@/lib/utils";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = useInvoices({ page, limit: 15, vendor: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined });
  const uploadMutation = useUploadInvoice();
  const deleteMutation = useDeleteInvoice();
  const validateBulk = useValidateBulk();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const fileArray = Array.from(files);
    
    await Promise.all(
      fileArray.map(async (file) => {
        try {
          await uploadMutation.mutateAsync(file);
          toast("success", `Uploaded: ${file.name}`);
        } catch {
          toast("error", `Failed to upload: ${file.name}`);
        }
      })
    );
    
    setUploading(false);
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleExportCSV = async () => {
    try {
      const res = await invoiceAPI.exportCSV();
      downloadBlob(res.data, "invoices_export.csv");
      toast("success", "CSV exported successfully");
    } catch {
      toast("error", "Export failed");
    }
  };

  return (
    <PageShell
      title="Invoices"
      subtitle="Upload, manage, and validate your invoices"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV} size="sm">
            <Download size={14} /> Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => validateBulk.mutate()}
            loading={validateBulk.isPending}
            size="sm"
          >
            <CheckCircle size={14} /> Validate All
          </Button>
        </div>
      }
    >
      {/* Upload Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`upload-zone p-8 mb-8 text-center cursor-pointer ${dragOver ? "drag-over" : ""}`}
        whileHover={{ scale: 1.01 }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".pdf,.jpg,.jpeg,.png";
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFiles(files);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-[#6d5cff]/20 rounded-full blur-xl animate-pulse" />
            
            {/* Document icon */}
            <FileText size={40} className="text-[#6d5cff] relative z-10" />

            {/* Scanning laser line */}
            <motion.div
              className="absolute left-2 right-2 h-0.5 bg-[#2dd4bf] shadow-[0_0_12px_2px_#2dd4bf] z-20"
              initial={{ top: "15%" }}
              animate={{ top: "85%" }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
            
            {/* Outer spinning rings */}
            <motion.div 
              className="absolute inset-0 rounded-full border border-dashed border-[#6d5cff]/60 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute -inset-2 rounded-full border border-dashed border-[#2dd4bf]/40 border-b-transparent"
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <motion.div whileHover={{ y: -4 }}>
            <Upload size={40} className="mx-auto text-[#6d5cff] mb-3" />
          </motion.div>
        )}
        <p className="text-sm text-slate-700 font-medium mb-1">
          {uploading ? "Extracting Data via OCR..." : "Drop invoice files here or click to upload"}
        </p>
        <p className="text-xs text-slate-500">
          Supports PDF, JPG, PNG — OCR will extract invoice data automatically
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5
                       text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 shadow-sm"
            aria-label="Search invoices"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5
                     text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 shadow-sm"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="valid">Valid</option>
          <option value="invalid">Invalid</option>
          <option value="matched">Matched</option>
          <option value="mismatch">Mismatch</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Invoice #</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">GST</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Validation</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Recon</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data?.invoices.map((inv, idx) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-[#6d5cff] font-medium">
                      {inv.invoice_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {inv.vendor_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono font-medium">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono font-medium">
                      {formatCurrency(inv.total_gst)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.validation_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.reconciliation_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteMutation.mutate(inv.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        aria-label={`Delete invoice ${inv.invoice_number}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && data?.invoices.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">No invoices found. Upload your first invoice above.</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-[#6d5cff] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Page {data.page} of {data.total_pages} • {data.total} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                disabled={page >= data.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
