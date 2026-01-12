/**
 * VanVinkl Casino - Audio DSP Controller
 *
 * Lightweight audio manager that:
 * - Never blocks the main thread
 * - Lazy loads sounds on demand
 * - Provides simple play/stop API
 * - Handles browser autoplay policy
 * - Queues sounds until ready
 */

type SoundConfig = {
  url: string
  volume?: number
  loop?: boolean
  bus?: 'music' | 'sfx' | 'ui'
}

type PlayingSound = {
  source: AudioBufferSourceNode
  gain: GainNode
  startTime: number
}

class AudioDSP {
  private ctx: AudioContext | null = null
  private buffers = new Map<string, AudioBuffer>()
  private playing = new Map<string, PlayingSound>()
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>()

  // Bus gains
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private uiGain: GainNode | null = null

  // Analyzer for visualization
  private analyser: AnalyserNode | null = null
  private frequencyData: Uint8Array | null = null

  // State
  private ready = false
  private muted = false
  private pendingPlays: Array<{ id: string; config: SoundConfig; instanceId?: string }> = []

  // Registered sounds
  private sounds = new Map<string, SoundConfig>()

  /**
   * Register a sound (doesn't load it yet)
   */
  register(id: string, config: SoundConfig): void {
    this.sounds.set(id, config)
  }

  /**
   * Register multiple sounds at once
   */
  registerAll(sounds: Record<string, SoundConfig>): void {
    for (const [id, config] of Object.entries(sounds)) {
      this.sounds.set(id, config)
    }
  }

