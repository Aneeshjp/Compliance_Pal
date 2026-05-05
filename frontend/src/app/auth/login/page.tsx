"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Compass, ArrowRight, Sparkles, Shield, FileText } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

const floatingCards = [
  { icon: Shield, label: "GSTIN Verified", color: "#22c55e", delay: 0, x: 20, y: 30 },
  { icon: FileText, label: "12 Invoices", color: "#6d5cff", delay: 0.5, x: 60, y: 55 },
  { icon: Sparkles, label: "AI Insights", color: "#f59e0b", delay: 1, x: 30, y: 75 },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast("success", "Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed. Please check your credentials.";
      toast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Vibrant Showcase ─────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7]">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 40% 80%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(236,72,153,0.4) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          />
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 80% 50%, rgba(14,165,233,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 80%, rgba(14,165,233,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 60% 20%, rgba(14,165,233,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(14,165,233,0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          />
        </div>

        {/* Floating notification cards */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your GST Compliance,
              <br />
              <span className="text-yellow-300">Simplified.</span>
            </h2>
            <p className="text-white/70 text-lg max-w-sm mx-auto">
              AI-powered invoice processing, validation, and ITC reconciliation in one dashboard.
            </p>
          </motion.div>

          {/* Floating cards */}
          <div className="relative w-80 h-56">
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { delay: card.delay + 0.5, duration: 0.5 },
                  scale: { delay: card.delay + 0.5, duration: 0.5 },
                  y: { delay: card.delay + 1, duration: 3, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/20 shadow-lg"
                style={{ left: `${card.x}%`, top: `${card.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}30` }}>
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
                <span className="text-white text-sm font-medium whitespace-nowrap">{card.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex gap-8 mt-8"
          >
            {[
              { val: "99.2%", label: "Accuracy" },
              { val: "50K+", label: "Invoices" },
              { val: "85%", label: "Time Saved" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.val}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Right Panel — Login Form ──────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Back to landing */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-violet-600 transition-colors mb-6 group">
            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d5cff] to-[#a855f7] flex items-center justify-center shadow-md shadow-violet-200">
              <Compass size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              GST Compass
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Sign in
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-violet-50/50 border border-violet-100 rounded-xl pl-11 pr-4 py-3
                             text-sm text-slate-800 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 focus:bg-white transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-violet-50/50 border border-violet-100 rounded-xl pl-11 pr-11 py-3
                             text-sm text-slate-800 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 focus:bg-white transition-all"
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !rounded-xl !py-3" size="lg">
              Sign In <ArrowRight size={16} />
            </Button>


          </form>

          <p className="text-sm text-slate-500 text-center mt-8">
            No account?{" "}
            <Link href="/auth/register" className="text-violet-600 hover:text-violet-800 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
