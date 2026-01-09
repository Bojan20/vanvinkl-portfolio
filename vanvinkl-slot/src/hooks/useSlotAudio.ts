"use client";

import { useCallback, useRef, useEffect, useState } from "react";

/**
 * ULTIMATIVNI AUDIO SISTEM - VanVinkl Casino Lounge
 *
 * Chief Audio Architect Analysis:
 * - Warm, inviting Vegas lounge atmosphere (NOT spooky/horror)
 * - Professional casino ambience: subtle, elegant, luxurious
 * - Clean signal path with proper gain staging
 * - Musical sound design (major keys, warm tones)
 *
 * Lead DSP Engineer Implementation:
 * - Proper ADSR envelopes with safe timing
 * - Warm filters (gentle lowpass, no harsh resonance)
 * - Subtle reverb for space (short, bright room)
 * - Safe audio context handling
 */

// Audio context singleton with lazy initialization
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;

// Voice limiting - track active oscillators
const MAX_VOICES = 24;
const activeVoices: Set<OscillatorNode> = new Set();

const registerVoice = (osc: OscillatorNode): boolean => {
  // If at limit, skip oldest voice
  if (activeVoices.size >= MAX_VOICES) {
    const oldest = activeVoices.values().next().value;
    if (oldest) {
      try {
        oldest.stop();
        oldest.disconnect();
      } catch {}
      activeVoices.delete(oldest);
    }
  }
  activeVoices.add(osc);
  return true;
};

const unregisterVoice = (osc: OscillatorNode) => {
  activeVoices.delete(osc);
};

// Safe audio context getter
const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Master bus - overall volume
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(audioContext.destination);

      // Ambience bus - background atmosphere (very subtle)
      ambienceGain = audioContext.createGain();
      ambienceGain.gain.value = 0.15; // Reduced from 0.3
      ambienceGain.connect(masterGain);

      // SFX bus - interaction sounds
      sfxGain = audioContext.createGain();
      sfxGain.gain.value = 0.6;
      sfxGain.connect(masterGain);

      // Music bus - melodic elements
      musicGain = audioContext.createGain();
      musicGain.gain.value = 0.4;
      musicGain.connect(masterGain);
    }
  } catch (e) {
    console.warn("Audio context creation failed:", e);
    return null;
  }

  return audioContext;
};

/**
 * Safe tone generator with proper envelope timing
 * Prevents negative time errors and harsh sounds
 */
const playTone = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.1,
  options: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    detune?: number;
    pan?: number;
    filter?: number;
    filterQ?: number;
    targetGain?: GainNode | null;
  } = {}
): OscillatorNode | null => {
  try {
    const {
      attack = 0.02,
      decay = 0.1,
      sustain = 0.6,
      release = 0.1,
      detune = 0,
      pan = 0,
      filter = 8000,
      filterQ = 0.5,
      targetGain = sfxGain,
    } = options;

    // Ensure minimum duration for envelope
    const safeDuration = Math.max(duration, attack + decay + release + 0.05);

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();
    const panNode = ctx.createStereoPanner();

    // Oscillator
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (detune !== 0) {
      oscillator.detune.setValueAtTime(detune, ctx.currentTime);
    }

    // Warm lowpass filter
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(filter, ctx.currentTime);
    filterNode.Q.setValueAtTime(filterQ, ctx.currentTime);

    // Stereo pan
    panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);

    // Safe ADSR envelope
    const now = ctx.currentTime;
    const attackEnd = now + attack;
    const decayEnd = attackEnd + decay;
    const sustainEnd = now + safeDuration - release;
    const releaseEnd = now + safeDuration;

    gainNode.gain.setValueAtTime(0.001, now); // Start from near-zero (not 0 to avoid clicks)
    gainNode.gain.linearRampToValueAtTime(volume, attackEnd);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, decayEnd);
    gainNode.gain.setValueAtTime(volume * sustain, Math.max(decayEnd, sustainEnd));
    gainNode.gain.linearRampToValueAtTime(0.001, releaseEnd);

    // Connect chain
    oscillator.connect(filterNode);
    filterNode.connect(panNode);
    panNode.connect(gainNode);

    if (targetGain) {
      gainNode.connect(targetGain);
    }

    // Register voice for limiting
    registerVoice(oscillator);

    oscillator.start(now);
    oscillator.stop(releaseEnd + 0.05);

    // Cleanup on end
    oscillator.onended = () => {
      unregisterVoice(oscillator);
      try {
        oscillator.disconnect();
        gainNode.disconnect();
        filterNode.disconnect();
        panNode.disconnect();
      } catch {}
    };

    return oscillator;
  } catch (e) {
    console.warn("Tone playback failed:", e);
    return null;
  }
};

