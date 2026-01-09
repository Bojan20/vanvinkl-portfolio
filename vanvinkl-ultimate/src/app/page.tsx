"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { About } from "@/components/sections/About";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

// Dynamic import for SlotHero (client-side only, no SSR)
const SlotHero = dynamic(
  () => import("@/components/sections/SlotHero").then((mod) => mod.SlotHero),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-[var(--color-bg-deepest)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-1 h-12">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-[var(--color-accent)] rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="text-sm font-mono text-[var(--color-text-muted)]">
            Loading slot machine...
          </span>
        </div>
      </div>
    ),
  }
);

// Dynamic import for background 3D scene
const Scene = dynamic(() => import("@/components/3d/Scene").then((mod) => mod.Scene), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative">
      {/* Navigation */}
      <Navbar />

      {/* Scroll Progress Bar */}
      <ScrollProgress />

      {/* Slot Machine Hero */}
      <SlotHero />

      {/* Page Sections */}
      <Projects />
      <About />
      <Services />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}

// Scroll progress component
function ScrollProgress() {
  return (
    <div className="scroll-progress">
      <div
        className="scroll-progress-bar"
        style={{
          transform: "scaleX(var(--scroll-progress, 0))",
        }}
      />
    </div>
  );
}
