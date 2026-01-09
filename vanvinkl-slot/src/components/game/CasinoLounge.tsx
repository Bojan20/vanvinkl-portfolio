"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Avatar } from "./Avatar";
import { SlotMachineZone } from "./SlotMachineZone";
import { InteractionPrompt } from "./InteractionPrompt";
import { MiniMap } from "./MiniMap";
import { ProgressIndicator } from "./ProgressIndicator";
import { HelpPanel } from "./HelpPanel";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useSlotAudio } from "@/hooks/useSlotAudio";

// Base design dimensions (will scale responsively)
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 800;

// Slot machine positions as percentages for responsive scaling
const MACHINES = [
  { id: "projects", xPct: 0.167, yPct: 0.25, label: "PROJECTS", icon: "🎮" },
  { id: "services", xPct: 0.5, yPct: 0.188, label: "SERVICES", icon: "🎵" },
  { id: "about", xPct: 0.833, yPct: 0.25, label: "ABOUT", icon: "🧙" },
  { id: "contact", xPct: 0.292, yPct: 0.625, label: "CONTACT", icon: "📧" },
  { id: "showreel", xPct: 0.708, yPct: 0.625, label: "SHOWREEL", icon: "🎬" },
];

interface CasinoLoungeProps {
  onMachineActivate: (machineId: string) => void;
  visitedSections: Set<string>;
}

