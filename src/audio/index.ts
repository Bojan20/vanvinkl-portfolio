/**
 * Audio System - Unified Public API
 *
 * This file exports both the new UnifiedAudioSystem API
 * and backwards-compatible wrappers for AudioDSP + SynthSounds.
 *
 * Prefer importing from UnifiedAudioSystem directly for new code.
 */

// ============================================
// NEW API - UnifiedAudioSystem (Recommended)
// ============================================

export {
  unifiedAudio,
  initUnifiedAudio,
  uaPlay,
  uaStop,
  uaVolume,
  uaGetVolume,
  uaMute,
  uaIsPlaying,
  uaPlaySynth,
  uaGetFrequencyData,
  uaGetBassLevel
} from './UnifiedAudioSystem'

// ============================================
// OLD API - Compatibility Layer (Deprecated)
// ============================================

export {
  // AudioDSP compatibility
  initAudio,
  dspPlay,
  dspStop,
  dspVolume,
  dspGetVolume,
  dspMute,
  dspIsPlaying,
  dspGetFrequencyData,
  dspGetBassLevel,

  // SynthSounds compatibility
  playSynthTick,
  playSynthSelect,
  playSynthBack,
  playSynthWhoosh,
  playSynthSwoosh,
  playSynthReveal,
  playSynthTransition,
  playSynthWin,
  playSynthJackpot,
  playIntroWhoosh,
  playCyberGlitch,
  playCyberSweep,
  playCyberReveal,
  playCyberBass,
  playCyberWow,
  playMagicReveal,
  playUiOpen,
  playUiClose,
  playLeverPull,
  playLeverRelease,
  playSynthFootstep,
  playReelStop
} from './compatibility'

// ============================================
// Legacy Exports (DO NOT USE IN NEW CODE)
// ============================================

// Re-export legacy AudioSystem for backwards compatibility
// (Not used in codebase, but exported in case external code depends on it)
export { audioSystem, SOUNDS, type SoundId, type BusId } from './AudioSystem'

// Re-export useAudio hook (uses legacy AudioSystem)
// TODO: Update useAudio.ts to use UnifiedAudioSystem
export {
  useAudio,
  playSound,
  playFootstep,
  playNavTick,
  playNavSelect,
  playNavBack,
  playModalOpen,
  playModalClose,
  playContentReveal,
  playPhaseTransition,
  startDucking,
  stopDucking,
  getFrequencyData, // Keep original name for backwards compatibility
  getAverageVolume,
  getBassLevel // Keep original name for backwards compatibility
} from './useAudio'
