"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  valid: { label: "Valid", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  invalid: { label: "Invalid", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  matched: { label: "Matched", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  mismatch: { label: "Mismatch", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  missing: { label: "Missing", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        config.bg,
        config.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
