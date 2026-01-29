/**
 * Audio System - Unified Public API
 *
 * Single AudioContext system for all sounds:
 * - External sounds (lounge, slots, footsteps)
 * - Procedural synth sounds (UI, transitions, effects)
 * - Unified bus routing (music, sfx, ui, spatial)
 * - Global volume control
 */

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
  uaGetBassLevel,
  uaDispose
} from './UnifiedAudioSystem'