/**
 * Play a pleasant chime (major chord tones)
 */
const playChime = (
  ctx: AudioContext,
  baseFreq: number,
  volume: number = 0.08,
  pan: number = 0
) => {
  // Major triad frequencies (root, major 3rd, 5th)
  const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone(ctx, freq, 0.4, "sine", volume * (1 - i * 0.2), {
        attack: 0.02,
        decay: 0.15,
        sustain: 0.3,
        release: 0.2,
        pan,
        filter: 4000,
        targetGain: musicGain,
      });
    }, i * 30);
  });
};

export function useSlotAudio() {
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambienceNodesRef = useRef<AudioNode[]>([]);
  const ambienceTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Resume audio context (required after user interaction)
  const resumeAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }, []);

  /**
   * WARM VEGAS LOUNGE AMBIENCE
   * - Gentle warm pad (not drone)
   * - Occasional pleasant distant slot chimes
   * - No harsh noise or spooky elements
   */
  const startAmbience = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx || !ambienceGain || isAmbiencePlaying) return;

    setIsAmbiencePlaying(true);

    // Warm pad - gentle major chord (C major: C3, E3, G3)
    const padNotes = [130.81, 164.81, 196.00]; // C3, E3, G3

    padNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.value = freq;

      // Very gentle volume with slow fade in
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03 - i * 0.005, ctx.currentTime + 2);

      // Warm filter
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.3;

      osc.connect(filter);
      filter.connect(gain);
      if (ambienceGain) gain.connect(ambienceGain);

      osc.start();
      ambienceNodesRef.current.push(osc, gain, filter);
    });

    // Occasional pleasant distant slot sounds (not creepy)
    const playDistantSlot = () => {
      if (!isAmbiencePlaying) return;

      const pan = (Math.random() - 0.5) * 1.5;
      const delay = 3000 + Math.random() * 5000; // Less frequent

      const timeout = setTimeout(() => {
        // Gentle bell-like chime instead of harsh square wave
        if (Math.random() > 0.5) {
          playTone(ctx, 800 + Math.random() * 400, 0.15, "sine", 0.015, {
            attack: 0.02,
            decay: 0.08,
            sustain: 0.2,
            release: 0.05,
            pan,
            filter: 2000,
            targetGain: ambienceGain,
          });
        }

        // Occasional happy win jingle (very subtle, distant)
        if (Math.random() > 0.85) {
          const winNotes = [523, 659, 784]; // C5, E5, G5 - major chord
          winNotes.forEach((note, i) => {
            setTimeout(() => {
              playTone(ctx, note, 0.2, "sine", 0.01, {
                pan,
                filter: 1500,
                targetGain: ambienceGain,
              });
            }, i * 80);
          });
        }

        playDistantSlot();
      }, delay);

      ambienceTimeoutsRef.current.push(timeout);
    };

    // Start distant slot sounds
    playDistantSlot();

  }, [resumeAudio, isAmbiencePlaying]);

  // Stop all ambience
  const stopAmbience = useCallback(() => {
    const ctx = getAudioContext();

    // Clear timeouts
    ambienceTimeoutsRef.current.forEach(t => clearTimeout(t));
    ambienceTimeoutsRef.current = [];

    // Stop and disconnect all nodes
    ambienceNodesRef.current.forEach(node => {
      try {
        if (node instanceof OscillatorNode) {
          // Fade out gracefully
          if (ctx) {
            const gain = ctx.createGain();
            node.connect(gain);
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            setTimeout(() => {
              try { node.stop(); } catch {}
            }, 350);
          } else {
            node.stop();
          }
        }
        node.disconnect();
      } catch {}
    });
    ambienceNodesRef.current = [];
    setIsAmbiencePlaying(false);
  }, []);

  // Duck ambience during important sounds
  const duckAmbience = useCallback((durationMs: number = 1500) => {
    const ctx = getAudioContext();
    if (!ctx || !ambienceGain) return;

    const now = ctx.currentTime;
    const duckLevel = 0.05;
    const normalLevel = 0.15;

    ambienceGain.gain.cancelScheduledValues(now);
    ambienceGain.gain.setValueAtTime(ambienceGain.gain.value, now);
    ambienceGain.gain.linearRampToValueAtTime(duckLevel, now + 0.1);
    ambienceGain.gain.linearRampToValueAtTime(normalLevel, now + durationMs / 1000);
  }, []);

  /**
   * FOOTSTEP - Soft carpet step
   */
  const playFootstep = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    // Soft thud (carpet footstep)
    playTone(ctx, 80 + Math.random() * 30, 0.08, "sine", 0.04, {
      attack: 0.005,
      decay: 0.04,
      sustain: 0.2,
      release: 0.03,
      filter: 300,
    });
  }, [resumeAudio]);

  /**
   * MACHINE APPROACH - Subtle electronic presence
   */
  const playMachineApproach = useCallback((pan: number = 0) => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    // Gentle ascending chime to indicate proximity
    playChime(ctx, 440, 0.06, pan);
  }, [resumeAudio]);

  /**
   * SPIN START - Lever pull with satisfying click
   */
  const playSpinStart = useCallback(() => {
    resumeAudio();
    duckAmbience(2500);
    const ctx = getAudioContext();
    if (!ctx) return;

    // Mechanical lever sound
    playTone(ctx, 150, 0.12, "triangle", 0.15, {
      attack: 0.01,
      decay: 0.08,
      filter: 600,
    });

    // Click
    setTimeout(() => {
      playTone(ctx, 2500, 0.03, "sine", 0.12, {
        attack: 0.002,
        decay: 0.02,
        filter: 5000,
      });
    }, 80);

    // Release sound
    setTimeout(() => {
      playTone(ctx, 100, 0.15, "sine", 0.1, {
        attack: 0.01,
        decay: 0.1,
        filter: 400,
      });
    }, 120);
  }, [resumeAudio, duckAmbience]);

  /**
   * SPIN LOOP - Rhythmic spinning reels
   */
  const playSpinLoop = useCallback((duration: number) => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    // Clear any existing spin
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }

    let tick = 0;
    const tickInterval = 50;
    const totalTicks = Math.floor(duration / tickInterval);

    spinIntervalRef.current = setInterval(() => {
      const progress = tick / totalTicks;

      // Slow down as progress increases
      if (Math.random() > progress * 0.5) {
        const freq = 400 + Math.random() * 200;
        const vol = 0.05 * (1 - progress * 0.6);

        playTone(ctx, freq, 0.04, "sine", vol, {
          attack: 0.005,
          decay: 0.02,
          filter: 2500 - progress * 1500,
          pan: (Math.random() - 0.5) * 0.6,
        });
      }

      tick++;
      if (tick >= totalTicks) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
          spinIntervalRef.current = null;
        }
      }
    }, tickInterval);
  }, [resumeAudio]);

  /**
   * REEL STOP - Satisfying thunk with position
   */
  const playReelStop = useCallback((reelIndex: number) => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    const pan = (reelIndex - 1) * 0.5; // -0.5, 0, 0.5

    setTimeout(() => {
      // Impact
      playTone(ctx, 100 - reelIndex * 15, 0.12, "sine", 0.18, {
        attack: 0.005,
        decay: 0.08,
        filter: 500,
        pan,
      });

      // Click
      playTone(ctx, 1800, 0.04, "sine", 0.08, {
        attack: 0.002,
        decay: 0.03,
        filter: 4000,
        pan,
      });
    }, reelIndex * 350);
  }, [resumeAudio]);

  /**
   * WIN CELEBRATION - Triumphant, joyful (NOT scary)
   */
  const playWin = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    // Coin cascade - bright, happy
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const freq = 2000 + Math.random() * 2000;
        playTone(ctx, freq, 0.12, "sine", 0.06, {
          pan: (Math.random() - 0.5) * 2,
          filter: 6000,
          targetGain: musicGain,
        });
      }, i * 40);
    }

    // Victory fanfare - C major arpeggio ascending
    const fanfare = [
      { freq: 523.25, time: 0 },     // C5
      { freq: 659.25, time: 100 },   // E5
      { freq: 783.99, time: 200 },   // G5
      { freq: 1046.50, time: 350 },  // C6
    ];

    fanfare.forEach(({ freq, time }) => {
      setTimeout(() => {
        playTone(ctx, freq, 0.5, "sine", 0.2, {
          attack: 0.02,
          decay: 0.15,
          sustain: 0.7,
          release: 0.2,
          filter: 5000,
          targetGain: musicGain,
        });
        // Octave harmony
        playTone(ctx, freq * 2, 0.4, "sine", 0.08, {
          attack: 0.03,
          filter: 4000,
          targetGain: musicGain,
        });
      }, time);
    });

    // Final chord (C major)
    setTimeout(() => {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        playTone(ctx, freq, 0.8, "sine", 0.12 - i * 0.02, {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.6,
          release: 0.3,
          filter: 3000,
          targetGain: musicGain,
        });
      });
    }, 500);
  }, [resumeAudio]);

  /**
   * UI CLICK - Clean, satisfying
   */
  const playClick = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    playTone(ctx, 1400, 0.05, "sine", 0.1, {
      attack: 0.003,
      decay: 0.03,
      filter: 5000,
    });
  }, [resumeAudio]);

  /**
   * HOVER - Subtle feedback
   */
  const playHover = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    playTone(ctx, 900, 0.04, "sine", 0.025, {
      attack: 0.01,
      decay: 0.02,
      filter: 3000,
    });
  }, [resumeAudio]);

  /**
   * SECTION OPEN - Elegant whoosh up
   */
  const playSectionOpen = useCallback(() => {
    resumeAudio();
    duckAmbience(1200);
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;

    // Smooth whoosh up
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    filter.type = "lowpass";
    filter.Q.value = 1;

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);

    // Pleasant arrival chime
    setTimeout(() => {
      playChime(ctx, 660, 0.1, 0);
    }, 200);
  }, [resumeAudio, duckAmbience]);

  /**
   * SECTION CLOSE - Gentle whoosh down
   */
  const playSectionClose = useCallback(() => {
    resumeAudio();
    const ctx = getAudioContext();
    if (!ctx || !sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }, [resumeAudio]);

  // Volume control
  const setMasterVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMasterVolumeState(clampedVolume);
    if (masterGain) {
      masterGain.gain.value = isMuted ? 0 : clampedVolume;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (masterGain) {
        masterGain.gain.value = newMuted ? 0 : masterVolume;
      }
      return newMuted;
    });
  }, [masterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
      stopAmbience();
    };
  }, [stopAmbience]);

  return {
    // Core slot sounds
    playSpinStart,
    playSpinLoop,
    playReelStop,
    playWin,

    // UI sounds
    playClick,
    playHover,

    // Ambience
    startAmbience,
    stopAmbience,
    duckAmbience,
    isAmbiencePlaying,

    // Spatial/Movement
    playFootstep,
    playMachineApproach,

    // Transitions
    playSectionOpen,
    playSectionClose,

    // Control
    resumeAudio,

    // Volume
    masterVolume,
    setMasterVolume,
    isMuted,
    toggleMute,
  };
}
