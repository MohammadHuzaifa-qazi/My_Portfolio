"use client";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  );
}
