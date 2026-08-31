"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  duration = 3000,
  rx = 9999,
  ry = 9999,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  rx?: number;
  ry?: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const pathRef = useRef<SVGRectElement>(null);
  const progressX = useMotionValue(0);
  const progressY = useMotionValue(0);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useAnimationFrame((time) => {
    const current = pathRef.current;
    if (!current) return;
    const len = current.getTotalLength();
    if (!len) return;
    const pxPerMs = len / duration;
    const totalDist = (time % duration) * pxPerMs;
    const point = current.getPointAtLength(totalDist);
    progressX.set(point.x);
    progressY.set(point.y);
  });

  const transform = useMotionTemplate`translate(${progressX}px, ${progressY}px) translate(-50%, -50%)`;

  return (
    <button
      className={cn(
        "group relative rounded-full p-[1px] overflow-hidden cursor-pointer bg-transparent",
        containerClassName
      )}
      {...props}
    >
      {/* Hidden SVG for path measurement */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          ref={pathRef}
          className="fill-transparent"
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
        />
      </svg>

      {/* Glowing dot traveling along the border */}
      <motion.div
        className="absolute z-0 pointer-events-none h-16 w-16"
        style={{
          transform,
        }}
      >
        <div className="h-full w-full bg-[radial-gradient(circle,#0ea5e9_0%,transparent_60%)]" />
      </motion.div>

      {/* Inner content layer */}
      <div
        className={cn(
          "relative z-10 rounded-full bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800",
          className
        )}
      >
        {children}
      </div>
    </button>
  );
}
