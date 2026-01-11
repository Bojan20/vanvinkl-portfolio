/**
 * VanVinkl Casino - Zero Latency Audio System
 *
 * Architecture:
 * - Pre-loaded AudioBuffers (no decode delay)
 * - Sound pools (zero allocation on play)
 * - Spatial audio (3D positioned sounds)
 * - Bus routing (ambient, sfx, slots, ui)
 */

// Sound definitions
export const SOUNDS = {
  // Ambient
  casinoHum: '/audio/ambient/casino-hum.wav',
  neonBuzz: '/audio/ambient/neon-buzz.wav',

  // Slots
  spinLoop: '/audio/slots/spin-loop.wav',
  reelStop1: '/audio/slots/reel-stop-1.wav',
  reelStop2: '/audio/slots/reel-stop-2.wav',
  reelStop3: '/audio/slots/reel-stop-3.wav',
  winSmall: '/audio/slots/win-small.wav',
  winBig: '/audio/slots/win-big.wav',
  jackpot: '/audio/slots/jackpot.wav',

  // UI
  hover: '/audio/ui/hover.wav',
  click: '/audio/ui/click.wav',
  modalOpen: '/audio/ui/modal-open.wav',

  // Player
  footstep1: '/audio/player/footstep-1.wav',
  footstep2: '/audio/player/footstep-2.wav',
  footstep3: '/audio/player/footstep-3.wav',
  sit: '/audio/player/sit.wav'
} as const

export type SoundId = keyof typeof SOUNDS

// Bus configuration
export type BusId = 'master' | 'ambient' | 'sfx' | 'slots' | 'ui'

interface SoundPoolEntry {
  source: AudioBufferSourceNode | null
  gain: GainNode
  panner: PannerNode | null
  playing: boolean
}

interface SpatialSource {
  panner: PannerNode
  gain: GainNode
  source: AudioBufferSourceNode | null
  soundId: SoundId
  loop: boolean
}

class AudioSystem {
  private context: AudioContext | null = null
  private buffers: Map<SoundId, AudioBuffer> = new Map()
  private buses: Map<BusId, GainNode> = new Map()
  private pools: Map<SoundId, SoundPoolEntry[]> = new Map()
  private spatialSources: Map<string, SpatialSource> = new Map()
  private listenerPosition: [number, number, number] = [0, 0, 0]
  private listenerForward: [number, number, number] = [0, 0, -1]
  private initialized = false
  private loadingPromise: Promise<void> | null = null

  // Pool size per sound
  private readonly POOL_SIZE = 8