  /**
   * Initialize audio context (call after user interaction)
   */
  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
      return
    }

    try {
      this.ctx = new AudioContext({ latencyHint: 'interactive' })

      // Create bus structure
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0.4
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 0.7
      this.sfxGain.connect(this.masterGain)

      this.uiGain = this.ctx.createGain()
      this.uiGain.gain.value = 0.6
      this.uiGain.connect(this.masterGain)

      // Create analyzer for visualization (connected to music bus)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      // Connect music to analyzer (before master)
      this.musicGain.connect(this.analyser)

      // Resume if needed
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }

      this.ready = true
      console.log('[AudioDSP] Ready')

      // Play any pending sounds
      this.flushPending()
    } catch (e) {
      console.warn('[AudioDSP] Init failed:', e)
    }
  }

  /**
   * Load a sound (lazy, only when needed)
   */
  private async load(id: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(id)) {
      return this.buffers.get(id)!
    }

    // Already loading?
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!
    }

    const config = this.sounds.get(id)
    if (!config) {
      console.warn(`[AudioDSP] Unknown sound: ${id}`)
      return null
    }

    const promise = this.fetchAndDecode(config.url)
    this.loadingPromises.set(id, promise)

    const buffer = await promise
    if (buffer) {
      this.buffers.set(id, buffer)
    }
    this.loadingPromises.delete(id)

    return buffer
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null

    try {
      const response = await fetch(url)
      if (!response.ok) return null
      const data = await response.arrayBuffer()
      return await this.ctx.decodeAudioData(data)
    } catch {
      return null
    }
  }

  /**
   * Play a sound
   * @param id - Sound ID (must be registered)
   * @param instanceId - Optional unique ID for this instance (for stopping specific plays)
   * @returns Instance ID
   */
  play(id: string, instanceId?: string): string {
    const iid = instanceId || `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    if (!this.ready || this.muted) {
      // Queue for later
      const config = this.sounds.get(id)
      if (config) {
        this.pendingPlays.push({ id, config, instanceId: iid })
      }
      return iid
    }

    // Fire and forget - don't block
    this.playAsync(id, iid)
    return iid
  }

  private async playAsync(id: string, instanceId: string): Promise<void> {
    if (!this.ctx) {
      console.warn('[AudioDSP] No context for playback')
      return
    }
    if (this.muted) {
      console.log('[AudioDSP] Muted, skipping:', id)
      return
    }

    const config = this.sounds.get(id)
    if (!config) {
      console.warn('[AudioDSP] Unknown sound:', id)
      return
    }

    console.log('[AudioDSP] Loading:', id, config.url)
    const buffer = await this.load(id)
    if (!buffer) {
      console.warn('[AudioDSP] Failed to load buffer:', id)
      return
    }
    if (!this.ctx) return
    console.log('[AudioDSP] Playing:', id)

    // Create nodes
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = config.loop ?? false

    const gain = this.ctx.createGain()
    gain.gain.value = config.volume ?? 1

    // Route to correct bus
    const bus = config.bus === 'music' ? this.musicGain :
                config.bus === 'ui' ? this.uiGain : this.sfxGain

    source.connect(gain)
    gain.connect(bus!)

    // Track it
    this.playing.set(instanceId, {
      source,
      gain,
      startTime: this.ctx.currentTime
    })

    // Cleanup on end
    source.onended = () => {
      this.playing.delete(instanceId)
    }

    source.start(0)
  }

  /**
   * Stop a specific sound instance
   */
  stop(instanceId: string, fadeTime = 0.1): void {
    const sound = this.playing.get(instanceId)
    if (!sound || !this.ctx) return

    const now = this.ctx.currentTime
    sound.gain.gain.setValueAtTime(sound.gain.gain.value, now)
    sound.gain.gain.linearRampToValueAtTime(0, now + fadeTime)

    setTimeout(() => {
      try {
        sound.source.stop()
        sound.source.disconnect()
        sound.gain.disconnect()
      } catch {
        // Already stopped
      }
      this.playing.delete(instanceId)
    }, fadeTime * 1000 + 50)
  }

  /**
   * Stop all instances of a sound
   */
  stopAll(id: string, fadeTime = 0.1): void {
    for (const [instanceId] of this.playing) {
      if (instanceId.startsWith(id)) {
        this.stop(instanceId, fadeTime)
      }
    }
  }

  /**
   * Set volume for a bus
   */
  setVolume(bus: 'master' | 'music' | 'sfx' | 'ui', volume: number, fadeTime = 0.1): void {
    if (!this.ctx) return

    const gain = bus === 'master' ? this.masterGain :
                 bus === 'music' ? this.musicGain :
                 bus === 'sfx' ? this.sfxGain : this.uiGain

    if (!gain) return

    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), now + fadeTime)
  }

  /**
   * Get current volume for a bus
   */
  getVolume(bus: 'master' | 'music' | 'sfx' | 'ui'): number {
    const gain = bus === 'master' ? this.masterGain :
                 bus === 'music' ? this.musicGain :
                 bus === 'sfx' ? this.sfxGain : this.uiGain

    return gain?.gain.value ?? 0.5
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1
    }

    if (!muted) {
      this.flushPending()
    }
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(id: string): boolean {
    for (const instanceId of this.playing.keys()) {
      if (instanceId.startsWith(id)) return true
    }
    return false
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null
    this.analyser.getByteFrequencyData(this.frequencyData)
    return this.frequencyData
  }

  /**
   * Get bass level (0-1) for reactive elements
   */
  getBassLevel(): number {
    const data = this.getFrequencyData()
    if (!data) return 0
    // Average of first 4 frequency bins (low frequencies)
    let sum = 0
    for (let i = 0; i < 4; i++) {
      sum += data[i]
    }
    return (sum / 4) / 255
  }

  /**
   * Preload sounds (optional, for critical sounds)
   */
  async preload(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.load(id)))
  }

  private flushPending(): void {
    const pending = [...this.pendingPlays]
    this.pendingPlays = []

    for (const { id, instanceId } of pending) {
      this.playAsync(id, instanceId || id)
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    for (const instanceId of this.playing.keys()) {
      this.stop(instanceId, 0)
    }

    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }

    this.buffers.clear()
    this.playing.clear()
    this.sounds.clear()
    this.ready = false
  }
}

// Singleton
export const audioDSP = new AudioDSP()

// ============================================
// QUICK SETUP - Register all VanVinkl sounds
// ============================================

audioDSP.registerAll({
  // Music (MP3 for faster loading - 4MB vs 48MB WAV)
  lounge: { url: '/audio/ambient/lounge.mp3', volume: 0.35, loop: true, bus: 'music' },
  casinoHum: { url: '/audio/ambient/casino-hum.wav', volume: 0.2, loop: true, bus: 'music' },
  neonBuzz: { url: '/audio/ambient/neon-buzz.wav', volume: 0.15, loop: true, bus: 'music' },

  // Slots
  spinLoop: { url: '/audio/slots/spin-loop.wav', volume: 0.5, loop: true, bus: 'sfx' },
  reelStop1: { url: '/audio/slots/reel-stop-1.wav', volume: 0.7, bus: 'sfx' },
  reelStop2: { url: '/audio/slots/reel-stop-2.wav', volume: 0.7, bus: 'sfx' },
  reelStop3: { url: '/audio/slots/reel-stop-3.wav', volume: 0.7, bus: 'sfx' },
  winSmall: { url: '/audio/slots/win-small.wav', volume: 0.6, bus: 'sfx' },
  winBig: { url: '/audio/slots/win-big.wav', volume: 0.8, bus: 'sfx' },
  jackpot: { url: '/audio/slots/jackpot.wav', volume: 1.0, bus: 'sfx' },

  // UI
  hover: { url: '/audio/ui/hover.wav', volume: 0.4, bus: 'ui' },
  click: { url: '/audio/ui/click.wav', volume: 0.5, bus: 'ui' },
  modalOpen: { url: '/audio/ui/modal-open.wav', volume: 0.6, bus: 'ui' },
  modalClose: { url: '/audio/ui/modal-close.wav', volume: 0.5, bus: 'ui' },

  // Player
  footstep1: { url: '/audio/player/footstep-1.wav', volume: 0.5, bus: 'sfx' },
  footstep2: { url: '/audio/player/footstep-2.wav', volume: 0.5, bus: 'sfx' },
  footstep3: { url: '/audio/player/footstep-3.wav', volume: 0.5, bus: 'sfx' },
})

// ============================================
// SIMPLE API - Just import and use
// ============================================

/**
 * Initialize audio (call after user interaction)
 */
export async function initAudio(): Promise<void> {
  await audioDSP.init()
}

/**
 * Play a sound
 * @example
 * dsp.play('click')
 * dsp.play('lounge')  // Music loops automatically
 * const id = dsp.play('footstep1')  // Get instance ID
 */
export function dspPlay(id: string): string {
  return audioDSP.play(id)
}

/**
 * Stop a sound
 * @example
 * dsp.stop('lounge')  // Stops all lounge instances
 * dsp.stop(instanceId)  // Stops specific instance
 */
export function dspStop(id: string, fadeTime = 0.3): void {
  audioDSP.stopAll(id, fadeTime)
}

/**
 * Set volume
 * @example
 * dsp.volume('music', 0.5)
 * dsp.volume('master', 0)  // Mute
 */
export function dspVolume(bus: 'master' | 'music' | 'sfx' | 'ui', volume: number): void {
  audioDSP.setVolume(bus, volume)
}

export function dspGetVolume(bus: 'master' | 'music' | 'sfx' | 'ui'): number {
  return audioDSP.getVolume(bus)
}

/**
 * Mute/unmute
 */
export function dspMute(muted: boolean): void {
  audioDSP.setMuted(muted)
}

/**
 * Check if playing
 */
export function dspIsPlaying(id: string): boolean {
  return audioDSP.isPlaying(id)
}

/**
 * Add custom sound
 * @example
 * dsp.add('mySound', { url: '/audio/custom.wav', volume: 0.5, bus: 'sfx' })
 */
export function dspAdd(id: string, config: SoundConfig): void {
  audioDSP.register(id, config)
}

/**
 * Preload critical sounds
 * @example
 * dsp.preload(['click', 'hover', 'lounge'])
 */
export async function dspPreload(ids: string[]): Promise<void> {
  await audioDSP.preload(ids)
}

/**
 * Get frequency data for visualization
 */
export function dspGetFrequencyData(): Uint8Array | null {
  return audioDSP.getFrequencyData()
}

/**
 * Get bass level (0-1) for reactive elements
 */
export function dspGetBassLevel(): number {
  return audioDSP.getBassLevel()
}
