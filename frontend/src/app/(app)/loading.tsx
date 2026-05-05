"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        {/* Outer Orbital Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-transparent border-t-[#6d5cff] border-r-[#6d5cff]"
          style={{ opacity: 0.8 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
        />
        
        {/* Middle Orbital Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-transparent border-b-[#14b8a6] border-l-[#14b8a6]"
          style={{ opacity: 0.8 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
        
        {/* Inner Pulsing Abstract Core */}
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-[#6d5cff] via-[#14b8a6] to-[#0ea5e9] shadow-lg shadow-[#6d5cff]/30"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ["30%", "50%", "30%"]
          }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-sm font-medium text-slate-500 tracking-widest uppercase"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Loading
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >...</motion.span>
      </motion.p>
    </div>
  );
}
