"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Download, GraduationCap, Award } from "lucide-react";
import { STATS } from "@/lib/constants";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export function About() {
  return (
    <section id="about" className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="absolute left-[20%] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(97,218,251,.08),transparent_70%)] blur-3xl" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">About Me</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em] leading-[1.1]">
            Building the future with <span className="text-[#61DAFB]">AI</span> and <span className="text-[#61DAFB]">code</span>.
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p className="text-white/45 text-lg leading-relaxed">
                BSAI undergraduate (5th Semester) and Governor&apos;s Initiative scholar
                with 1+ year of hands-on experience building Agentic AI systems,
                LLM-powered applications, and production-ready full-stack web apps.
              </p>
              <p className="text-white/45 text-lg leading-relaxed">
                Delivered 4 complete projects including 2 hackathon submissions and
                a live client website. Proficient in Python, TypeScript,
                Next.js, LangChain, LangGraph, and the OpenAI Agents SDK.
              </p>

              <a href="/Huzaifa_CV.pdf" download className="download-button mt-4 inline-block">
                <div className="docs">
                  <Download className="w-4 h-4" />
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em]">Download CV</span>
                </div>
                <div className="download">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="6 9 12 15 18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </a>
            </div>

            <div className="space-y-5">
              <div className="liquid-panel rounded-[2rem] p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-[1.2rem] bg-[#61DAFB]/10">
                    <GraduationCap className="w-6 h-6 text-[#61DAFB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      BSAI — SMI University Karachi
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      5th Semester | Expected Graduation: 2028
                    </p>
                  </div>
                </div>
              </div>

              <div className="liquid-panel rounded-[2rem] p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-[1.2rem] bg-[#61DAFB]/10">
                    <Award className="w-6 h-6 text-[#61DAFB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      AI, Web 3.0 & Metaverse Certification
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      Governor&apos;s Initiative — Batch 1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="liquid-panel rounded-[2rem] p-6 text-center"
              >
                <stat.icon className="w-7 h-7 text-[#61DAFB] mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">
                  <Counter target={stat.value} suffix={stat.suffix || ""} />
                </div>
                <div className="text-white/35 text-xs font-sans uppercase tracking-[0.15em] mt-2">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
