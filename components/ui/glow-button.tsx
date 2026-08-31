"use client";

import { cn } from "@/lib/utils";

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
  className?: string;
}

export function GlowButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
}: GlowButtonProps) {
  const baseStyles =
    "relative px-8 py-3 rounded-lg font-semibold transition-all duration-300 cursor-pointer";

  const variants = {
    primary:
      "bg-accent text-[#0a0f1c] hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]",
    outline:
      "border-2 border-accent text-accent hover:bg-accent hover:text-[#0a0f1c] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]",
  };

  const classes = cn(baseStyles, variants[variant], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
