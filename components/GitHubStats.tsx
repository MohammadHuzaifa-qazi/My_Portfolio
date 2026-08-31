"use client";

import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/lib/constants";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

const contributionData = [
  [3, 0, 2, 4, 1, 0, 3],
  [0, 1, 3, 0, 2, 4, 1],
  [2, 4, 0, 1, 3, 0, 2],
  [1, 0, 4, 2, 0, 3, 1],
  [4, 2, 1, 0, 3, 1, 4],
];

function getIntensity(level: number) {
  if (level === 0) return "bg-white/[0.04]";
  if (level === 1) return "bg-[#61DAFB]/20";
  if (level === 2) return "bg-[#61DAFB]/40";
  if (level === 3) return "bg-[#61DAFB]/60";
  return "bg-[#61DAFB]/80";
}

export function GitHubStats() {
  return (
    <section className="relative py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.3em] text-white/35 mb-6">Open Source</div>
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-[-0.04em]">
            GitHub <span className="text-[#61DAFB]">Stats</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="liquid-panel rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-[1.2rem] bg-[#61DAFB]/10">
                  <GitHubIcon className="w-8 h-8 text-[#61DAFB]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {SITE_CONFIG.github.split("/").pop()}
                  </h3>
                  <p className="text-white/40 text-sm">
                    Open Source Contributor
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/45 font-sans text-[11px] uppercase tracking-[0.1em]">Repositories</span>
                    <span className="text-white font-medium">10+</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "70%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-[#61DAFB]/60 to-[#61DAFB] rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/45 font-sans text-[11px] uppercase tracking-[0.1em]">Contributions</span>
                    <span className="text-white font-medium">150+</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "60%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-[#61DAFB]/60 to-[#61DAFB] rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/45 font-sans text-[11px] uppercase tracking-[0.1em]">Stars</span>
                    <span className="text-white font-medium">5+</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "30%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-[#61DAFB]/60 to-[#61DAFB] rounded-full"
                    />
                  </div>
                </div>
              </div>

              <a
                href={SITE_CONFIG.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-[#61DAFB] font-sans text-[11px] uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
              >
                View Profile →
              </a>
            </div>

            <div className="liquid-panel rounded-[2.5rem] p-8">
              <h3 className="font-bold text-white mb-6 text-lg">
                Contribution Activity
              </h3>

              <div className="grid gap-1.5">
                {contributionData.map((week, i) => (
                  <div key={i} className="flex gap-1.5">
                    {week.map((level, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (i * 7 + j) * 0.02 }}
                        className={`w-5 h-5 rounded-[4px] ${getIntensity(level)} transition-all duration-300 hover:ring-1 hover:ring-[#61DAFB]/50`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 text-[10px] font-sans uppercase tracking-[0.1em] text-white/30">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`w-3.5 h-3.5 rounded-[3px] ${getIntensity(level)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
