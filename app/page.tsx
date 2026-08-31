"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { Achievements } from "@/components/Achievements";
import { GitHubStats } from "@/components/GitHubStats";
import { Contact } from "@/components/Contact";
import { TracingBeam } from "@/components/ui/tracing-beam";

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <Navbar />
      <TracingBeam className="px-6 md:px-12">
        <main className="relative z-10">
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Achievements />
          <GitHubStats />
          <Contact />
        </main>
        <footer className="relative py-12 px-6 md:px-12 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[1.2rem] border border-white/10 bg-white/[0.04]">
                <div className="h-4 w-4 rounded-full bg-[#61DAFB] shadow-[0_0_20px_rgba(97,218,251,0.5)]" />
              </div>
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/35">
                Mohammad Huzaifa
              </span>
            </div>
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/25">
              © {new Date().getFullYear()} Built with Next.js & Tailwind CSS
            </p>
          </div>
        </footer>
      </TracingBeam>
    </>
  );
}
