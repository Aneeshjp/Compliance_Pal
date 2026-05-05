"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Building2, CreditCard, Eye, EyeOff, Compass, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    business_name: "",
    gstin: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        business_name: formData.business_name,
        gstin: formData.gstin || undefined,
      });
      toast("success", "Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed. Please try again.";
      toast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-violet-50/50 border border-violet-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 focus:bg-white transition-all";

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Gradient ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#14b8a6] via-[#0ea5e9] to-[#6d5cff]">
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 30% 40%, rgba(251,191,36,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 70%, rgba(251,191,36,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 40%, rgba(251,191,36,0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Join <span className="text-yellow-300">50,000+</span>
              <br />Indian Businesses
            </h2>
            <p className="text-white/70 text-lg max-w-sm mx-auto mb-10">
              Create your free account and start claiming every rupee of ITC you deserve.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-2 gap-4 max-w-xs"
          >
            {[
              { val: "Free", label: "To Start" },
              { val: "2 min", label: "Setup" },
              { val: "99.2%", label: "Accuracy" },
              { val: "85%", label: "Time Saved" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <p className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.val}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Right Panel — Register Form ───────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-600 transition-colors mb-6 group">
            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0ea5e9] flex items-center justify-center shadow-md shadow-teal-200">
              <Compass size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              GST Compass
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create Account
          </h2>
          <p className="text-slate-500 text-sm mb-6">Start managing your GST compliance</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
                <input id="register-business" type="text" value={formData.business_name} onChange={(e) => update("business_name", e.target.value)}
                  className={inputClass} placeholder="Acme Technologies Pvt Ltd" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
                <input id="register-email" type="email" value={formData.email} onChange={(e) => update("email", e.target.value)}
                  className={inputClass} placeholder="you@company.com" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">GSTIN <span className="text-slate-400">(optional)</span></label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
                <input id="register-gstin" type="text" value={formData.gstin} onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                  className={`${inputClass} font-mono`} placeholder="29AADCB2230M1ZV" maxLength={15} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
                <input id="register-password" type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={`${inputClass} !pr-11`} placeholder="Min. 8 characters" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full !rounded-xl !py-3 mt-2" size="lg">
              Create Account <ArrowRight size={16} />
            </Button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-teal-600 hover:text-teal-800 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
