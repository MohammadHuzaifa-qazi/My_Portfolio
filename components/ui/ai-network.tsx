"use client";

import { motion } from "framer-motion";

const nodes = [
  { x: 200, y: 80, size: 8, delay: 0 },
  { x: 320, y: 140, size: 6, delay: 0.2 },
  { x: 280, y: 220, size: 10, delay: 0.4 },
  { x: 160, y: 180, size: 7, delay: 0.6 },
  { x: 380, y: 60, size: 5, delay: 0.8 },
  { x: 100, y: 120, size: 9, delay: 1.0 },
  { x: 350, y: 200, size: 6, delay: 1.2 },
  { x: 240, y: 280, size: 8, delay: 0.3 },
  { x: 80, y: 240, size: 5, delay: 0.7 },
  { x: 400, y: 280, size: 7, delay: 0.9 },
  { x: 180, y: 300, size: 6, delay: 1.1 },
  { x: 320, y: 320, size: 8, delay: 0.5 },
];

const connections = [
  [0, 1], [0, 3], [1, 2], [1, 4], [2, 3], [2, 7],
  [3, 5], [3, 8], [4, 6], [5, 8], [6, 9], [7, 10],
  [7, 11], [9, 11], [10, 11], [0, 5], [2, 6],
];

const dataParticles = [
  { path: [0, 1, 2, 7], delay: 0 },
  { path: [5, 3, 2, 6], delay: 1.5 },
  { path: [8, 10, 11, 9], delay: 3 },
  { path: [4, 1, 0, 5], delay: 4.5 },
];

export function AINetwork() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      <svg
        viewBox="0 0 480 380"
        className="w-full h-full"
        fill="none"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#61DAFB" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#61DAFB" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#61DAFB" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Connections */}
        {connections.map(([from, to], i) => (
          <motion.line
            key={`line-${i}`}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size * 3}
              fill="url(#nodeGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.4, 0.2, 0.4],
                scale: [0, 1, 0.9, 1],
              }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="#61DAFB"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: node.delay }}
            />
          </g>
        ))}

        {/* Data particles traveling along paths */}
        {dataParticles.map((particle, i) => (
          <motion.circle
            key={`particle-${i}`}
            r="3"
            fill="#fff"
            filter="url(#particleGlow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              cx: particle.path.map((idx) => nodes[idx].x),
              cy: particle.path.map((idx) => nodes[idx].y),
            }}
            transition={{
              duration: 4,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Central brain/core node */}
        <motion.circle
          cx="240"
          cy="180"
          r="40"
          fill="none"
          stroke="#61DAFB"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.05, 0.95],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.circle
          cx="240"
          cy="180"
          r="25"
          fill="rgba(97, 218, 251, 0.1)"
          stroke="#61DAFB"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        {/* Pulse rings */}
        {[1, 2, 3].map((ring) => (
          <motion.circle
            key={`ring-${ring}`}
            cx="240"
            cy="180"
            r={50 + ring * 25}
            fill="none"
            stroke="#61DAFB"
            strokeWidth="0.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4,
              delay: ring * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Floating labels */}
      <motion.div
        className="absolute top-4 right-4 liquid-panel rounded-[1.2rem] px-4 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#61DAFB] animate-pulse-react" />
          <div className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/30">System Status</div>
        </div>
        <div className="text-[11px] font-semibold text-white/80">Neural Network</div>
        <div className="text-[10px] text-[#61DAFB]">Operational</div>
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-4 liquid-panel rounded-[1.2rem] px-4 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#78FFB4] animate-pulse-react" />
          <div className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/30">Agent Type</div>
        </div>
        <div className="text-[11px] font-semibold text-white/80">LangGraph</div>
        <div className="text-[10px] text-[#78FFB4]">Orchestration</div>
      </motion.div>

      <motion.div
        className="absolute top-1/3 -left-2 liquid-panel rounded-[1.2rem] px-4 py-3"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 3.5, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#FFB86C] animate-pulse-react" />
          <div className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/30">LLM Provider</div>
        </div>
        <div className="text-[11px] font-semibold text-white/80">OpenAI</div>
        <div className="text-[10px] text-[#FFB86C]">GPT-4 Active</div>
      </motion.div>

      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 liquid-panel rounded-[1.2rem] px-4 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[#BD93F9] animate-pulse-react" />
          <div className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/30">Tool Calling</div>
        </div>
        <div className="text-[11px] font-semibold text-white/80">7 Tools</div>
        <div className="text-[10px] text-[#BD93F9]">Ready</div>
      </motion.div>
    </div>
  );
}
