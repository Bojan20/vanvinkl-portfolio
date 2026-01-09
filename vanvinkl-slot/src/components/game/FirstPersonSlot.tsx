"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

interface FirstPersonSlotProps {
  machineId: string;
  onResult: (section: string, isWin: boolean) => void;
  onSpinStart: () => void;
  onBack: () => void;
}

// Machine-specific configurations
const MACHINE_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  symbols: { icon: string; label: string }[];
  jackpotLabel: string;
}> = {
  projects: {
    title: "PROJECTS",
    subtitle: "Game Portfolio",
    description: "Spin to explore my slot game audio work",
    color: "#40c8ff",
    symbols: [
      { icon: "🎮", label: "Games" },
      { icon: "🎰", label: "Slots" },
      { icon: "💎", label: "Premium" },
      { icon: "🃏", label: "Cards" },
      { icon: "⭐", label: "Featured" },
      { icon: "🏆", label: "Awards" },
    ],
    jackpotLabel: "UNLOCK FULL PORTFOLIO",
  },
  services: {
    title: "SERVICES",
    subtitle: "What I Offer",
    description: "Spin to discover my audio services",
    color: "#ff7a3b",
    symbols: [
      { icon: "🎵", label: "SFX" },
      { icon: "🎚️", label: "Mixing" },
      { icon: "🎛️", label: "Mastering" },
      { icon: "🔊", label: "Sound" },
      { icon: "🎧", label: "Audio" },
      { icon: "🎼", label: "Music" },
    ],
    jackpotLabel: "VIEW ALL SERVICES",
  },
  about: {
    title: "ABOUT",
    subtitle: "The Sound Wizard",
    description: "Spin to learn my story",
    color: "#a855f7",
    symbols: [
      { icon: "🧙", label: "Wizard" },
      { icon: "7️⃣", label: "Lucky" },
      { icon: "🍀", label: "Fortune" },
      { icon: "🎲", label: "Chance" },
      { icon: "✨", label: "Magic" },
      { icon: "🌟", label: "Star" },
    ],
    jackpotLabel: "READ FULL BIO",
  },
  contact: {
    title: "CONTACT",
    subtitle: "Get In Touch",
    description: "Spin to reach out",
    color: "#22c55e",
    symbols: [
      { icon: "📧", label: "Email" },
      { icon: "💬", label: "Chat" },
      { icon: "📞", label: "Call" },
      { icon: "🌐", label: "Web" },
      { icon: "✉️", label: "Message" },
      { icon: "🤝", label: "Connect" },
    ],
    jackpotLabel: "OPEN CONTACT FORM",
  },
  showreel: {
    title: "SHOWREEL",
    subtitle: "Watch & Listen",
    description: "Spin to play my demo reel",
    color: "#eab308",
    symbols: [
      { icon: "🎬", label: "Video" },
      { icon: "🎥", label: "Film" },
      { icon: "🎞️", label: "Reel" },
      { icon: "📽️", label: "Project" },
      { icon: "🏆", label: "Best" },
      { icon: "▶️", label: "Play" },
    ],
    jackpotLabel: "PLAY SHOWREEL",
  },
};

