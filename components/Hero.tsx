"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ParticleBackground } from "./ui/particle";
import { AINetwork } from "./ui/ai-network";

export function Hero() {
  const [nameText, setNameText] = useState("");
  const [roleText, setRoleText] = useState("");
  const fullName = "Mohammad Huzaifa";
  const fullRole = "Agentic AI Engineer | Full-Stack Developer | Rag Based LLM Systems";

  useEffect(() => {
    let i = 0;
    let roleInterval: ReturnType<typeof setInterval>;
    const nameTimer = setInterval(() => {
      if (i <= fullName.length) {
        setNameText(fullName.slice(0, i));
        i++;
      } else {
        clearInterval(nameTimer);
        let j = 0;
        roleInterval = setInterval(() => {
          if (j <= fullRole.length) {
            setRoleText(fullRole.slice(0, j));
            j++;
          } else {
            clearInterval(roleInterval);
          }
        }, 35);
      }
    }, 90);
    return () => {
      clearInterval(nameTimer);
      clearInterval(roleInterval);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      <ParticleBackground />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-[10%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(97,218,251,.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-[5%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(120,255,180,.06),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
        {/* Left - Text Content */}
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.2 }}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 mb-8"
          >
            <div className="h-2 w-2 rounded-full bg-[#61DAFB] shadow-[0_0_15px_rgba(97,218,251,0.8)] animate-pulse-react" />
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/50">
              Available for opportunities
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.4 }}
            className="text-[#61DAFB] text-lg mb-4 font-sans tracking-wide"
          >
            Hi, I&apos;m
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]"
          >
            <span className="gradient-text">{nameText}</span>
            <span className="animate-[blink_1s_infinite] border-r-4 border-[#61DAFB] ml-1" />
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.8 }}
            className="text-xl md:text-2xl text-white/45 mb-10 h-8 font-light"
          >
            <span>{roleText}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 3.0 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <a href="#projects" className="dew rounded-[2rem] px-8 py-4 font-sans text-[12px] uppercase tracking-[0.2em] text-white text-center bg-transparent hover:bg-[rgb(46,167,192)] hover:shadow-[0_0_30px_5px_rgba(24,162,180,0.815)] transition-all duration-200">
              View Projects
            </a>
            <a href="#contact" className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-4 font-sans text-[12px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] hover:text-white text-center">
              Contact Me
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 3.2 }}
            className="mt-16 flex flex-wrap gap-5"
          >
            <div className="liquid-panel rounded-[1.8rem] px-6 py-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/35">Projects</div>
              <div className="mt-2 text-2xl font-semibold text-white">5+</div>
            </div>
            <div className="liquid-panel rounded-[1.8rem] px-6 py-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/35">Hackathons</div>
              <div className="mt-2 text-2xl font-semibold text-white">3</div>
            </div>
            <div className="liquid-panel rounded-[1.8rem] px-6 py-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/35">Repositories</div>
              <div className="mt-2 text-2xl font-semibold text-white">40+</div>
            </div>
          </motion.div>
        </div>

        {/* Right - AI Network Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="hidden lg:flex items-center justify-center"
        >
          <AINetwork />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a
          href="#about"
          className="flex flex-col items-center text-white/30 hover:text-[#61DAFB] transition-colors duration-300"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] mb-3 font-sans">Scroll 👇</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
