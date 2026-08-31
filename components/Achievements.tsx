"use client";

import { motion } from "framer-motion";
import { ACHIEVEMENTS } from "@/lib/constants";

export function Achievements() {
  return (
    <section id="achievements" className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="absolute left-[30%] top-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(97,218,251,.06),transparent_70%)] blur-3xl" />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">Recognition</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em]">
            Achievements & <span className="text-[#61DAFB]">Certifications</span>
          </h2>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#61DAFB]/30 via-white/10 to-transparent" />

            {ACHIEVEMENTS.map((achievement, i) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative flex items-start gap-8 mb-8 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="hidden md:block md:w-1/2" />

                <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-[#61DAFB] border-4 border-[#05070b] -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(97,218,251,0.5)]" />

                <div className="ml-12 md:ml-0 md:w-1/2 liquid-panel rounded-[2rem] p-6">
                  <div className="text-xs font-sans text-[#61DAFB] uppercase tracking-[0.15em] mb-2">
                    {achievement.date}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {achievement.title}
                  </h3>
                  <p className="text-white/40 text-sm">
                    {achievement.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
