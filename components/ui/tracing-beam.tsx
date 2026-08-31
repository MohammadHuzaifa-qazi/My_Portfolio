"use client";

import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className = "" }: TracingBeamProps) {
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001,
  });

  const beamHeight = useTransform(smoothProgress, [0, 1], ["0vh", "100vh"]);
  const dotY = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className={`relative ${className}`}>
      {children}

      {/* Fixed beam on RIGHT side - always visible while scrolling */}
      <div className="fixed right-2 md:right-6 top-0 h-screen w-8 md:w-10 pointer-events-none z-50 hidden md:block">
        {/* Background track line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-[1px] bg-white/[0.06]" />

        {/* Animated beam - grows from top to bottom */}
        <motion.div
          style={{ height: beamHeight }}
          className="absolute left-1/2 -translate-x-1/2 top-8 w-[2px] origin-top bg-gradient-to-b from-transparent via-[#61DAFB] to-[#61DAFB]"
        />

        {/* Glowing dot at the tip */}
        <motion.div
          style={{ top: dotY }}
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="relative">
            <div className="absolute -inset-2 w-7 h-7 bg-[#61DAFB]/20 rounded-full blur-md" />
            <div className="absolute inset-0 w-3 h-3 bg-[#61DAFB] rounded-full animate-ping opacity-40" />
            <div className="relative w-3 h-3 bg-[#61DAFB] rounded-full shadow-[0_0_20px_rgba(97,218,251,0.9)]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
