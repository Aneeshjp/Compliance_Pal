import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "valid":
    case "matched":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "invalid":
    case "missing":
      return "text-red-400 bg-red-400/10 border-red-400/30";
    case "mismatch":
      return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "pending":
      return "text-slate-400 bg-slate-400/10 border-slate-400/30";
    case "extra_in_gst":
      return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    default:
      return "text-slate-400 bg-slate-400/10 border-slate-400/30";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "matched":
      return "Matched";
    case "mismatch":
      return "Mismatch";
    case "missing":
      return "Missing";
    case "extra_in_gst":
      return "Extra in GST";
    case "valid":
      return "Valid";
    case "invalid":
      return "Invalid";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
