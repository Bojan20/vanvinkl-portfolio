/**
 * AudioVolumeSync - Global volume controller
 *
 * Synchronizes Zustand audio store with UnifiedAudioSystem bus volumes
 * Allows unified volume control for music and SFX across:
 * - Lounge ambient music
 * - Portfolio video audio tracks
 * - All game SFX (external + synth)
 * - UI sounds (procedural synth)
 */

import { useEffect } from 'react'
import { useAudioStore } from '../store/audio'
import { unifiedAudio } from '../audio'

export function AudioVolumeSync() {
  const musicVolume = useAudioStore((state) => state.musicVolume)
  const sfxVolume = useAudioStore((state) => state.sfxVolume)

  // Sync music volume with music bus
  useEffect(() => {
    if (unifiedAudio.isInitialized()) {
      unifiedAudio.setVolume('music', musicVolume)
    }
  }, [musicVolume])

  // Sync SFX volume with sfx AND ui buses
  useEffect(() => {
    if (unifiedAudio.isInitialized()) {
      unifiedAudio.setVolume('sfx', sfxVolume)
      unifiedAudio.setVolume('ui', sfxVolume) // UI synth sounds use same volume
    }
  }, [sfxVolume])

  return null // This component only handles side effects
}