export function FirstPersonSlot({ machineId, onResult, onSpinStart, onBack }: FirstPersonSlotProps) {
  const config = MACHINE_CONFIG[machineId] || MACHINE_CONFIG.projects;
  const machineRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  const [isSpinning, setIsSpinning] = useState(false);

  // Extended symbols for looping
  const extendedSymbols = [...config.symbols, ...config.symbols, ...config.symbols, ...config.symbols, ...config.symbols];

  const spin = useCallback(() => {
    if (isSpinning) return;

    setIsSpinning(true);
    onSpinStart();

    // Screen shake
    gsap.to(machineRef.current, {
      x: "random(-3, 3)",
      y: "random(-2, 2)",
      duration: 0.05,
      repeat: 30,
      yoyo: true,
      ease: "none",
    });

    const newResults = [
      Math.floor(Math.random() * config.symbols.length),
      Math.floor(Math.random() * config.symbols.length),
      Math.floor(Math.random() * config.symbols.length),
    ];

    stripRefs.current.forEach((strip, i) => {
      if (!strip) return;

      const symbolHeight = 100;
      const spins = 3 + i;
      const targetPosition = -(newResults[i] * symbolHeight + spins * config.symbols.length * symbolHeight);

      gsap.set(strip, { y: 0 });

      gsap.to(strip, {
        y: targetPosition,
        duration: 1.5 + i * 0.4,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(strip, {
            y: targetPosition + 12,
            duration: 0.1,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          });

          gsap.to(reelRefs.current[i], {
            y: 2,
            duration: 0.05,
            yoyo: true,
            repeat: 1,
          });

          if (i === 2) {
            setTimeout(() => {
              const isWin = newResults[0] === newResults[1] && newResults[1] === newResults[2];
              onResult(machineId, isWin);
              setIsSpinning(false);
            }, 200);
          }
        },
      });
    });
  }, [isSpinning, onResult, onSpinStart, machineId, config.symbols.length]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpinning) {
        e.preventDefault();
        spin();
      }
      if (e.code === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpinning, spin, onBack]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Background - Dark with machine color glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, ${config.color}15 0%, transparent 50%),
            linear-gradient(180deg, #0a0a12 0%, #050508 100%)
          `,
        }}
      />

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              background: config.color,
              opacity: 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main slot machine screen */}
      <div
        ref={machineRef}
        className="relative z-10"
        style={{
          width: "700px",
          maxWidth: "95vw",
        }}
      >
        {/* Machine frame */}
        <div
          className="rounded-3xl p-1"
          style={{
            background: `linear-gradient(145deg, ${config.color}40, ${config.color}10)`,
            boxShadow: `
              0 0 60px ${config.color}30,
              0 30px 60px rgba(0,0,0,0.8)
            `,
          }}
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1a1a25 0%, #0a0a12 100%)",
            }}
          >
            {/* Header display */}
            <div
              className="px-8 py-6 text-center"
              style={{
                background: "linear-gradient(180deg, #0a0a12 0%, #12121a 100%)",
                borderBottom: `2px solid ${config.color}30`,
              }}
            >
              <h1
                className="text-4xl font-bold tracking-widest mb-1"
                style={{
                  color: config.color,
                  textShadow: `0 0 30px ${config.color}80`,
                  fontFamily: "var(--font-orbitron), monospace",
                }}
              >
                {config.title}
              </h1>
              <p className="text-white/50 text-sm tracking-wide">{config.subtitle}</p>
            </div>

            {/* Reel window */}
            <div className="px-6 py-8">
              <div
                className="rounded-2xl p-2"
                style={{
                  background: "#050508",
                  boxShadow: `
                    inset 0 5px 30px rgba(0,0,0,0.9),
                    0 0 30px ${config.color}20
                  `,
                  border: `1px solid ${config.color}20`,
                }}
              >
                {/* Reels */}
                <div className="flex h-[200px] overflow-hidden rounded-xl">
                  {[0, 1, 2].map((reelIndex) => (
                    <div
                      key={reelIndex}
                      ref={(el) => { reelRefs.current[reelIndex] = el; }}
                      className="flex-1 relative overflow-hidden"
                      style={{
                        borderLeft: reelIndex > 0 ? "2px solid #1a1a25" : "none",
                      }}
                    >
                      <div
                        ref={(el) => { stripRefs.current[reelIndex] = el; }}
                        className="absolute w-full"
                        style={{ top: "50px" }}
                      >
                        {extendedSymbols.map((symbol, i) => (
                          <div
                            key={`${reelIndex}-${i}`}
                            className="flex items-center justify-center"
                            style={{
                              height: "100px",
                              fontSize: "48px",
                              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                            }}
                          >
                            {symbol.icon}
                          </div>
                        ))}
                      </div>

                      {/* Top/bottom shadows */}
                      <div
                        className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
                        style={{ background: "linear-gradient(180deg, rgba(5,5,8,0.95) 0%, transparent 100%)" }}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
                        style={{ background: "linear-gradient(0deg, rgba(5,5,8,0.95) 0%, transparent 100%)" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Payline */}
                <div
                  className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[100px] pointer-events-none"
                  style={{
                    border: `2px solid ${config.color}50`,
                    boxShadow: `0 0 20px ${config.color}30`,
                    borderRadius: "8px",
                  }}
                />
              </div>

              {/* Info text */}
              <p
                className="text-center mt-4 text-sm"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {config.description}
              </p>

              {/* Jackpot indicator */}
              <div
                className="mt-4 py-2 px-4 rounded-lg text-center"
                style={{
                  background: `${config.color}10`,
                  border: `1px solid ${config.color}30`,
                }}
              >
                <span
                  className="text-xs font-bold tracking-widest"
                  style={{
                    color: config.color,
                    fontFamily: "var(--font-orbitron), monospace",
                  }}
                >
                  🎰 JACKPOT: {config.jackpotLabel}
                </span>
              </div>
            </div>

            {/* Control panel */}
            <div
              className="px-6 pb-6"
            >
              <button
                onClick={spin}
                disabled={isSpinning}
                className="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all"
                style={{
                  background: isSpinning
                    ? "linear-gradient(180deg, #333 0%, #222 100%)"
                    : `linear-gradient(180deg, ${config.color} 0%, ${config.color}cc 100%)`,
                  color: isSpinning ? "#666" : "#000",
                  boxShadow: isSpinning
                    ? "none"
                    : `0 4px 0 ${config.color}80, 0 8px 30px ${config.color}40`,
                  cursor: isSpinning ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-orbitron), monospace",
                }}
              >
                {isSpinning ? "SPINNING..." : "SPIN"}
              </button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute -top-2 -left-2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          ←
        </button>
      </div>

      {/* Avatar head at bottom - First Person View */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20"
        style={{
          width: "300px",
          height: "180px",
        }}
      >
        {/* Avatar silhouette from behind */}
        <div className="relative w-full h-full">
          {/* Shoulders */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: "280px",
              height: "80px",
              background: "linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)",
              borderRadius: "140px 140px 0 0",
              boxShadow: "inset 0 5px 20px rgba(255,255,255,0.05)",
            }}
          />

          {/* Neck */}
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2"
            style={{
              width: "60px",
              height: "40px",
              background: "linear-gradient(180deg, #252535 0%, #1a1a2a 100%)",
            }}
          />

          {/* Head (back view) */}
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
            style={{
              width: "100px",
              height: "110px",
              background: "linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)",
              borderRadius: "50px 50px 45px 45px",
              boxShadow: `
                inset 0 -10px 30px rgba(0,0,0,0.3),
                0 0 30px ${config.color}20
              `,
              border: `1px solid ${config.color}20`,
            }}
          >
            {/* Hair/hat detail */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2"
              style={{
                background: "linear-gradient(180deg, #1a1a25 0%, transparent 100%)",
                borderRadius: "50px 50px 0 0",
              }}
            />

            {/* Ear left */}
            <div
              className="absolute top-1/3 -left-2"
              style={{
                width: "15px",
                height: "25px",
                background: "#252535",
                borderRadius: "8px",
              }}
            />

            {/* Ear right */}
            <div
              className="absolute top-1/3 -right-2"
              style={{
                width: "15px",
                height: "25px",
                background: "#252535",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Wizard hat (optional) */}
          <div
            className="absolute bottom-[150px] left-1/2 -translate-x-1/2"
            style={{
              width: "0",
              height: "0",
              borderLeft: "35px solid transparent",
              borderRight: "35px solid transparent",
              borderBottom: "60px solid #15151f",
              filter: `drop-shadow(0 0 10px ${config.color}30)`,
            }}
          />

          {/* Hat brim */}
          <div
            className="absolute bottom-[145px] left-1/2 -translate-x-1/2"
            style={{
              width: "120px",
              height: "15px",
              background: "#1a1a25",
              borderRadius: "60px",
            }}
          />

          {/* PLACEHOLDER label */}
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-mono px-2 py-1 rounded"
            style={{
              color: "rgba(255,255,255,0.3)",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            [AVATAR PLACEHOLDER]
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div
        className="absolute bottom-4 right-4 text-xs space-y-1"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        <div><kbd className="px-1 bg-white/10 rounded">SPACE</kbd> Spin</div>
        <div><kbd className="px-1 bg-white/10 rounded">ESC</kbd> Back</div>
      </div>
    </div>
  );
}
