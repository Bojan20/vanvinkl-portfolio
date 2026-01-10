'use client'

import { useRef, useEffect } from 'react'
import { PositionalAudio } from '@react-three/drei'
import * as THREE from 'three'

interface SpatialAudioSystemProps {
  machinePositions: Array<{ id: string; pos: [number, number, number] }>
  nearMachine?: string | null
}

/**
 * Spatial Audio System
 *
 * Features:
 * - Positional audio for each slot machine
 * - Attract mode loops (ambient jingles)
 * - Proximity-based volume
 * - 3D spatialization (distance attenuation)
 *
 * NOTE: Audio files must be placed in /public/sounds/
 */
export function SpatialAudioSystem({ machinePositions, nearMachine }: SpatialAudioSystemProps) {
  const audioRefs = useRef<(THREE.PositionalAudio | null)[]>([])

  // Adjust volume based on proximity
  useEffect(() => {
    audioRefs.current.forEach((audio, i) => {
      if (!audio) return

      const machine = machinePositions[i]
      const isNear = machine?.id === nearMachine

      // Boost volume when near (smooth transition)
      const targetVolume = isNear ? 0.8 : 0.3

      // Smooth lerp
      if (audio.gain.gain.value !== targetVolume) {
        audio.gain.gain.linearRampToValueAtTime(
          targetVolume,
          audio.context.currentTime + 0.5
        )
      }
    })
  }, [nearMachine, machinePositions])

  return (
    <group>
      {/* Per-machine ambient loops */}
      {machinePositions.map((machine, i) => (
        <group key={machine.id} position={machine.pos}>
          <PositionalAudio
            ref={(el) => {
              audioRefs.current[i] = el
            }}
            url={`/sounds/slot_attract_${(i % 3) + 1}.mp3`} // 3 variations
            distance={8} // Max audible distance
            loop
            autoplay
          />
        </group>
      ))}

      {/* Ambient casino atmosphere (non-positional) */}
      <group position={[0, 2, 0]}>
        <PositionalAudio
          url="/sounds/casino_ambient.mp3"
          distance={30}
          loop
          autoplay
        />
      </group>
    </group>
  )
}

/**
 * UI Feedback Sounds (non-spatial)
 *
 * Usage:
 * import { playUISound } from '@/components/3d/SpatialAudioSystem'
 * playUISound('click')
 */

let audioContext: AudioContext | null = null
const soundBuffers: Map<string, AudioBuffer> = new Map()

async function loadSound(url: string): Promise<AudioBuffer> {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return await audioContext.decodeAudioData(arrayBuffer)
}

export async function preloadUISounds() {
  const sounds = [
    '/sounds/ui_click.mp3',
    '/sounds/ui_hover.mp3',
    '/sounds/ui_select.mp3',
    '/sounds/footstep.mp3'
  ]

  await Promise.all(
    sounds.map(async (url) => {
      try {
        const buffer = await loadSound(url)
        soundBuffers.set(url, buffer)
      } catch (err) {
        console.warn(`Failed to load sound: ${url}`, err)
      }
    })
  )
}

export function playUISound(
  soundId: 'click' | 'hover' | 'select' | 'footstep',
  volume = 1.0
) {
  if (!audioContext) return

  const urlMap = {
    click: '/sounds/ui_click.mp3',
    hover: '/sounds/ui_hover.mp3',
    select: '/sounds/ui_select.mp3',
    footstep: '/sounds/footstep.mp3'
  }

  const url = urlMap[soundId]
  const buffer = soundBuffers.get(url)

  if (!buffer) {
    console.warn(`Sound not loaded: ${soundId}`)
    return
  }

  const source = audioContext.createBufferSource()
  const gainNode = audioContext.createGain()

  source.buffer = buffer
  gainNode.gain.value = volume

  source.connect(gainNode)
  gainNode.connect(audioContext.destination)

  source.start(0)
}

/**
 * Dynamic Music Stem System
 *
 * Features:
 * - 3 stems: ambient, tension, celebration
 * - Crossfade based on game state
 * - Smooth transitions
 */

class MusicStemSystem {
  private stems: Map<string, HTMLAudioElement> = new Map()
  private initialized = false

  async init() {
    if (this.initialized) return

    const stemUrls = {
      ambient: '/sounds/music_ambient.mp3',
      tension: '/sounds/music_tension.mp3',
      celebration: '/sounds/music_celebration.mp3'
    }

    for (const [key, url] of Object.entries(stemUrls)) {
      const audio = new Audio(url)
      audio.loop = true
      audio.volume = 0
      this.stems.set(key, audio)

      // Preload
      try {
        await audio.load()
      } catch (err) {
        console.warn(`Failed to load music stem: ${key}`, err)
      }
    }

    this.initialized = true
  }

  play() {
    this.stems.forEach((audio) => {
      audio.play().catch(() => {
        // Silent fail (user interaction required)
      })
    })
  }

  stop() {
    this.stems.forEach((audio) => audio.pause())
  }

  setVolumes(volumes: { ambient?: number; tension?: number; celebration?: number }) {
    for (const [key, volume] of Object.entries(volumes)) {
      const audio = this.stems.get(key)
      if (audio && volume !== undefined) {
        // Smooth transition
        const currentVolume = audio.volume
        const targetVolume = volume
        const duration = 1000 // 1 second

        const startTime = Date.now()
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          audio.volume = currentVolume + (targetVolume - currentVolume) * progress

          if (progress >= 1) {
            clearInterval(interval)
          }
        }, 50)
      }
    }
  }
}

export const musicSystem = new MusicStemSystem()
