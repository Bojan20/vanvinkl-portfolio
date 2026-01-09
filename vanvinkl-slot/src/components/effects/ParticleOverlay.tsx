"use client";

/**
 * ParticleOverlay - Full-screen particle effects layer
 *
 * Usage:
 * ```tsx
 * const particlesRef = useRef<ParticleOverlayRef>(null);
 *
 * // Trigger effects
 * particlesRef.current?.coinExplosion(x, y);
 * particlesRef.current?.jackpot(x, y);
 * ```
 */

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Canvas2DParticleSystem,
  PARTICLE_2D_PRESETS,
} from "@/lib/particles";

export interface ParticleOverlayRef {
  coinExplosion: (x: number, y: number) => void;
  sparkleAt: (x: number, y: number) => void;
  confetti: (x: number, y: number) => void;
  jackpot: (x: number, y: number) => void;
  trailTo: (fromX: number, fromY: number, toX: number, toY: number) => void;
  clear: () => void;
}

interface ParticleOverlayProps {
  zIndex?: number;
}

export const ParticleOverlay = forwardRef<
  ParticleOverlayRef,
  ParticleOverlayProps
>(function ParticleOverlay({ zIndex = 100 }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<Canvas2DParticleSystem | null>(null);
  const animatingRef = useRef(false);

  // Initialize
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particle system
    const system = new Canvas2DParticleSystem({
      maxParticles: 2000,
    });

    if (system.initialize(canvas)) {
      systemRef.current = system;
    }

    return () => {
      window.removeEventListener("resize", resize);
      system.dispose();
      systemRef.current = null;
    };
  }, []);

  // Start animation loop when needed
  const ensureAnimating = useCallback(() => {
    if (animatingRef.current || !systemRef.current) return;

    animatingRef.current = true;
    systemRef.current.start();

    // Auto-stop when no particles
    const checkStop = setInterval(() => {
      if (systemRef.current && systemRef.current.getActiveCount() === 0) {
        systemRef.current.stop();
        animatingRef.current = false;
        clearInterval(checkStop);
      }
    }, 500);
  }, []);

  // Coin explosion effect
  const coinExplosion = useCallback(
    (x: number, y: number) => {
      systemRef.current?.burst(x, y, 80, PARTICLE_2D_PRESETS.coinExplosion);
      ensureAnimating();
    },
    [ensureAnimating]
  );

  // Sparkle effect
  const sparkleAt = useCallback(
    (x: number, y: number) => {
      systemRef.current?.burst(x, y, 20, {
        ...PARTICLE_2D_PRESETS.sparkleTrail,
        spread: Math.PI,
        speed: [30, 80],
      });
      ensureAnimating();
    },
    [ensureAnimating]
  );

  // Confetti burst
  const confetti = useCallback(
    (x: number, y: number) => {
      systemRef.current?.burst(x, y, 100, PARTICLE_2D_PRESETS.confetti);
      ensureAnimating();
    },
    [ensureAnimating]
  );

  // Jackpot celebration
  const jackpot = useCallback(
    (x: number, y: number) => {
      // Multiple bursts for dramatic effect
      systemRef.current?.burst(x, y, 200, PARTICLE_2D_PRESETS.jackpotCelebration);

      // Delayed secondary bursts
      setTimeout(() => {
        systemRef.current?.burst(x - 100, y, 100, PARTICLE_2D_PRESETS.jackpotCelebration);
        systemRef.current?.burst(x + 100, y, 100, PARTICLE_2D_PRESETS.jackpotCelebration);
      }, 100);

      setTimeout(() => {
        systemRef.current?.burst(x, y - 50, 150, PARTICLE_2D_PRESETS.confetti);
      }, 200);

      ensureAnimating();
    },
    [ensureAnimating]
  );

  // Trail effect (for coin collection)
  const trailTo = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const system = systemRef.current;
      if (!system) return;

      const dx = toX - fromX;
      const dy = toY - fromY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(distance / 20);
      const stepX = dx / steps;
      const stepY = dy / steps;

      // Emit particles along the path
      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          system.burst(
            fromX + stepX * i,
            fromY + stepY * i,
            3,
            {
              ...PARTICLE_2D_PRESETS.sparkleTrail,
              lifetime: [0.2, 0.4],
              speed: [10, 30],
            }
          );
        }, i * 20);
      }

      ensureAnimating();
    },
    [ensureAnimating]
  );

  // Clear all
  const clear = useCallback(() => {
    systemRef.current?.clear();
  }, []);

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      coinExplosion,
      sparkleAt,
      confetti,
      jackpot,
      trailTo,
      clear,
    }),
    [coinExplosion, sparkleAt, confetti, jackpot, trailTo, clear]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
      }}
    />
  );
});
