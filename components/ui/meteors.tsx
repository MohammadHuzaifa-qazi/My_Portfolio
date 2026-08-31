"use client";

import React, { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
}

export function Meteors({ number = 20 }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<Array<{ top: string; left: string; animationDelay: string; animationDuration: string }>>([]);

  useEffect(() => {
    const styles = Array.from({ length: number }, () => ({
      top: "0px",
      left: `${Math.floor(Math.random() * 100)}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.floor(Math.random() * 5 + 5)}s`,
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          className="absolute size-[0.125rem] rotate-[45deg] bg-gradient-to-b from-transparent via-[#61DAFB] to-transparent opacity-0 animate-meteor-effect"
          style={{
            top: style.top,
            left: style.left,
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration,
          }}
        >
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-[#61DAFB] to-transparent" />
        </span>
      ))}
    </>
  );
}
