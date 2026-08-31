"use client";

import React from "react";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MovingBorder({
  children,
  borderRadius = "1.75rem",
  className,
  containerClassName,
  ...props
}: {
  children: React.ReactNode;
  borderRadius?: string;
  className?: string;
  containerClassName?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group relative animate-rainbow cursor-pointer border-0 bg-[linear-gradient(#05070b,#05070b),linear-gradient(#05070b_50%,rgba(5,7,11,0.6)_80%,rgba(5,7,11,0)),linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] bg-[length:200%] text-white [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(0,100%,63%),hsl(90,100%,63%),hsl(210,100%,63%),hsl(195,100%,63%),hsl(270,100%,63%))] before:[filter:blur(calc(0.8*1rem))] hover:scale-105 active:scale-95 transition-transform duration-200",
        containerClassName
      )}
      style={{
        borderRadius,
      }}
      {...props}
    >
      <div
        className={cn(
          "relative z-10 bg-[#05070b] rounded-[inherit]",
          className
        )}
        style={{
          margin: "1px",
          borderRadius: `calc(${borderRadius} - 1px)`,
        }}
      >
        {children}
      </div>
    </button>
  );
}