export function CasinoLounge({ onMachineActivate, visitedSections }: CasinoLoungeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });
  const [avatarPos, setAvatarPos] = useState({ x: 0.5, y: 0.5 }); // Percentage-based
  const [nearMachine, setNearMachine] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | "up" | "down">("down");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const footstepTimer = useRef<number>(0);
  const lastNearMachine = useRef<string | null>(null);

  // Touch controls state
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchJoystick, setTouchJoystick] = useState<{ x: number; y: number } | null>(null);
  const joystickRef = useRef<{ startX: number; startY: number } | null>(null);

  // Accessibility - reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Help panel state
  const [showHelp, setShowHelp] = useState(false);

  // Onboarding state (check localStorage for first visit)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  const audio = useSlotAudio();

  // Movement speed (percentage per frame)
  const SPEED = 0.006;
  const INTERACTION_RADIUS = 0.1; // 10% of width
  const FOOTSTEP_INTERVAL = 25;

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('touchstart', () => setIsTouchDevice(true), { once: true });
  }, []);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('vanvinkl_onboarding_complete');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
    setHasCheckedOnboarding(true);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('vanvinkl_onboarding_complete', 'true');
    setShowOnboarding(false);
    setHasUserInteracted(true);
    audio.resumeAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate max size while maintaining aspect ratio
      const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
      let width = Math.min(viewportWidth * 0.95, BASE_WIDTH);
      let height = width / aspectRatio;

      // If height exceeds viewport, constrain by height
      if (height > viewportHeight * 0.85) {
        height = viewportHeight * 0.85;
        width = height * aspectRatio;
      }

      setDimensions({ width, height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Check proximity to machines (using percentages)
  const checkProximity = useCallback((pos: { x: number; y: number }) => {
    for (const machine of MACHINES) {
      const dx = pos.x - machine.xPct;
      const dy = pos.y - machine.yPct;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < INTERACTION_RADIUS) {
        const pan = (machine.xPct - 0.5) * 2; // -1 to 1
        return { id: machine.id, pan };
      }
    }
    return null;
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const keys = keysPressed.current;
    let dx = 0;
    let dy = 0;
    let moving = false;

    // Keyboard input
    if (keys.has("ArrowUp") || keys.has("KeyW")) {
      dy = -SPEED;
      setDirection("up");
      moving = true;
    }
    if (keys.has("ArrowDown") || keys.has("KeyS")) {
      dy = SPEED;
      setDirection("down");
      moving = true;
    }
    if (keys.has("ArrowLeft") || keys.has("KeyA")) {
      dx = -SPEED;
      setDirection("left");
      moving = true;
    }
    if (keys.has("ArrowRight") || keys.has("KeyD")) {
      dx = SPEED;
      setDirection("right");
      moving = true;
    }

    // Touch joystick input
    if (touchJoystick) {
      const magnitude = Math.sqrt(touchJoystick.x ** 2 + touchJoystick.y ** 2);
      if (magnitude > 0.1) {
        dx = (touchJoystick.x / magnitude) * SPEED * Math.min(magnitude, 1);
        dy = (touchJoystick.y / magnitude) * SPEED * Math.min(magnitude, 1);
        moving = true;

        // Set direction based on dominant axis
        if (Math.abs(touchJoystick.x) > Math.abs(touchJoystick.y)) {
          setDirection(touchJoystick.x > 0 ? "right" : "left");
        } else {
          setDirection(touchJoystick.y > 0 ? "down" : "up");
        }
      }
    }

    setIsMoving(moving);

    if (dx !== 0 || dy !== 0) {
      footstepTimer.current++;
      if (footstepTimer.current >= FOOTSTEP_INTERVAL) {
        footstepTimer.current = 0;
        audio.playFootstep();
      }

      setAvatarPos((prev) => {
        const newX = Math.max(0.05, Math.min(0.95, prev.x + dx));
        const newY = Math.max(0.12, Math.min(0.92, prev.y + dy));
        const newPos = { x: newX, y: newY };

        const proximity = checkProximity(newPos);
        const newNearId = proximity?.id || null;

        if (newNearId && newNearId !== lastNearMachine.current) {
          audio.playMachineApproach(proximity?.pan || 0);
        }
        lastNearMachine.current = newNearId;
        setNearMachine(newNearId);

        return newPos;
      });
    } else {
      footstepTimer.current = 0;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkProximity, touchJoystick]);

  // Start ambience after first user interaction
  useEffect(() => {
    if (hasUserInteracted && !audio.isAmbiencePlaying) {
      audio.startAmbience();
    }

    return () => {
      audio.stopAmbience();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUserInteracted]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        audio.resumeAudio();
      }

      keysPressed.current.add(e.code);

      if ((e.code === "KeyE" || e.code === "Space") && nearMachine) {
        e.preventDefault();
        audio.playClick();
        onMachineActivate(nearMachine);
      }

      // Toggle help panel with ? key
      if (e.key === "?" || (e.shiftKey && e.code === "Slash")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameLoop, nearMachine, onMachineActivate, hasUserInteracted]);

  // Handle click to enable audio
  const handleClick = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      audio.resumeAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUserInteracted]);

  // Touch joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      audio.resumeAudio();
    }
    const touch = e.touches[0];
    joystickRef.current = { startX: touch.clientX, startY: touch.clientY };
    setTouchJoystick({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUserInteracted]);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const maxRadius = 50;
    const dx = (touch.clientX - joystickRef.current.startX) / maxRadius;
    const dy = (touch.clientY - joystickRef.current.startY) / maxRadius;
    setTouchJoystick({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystickRef.current = null;
    setTouchJoystick(null);
  }, []);

  // Handle interact button tap
  const handleInteract = useCallback(() => {
    if (nearMachine) {
      audio.playClick();
      onMachineActivate(nearMachine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearMachine, onMachineActivate]);

  // Convert percentage to pixel position
  const toPixel = (pct: number, dimension: number) => pct * dimension;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden cursor-pointer"
      onClick={handleClick}
      role="application"
      aria-label="VanVinkl Casino Lounge - Interactive portfolio navigation"
      aria-live="polite"
      tabIndex={0}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: "linear-gradient(180deg, #0a0a12 0%, #1a1a2e 100%)",
        borderRadius: "16px",
        boxShadow: "0 0 100px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.5)",
      }}
    >
      {/* Floor pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #222 25%, transparent 25%),
            linear-gradient(-45deg, #222 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #222 75%),
            linear-gradient(-45deg, transparent 75%, #222 75%)
          `,
          backgroundSize: `${dimensions.width * 0.05}px ${dimensions.width * 0.05}px`,
          backgroundPosition: "0 0, 0 30px, 30px -30px, -30px 0px",
        }}
      />

      {/* Floor reflection gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(255,122,59,0.05) 100%)",
        }}
      />

      {/* Casino name header */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-20"
        style={{
          fontFamily: "var(--font-orbitron), monospace",
        }}
      >
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-widest"
          style={{
            color: "#ff7a3b",
            textShadow: `
              0 0 20px rgba(255,122,59,0.8),
              0 0 40px rgba(255,122,59,0.5),
              0 0 60px rgba(255,122,59,0.3)
            `,
          }}
        >
          VANVINKL LOUNGE
        </h1>
      </div>

      {/* Slot Machines - responsive positions */}
      {MACHINES.map((machine) => (
        <SlotMachineZone
          key={machine.id}
          id={machine.id}
          x={toPixel(machine.xPct, dimensions.width)}
          y={toPixel(machine.yPct, dimensions.height)}
          label={machine.label}
          icon={machine.icon}
          isNear={nearMachine === machine.id}
          scale={dimensions.width / BASE_WIDTH}
        />
      ))}

      {/* Avatar - responsive position */}
      <Avatar
        x={toPixel(avatarPos.x, dimensions.width)}
        y={toPixel(avatarPos.y, dimensions.height)}
        direction={direction}
        isMoving={isMoving}
        scale={dimensions.width / BASE_WIDTH}
      />

      {/* Interaction Prompt */}
      {nearMachine && (
        <InteractionPrompt
          machineName={MACHINES.find((m) => m.id === nearMachine)?.label || ""}
        />
      )}

      {/* Mini-map */}
      {hasUserInteracted && (
        <MiniMap
          playerX={avatarPos.x}
          playerY={avatarPos.y}
          machines={MACHINES}
          visitedSections={visitedSections}
        />
      )}

      {/* Progress Indicator */}
      {hasUserInteracted && (
        <ProgressIndicator
          totalSections={MACHINES.length}
          visitedCount={visitedSections.size}
          sectionNames={MACHINES.map((m) => m.id)}
          visitedSections={visitedSections}
        />
      )}

      {/* Help Button */}
      {hasUserInteracted && (
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "2px solid rgba(255,122,59,0.4)",
            color: "#ff7a3b",
            fontFamily: "var(--font-orbitron), monospace",
          }}
          aria-label="Show keyboard shortcuts"
        >
          ?
        </button>
      )}

      {/* Help Panel */}
      <HelpPanel isVisible={showHelp} onClose={() => setShowHelp(false)} />

      {/* Onboarding Tutorial (first visit only) */}
      {hasCheckedOnboarding && showOnboarding && (
        <OnboardingTutorial
          onComplete={handleOnboardingComplete}
          isTouchDevice={isTouchDevice}
        />
      )}

      {/* Audio activation prompt (skip if onboarding is showing) */}
      {!hasUserInteracted && !showOnboarding && hasCheckedOnboarding && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50 bg-black/60"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div
            className="text-center p-6 sm:p-8 rounded-2xl mx-4"
            style={{
              background: "rgba(10,10,18,0.95)",
              border: "2px solid rgba(255,122,59,0.5)",
              boxShadow: "0 0 60px rgba(255,122,59,0.3)",
            }}
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4 tracking-widest"
              style={{
                color: "#ff7a3b",
                fontFamily: "var(--font-orbitron), monospace",
                textShadow: "0 0 20px rgba(255,122,59,0.6)",
              }}
            >
              WELCOME
            </h2>
            <p className="text-white/70 mb-6 text-sm sm:text-base">Click or press any key to enter</p>
            <div
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-white/90 font-bold text-sm sm:text-base"
              style={{
                background: "linear-gradient(180deg, #ff7a3b 0%, #cc5a1b 100%)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              START EXPERIENCE
            </div>
          </div>
        </div>
      )}

      {/* Controls hint - Desktop */}
      {!isTouchDevice && (
        <div
          className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-4 sm:gap-6 text-xs sm:text-sm"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/10 font-mono text-xs">WASD</kbd>
            <span>Move</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/10 font-mono text-xs">E</kbd>
            <span>Interact</span>
          </div>
        </div>
      )}

      {/* Touch Controls - Mobile */}
      {isTouchDevice && hasUserInteracted && (
        <>
          {/* Virtual Joystick */}
          <div
            className="absolute z-30"
            style={{
              left: "20px",
              bottom: "20px",
              width: "120px",
              height: "120px",
            }}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            {/* Joystick base */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            />
            {/* Joystick knob */}
            <div
              className="absolute rounded-full"
              style={{
                width: "50px",
                height: "50px",
                left: `calc(50% - 25px + ${(touchJoystick?.x || 0) * 35}px)`,
                top: `calc(50% - 25px + ${(touchJoystick?.y || 0) * 35}px)`,
                background: "linear-gradient(180deg, rgba(255,122,59,0.8) 0%, rgba(255,122,59,0.5) 100%)",
                border: "2px solid rgba(255,255,255,0.3)",
                boxShadow: "0 0 20px rgba(255,122,59,0.4)",
                transition: touchJoystick ? "none" : "all 0.2s ease-out",
              }}
            />
          </div>

          {/* Interact Button */}
          <button
            className="absolute z-30"
            style={{
              right: "20px",
              bottom: "20px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: nearMachine
                ? "linear-gradient(180deg, #ff7a3b 0%, #cc5a1b 100%)"
                : "rgba(255,255,255,0.1)",
              border: nearMachine
                ? "3px solid rgba(255,255,255,0.4)"
                : "2px solid rgba(255,255,255,0.2)",
              boxShadow: nearMachine
                ? "0 0 30px rgba(255,122,59,0.5)"
                : "none",
              color: nearMachine ? "#fff" : "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-orbitron), monospace",
              fontSize: "12px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onClick={handleInteract}
          >
            {nearMachine ? "TAP" : "E"}
          </button>
        </>
      )}
    </div>
  );
}
