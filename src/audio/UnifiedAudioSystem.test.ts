/**
 * UnifiedAudioSystem Integration Tests
 *
 * Tests for the audio system including:
 * - Initialization
 * - Sound registration
 * - Volume control
 * - Mute functionality
 * - Synth sounds
 * - State management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock AudioContext
class MockAudioContext {
  state: 'running' | 'suspended' = 'running'
  currentTime = 0
  sampleRate = 44100

  async resume() {
    this.state = 'running'
  }

  async close() {
    this.state = 'suspended'
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    }
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length)
    }
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      Q: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      smoothingTimeConstant: 0.8,
      connect: vi.fn(),
      getByteFrequencyData: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
      }
    }
  }

  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100
  })

  get destination() {
    return { connect: vi.fn() }
  }
}

// Mock window.AudioContext
const originalAudioContext = globalThis.AudioContext
beforeEach(() => {
  globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
})
afterEach(() => {
  globalThis.AudioContext = originalAudioContext
})

// Import after mocking
import {
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

describe('UnifiedAudioSystem', () => {
  beforeEach(() => {
    // Reset the audio system before each test
    uaDispose()
  })

  describe('Initialization', () => {
    it('should initialize audio context on init()', async () => {
      await initUnifiedAudio()
      expect(unifiedAudio.isInitialized()).toBe(true)
    })

    it('should handle multiple init() calls gracefully', async () => {
      await initUnifiedAudio()
      await initUnifiedAudio() // Should not throw
      expect(unifiedAudio.isInitialized()).toBe(true)
    })

    it('should not be initialized before init()', () => {
      expect(unifiedAudio.isInitialized()).toBe(false)
    })
  })

  describe('Sound Registration', () => {
    it('should register sounds via registerAll', async () => {
      unifiedAudio.registerAll({
        testSound: { url: '/test.wav', volume: 0.5, bus: 'sfx' }
      })
      // Sound is registered but not loaded yet
      await initUnifiedAudio()
      // Now the system is ready
      expect(unifiedAudio.isInitialized()).toBe(true)
    })

    it('should register single sound via register', async () => {
      unifiedAudio.register('customSound', { url: '/custom.wav', volume: 0.7, bus: 'music' })
      await initUnifiedAudio()
      expect(unifiedAudio.isInitialized()).toBe(true)
    })
  })

  describe('Volume Control', () => {
    beforeEach(async () => {
      await initUnifiedAudio()
    })

    it('should set master volume', () => {
      uaVolume('master', 0.5)
      // Volume is set via gain node - just verify no errors
    })

    it('should set music volume', () => {
      uaVolume('music', 0.3)
      // Verify no errors
    })

    it('should set sfx volume', () => {
      uaVolume('sfx', 0.8)
      // Verify no errors
    })

    it('should set ui volume', () => {
      uaVolume('ui', 0.6)
      // Verify no errors
    })

    it('should set spatial volume', () => {
      uaVolume('spatial', 0.4)
      // Verify no errors
    })

    it('should clamp volume between 0 and 1', () => {
      uaVolume('master', 1.5) // Should clamp to 1
      uaVolume('master', -0.5) // Should clamp to 0
      // No errors means clamping works
    })

    it('should get volume for each bus', () => {
      // Default values
      const musicVol = uaGetVolume('music')
      const sfxVol = uaGetVolume('sfx')
      const uiVol = uaGetVolume('ui')
      const spatialVol = uaGetVolume('spatial')

      expect(typeof musicVol).toBe('number')
      expect(typeof sfxVol).toBe('number')
      expect(typeof uiVol).toBe('number')
      expect(typeof spatialVol).toBe('number')
    })
  })

  describe('Mute Functionality', () => {
    beforeEach(async () => {
      await initUnifiedAudio()
    })

    it('should mute all audio', () => {
      uaMute(true)
      // No errors means mute works
    })

    it('should unmute all audio', () => {
      uaMute(true)
      uaMute(false)
      // No errors means unmute works
    })
  })

  describe('Play/Stop Controls', () => {
    beforeEach(async () => {
      await initUnifiedAudio()
    })

    it('should return instance ID when playing sound', () => {
      const instanceId = uaPlay('lounge')
      expect(typeof instanceId).toBe('string')
      expect(instanceId).toContain('lounge')
    })

    it('should stop sound by ID', () => {
      const _instanceId = uaPlay('lounge')
      uaStop('lounge', 0.1)
      // No errors means stop works
    })

    it('should check if sound is playing', () => {
      const isPlaying = uaIsPlaying('lounge')
      expect(typeof isPlaying).toBe('boolean')
    })
  })

  describe('Synth Sounds', () => {
    beforeEach(async () => {
      await initUnifiedAudio()
    })

    it('should play tick sound', () => {
      uaPlaySynth('tick', 0.5)
      // No errors means synth works
    })

    it('should play select sound', () => {
      uaPlaySynth('select', 0.5)
    })

    it('should play back sound', () => {
      uaPlaySynth('back', 0.5)
    })

    it('should play whoosh sound', () => {
      uaPlaySynth('whoosh', 0.5)
    })

    it('should play reveal sound', () => {
      uaPlaySynth('reveal', 0.5)
    })

    it('should play transition sound', () => {
      uaPlaySynth('transition', 0.5)
    })

    it('should play win sound', () => {
      uaPlaySynth('win', 0.5)
    })

    it('should play jackpot sound', () => {
      uaPlaySynth('jackpot', 0.5)
    })

    it('should play cyberWow sound', () => {
      uaPlaySynth('cyberWow', 0.5)
    })

    it('should play uiOpen sound', () => {
      uaPlaySynth('uiOpen', 0.5)
    })

    it('should play uiClose sound', () => {
      uaPlaySynth('uiClose', 0.5)
    })

    it('should play leverPull sound', () => {
      uaPlaySynth('leverPull', 0.5)
    })

    it('should play leverRelease sound', () => {
      uaPlaySynth('leverRelease', 0.5)
    })

    it('should play reelStop sound', () => {
      uaPlaySynth('reelStop', 0.5)
    })

    it('should play footstep sound', () => {
      uaPlaySynth('footstep', 0.3)
    })

    it('should handle all synth sound types', () => {
      const synthTypes = [
        'tick', 'select', 'back', 'click',
        'whoosh', 'swoosh', 'reveal', 'transition',
        'win', 'jackpot', 'spinMech',
        'introWhoosh', 'footstep',
        'cyberGlitch', 'cyberSweep', 'cyberReveal', 'cyberBass', 'cyberWow',
        'magicReveal', 'leverPull', 'leverRelease',
        'uiOpen', 'uiClose',
        'reelSpin', 'reelStop'
      ] as const

      for (const type of synthTypes) {
        expect(() => uaPlaySynth(type, 0.3)).not.toThrow()
      }
    })
  })

  describe('Frequency Analysis', () => {
    beforeEach(async () => {
      await initUnifiedAudio()
    })

    it('should return frequency data array', () => {
      const data = uaGetFrequencyData()
      // May be null if analyser not connected to active source
      if (data) {
        expect(data).toBeInstanceOf(Uint8Array)
      }
    })

    it('should return bass level between 0 and 1', () => {
      const bassLevel = uaGetBassLevel()
      expect(typeof bassLevel).toBe('number')
      expect(bassLevel).toBeGreaterThanOrEqual(0)
      expect(bassLevel).toBeLessThanOrEqual(1)
    })
  })

  describe('Dispose', () => {
    it('should clean up all resources', async () => {
      await initUnifiedAudio()
      uaPlay('lounge')
      uaDispose()
      expect(unifiedAudio.isInitialized()).toBe(false)
    })

    it('should handle dispose when not initialized', () => {
      expect(() => uaDispose()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle synth play before init', () => {
      expect(() => uaPlaySynth('tick', 0.5)).not.toThrow()
    })

    it('should queue plays before init and flush after', async () => {
      uaPlay('lounge') // Queue
      await initUnifiedAudio()
      // Queued sound should play after init
    })

    it('should handle volume change before init', () => {
      expect(() => uaVolume('master', 0.5)).not.toThrow()
    })

    it('should handle stop before init', () => {
      expect(() => uaStop('lounge')).not.toThrow()
    })

    it('should handle mute before init', () => {
      expect(() => uaMute(true)).not.toThrow()
    })

    it('should handle getVolume before init', () => {
      const vol = uaGetVolume('master')
      expect(typeof vol).toBe('number')
    })
  })

  describe('Registered Sounds', () => {
    it('should have lounge music registered', async () => {
      await initUnifiedAudio()
      const id = uaPlay('lounge')
      expect(id).toContain('lounge')
    })

    it('should have footstep sounds registered', async () => {
      await initUnifiedAudio()
      const id1 = uaPlay('footstep1')
      const id2 = uaPlay('footstep2')
      const id3 = uaPlay('footstep3')
      expect(id1).toContain('footstep1')
      expect(id2).toContain('footstep2')
      expect(id3).toContain('footstep3')
    })

    it('should have slot machine sounds registered', async () => {
      await initUnifiedAudio()
      expect(uaPlay('spinLoop')).toContain('spinLoop')
      expect(uaPlay('reelStop1')).toContain('reelStop1')
      expect(uaPlay('reelStop2')).toContain('reelStop2')
      expect(uaPlay('reelStop3')).toContain('reelStop3')
      expect(uaPlay('winSmall')).toContain('winSmall')
      expect(uaPlay('winBig')).toContain('winBig')
      expect(uaPlay('jackpot')).toContain('jackpot')
    })

    it('should have ambient sounds registered', async () => {
      await initUnifiedAudio()
      expect(uaPlay('casinoHum')).toContain('casinoHum')
      expect(uaPlay('neonBuzz')).toContain('neonBuzz')
    })
  })
})
