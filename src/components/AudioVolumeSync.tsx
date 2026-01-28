/**
 * AudioVolumeSync - Global volume controller
 *
 * Synchronizes Zustand audio store with AudioSystem bus volumes
 * Allows unified volume control for music and SFX across:
 * - Lounge ambient music
 * - Portfolio video audio tracks
 * - All game SFX
 */

import { useEffect } from 'react'
import { useAudioStore } from '../store/audio'
import { audioSystem } from '../audio/AudioSystem'

export function AudioVolumeSync() {
  const musicVolume = useAudioStore((state) => state.musicVolume)
  const sfxVolume = useAudioStore((state) => state.sfxVolume)

  // Sync music volume with ambient bus
  useEffect(() => {
    if (audioSystem.isInitialized()) {
      audioSystem.setBusVolume('ambient', musicVolume)
    }
  }, [musicVolume])

  // Sync SFX volume with sfx/slots/ui buses
  useEffect(() => {
    if (audioSystem.isInitialized()) {
      audioSystem.setBusVolume('sfx', sfxVolume)
      audioSystem.setBusVolume('slots', sfxVolume)
      audioSystem.setBusVolume('ui', sfxVolume * 0.8) // UI slightly quieter
    }
  }, [sfxVolume])

  return null // This component only handles side effects
}
