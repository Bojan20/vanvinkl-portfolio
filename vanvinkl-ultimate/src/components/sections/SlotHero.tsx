"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { SlotMachine } from "@/components/3d/SlotMachine";
import { TextReveal } from "@/components/ui/TextReveal";
import { useSlotAudio } from "@/hooks/useSlotAudio";

const SECTION_LABELS: Record<string, string> = {
  "#services": "Services",
  "#projects": "Projects",
  "#about": "About Me",
  "#contact": "Contact",
};

export function SlotHero() {
  const [result, setResult] = useState<{
    symbols: string[];
    isWin: boolean;
    section: string;
  } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const { playLever, playSpinLoop, playWin, playClick } = useSlotAudio();

  const handleSpin = useCallback(() => {
    setIsSpinning(true);
    setShowResult(false);
    setSpinCount((prev) => prev + 1);
    playLever();
    playSpinLoop(2500);
  }, [playLever, playSpinLoop]);

  const handleResult = useCallback(
    (res: { symbols: string[]; isWin: boolean; section: string }) => {
      setResult(res);
      setIsSpinning(false);
      setShowResult(true);

      if (res.isWin) {
        playWin();
      }

      // Auto-scroll to section after delay
      if (res.section) {
        setTimeout(() => {
          const element = document.querySelector(res.section);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 2500);
      }
    },
    [playWin]
  );

  const navigateToSection = (section: string) => {
    playClick();
    const element = document.querySelector(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[var(--color-bg-mid)] via-[var(--color-bg-deep)] to-[var(--color-bg-deepest)]" />

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={1}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />

            <SlotMachine onSpin={handleSpin} onResult={handleResult} />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top headline */}
        <div className="absolute top-20 left-0 right-0 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <TextReveal animation="wave" splitBy="chars">
                VanVinkl
              </TextReveal>
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] font-mono">
              Sound Wizard for Slot Games
            </p>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          className="absolute bottom-32 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isSpinning ? 0.3 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-[var(--color-text-muted)] font-mono mb-2">
            {spinCount === 0
              ? "Pull the lever or click SPIN to explore"
              : isSpinning
              ? "Spinning..."
              : "Spin again or scroll down"}
          </p>
          <motion.div
            className="flex justify-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-[var(--color-accent)]">↓</span>
          </motion.div>
        </motion.div>

        {/* Result popup */}
        <AnimatePresence>
          {showResult && result && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="bg-[var(--color-bg-surface)]/90 backdrop-blur-xl rounded-2xl p-8 border border-[var(--color-accent)]/30 text-center min-w-[300px]">
                {result.isWin ? (
                  <>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      🎰
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[var(--color-accent)] mb-2">
                      JACKPOT!
                    </h3>
                  </>
                ) : (
                  <div className="text-4xl mb-4">
                    {result.symbols.map((_, i) => (
                      <span key={i} className="mx-1">
                        {["🎵", "🎮", "🎬", "⭐", "🎹", "🎙️", "📧", "🧙"][
                          Math.floor(Math.random() * 8)
                        ]}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[var(--color-text-secondary)] mb-4">
                  Taking you to{" "}
                  <span className="text-[var(--color-accent)] font-bold">
                    {SECTION_LABELS[result.section] || "a section"}
                  </span>
                </p>

                <motion.button
                  className="px-6 py-2 bg-[var(--color-accent)] text-black font-bold rounded-full hover:bg-[var(--color-accent-light)] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToSection(result.section)}
                >
                  Go Now
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick navigation */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {Object.entries(SECTION_LABELS).map(([section, label]) => (
            <button
              key={section}
              onClick={() => navigateToSection(section)}
              className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors font-mono"
            >
              {label}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