  // Bus volumes (0-1)
  private busVolumes: Record<BusId, number> = {
    master: 0.8,
    ambient: 0.4,
    sfx: 0.7,
    slots: 0.8,
    ui: 0.6
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.initialized) return
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = this._init()
    return this.loadingPromise
  }

  private async _init(): Promise<void> {
    try {
      // Create context with lowest latency
      this.context = new AudioContext({
        latencyHint: 'interactive',
        sampleRate: 44100
      })

      // Resume if suspended (browser autoplay policy)
      if (this.context.state === 'suspended') {
        await this.context.resume()
      }

      // Create bus structure
      this.createBuses()

      // Pre-load all sounds
      await this.loadAllSounds()

      // Create sound pools
      this.createPools()

      this.initialized = true
      console.log('[AudioSystem] Initialized successfully')
    } catch (error) {
      console.error('[AudioSystem] Init failed:', error)
      throw error
    }
  }

  private createBuses(): void {
    if (!this.context) return

    // Master bus -> destination
    const masterGain = this.context.createGain()
    masterGain.gain.value = this.busVolumes.master
    masterGain.connect(this.context.destination)
    this.buses.set('master', masterGain)

    // Sub-buses -> master
    const busIds: BusId[] = ['ambient', 'sfx', 'slots', 'ui']
    for (const busId of busIds) {
      const gain = this.context.createGain()
      gain.gain.value = this.busVolumes[busId]
      gain.connect(masterGain)
      this.buses.set(busId, gain)
    }
  }

  private async loadAllSounds(): Promise<void> {
    if (!this.context) return

    const loadPromises = Object.entries(SOUNDS).map(async ([id, path]) => {
      try {
        const response = await fetch(path)
        if (!response.ok) {
          console.warn(`[AudioSystem] Sound not found: ${path}`)
          return
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)
        this.buffers.set(id as SoundId, audioBuffer)
      } catch (error) {
        console.warn(`[AudioSystem] Failed to load ${path}:`, error)
      }
    })

    await Promise.all(loadPromises)
    console.log(`[AudioSystem] Loaded ${this.buffers.size}/${Object.keys(SOUNDS).length} sounds`)
  }

  private createPools(): void {
    if (!this.context) return

    // Create pools for frequently used sounds
    const pooledSounds: SoundId[] = [
      'hover', 'click', 'footstep1', 'footstep2', 'footstep3',
      'reelStop1', 'reelStop2', 'reelStop3'
    ]

    for (const soundId of pooledSounds) {
      const pool: SoundPoolEntry[] = []
      const bus = this.getBusForSound(soundId)

      for (let i = 0; i < this.POOL_SIZE; i++) {
        const gain = this.context.createGain()
        gain.connect(bus)

        pool.push({
          source: null,
          gain,
          panner: null,
          playing: false
        })
      }

      this.pools.set(soundId, pool)
    }
  }

  private getBusForSound(soundId: SoundId): GainNode {
    // Route sounds to appropriate bus
    if (soundId.startsWith('hover') || soundId.startsWith('click') || soundId.startsWith('modal')) {
      return this.buses.get('ui')!
    }
    if (soundId.startsWith('footstep') || soundId === 'sit') {
      return this.buses.get('sfx')!
    }
    if (soundId.startsWith('spin') || soundId.startsWith('reel') || soundId.startsWith('win') || soundId === 'jackpot') {
      return this.buses.get('slots')!
    }
    if (soundId === 'casinoHum' || soundId === 'neonBuzz') {
      return this.buses.get('ambient')!
    }
    return this.buses.get('sfx')!
  }

  /**
   * Play a sound immediately (zero latency)
   */
  play(soundId: SoundId, options?: {
    volume?: number
    loop?: boolean
    playbackRate?: number
  }): void {
    if (!this.initialized || !this.context) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      console.warn(`[AudioSystem] Buffer not loaded: ${soundId}`)
      return
    }

    const pool = this.pools.get(soundId)

    if (pool) {
      // Use pooled playback (zero allocation)
      this.playPooled(soundId, buffer, pool, options)
    } else {
      // Create new nodes (rare sounds)
      this.playDirect(soundId, buffer, options)
    }
  }

  private playPooled(
    soundId: SoundId,
    buffer: AudioBuffer,
    pool: SoundPoolEntry[],
    options?: { volume?: number; loop?: boolean; playbackRate?: number }
  ): void {
    // Find available slot (round-robin)
    let entry = pool.find(e => !e.playing)
    if (!entry) {
      // All slots busy, steal oldest
      entry = pool[0]
      if (entry.source) {
        entry.source.stop()
        entry.source.disconnect()
      }
    }

    // Create new source node (required for each play)
    const source = this.context!.createBufferSource()
    source.buffer = buffer
    source.loop = options?.loop ?? false
    source.playbackRate.value = options?.playbackRate ?? 1

    // Set volume
    entry.gain.gain.value = options?.volume ?? 1

    // Connect and play
    source.connect(entry.gain)
    source.start(0)

    entry.source = source
    entry.playing = true

    // Mark as available when done
    source.onended = () => {
      entry!.playing = false
      entry!.source = null
    }
  }

  private playDirect(
    soundId: SoundId,
    buffer: AudioBuffer,
    options?: { volume?: number; loop?: boolean; playbackRate?: number }
  ): void {
    const source = this.context!.createBufferSource()
    source.buffer = buffer
    source.loop = options?.loop ?? false
    source.playbackRate.value = options?.playbackRate ?? 1

    const gain = this.context!.createGain()
    gain.gain.value = options?.volume ?? 1

    const bus = this.getBusForSound(soundId)
    source.connect(gain)
    gain.connect(bus)

    source.start(0)
  }

  /**
   * Play a 3D positioned sound
   */
  playSpatial(
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
  ): void {
    if (!this.initialized || !this.context) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) return

    // Stop existing source with same id
    this.stopSpatial(id)

    // Create panner for 3D positioning
    const panner = this.context.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = options?.refDistance ?? 1
    panner.maxDistance = options?.maxDistance ?? 50
    panner.rolloffFactor = options?.rolloffFactor ?? 1
    panner.setPosition(position[0], position[1], position[2])

    const gain = this.context.createGain()
    gain.gain.value = options?.volume ?? 1

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.loop = options?.loop ?? false

    // Connect: source -> panner -> gain -> ambient bus
    source.connect(panner)
    panner.connect(gain)
    gain.connect(this.buses.get('ambient')!)

    source.start(0)

    this.spatialSources.set(id, {
      panner,
      gain,
      source,
      soundId,
      loop: options?.loop ?? false
    })

    // Cleanup on end if not looping
    if (!options?.loop) {
      source.onended = () => {
        this.spatialSources.delete(id)
      }
    }
  }

  /**
   * Update position of a spatial sound
   */
  updateSpatialPosition(id: string, position: [number, number, number]): void {
    const spatial = this.spatialSources.get(id)
    if (spatial) {
      spatial.panner.setPosition(position[0], position[1], position[2])
    }
  }

  /**
   * Stop a spatial sound
   */
  stopSpatial(id: string): void {
    const spatial = this.spatialSources.get(id)
    if (spatial && spatial.source) {
      spatial.source.stop()
      spatial.source.disconnect()
      spatial.panner.disconnect()
      spatial.gain.disconnect()
      this.spatialSources.delete(id)
    }
  }

  /**
   * Update listener position (call every frame with camera position)
   */
  updateListener(
    position: [number, number, number],
    forward: [number, number, number],
    up: [number, number, number] = [0, 1, 0]
  ): void {
    if (!this.context) return

    const listener = this.context.listener

    // Position
    if (listener.positionX) {
      listener.positionX.value = position[0]
      listener.positionY.value = position[1]
      listener.positionZ.value = position[2]
    } else {
      listener.setPosition(position[0], position[1], position[2])
    }

    // Orientation
    if (listener.forwardX) {
      listener.forwardX.value = forward[0]
      listener.forwardY.value = forward[1]
      listener.forwardZ.value = forward[2]
      listener.upX.value = up[0]
      listener.upY.value = up[1]
      listener.upZ.value = up[2]
    } else {
      listener.setOrientation(
        forward[0], forward[1], forward[2],
        up[0], up[1], up[2]
      )
    }

    this.listenerPosition = position
    this.listenerForward = forward
  }

  /**
   * Set bus volume
   */
  setBusVolume(busId: BusId, volume: number): void {
    const bus = this.buses.get(busId)
    if (bus) {
      bus.gain.value = Math.max(0, Math.min(1, volume))
      this.busVolumes[busId] = volume
    }
  }

  /**
   * Get current bus volume
   */
  getBusVolume(busId: BusId): number {
    return this.busVolumes[busId]
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    const master = this.buses.get('master')
    if (master) {
      master.gain.value = muted ? 0 : this.busVolumes.master
    }
  }

  /**
   * Resume audio context (call after user interaction)
   */
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume()
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Stop all spatial sources
    for (const [id] of this.spatialSources) {
      this.stopSpatial(id)
    }

    // Close context
    if (this.context) {
      this.context.close()
      this.context = null
    }

    this.buffers.clear()
    this.buses.clear()
    this.pools.clear()
    this.initialized = false
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Singleton instance
export const audioSystem = new AudioSystem()
