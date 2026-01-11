/**
 * React hook for audio system
 *
 * Usage:
 *   const audio = useAudio()
 *   audio.play('click')
 *   audio.playSpatial('neon-1', 'neonBuzz', [5, 2, 0], { loop: true })
 */

import { useCallback, useEffect, useRef } from 'react'
import { audioSystem, SoundId, BusId } from './AudioSystem'
import {
  playSynthTick,
  playSynthSelect,
  playSynthBack,
  playSynthWhoosh,
  playSynthSwoosh,
  playSynthReveal,
  playSynthTransition
} from './SynthSounds'

interface UseAudioReturn {
  // Core playback
  play: (soundId: SoundId, options?: {
    volume?: number
    loop?: boolean
    playbackRate?: number
  }) => void

  // 3D spatial audio
  playSpatial: (
    id: string,
    soundId: SoundId,
    position: [number, number, number],
    options?: {
      volume?: number
      loop?: boolean
      refDistance?: number
      maxDistance?: number
      rolloffFactor?: number
    }
  ) => void

  updateSpatialPosition: (id: string, position: [number, number, number]) => void
  stopSpatial: (id: string) => void

  // Listener (camera)
  updateListener: (
    position: [number, number, number],
    forward: [number, number, number],
    up?: [number, number, number]
  ) => void

  // Volume control
  setBusVolume: (busId: BusId, volume: number) => void
  getBusVolume: (busId: BusId) => number
  setMuted: (muted: boolean) => void

  // State
  isReady: boolean
  init: () => Promise<void>
}

export function useAudio(): UseAudioReturn {
  const initRef = useRef(false)

  // Initialize on first user interaction
  const init = useCallback(async () => {
    if (initRef.current) return
    initRef.current = true
    await audioSystem.init()
  }, [])

  // Auto-init on click/keydown/touch (browser autoplay policy)
  useEffect(() => {
    const handleInteraction = async () => {
      if (!audioSystem.isInitialized()) {
        await init()
        console.log('[Audio] Initialized on user interaction')
      } else {
        await audioSystem.resume()
      }
      // Remove all listeners after first interaction
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }

    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [init])

  const play = useCallback((soundId: SoundId, options?: {
    volume?: number
    loop?: boolean
    playbackRate?: number
  }) => {
    audioSystem.play(soundId, options)
  }, [])

  const playSpatial = useCallback((
    id: string,
    soundId: SoundId,
    position: [number, number, number],
    options?: {
      volume?: number
      loop?: boolean
      refDistance?: number
      maxDistance?: number
      rolloffFactor?: number
    }
  ) => {
    audioSystem.playSpatial(id, soundId, position, options)
  }, [])

  const updateSpatialPosition = useCallback((id: string, position: [number, number, number]) => {
    audioSystem.updateSpatialPosition(id, position)
  }, [])

  const stopSpatial = useCallback((id: string) => {
    audioSystem.stopSpatial(id)
  }, [])

  const updateListener = useCallback((
    position: [number, number, number],
    forward: [number, number, number],
    up?: [number, number, number]
  ) => {
    audioSystem.updateListener(position, forward, up)
  }, [])

  const setBusVolume = useCallback((busId: BusId, volume: number) => {
    audioSystem.setBusVolume(busId, volume)
  }, [])

  const getBusVolume = useCallback((busId: BusId) => {
    return audioSystem.getBusVolume(busId)
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    audioSystem.setMuted(muted)
  }, [])

  return {
    play,
    playSpatial,
    updateSpatialPosition,
    stopSpatial,
    updateListener,
    setBusVolume,
    getBusVolume,
    setMuted,
    isReady: audioSystem.isInitialized(),
    init
  }
}

// Shorthand for quick sound triggers
export function playSound(soundId: SoundId, volume = 1): void {
  audioSystem.play(soundId, { volume })
}

// Footstep helper - cycles through footstep sounds
let footstepIndex = 0
export function playFootstep(volume = 0.5): void {
  const sounds: SoundId[] = ['footstep1', 'footstep2', 'footstep3']
  audioSystem.play(sounds[footstepIndex], { volume })
  footstepIndex = (footstepIndex + 1) % sounds.length
}

// Reel stop helper - plays appropriate reel stop sound
export function playReelStop(reelIndex: number, volume = 0.7): void {
  const sounds: SoundId[] = ['reelStop1', 'reelStop2', 'reelStop3']
  const soundIndex = Math.min(reelIndex, sounds.length - 1)
  audioSystem.play(sounds[soundIndex], { volume })
}

// ============================================
// SLOT NAVIGATION SOUND HELPERS
// With synth fallback for missing audio files
// ============================================

// Navigation tick - arrow key movement
export function playNavTick(volume = 0.4): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('navTick', { volume, playbackRate: 1.2 })
  }
  // Always play synth as backup (silent if file loaded)
  playSynthTick(volume)
}

// Navigation select - Enter key
export function playNavSelect(volume = 0.6): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('navSelect', { volume })
  }
  playSynthSelect(volume)
}

// Navigation back - Escape key
export function playNavBack(volume = 0.5): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('navBack', { volume })
  }
  playSynthBack(volume)
}

// Modal open with whoosh
export function playModalOpen(volume = 0.6): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('modalOpen', { volume })
  }
  playSynthWhoosh(volume)
}

// Modal close
export function playModalClose(volume = 0.5): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('modalClose', { volume })
  }
  playSynthSwoosh(volume)
}

// Content reveal (phase transition)
export function playContentReveal(volume = 0.5): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('contentReveal', { volume })
  }
  playSynthReveal(volume)
}

// Phase transition (intro -> spinning -> result -> content)
export function playPhaseTransition(volume = 0.4): void {
  if (audioSystem.isInitialized()) {
    audioSystem.play('phaseTransition', { volume })
  }
  playSynthTransition(volume)
}
