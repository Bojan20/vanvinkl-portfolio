/**
 * useParticles - React hook for particle effects
 *
 * Automatically chooses WebGPU or Canvas2D based on browser support
 */

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Canvas2DParticleSystem,
  PARTICLE_2D_PRESETS,
  type Emitter2DConfig,
} from "@/lib/particles";

type PresetName = keyof typeof PARTICLE_2D_PRESETS;

interface UseParticlesOptions {
  autoStart?: boolean;
  preset?: PresetName;
  config?: Partial<Emitter2DConfig>;
}

interface ParticlesAPI {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isReady: boolean;
  activeCount: number;

  // Emitter controls
  setPosition: (x: number, y: number) => void;
  startEmitting: () => void;
  stopEmitting: () => void;

  // Single burst
  burst: (x: number, y: number, count: number, preset?: PresetName) => void;

  // Presets
  coinExplosion: (x: number, y: number) => void;
  sparkleTrail: (x: number, y: number) => void;
  confetti: (x: number, y: number) => void;
  jackpot: (x: number, y: number) => void;

  // Control
  clear: () => void;
}

export function useParticles(options: UseParticlesOptions = {}): ParticlesAPI {
  const { autoStart = false, preset, config } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<Canvas2DParticleSystem | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Initialize particle system
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Use preset config if specified
    const initialConfig = preset
      ? { ...PARTICLE_2D_PRESETS[preset], ...config }
      : config;

    const system = new Canvas2DParticleSystem(initialConfig);

    if (system.initialize(canvas)) {
      systemRef.current = system;
      setIsReady(true);

      if (autoStart) {
        system.start();
      }

      // Update active count periodically
      const countInterval = setInterval(() => {
        setActiveCount(system.getActiveCount());
      }, 100);

      return () => {
        clearInterval(countInterval);
        system.dispose();
        systemRef.current = null;
        setIsReady(false);
      };
    }
  }, [autoStart, preset]);

  // Set emitter position
  const setPosition = useCallback((x: number, y: number) => {
    systemRef.current?.setEmitterPosition(x, y);
  }, []);

  // Start continuous emission
  const startEmitting = useCallback(() => {
    const system = systemRef.current;
    if (system) {
      system.startEmitting();
      system.start();
    }
  }, []);

  // Stop emission
  const stopEmitting = useCallback(() => {
    systemRef.current?.stopEmitting();
  }, []);

  // Single burst at position
  const burst = useCallback(
    (x: number, y: number, count: number, presetName?: PresetName) => {
      const system = systemRef.current;
      if (!system) return;

      const burstConfig = presetName ? PARTICLE_2D_PRESETS[presetName] : undefined;
      system.burst(x, y, count, burstConfig);

      // Make sure animation is running
      system.start();
    },
    []
  );

  // Preset effects
  const coinExplosion = useCallback(
    (x: number, y: number) => {
      burst(x, y, 100, "coinExplosion");
    },
    [burst]
  );

  const sparkleTrail = useCallback(
    (x: number, y: number) => {
      const system = systemRef.current;
      if (!system) return;

      system.setEmitterPosition(x, y);
      Object.assign(system, PARTICLE_2D_PRESETS.sparkleTrail);
      system.emit(5);
      system.start();
    },
    []
  );

  const confetti = useCallback(
    (x: number, y: number) => {
      burst(x, y, 150, "confetti");
    },
    [burst]
  );

  const jackpot = useCallback(
    (x: number, y: number) => {
      burst(x, y, 500, "jackpotCelebration");
    },
    [burst]
  );

  // Clear all particles
  const clear = useCallback(() => {
    systemRef.current?.clear();
  }, []);

  return {
    canvasRef,
    isReady,
    activeCount,
    setPosition,
    startEmitting,
    stopEmitting,
    burst,
    coinExplosion,
    sparkleTrail,
    confetti,
    jackpot,
    clear,
  };
}
