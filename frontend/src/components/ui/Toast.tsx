"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  if (addToastFn) addToastFn(type, message);
}

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />,
  error: <XCircle size={18} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />,
  warning: <AlertTriangle size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />,
  info: <Info size={18} className="text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />,
};

const bgColors = {
  success: "border-emerald-500/20 bg-slate-900/90 shadow-[0_10px_40px_rgba(16,185,129,0.15)]",
  error: "border-rose-500/20 bg-slate-900/90 shadow-[0_10px_40px_rgba(244,63,94,0.15)]",
  warning: "border-amber-500/20 bg-slate-900/90 shadow-[0_10px_40px_rgba(245,158,11,0.15)]",
  info: "border-sky-500/20 bg-slate-900/90 shadow-[0_10px_40px_rgba(14,165,233,0.15)]",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 20, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl ${bgColors[t.type]}`}
          >
            <span className="mt-0.5 flex-shrink-0">{icons[t.type]}</span>
            <p className="text-sm text-slate-100 flex-1 font-medium tracking-wide">{t.message}</p>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
