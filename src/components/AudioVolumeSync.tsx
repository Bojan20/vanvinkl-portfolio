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

  // Initial sync on mount + whenever volume changes
  useEffect(() => {
    const syncVolumes = () => {
      if (unifiedAudio.isInitialized()) {
        unifiedAudio.setVolume('music', musicVolume)
        unifiedAudio.setVolume('sfx', sfxVolume)
        unifiedAudio.setVolume('ui', sfxVolume)
      }
    }

    // Immediate sync
    syncVolumes()

    // Also sync after short delay (in case audio initializes late)
    const timer = setTimeout(syncVolumes, 100)
    return () => clearTimeout(timer)
  }, [musicVolume, sfxVolume])

  return null // This component only handles side effects
}
