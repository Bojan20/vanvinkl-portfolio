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
  lounge: '/audio/ambient/lounge.mp3',
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

  // UI - these are now handled by SynthSounds, only keep if files exist
  // hover: '/audio/ui/hover.wav',
  // click: '/audio/ui/click.wav',
  // modalOpen: '/audio/ui/modal-open.wav',
  // modalClose: '/audio/ui/modal-close.wav',
  // navTick: '/audio/ui/nav-tick.wav',
  // navSelect: '/audio/ui/nav-select.wav',
  // navBack: '/audio/ui/nav-back.wav',
  // contentReveal: '/audio/ui/content-reveal.wav',
  // phaseTransition: '/audio/ui/phase-transition.wav',

  // Player
  footstep1: '/audio/player/footstep-1.wav',
  footstep2: '/audio/player/footstep-2.wav',
  footstep3: '/audio/player/footstep-3.wav',
  sit: '/audio/player/sit.wav'
} as const

// Critical sounds to preload immediately - others lazy load on first use
const PRELOAD_SOUNDS: (keyof typeof SOUNDS)[] = ['footstep1', 'footstep2', 'footstep3']

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

  // Master dynamics
  private compressor: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private analyserData: Uint8Array | null = null

  // Ducking state
  private isDucking = false
  private duckingTargets: Map<BusId, number> = new Map()

  // Ambient music controller
  private ambientSource: AudioBufferSourceNode | null = null
  private ambientGain: GainNode | null = null
  private currentAmbientTrack: SoundId | null = null
  private ambientPaused = false
  private ambientPauseTime = 0

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
    } catch (error) {
      // Silently fail - audio is not critical
      throw error
    }
  }

  private createBuses(): void {
    if (!this.context) return

    // Create master compressor for professional sound
    this.compressor = this.context.createDynamicsCompressor()
    this.compressor.threshold.value = -24  // Start compressing at -24dB
    this.compressor.knee.value = 12        // Soft knee for natural sound
    this.compressor.ratio.value = 4        // 4:1 compression ratio
    this.compressor.attack.value = 0.003   // 3ms attack
    this.compressor.release.value = 0.25   // 250ms release
    this.compressor.connect(this.context.destination)

    // Create analyser for spectrum visualization
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 256  // 128 frequency bins
    this.analyser.smoothingTimeConstant = 0.8
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount)

    // Master bus -> analyser -> compressor -> destination
    const masterGain = this.context.createGain()
    masterGain.gain.value = this.busVolumes.master
    masterGain.connect(this.analyser)
    this.analyser.connect(this.compressor)
    this.buses.set('master', masterGain)

    // Create reverb convolver for casino ambience
    const convolver = this.context.createConvolver()
    const reverbGain = this.context.createGain()
    reverbGain.gain.value = 0.15 // Subtle reverb
    convolver.connect(reverbGain)
    reverbGain.connect(masterGain)

    // Generate impulse response for small room reverb
    this.generateImpulseResponse(convolver)

    // Sub-buses -> master (with reverb send for sfx/slots)
    const busIds: BusId[] = ['ambient', 'sfx', 'slots', 'ui']
    for (const busId of busIds) {
      const gain = this.context.createGain()
      gain.gain.value = this.busVolumes[busId]
      gain.connect(masterGain)

      // Add reverb send for sfx and slots buses
      if (busId === 'sfx' || busId === 'slots') {
        const sendGain = this.context.createGain()
        sendGain.gain.value = 0.3 // Reverb send amount
        gain.connect(sendGain)
        sendGain.connect(convolver)
      }

      this.buses.set(busId, gain)
    }
  }

  private generateImpulseResponse(convolver: ConvolverNode): void {
    if (!this.context) return

    // Generate synthetic impulse response for small room
    const sampleRate = this.context.sampleRate
    const length = sampleRate * 0.8 // 0.8 second reverb tail
    const impulse = this.context.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponential decay with random noise
        const decay = Math.exp(-3 * i / length)
        data[i] = (Math.random() * 2 - 1) * decay
      }
    }

    convolver.buffer = impulse
  }

  // Lazy load a single sound on demand
  private loadingPromises = new Map<SoundId, Promise<AudioBuffer | null>>()

  private async loadSound(id: SoundId): Promise<AudioBuffer | null> {
    // Already loaded
    if (this.buffers.has(id)) return this.buffers.get(id)!

    // Already loading
    if (this.loadingPromises.has(id)) return this.loadingPromises.get(id)!

    // Start loading
    const path = SOUNDS[id]
    const promise = (async () => {
      try {
        const response = await fetch(path)
        if (!response.ok) return null
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)
        this.buffers.set(id, audioBuffer)
        return audioBuffer
      } catch {
        return null
      }
    })()

    this.loadingPromises.set(id, promise)
    return promise
  }

  // Preload only critical sounds at init - others lazy load on first use
  private async loadAllSounds(): Promise<void> {
    if (!this.context) return

    // Only preload critical sounds (footsteps) - rest lazy load
    const loadPromises = PRELOAD_SOUNDS.map(id => this.loadSound(id))
    await Promise.all(loadPromises)
  }

  private createPools(): void {
    if (!this.context) return

    // Create pools only for preloaded sounds (footsteps)
    // Other sounds are lazy loaded and don't need pools
    for (const soundId of PRELOAD_SOUNDS) {
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
   * Play a sound immediately (zero latency for preloaded, lazy loads others)
   */
  play(soundId: SoundId, options?: {
    volume?: number
    loop?: boolean
    playbackRate?: number
  }): void {
    if (!this.initialized || !this.context) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      // Lazy load and play when ready
      this.loadSound(soundId).then(loadedBuffer => {
        if (loadedBuffer) {
          this.playWithBuffer(soundId, loadedBuffer, options)
        }
      })
      return
    }

    this.playWithBuffer(soundId, buffer, options)
  }

  private playWithBuffer(soundId: SoundId, buffer: AudioBuffer, options?: {
    volume?: number
    loop?: boolean
    playbackRate?: number
  }): void {
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
   * Start ducking - reduce other buses for important sounds (jackpot, etc)
   * @param duckAmount - How much to reduce (0.3 = reduce to 30%)
   * @param fadeTime - Fade duration in seconds
   */
  startDucking(duckAmount = 0.3, fadeTime = 0.3): void {
    if (!this.context || this.isDucking) return
    this.isDucking = true

    const now = this.context.currentTime
    const busesToDuck: BusId[] = ['ambient', 'sfx', 'ui']

    for (const busId of busesToDuck) {
      const bus = this.buses.get(busId)
      if (bus) {
        // Store original volume
        this.duckingTargets.set(busId, bus.gain.value)
        // Fade down
        bus.gain.setValueAtTime(bus.gain.value, now)
        bus.gain.linearRampToValueAtTime(bus.gain.value * duckAmount, now + fadeTime)
      }
    }
  }

  /**
   * Stop ducking - restore original bus volumes
   * @param fadeTime - Fade duration in seconds
   */
  stopDucking(fadeTime = 0.5): void {
    if (!this.context || !this.isDucking) return
    this.isDucking = false

    const now = this.context.currentTime

    for (const [busId, originalVolume] of this.duckingTargets) {
      const bus = this.buses.get(busId)
      if (bus) {
        bus.gain.setValueAtTime(bus.gain.value, now)
        bus.gain.linearRampToValueAtTime(originalVolume, now + fadeTime)
      }
    }

    this.duckingTargets.clear()
  }

  /**
   * Get frequency data for spectrum visualization
   * Returns array of 0-255 values for each frequency bin
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.analyserData) return null
    this.analyser.getByteFrequencyData(this.analyserData)
    return this.analyserData
  }

  /**
   * Get average volume level (0-1) for reactive effects
   */
  getAverageVolume(): number {
    const data = this.getFrequencyData()
    if (!data) return 0

    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i]
    }
    return sum / (data.length * 255)
  }

  /**
   * Get bass level (0-1) for reactive effects
   */
  getBassLevel(): number {
    const data = this.getFrequencyData()
    if (!data) return 0

    // First 8 bins are bass frequencies
    let sum = 0
    const bassRange = Math.min(8, data.length)
    for (let i = 0; i < bassRange; i++) {
      sum += data[i]
    }
    return sum / (bassRange * 255)
  }

  // ============================================
  // AMBIENT MUSIC CONTROLLER
  // ============================================

  /**
   * Start ambient music with fade in
   * @param soundId - Which track to play (lounge, casinoHum, etc)
   * @param fadeTime - Fade in duration (seconds)
   * @param volume - Target volume (0-1)
   */
  startAmbientMusic(soundId: SoundId, fadeTime = 1.0, volume = 0.4): void {
    if (!this.initialized || !this.context) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      // Sound not loaded - will lazy load on next attempt
      return
    }

    // Stop current track if playing
    if (this.ambientSource) {
      this.stopAmbientMusic(0.5)
    }

    // Create gain node for this track
    this.ambientGain = this.context.createGain()
    this.ambientGain.gain.value = 0 // Start silent
    this.ambientGain.connect(this.buses.get('ambient')!)

    // Create source
    this.ambientSource = this.context.createBufferSource()
    this.ambientSource.buffer = buffer
    this.ambientSource.loop = true
    this.ambientSource.connect(this.ambientGain)

    // Start and fade in
    this.ambientSource.start(0)
    this.currentAmbientTrack = soundId
    this.ambientPaused = false

    // Fade in
    const now = this.context.currentTime
    this.ambientGain.gain.setValueAtTime(0, now)
    this.ambientGain.gain.linearRampToValueAtTime(volume, now + fadeTime)

  }

  /**
   * Stop ambient music with fade out
   * @param fadeTime - Fade out duration (seconds)
   */
  stopAmbientMusic(fadeTime = 1.0): void {
    if (!this.context || !this.ambientSource || !this.ambientGain) return

    const now = this.context.currentTime
    const currentVolume = this.ambientGain.gain.value

    // Fade out
    this.ambientGain.gain.setValueAtTime(currentVolume, now)
    this.ambientGain.gain.linearRampToValueAtTime(0, now + fadeTime)

    // Schedule stop after fade
    const source = this.ambientSource
    const gain = this.ambientGain
    setTimeout(() => {
      try {
        source.stop()
        source.disconnect()
        gain.disconnect()
      } catch {
        // Already stopped
      }
    }, fadeTime * 1000 + 50)

    this.ambientSource = null
    this.ambientGain = null
    this.currentAmbientTrack = null
    this.ambientPaused = false

  }

  /**
   * Crossfade to new ambient track
   * @param soundId - New track to play
   * @param fadeTime - Crossfade duration (seconds)
   * @param volume - Target volume
   */
  crossfadeAmbientMusic(soundId: SoundId, fadeTime = 2.0, volume = 0.4): void {
    if (!this.initialized || !this.context) return

    const buffer = this.buffers.get(soundId)
    if (!buffer) {
      // Sound not loaded - will lazy load on next attempt
      return
    }

    // If same track, just adjust volume
    if (soundId === this.currentAmbientTrack && this.ambientGain) {
      const now = this.context.currentTime
      this.ambientGain.gain.linearRampToValueAtTime(volume, now + 0.5)
      return
    }

    // Fade out old track
    if (this.ambientSource && this.ambientGain) {
      const now = this.context.currentTime
      const oldGain = this.ambientGain
      const oldSource = this.ambientSource

      oldGain.gain.setValueAtTime(oldGain.gain.value, now)
      oldGain.gain.linearRampToValueAtTime(0, now + fadeTime)

      setTimeout(() => {
        try {
          oldSource.stop()
          oldSource.disconnect()
          oldGain.disconnect()
        } catch {
          // Already stopped
        }
      }, fadeTime * 1000 + 50)
    }

    // Create new track
    this.ambientGain = this.context.createGain()
    this.ambientGain.gain.value = 0
    this.ambientGain.connect(this.buses.get('ambient')!)

    this.ambientSource = this.context.createBufferSource()
    this.ambientSource.buffer = buffer
    this.ambientSource.loop = true
    this.ambientSource.connect(this.ambientGain)

    this.ambientSource.start(0)
    this.currentAmbientTrack = soundId
    this.ambientPaused = false

    // Fade in new track
    const now = this.context.currentTime
    this.ambientGain.gain.setValueAtTime(0, now)
    this.ambientGain.gain.linearRampToValueAtTime(volume, now + fadeTime)

  }

  /**
   * Set ambient music volume with smooth transition
   * @param volume - Target volume (0-1)
   * @param fadeTime - Transition time (seconds)
   */
  setAmbientVolume(volume: number, fadeTime = 0.3): void {
    if (!this.context || !this.ambientGain) return

    const now = this.context.currentTime
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now)
    this.ambientGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      now + fadeTime
    )
  }

  /**
   * Check if ambient music is playing
   */
  isAmbientPlaying(): boolean {
    return this.ambientSource !== null && !this.ambientPaused
  }

  /**
   * Get current ambient track
   */
  getCurrentAmbientTrack(): SoundId | null {
    return this.currentAmbientTrack
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
