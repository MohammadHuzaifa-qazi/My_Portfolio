"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { ThemeToggle } from "./ui/theme-toggle";
import { MovingBorderButton } from "./ui/moving-border-button";

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 438.549 438.549" fill="currentColor">
      <path d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 2.001 46.161-14.653 82.246-41.082 108.23-79.227 25.984-38.164 38.963-81.129 38.963-128.906 0-39.781-9.803-76.466-29.408-110.063z" />
    </svg>
  );
}

function GitHubBtn({ className }: { className?: string }) {
  return (
    <a href={SITE_CONFIG.github} target="_blank" rel="noopener noreferrer" className={className}>
      <MovingBorderButton duration={3000} className="px-4 py-2 h-10 text-sm font-medium flex items-center gap-2">
        <GitHubIcon />
        <span className="text-black dark:text-white">GitHub</span>
      </MovingBorderButton>
    </a>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hovered, setHovered] = useState<number | string | null>(null);
  const activeId = useScrollSpy(
    NAV_LINKS.map((l) => l.href.replace("#", "")),
    80
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 2 }}
        className="fixed inset-x-0 top-0 z-[60] px-4 py-4 md:px-8"
      >
        <div
          className={`liquid-panel mx-auto flex max-w-6xl items-center justify-between rounded-[2rem] px-6 py-4 transition-all duration-500 ${
            isScrolled ? "shadow-lg shadow-black/20" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-[1.4rem] border border-white/10 bg-white/[0.04]">
              <div className="h-5 w-5 rounded-full bg-[#61DAFB] shadow-[0_0_25px_rgba(97,218,251,0.6)]" />
            </div>
            <div>
              <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40">
                Portfolio
              </div>
              <a href="#home" className="text-sm text-white/70 hover:text-white transition-colors">
                {SITE_CONFIG.name}
              </a>
            </div>
          </div>

          <nav
            className="hidden items-center gap-8 lg:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_LINKS.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(index)}
                className={`relative font-sans text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 px-3 py-1.5 z-20 ${
                  activeId === link.href.replace("#", "")
                    ? "text-[#61DAFB]"
                    : hovered === index
                    ? "text-white"
                    : "text-white/80"
                }`}
              >
                {hovered === index && (
                  <motion.div
                    layoutId="hovered"
                    className="absolute inset-0 rounded-full bg-[#61DAFB]/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-20">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <GitHubBtn />
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-72 z-50 liquid-panel lg:hidden"
          >
            <div className="flex flex-col gap-2 p-8 pt-28" onMouseLeave={() => setHovered(null)}>
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onMouseEnter={() => setHovered(`mobile-${i}`)}
                  onClick={() => setIsOpen(false)}
                  className={`relative font-sans text-sm uppercase tracking-[0.15em] transition-colors duration-300 px-3 py-2 z-20 ${
                    activeId === link.href.replace("#", "")
                      ? "text-[#61DAFB]"
                      : hovered === `mobile-${i}`
                      ? "text-white"
                      : "text-white/40"
                  }`}
                >
                  {hovered === `mobile-${i}` && (
                    <motion.div
                      layoutId="hovered-mobile"
                      className="absolute inset-0 rounded-full bg-[#61DAFB]/10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20">{link.label}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
