"use client";

import { useCallback, useRef, useEffect } from "react";

// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

// Generate procedural sounds
const createSpinSound = (ctx: AudioContext, duration: number = 0.1) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

const createLeverSound = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
};

const createWinSound = (ctx: AudioContext) => {
  // Arpeggio win sound
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + i * 0.1);
    oscillator.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
};

const createClickSound = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(800, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.05);
};

const createReelStopSound = (ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(300, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

export function useSlotAudio() {
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resume audio context on user interaction
  const resumeAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  }, []);

  const playLever = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (ctx) createLeverSound(ctx);
  }, [resumeAudio]);

  const playSpinLoop = useCallback((duration: number = 2000) => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    // Play tick sounds during spin
    let tickCount = 0;
    spinIntervalRef.current = setInterval(() => {
      if (ctx) createSpinSound(ctx, 0.05);
      tickCount++;
      // Speed up ticks initially, then slow down
      if (tickCount > duration / 50) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
        }
      }
    }, 50);

    // Clear after duration
    setTimeout(() => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    }, duration);
  }, [resumeAudio]);

  const playReelStop = useCallback((reelIndex: number) => {
    resumeAudio();
    const ctx = getAudioContext();
    if (ctx) {
      setTimeout(() => createReelStopSound(ctx), reelIndex * 500);
    }
  }, [resumeAudio]);

  const playWin = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (ctx) createWinSound(ctx);
  }, [resumeAudio]);

  const playClick = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (ctx) createClickSound(ctx);
  }, [resumeAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  return {
    playLever,
    playSpinLoop,
    playReelStop,
    playWin,
    playClick,
    resumeAudio,
  };
}
