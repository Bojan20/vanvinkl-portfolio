/**
 * Audio System - Public API
 */

export { audioSystem, SOUNDS, type SoundId, type BusId } from './AudioSystem'
export {
  useAudio,
  playSound,
  playFootstep,
  playReelStop,
  playNavTick,
  playNavSelect,
  playNavBack,
  playModalOpen,
  playModalClose,
  playContentReveal,
  playPhaseTransition,
  startDucking,
  stopDucking,
  getFrequencyData,
  getAverageVolume,
  getBassLevel
} from './useAudio'

// Synth sounds for when audio files don't exist
export {
  synthSounds,
  playSynthTick,
  playSynthSelect,
  playSynthBack,
  playSynthWhoosh,
  playSynthSwoosh,
  playSynthReveal,
  playSynthTransition,
  playSynthWin,
  playSynthJackpot
} from './SynthSounds'
