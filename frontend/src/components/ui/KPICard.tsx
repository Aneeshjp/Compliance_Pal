"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

const variantStyles = {
  violet: {
    bg: "from-[#6d5cff]/20 via-[#6d5cff]/5 to-transparent",
    border: "border-[#6d5cff]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(109,92,255,0.4)]",
    iconColor: "text-[#6d5cff]",
    blob: "bg-[#6d5cff]",
    accent: "bg-gradient-to-r from-[#6d5cff] to-[#a855f7]",
  },
  sky: {
    bg: "from-[#38bdf8]/20 via-[#38bdf8]/5 to-transparent",
    border: "border-[#38bdf8]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(56,189,248,0.4)]",
    iconColor: "text-[#38bdf8]",
    blob: "bg-[#38bdf8]",
    accent: "bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf]",
  },
  teal: {
    bg: "from-[#14b8a6]/20 via-[#14b8a6]/5 to-transparent",
    border: "border-[#14b8a6]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)]",
    iconColor: "text-[#14b8a6]",
    blob: "bg-[#14b8a6]",
    accent: "bg-gradient-to-r from-[#14b8a6] to-[#34d399]",
  },
  rose: {
    bg: "from-[#f43f5e]/20 via-[#f43f5e]/5 to-transparent",
    border: "border-[#f43f5e]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(244,63,94,0.4)]",
    iconColor: "text-[#f43f5e]",
    blob: "bg-[#f43f5e]",
    accent: "bg-gradient-to-r from-[#f43f5e] to-[#fb923c]",
  },
  amber: {
    bg: "from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent",
    border: "border-[#f59e0b]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]",
    iconColor: "text-[#f59e0b]",
    blob: "bg-[#f59e0b]",
    accent: "bg-gradient-to-r from-[#f59e0b] to-[#fcd34d]",
  },
  lime: {
    bg: "from-[#84cc16]/20 via-[#84cc16]/5 to-transparent",
    border: "border-[#84cc16]/40",
    glow: "group-hover:shadow-[0_0_40px_-10px_rgba(132,204,22,0.4)]",
    iconColor: "text-[#84cc16]",
    blob: "bg-[#84cc16]",
    accent: "bg-gradient-to-r from-[#84cc16] to-[#4ade80]",
  },
};

interface KPICardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: keyof typeof variantStyles;
  className?: string;
}

export default function KPICard({
  title,
  icon,
  children,
  variant = "violet",
  className = "",
}: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative group rounded-[2rem] p-6 h-full border border-white/20
        bg-white/30 backdrop-blur-2xl overflow-hidden transition-all duration-500
        ${styles.glow} ${className}
      `}
      style={{
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4), 0 8px 32px rgba(0,0,0,0.04)"
      }}
    >
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Abstract Animated Blob */}
      <motion.div 
        className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${styles.blob} blur-[40px] opacity-20`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Decorative Accent Line */}
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${styles.accent} opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="relative z-10 flex flex-col h-full justify-between pl-2">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {title}
            </h3>
          </div>
          
          {/* Floating Icon */}
          <motion.div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/40 shadow-sm border border-white/50 backdrop-blur-md ${styles.iconColor}`}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
        
        <div className="relative">
          <div className={`text-xl lg:text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Glassy Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -translate-x-full group-hover:translate-x-full ease-out" />
    </motion.div>
  );
}
