"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, GitCompare, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Compass, RotateCcw, Database
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { seedAPI } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#6d5cff", bg: "bg-violet-50" },
  { href: "/invoices", label: "Invoices", icon: FileText, color: "#14b8a6", bg: "bg-teal-50" },
  { href: "/reconciliation", label: "Reconciliation", icon: GitCompare, color: "#ec4899", bg: "bg-pink-50" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, color: "#f59e0b", bg: "bg-amber-50" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col
                 bg-white border-r border-slate-200 shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d5cff] via-[#14b8a6] to-[#0ea5e9] flex items-center justify-center flex-shrink-0 shadow-md">
          <Compass size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold gradient-text whitespace-nowrap"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GST Compass
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                            transition-colors group
                            ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={`absolute inset-0 rounded-xl ${item.bg} border`}
                    style={{ borderColor: `${item.color}30` }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={20}
                  className="relative z-10 flex-shrink-0"
                  style={isActive ? { color: item.color } : undefined}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-2 space-y-1">
        <AnimatePresence>
          {!collapsed && user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 py-2 mb-1">
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <p className="text-sm text-slate-700 font-medium truncate">{user.business_name}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={async () => {
            if (confirm("Are you sure you want to completely reset your dashboard? All data will be lost.")) {
              try {
                await seedAPI.resetDashboard();
                sessionStorage.setItem("data_reset", "true");
                toast("success", "Dashboard has been reset!");
                setTimeout(() => window.location.reload(), 1000);
              } catch {
                toast("error", "Failed to reset dashboard.");
              }
            }
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
        >
          <RotateCcw size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Reset Data
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex justify-center w-full pb-1">
          <button
            onClick={async () => {
              try {
                toast("info", "Loading dashboard data...");
                await seedAPI.seedDemo();
                toast("success", "Dashboard data loaded successfully!");
                setTimeout(() => window.location.reload(), 1000);
              } catch {
                toast("error", "Failed to load dashboard data.");
              }
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
            title="Load Dashboard Data"
          >
            <Database size={14} />
          </button>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
