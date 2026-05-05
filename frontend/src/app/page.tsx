"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  FileText, Shield, GitCompare, Bot, BarChart3, Zap,
  ArrowRight, Compass, ChevronDown, Upload, Check, TrendingUp, IndianRupee,
} from "lucide-react";
import HeroAbstract from "@/components/ui/HeroAbstract";

const fadeSlide = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <div className="bg-white overflow-x-hidden">
      {/* ─── Navbar ───────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6d5cff] to-[#a855f7] flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              GST Compass
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link href="/auth/register" className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-[#6d5cff] to-[#a855f7] hover:shadow-lg hover:shadow-violet-200 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <HeroAbstract />

        <motion.div style={{ y: heroY, scale: heroScale }} className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-8"
          >
            <Zap size={14} className="text-violet-500" /> Built for Indian MSMEs
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.08] mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Never Lose{" "}
            <span className="bg-gradient-to-r from-[#6d5cff] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
              ITC
            </span>
            <br />
            to Invoice Errors
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Upload, validate, reconcile, and get AI insights on your GST invoices — all from one beautiful dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              href="/auth/register"
              className="group px-8 py-3.5 text-base font-semibold text-white rounded-2xl
                         bg-gradient-to-r from-[#6d5cff] to-[#a855f7]
                         hover:shadow-xl hover:shadow-violet-200 transition-all flex items-center gap-2"
            >
              Start for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3.5 text-base font-semibold text-slate-700 rounded-2xl border-2 border-slate-200
                         hover:border-violet-300 hover:text-violet-700 transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-300"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ─── How It Works — 3-Step ────────────────────── */}
      <AnimatedSection className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeSlide} custom={0} className="text-center mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Three Steps. Zero Hassle.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Upload, title: "Upload Invoices", desc: "Drop PDFs, images, or photos. Our OCR handles the rest.", color: "#6d5cff", bg: "bg-violet-50" },
              { step: "02", icon: Shield, title: "Auto-Validate", desc: "8 compliance rules check GSTIN, tax math, rates, and duplicates.", color: "#14b8a6", bg: "bg-teal-50" },
              { step: "03", icon: GitCompare, title: "Reconcile & Claim", desc: "Match against GSTR-2B. Know your ITC claimable instantly.", color: "#ec4899", bg: "bg-pink-50" },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeSlide}
                custom={i + 1}
                className={`relative p-8 rounded-3xl ${s.bg} border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <span className="text-6xl font-black text-slate-100 absolute top-4 right-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.step}
                </span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm" style={{ backgroundColor: `${s.color}18` }}>
                  <s.icon size={28} style={{ color: s.color }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Bento Feature Grid ───────────────────────── */}
      <AnimatedSection className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeSlide} custom={0} className="text-center mb-16">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything in One Place
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">
            {/* AI Assistant — large */}
            <motion.div variants={fadeSlide} custom={1} className="md:col-span-2 md:row-span-2 p-8 rounded-3xl bg-gradient-to-br from-[#6d5cff] to-[#a855f7] text-white flex flex-col justify-end group hover:shadow-2xl hover:shadow-violet-200 transition-all">
              <Bot size={40} className="mb-4 opacity-80 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI Assistant</h3>
              <p className="text-white/70 text-sm">Ask questions about your GST data. Get instant, context-aware answers powered by Google Gemini.</p>
            </motion.div>

            {/* Analytics */}
            <motion.div variants={fadeSlide} custom={2} className="md:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 flex items-center gap-5 group hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={28} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Real-Time Analytics</h3>
                <p className="text-sm text-slate-500">Monthly trends, vendor breakdown, ITC efficiency — live charts for everything.</p>
              </div>
            </motion.div>

            {/* OCR */}
            <motion.div variants={fadeSlide} custom={3} className="p-6 rounded-3xl bg-teal-50 border border-teal-100 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all">
              <FileText size={24} className="text-teal-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Smart OCR</h3>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG</p>
              </div>
            </motion.div>

            {/* Validation */}
            <motion.div variants={fadeSlide} custom={4} className="p-6 rounded-3xl bg-pink-50 border border-pink-100 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all">
              <Check size={24} className="text-pink-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>8 Rules</h3>
                <p className="text-xs text-slate-500 mt-1">Full GST check</p>
              </div>
            </motion.div>

            {/* ITC */}
            <motion.div variants={fadeSlide} custom={5} className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white flex items-center gap-5 group hover:shadow-xl hover:shadow-teal-200 transition-all">
              <IndianRupee size={36} className="opacity-80" />
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ITC Recovery</h3>
                <p className="text-sm text-white/70">See exactly how much you can claim and what&apos;s at risk, vendor by vendor.</p>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeSlide} custom={6} className="md:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 flex items-center justify-around group hover:shadow-lg transition-all">
              {[
                { val: "50K+", label: "Invoices", cl: "text-violet-600" },
                { val: "Rs 2.3Cr", label: "ITC Saved", cl: "text-teal-600" },
                { val: "99.2%", label: "Accuracy", cl: "text-pink-600" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className={`text-2xl font-bold ${s.cl}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.val}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6">
        <AnimatedSection>
          <motion.div variants={fadeSlide} custom={0} className="max-w-3xl mx-auto text-center">
            <div className="relative p-14 rounded-[2rem] bg-gradient-to-br from-[#6d5cff] via-[#a855f7] to-[#ec4899] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Ready to Reclaim Your ITC?
                </h2>
                <p className="text-white/70 text-lg mb-8">
                  Join thousands of Indian businesses saving time and money on GST compliance.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold text-violet-700 bg-white rounded-2xl
                             hover:shadow-xl transition-all"
                >
                  Get Started Free <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>GST Compass &copy; 2025</span>
          <span className="text-slate-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>v1.0</span>
        </div>
      </footer>
    </div>
  );
}
