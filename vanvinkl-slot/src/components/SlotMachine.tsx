"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

interface SlotMachineProps {
  onResult: (section: string, isWin: boolean) => void;
  onSpinStart: () => void;
}

const SYMBOLS = [
  { id: "sound", icon: "🎵", label: "Sound Design", section: "services" },
  { id: "game", icon: "🎮", label: "Game Audio", section: "projects" },
  { id: "mix", icon: "🎚️", label: "Mixing", section: "services" },
  { id: "seven", icon: "7️⃣", label: "Lucky Seven", section: "about" },
  { id: "star", icon: "⭐", label: "Premium", section: "contact" },
  { id: "diamond", icon: "💎", label: "Diamond", section: "projects" },
];

export function SlotMachine({ onResult, onSpinStart }: SlotMachineProps) {
  const machineRef = useRef<HTMLDivElement>(null);
  const leverRef = useRef<HTMLDivElement>(null);
  const leverHandleRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [isLeverPulled, setIsLeverPulled] = useState(false);

  const spin = useCallback(() => {
    if (isSpinning) return;

    setIsSpinning(true);
    onSpinStart();

    // Machine anticipation shake
    gsap.to(machineRef.current, {
      x: "random(-2, 2)",
      y: "random(-1, 1)",
      duration: 0.05,
      repeat: 40,
      yoyo: true,
      ease: "none",
    });

    // Generate results
    const newResults = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ];

    // Animate each reel with realistic physics
    stripRefs.current.forEach((strip, i) => {
      if (!strip) return;

      const symbolHeight = 120;
      const totalSymbols = SYMBOLS.length;
      const spins = 3 + i; // More spins for later reels
      const targetPosition = -(newResults[i] * symbolHeight + spins * totalSymbols * symbolHeight);

      // Reset position for continuous spinning illusion
      gsap.set(strip, { y: 0 });

      // Realistic reel spin with deceleration
      gsap.to(strip, {
        y: targetPosition,
        duration: 1.5 + i * 0.4,
        ease: "power2.out",
        onComplete: () => {
          // Bounce effect on stop
          gsap.to(strip, {
            y: targetPosition + 15,
            duration: 0.1,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
          });

          // Reel stop thunk - shake the reel window
          gsap.to(reelRefs.current[i], {
            y: 3,
            duration: 0.05,
            yoyo: true,
            repeat: 1,
          });

          if (i === 2) {
            // All reels stopped
            setTimeout(() => {
              const isWin = newResults[0] === newResults[1] && newResults[1] === newResults[2];
              onResult(SYMBOLS[newResults[1]].section, isWin);
              setIsSpinning(false);
            }, 200);
          }
        },
      });
    });
  }, [isSpinning, onResult, onSpinStart]);

  const pullLever = useCallback(() => {
    if (isSpinning || isLeverPulled) return;

    setIsLeverPulled(true);

    // Animate lever pull with realistic arc
    const tl = gsap.timeline();

    tl.to(leverHandleRef.current, {
      rotateX: 45,
      y: 80,
      duration: 0.3,
      ease: "power2.in",
    })
    .call(() => spin())
    .to(leverHandleRef.current, {
      rotateX: 0,
      y: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => setIsLeverPulled(false),
    });
  }, [isSpinning, isLeverPulled, spin]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpinning) {
        e.preventDefault();
        pullLever();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpinning, pullLever]);

  // Extended symbols for seamless looping
  const extendedSymbols = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

  return (
    <div className="flex items-center gap-8">
      {/* Main Slot Machine Cabinet */}
      <div
        ref={machineRef}
        className="relative"
        style={{
          width: "520px",
          height: "400px",
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Machine Body - Outer Cabinet */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `
              linear-gradient(145deg, #2a2a35 0%, #1a1a22 50%, #0f0f14 100%)
            `,
            boxShadow: `
              0 50px 100px rgba(0,0,0,0.8),
              0 20px 40px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1),
              inset 0 -1px 0 rgba(0,0,0,0.5)
            `,
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        />

        {/* Chrome Trim - Top */}
        <div
          className="absolute left-4 right-4 h-3 rounded-t-2xl"
          style={{
            top: "8px",
            background: `
              linear-gradient(180deg,
                #888 0%,
                #666 20%,
                #444 40%,
                #666 60%,
                #888 80%,
                #aaa 100%
              )
            `,
            boxShadow: `
              0 1px 2px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.4)
            `,
          }}
        />

        {/* Chrome Trim - Bottom */}
        <div
          className="absolute left-4 right-4 h-3 rounded-b-2xl"
          style={{
            bottom: "8px",
            background: `
              linear-gradient(180deg,
                #aaa 0%,
                #888 20%,
                #666 40%,
                #444 60%,
                #666 80%,
                #888 100%
              )
            `,
            boxShadow: `
              0 -1px 2px rgba(0,0,0,0.5),
              inset 0 -1px 0 rgba(255,255,255,0.3)
            `,
          }}
        />

        {/* Display Panel - Header */}
        <div
          className="absolute left-8 right-8 flex items-center justify-center"
          style={{
            top: "25px",
            height: "50px",
            background: `
              linear-gradient(180deg, #0a0a0f 0%, #151520 100%)
            `,
            borderRadius: "8px",
            boxShadow: `
              inset 0 2px 10px rgba(0,0,0,0.8),
              0 1px 0 rgba(255,255,255,0.1)
            `,
            border: "1px solid #333",
          }}
        >
          {/* LED Text Display */}
          <div
            className="text-2xl font-bold tracking-wider"
            style={{
              color: "#ff7a3b",
              textShadow: `
                0 0 10px rgba(255,122,59,0.8),
                0 0 20px rgba(255,122,59,0.5),
                0 0 40px rgba(255,122,59,0.3)
              `,
              fontFamily: "var(--font-orbitron), monospace",
            }}
          >
            VANVINKL STUDIO
          </div>
        </div>

        {/* Reel Window Frame */}
        <div
          className="absolute left-8 right-8"
          style={{
            top: "90px",
            height: "180px",
            background: `
              linear-gradient(145deg, #1a1a22 0%, #0a0a0f 100%)
            `,
            borderRadius: "12px",
            boxShadow: `
              inset 0 5px 20px rgba(0,0,0,0.9),
              inset 0 -2px 10px rgba(0,0,0,0.5),
              0 2px 0 rgba(255,255,255,0.05)
            `,
            border: "2px solid #222",
            padding: "8px",
          }}
        >
          {/* Inner Bezel */}
          <div
            className="relative w-full h-full overflow-hidden rounded-lg"
            style={{
              background: "#050508",
              boxShadow: `
                inset 0 0 30px rgba(0,0,0,0.9),
                inset 0 0 60px rgba(0,0,0,0.5)
              `,
            }}
          >
            {/* Reels Container */}
            <div className="flex h-full">
              {[0, 1, 2].map((reelIndex) => (
                <div
                  key={reelIndex}
                  ref={(el) => { reelRefs.current[reelIndex] = el; }}
                  className="flex-1 relative overflow-hidden"
                  style={{
                    borderLeft: reelIndex > 0 ? "2px solid #1a1a22" : "none",
                  }}
                >
                  {/* Reel Strip */}
                  <div
                    ref={(el) => { stripRefs.current[reelIndex] = el; }}
                    className="absolute w-full"
                    style={{
                      top: "20px",
                    }}
                  >
                    {extendedSymbols.map((symbol, i) => (
                      <div
                        key={`${reelIndex}-${i}`}
                        className="flex items-center justify-center"
                        style={{
                          height: "120px",
                          fontSize: "48px",
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                        }}
                      >
                        {symbol.icon}
                      </div>
                    ))}
                  </div>

                  {/* Reel Gradient Overlays - Top Shadow */}
                  <div
                    className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10"
                    style={{
                      background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
                    }}
                  />
                  {/* Reel Gradient Overlays - Bottom Shadow */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"
                    style={{
                      background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Payline Indicator */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[120px] pointer-events-none z-20"
              style={{
                border: "2px solid rgba(255,122,59,0.6)",
                boxShadow: `
                  0 0 20px rgba(255,122,59,0.3),
                  inset 0 0 20px rgba(255,122,59,0.1)
                `,
              }}
            />

            {/* Glass Reflection Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(255,255,255,0.1) 0%,
                    transparent 30%,
                    transparent 70%,
                    rgba(255,255,255,0.03) 100%
                  )
                `,
              }}
            />
          </div>
        </div>

        {/* Control Panel */}
        <div
          className="absolute left-8 right-8"
          style={{
            top: "285px",
            height: "100px",
            background: `
              linear-gradient(180deg, #1a1a22 0%, #0f0f14 100%)
            `,
            borderRadius: "12px",
            boxShadow: `
              inset 0 2px 10px rgba(0,0,0,0.5),
              0 2px 0 rgba(255,255,255,0.05)
            `,
            padding: "15px 20px",
          }}
        >
          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={isSpinning}
            className="w-full h-full rounded-xl font-bold text-xl uppercase tracking-widest transition-all duration-150"
            style={{
              background: isSpinning
                ? "linear-gradient(180deg, #333 0%, #222 100%)"
                : `
                  linear-gradient(180deg,
                    #ff9a5b 0%,
                    #ff7a3b 30%,
                    #e55a1b 70%,
                    #cc4a0b 100%
                  )
                `,
              color: isSpinning ? "#666" : "#fff",
              boxShadow: isSpinning
                ? "inset 0 2px 10px rgba(0,0,0,0.5)"
                : `
                  0 4px 0 #993a10,
                  0 6px 20px rgba(255,122,59,0.4),
                  inset 0 1px 0 rgba(255,255,255,0.3)
                `,
              border: "1px solid rgba(0,0,0,0.3)",
              cursor: isSpinning ? "not-allowed" : "pointer",
              transform: isSpinning ? "translateY(2px)" : "none",
              textShadow: isSpinning ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {isSpinning ? "SPINNING..." : "SPIN"}
          </button>
        </div>

        {/* Decorative Bolts */}
        {[
          { top: "15px", left: "15px" },
          { top: "15px", right: "15px" },
          { bottom: "15px", left: "15px" },
          { bottom: "15px", right: "15px" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              ...pos,
              background: `
                radial-gradient(circle at 30% 30%,
                  #888 0%,
                  #555 50%,
                  #333 100%
                )
              `,
              boxShadow: `
                inset 0 1px 2px rgba(255,255,255,0.3),
                0 1px 2px rgba(0,0,0,0.5)
              `,
            }}
          >
            <div
              className="absolute inset-1 rounded-full"
              style={{
                background: `
                  radial-gradient(circle at 40% 40%,
                    #666 0%,
                    #444 100%
                  )
                `,
              }}
            />
          </div>
        ))}

        {/* Side Lights */}
        {[
          { top: "100px", left: "-8px" },
          { top: "100px", right: "-8px" },
          { top: "180px", left: "-8px" },
          { top: "180px", right: "-8px" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-4 h-8 rounded-full"
            style={{
              ...pos,
              background: isSpinning
                ? `radial-gradient(circle, #ffdd40 0%, #ff9a40 100%)`
                : `radial-gradient(circle, #40c8ff 0%, #2080a0 100%)`,
              boxShadow: isSpinning
                ? `0 0 20px rgba(255,220,64,0.8), 0 0 40px rgba(255,154,64,0.4)`
                : `0 0 15px rgba(64,200,255,0.6), 0 0 30px rgba(64,200,255,0.3)`,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Lever Assembly */}
      <div
        ref={leverRef}
        className="relative cursor-pointer select-none"
        style={{
          width: "80px",
          height: "300px",
          perspective: "500px",
        }}
        onClick={pullLever}
      >
        {/* Lever Base Mount */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "60px",
            height: "40px",
            background: `
              linear-gradient(180deg, #444 0%, #222 100%)
            `,
            borderRadius: "8px",
            boxShadow: `
              0 5px 15px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `,
          }}
        />

        {/* Lever Shaft */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 origin-bottom"
          style={{
            width: "16px",
            height: "180px",
            background: `
              linear-gradient(90deg,
                #888 0%,
                #ccc 30%,
                #fff 50%,
                #ccc 70%,
                #888 100%
              )
            `,
            borderRadius: "8px",
            boxShadow: `
              2px 0 5px rgba(0,0,0,0.3),
              -2px 0 5px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Handle */}
          <div
            ref={leverHandleRef}
            className="absolute -top-12 left-1/2 -translate-x-1/2 origin-bottom"
            style={{
              width: "50px",
              height: "50px",
              background: `
                radial-gradient(circle at 40% 30%,
                  #ff4040 0%,
                  #cc0000 50%,
                  #990000 100%
                )
              `,
              borderRadius: "50%",
              boxShadow: `
                0 5px 15px rgba(0,0,0,0.5),
                inset 0 -5px 15px rgba(0,0,0,0.3),
                inset 0 5px 10px rgba(255,255,255,0.2)
              `,
              border: "3px solid #660000",
            }}
          >
            {/* Handle Highlight */}
            <div
              className="absolute top-2 left-2 w-4 h-4 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
              }}
            />
          </div>
        </div>

        {/* Pull Label */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold uppercase"
          style={{
            color: "#666",
            letterSpacing: "0.1em",
          }}
        >
          Pull to Spin
        </div>
      </div>
    </div>
  );
}
