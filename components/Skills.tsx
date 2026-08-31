"use client";

import { motion } from "framer-motion";
import { SKILLS } from "@/lib/constants";
import { Meteors } from "./ui/meteors";

export function Skills() {
  return (
    <section id="skills" className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">Expertise</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em]">
            Skills & <span className="text-[#61DAFB]">Technologies</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKILLS.map((skill, i) => (
              <motion.div
                key={skill.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="liquid-panel rounded-[2.5rem] p-8 group relative overflow-hidden"
              >
                <Meteors number={10} />

                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="p-3 rounded-[1.2rem] bg-[#61DAFB]/10 group-hover:bg-[#61DAFB]/15 transition-colors duration-300">
                    <skill.icon className="w-6 h-6 text-[#61DAFB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {skill.category}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 relative z-10">
                  {skill.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 text-xs rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 group-hover:border-[#61DAFB]/30 group-hover:text-white/70 transition-all duration-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
