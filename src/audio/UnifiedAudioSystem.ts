/**
 * VanVinkl Casino - Unified Audio System
 *
 * Combines external sounds (AudioDSP) and procedural synthesis (SynthSounds)
 * into a single, coordinated audio system.
 *
 * Features:
 * - Single AudioContext (no conflicts)
 * - External sound loading (fetch + decode)
 * - Procedural sound synthesis (oscillators, FM, ADSR)
 * - Unified bus routing (music, sfx, ui, spatial)
 * - Global volume control
 * - Frequency analyzer for visualization
 */

type SoundConfig = {
  url: string
  volume?: number
  loop?: boolean
  bus?: 'music' | 'sfx' | 'ui' | 'spatial'
}

type PlayingSound = {
  source: AudioBufferSourceNode
  gain: GainNode
  startTime: number
}

type SynthSoundType =
  | 'tick' | 'select' | 'back' | 'click'
  | 'whoosh' | 'swoosh' | 'reveal' | 'transition'
  | 'win' | 'jackpot' | 'spinMech'
  | 'introWhoosh' | 'footstep'
  | 'cyberGlitch' | 'cyberSweep' | 'cyberReveal' | 'cyberBass' | 'cyberWow'
  | 'magicReveal' | 'leverPull' | 'leverRelease'
  | 'uiOpen' | 'uiClose'
  | 'reelSpin' | 'reelStop'

class UnifiedAudioSystem {
  private ctx: AudioContext | null = null
  private buffers = new Map<string, AudioBuffer>()
  private playing = new Map<string, PlayingSound>()
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>()

  // Bus gains
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private uiGain: GainNode | null = null
  private spatialGain: GainNode | null = null

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
      this.musicGain.gain.value = 0.5
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 0.7
      this.sfxGain.connect(this.masterGain)

      this.uiGain = this.ctx.createGain()
      this.uiGain.gain.value = 0.6
      this.uiGain.connect(this.masterGain)

      this.spatialGain = this.ctx.createGain()
      this.spatialGain.gain.value = 0.5
      this.spatialGain.connect(this.masterGain)

      // Create analyzer for visualization (connected to music bus)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      this.musicGain.connect(this.analyser)

      // Resume if needed
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }

      this.ready = true

      // Play any pending sounds
      this.flushPending()

      console.log('[UnifiedAudio] System initialized')
    } catch (err) {
      console.error('[UnifiedAudio] Init failed:', err)
    }
  }

  /**
   * Load a sound (lazy, only when needed)
   */
  private async load(id: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(id)) {
      return this.buffers.get(id)!
    }

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!
    }

    const config = this.sounds.get(id)
    if (!config) return null

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
   * Play an external sound
   * @param id - Sound ID (must be registered)
   * @param instanceId - Optional unique ID for this instance
   * @returns Instance ID
   */
  play(id: string, instanceId?: string): string {
    const iid = instanceId || `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    if (!this.ready || this.muted) {
      const config = this.sounds.get(id)
      if (config) {
        this.pendingPlays.push({ id, config, instanceId: iid })
      }
      return iid
    }

    this.playAsync(id, iid)
    return iid
  }

  private async playAsync(id: string, instanceId: string): Promise<void> {
    if (!this.ctx || this.muted) return

    const config = this.sounds.get(id)
    if (!config) return

    const buffer = await this.load(id)
    if (!buffer || !this.ctx) return

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = config.loop ?? false

    const gain = this.ctx.createGain()
    gain.gain.value = config.volume ?? 1

    const bus = config.bus === 'music' ? this.musicGain :
                config.bus === 'ui' ? this.uiGain :
                config.bus === 'spatial' ? this.spatialGain : this.sfxGain

    source.connect(gain)
    gain.connect(bus!)

    this.playing.set(instanceId, {
      source,
      gain,
      startTime: this.ctx.currentTime
    })

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
      } catch {}
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
  setVolume(bus: 'master' | 'music' | 'sfx' | 'ui' | 'spatial', volume: number, fadeTime = 0.1): void {
    if (!this.ctx) return

    const gain = bus === 'master' ? this.masterGain :
                 bus === 'music' ? this.musicGain :
                 bus === 'sfx' ? this.sfxGain :
                 bus === 'spatial' ? this.spatialGain : this.uiGain

    if (!gain) return

    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), now + fadeTime)
  }

  /**
   * Get current volume for a bus
   */
  getVolume(bus: 'master' | 'music' | 'sfx' | 'ui' | 'spatial'): number {
    const gain = bus === 'master' ? this.masterGain :
                 bus === 'music' ? this.musicGain :
                 bus === 'sfx' ? this.sfxGain :
                 bus === 'spatial' ? this.spatialGain : this.uiGain

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

  // ============================================
  // SYNTHESIZED SOUNDS - Embedded
  // ============================================

  /**
   * Play a synthesized sound
   */
  playSynth(type: SynthSoundType, volume = 0.5): void {
    const ctx = this.ctx
    if (!ctx || !this.ready) return

    try {
      const now = ctx.currentTime

      switch (type) {
        case 'tick':
          this.playTick(ctx, now, volume)
          break
        case 'select':
          this.playSelect(ctx, now, volume)
          break
        case 'back':
          this.playBack(ctx, now, volume)
          break
        case 'whoosh':
          this.playWhoosh(ctx, now, volume)
          break
        case 'swoosh':
          this.playSwoosh(ctx, now, volume)
          break
        case 'reveal':
          this.playReveal(ctx, now, volume)
          break
        case 'transition':
          this.playTransition(ctx, now, volume)
          break
        case 'win':
          this.playWin(ctx, now, volume)
          break
        case 'jackpot':
          this.playJackpot(ctx, now, volume)
          break
        case 'introWhoosh':
          this.playIntroWhoosh(ctx, now, volume)
          break
        case 'cyberWow':
          this.playCyberWow(ctx, now, volume)
          break
        case 'magicReveal':
          this.playMagicReveal(ctx, now, volume)
          break
        case 'uiOpen':
          this.playUiOpen(ctx, now, volume)
          break
        case 'uiClose':
          this.playUiClose(ctx, now, volume)
          break
        case 'leverPull':
          this.playLeverPull(ctx, now, volume)
          break
        case 'leverRelease':
          this.playLeverRelease(ctx, now, volume)
          break
        case 'reelStop':
          this.playReelStop(ctx, now, volume)
          break
        case 'reelSpin':
          this.playReelSpin(ctx, now, volume)
          break
        case 'click':
          this.playTick(ctx, now, volume) // Click = tick sound
          break
        case 'footstep':
          this.playFootstep(ctx, now, volume)
          break
        case 'cyberReveal':
          this.playCyberReveal(ctx, now, volume)
          break
        case 'cyberGlitch':
          this.playCyberGlitch(ctx, now, volume)
          break
        case 'cyberSweep':
          this.playCyberSweep(ctx, now, volume)
          break
        case 'cyberBass':
          this.playCyberBass(ctx, now, volume)
          break
      }
    } catch (e) {
      console.warn('[UnifiedAudio] Failed to play synth:', e)
    }
  }

  private getOutput(): AudioNode {
    if (!this.uiGain) throw new Error('[UnifiedAudio] uiGain not initialized')
    return this.uiGain
  }

  // Synth generators (embed samo kritične - rest će koristiti existing SynthSounds)

  private playTick(ctx: AudioContext, now: number, vol: number): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(2000, now)
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.02)

    gain.gain.setValueAtTime(vol * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.05)
  }

  private playSelect(ctx: AudioContext, now: number, vol: number): void {
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(800, now)
    gain1.gain.setValueAtTime(vol * 0.4, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc1.connect(gain1)
    gain1.connect(this.getOutput())
    osc1.start(now)
    osc1.stop(now + 0.1)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1200, now + 0.05)
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.setValueAtTime(vol * 0.4, now + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc2.connect(gain2)
    gain2.connect(this.getOutput())
    osc2.start(now + 0.05)
    osc2.stop(now + 0.15)
  }

  private playBack(ctx: AudioContext, now: number, vol: number): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12)

    gain.gain.setValueAtTime(vol * 0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.12)
  }

  private playWhoosh(ctx: AudioContext, now: number, vol: number): void {
    const bufferSize = ctx.sampleRate * 0.2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * (1 - t * 0.5)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(500, now)
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.15)
    filter.Q.value = 2

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    source.start(now)
  }

  private playSwoosh(ctx: AudioContext, now: number, vol: number): void {
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * t
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2500, now)
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12)
    filter.Q.value = 1.5

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    source.start(now)
  }

  private playReveal(ctx: AudioContext, now: number, vol: number): void {
    const frequencies = [523.25, 659.25, 783.99]

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.03)

      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(vol * 0.2, now + i * 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(this.getOutput())

      osc.start(now + i * 0.03)
      osc.stop(now + 0.4)
    })
  }

  private playTransition(ctx: AudioContext, now: number, vol: number): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, now)
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.1)
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.2)

    gain.gain.setValueAtTime(vol * 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.25)
  }

  private playWin(ctx: AudioContext, now: number, vol: number): void {
    const notes = [523.25, 659.25, 783.99, 1046.50]

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.value = freq

      const startTime = now + i * 0.08
      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(vol * 0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)

      osc.connect(gain)
      gain.connect(this.getOutput())

      osc.start(startTime)
      osc.stop(startTime + 0.2)
    })
  }

  private playJackpot(ctx: AudioContext, now: number, vol: number): void {
    const bassOsc = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bassOsc.type = 'sine'
    bassOsc.frequency.setValueAtTime(80, now)
    bassGain.gain.setValueAtTime(vol * 0.5, now)
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    bassOsc.connect(bassGain)
    bassGain.connect(this.getOutput())
    bassOsc.start(now)
    bassOsc.stop(now + 0.5)

    const chordNotes = [
      { freq: 261.63, delay: 0 },
      { freq: 329.63, delay: 0.05 },
      { freq: 392.00, delay: 0.1 },
      { freq: 523.25, delay: 0.15 },
      { freq: 659.25, delay: 0.2 },
      { freq: 783.99, delay: 0.25 },
      { freq: 1046.50, delay: 0.3 },
    ]

    chordNotes.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.value = freq

      const start = now + delay
      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(vol * 0.25, start)
      gain.gain.setValueAtTime(vol * 0.25, start + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8)

      osc.connect(gain)
      gain.connect(this.getOutput())

      osc.start(start)
      osc.stop(start + 0.8)
    })
  }

  private playIntroWhoosh(ctx: AudioContext, now: number, vol: number): void {
    const noiseSize = ctx.sampleRate * 2.5
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.5
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 1
    filter.frequency.setValueAtTime(100, now)
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.8)
    filter.frequency.exponentialRampToValueAtTime(300, now + 2.0)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.linearRampToValueAtTime(vol * 0.15, now + 0.3)
    noiseGain.gain.linearRampToValueAtTime(vol * 0.1, now + 1.5)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

    noiseSource.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.getOutput())

    noiseSource.start(now)
  }

  private playCyberWow(ctx: AudioContext, now: number, vol: number): void {
    const boostVol = vol * 1.5

    const bassOsc = ctx.createOscillator()
    bassOsc.type = 'sine'
    bassOsc.frequency.setValueAtTime(80, now)
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4)

    const bassGain = ctx.createGain()
    bassGain.gain.setValueAtTime(boostVol * 0.6, now)
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    bassOsc.connect(bassGain)
    bassGain.connect(this.getOutput())
    bassOsc.start(now)
    bassOsc.stop(now + 0.6)

    const chordFreqs = [261.63, 329.63, 392.00, 523.25, 659.25]

    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = i < 2 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq * 0.98, now)
      osc.frequency.linearRampToValueAtTime(freq, now + 0.1)
      osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.8)

      const gain = ctx.createGain()
      const delay = i * 0.03
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(boostVol * (0.3 - i * 0.03), now + delay + 0.05)
      gain.gain.setValueAtTime(boostVol * (0.25 - i * 0.02), now + 0.4)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(this.getOutput())
      osc.start(now + delay)
      osc.stop(now + 1.3)
    })
  }

  private playMagicReveal(ctx: AudioContext, now: number, vol: number): void {
    const v = vol * 1.2

    const padFreqs = [261.63, 329.63, 392.00, 493.88]

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1200, now)
      filter.frequency.linearRampToValueAtTime(2500, now + 0.4)
      filter.frequency.linearRampToValueAtTime(800, now + 1.5)
      filter.Q.value = 0.7

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(v * (0.12 - i * 0.015), now + 0.2)
      gain.gain.setValueAtTime(v * (0.10 - i * 0.012), now + 0.8)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.getOutput())
      osc.start(now)
      osc.stop(now + 1.8)
    })
  }

  private playUiOpen(ctx: AudioContext, now: number, vol: number): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(vol * 0.15, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.35)
  }

  private playUiClose(ctx: AudioContext, now: number, vol: number): void {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(500, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.25)
  }

  private playLeverPull(ctx: AudioContext, now: number, vol: number): void {
    const clickOsc = ctx.createOscillator()
    clickOsc.type = 'square'
    clickOsc.frequency.setValueAtTime(1200, now)
    clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.03)

    const clickFilter = ctx.createBiquadFilter()
    clickFilter.type = 'bandpass'
    clickFilter.frequency.value = 800
    clickFilter.Q.value = 2

    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(vol * 0.4, now)
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    clickOsc.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(this.getOutput())
    clickOsc.start(now)
    clickOsc.stop(now + 0.06)
  }

  private playLeverRelease(ctx: AudioContext, now: number, vol: number): void {
    const springOsc = ctx.createOscillator()
    springOsc.type = 'sine'
    springOsc.frequency.setValueAtTime(400, now)
    springOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15)

    const springGain = ctx.createGain()
    springGain.gain.setValueAtTime(vol * 0.3, now)
    springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    springOsc.connect(springGain)
    springGain.connect(this.getOutput())
    springOsc.start(now)
    springOsc.stop(now + 0.2)
  }

  private playReelStop(ctx: AudioContext, now: number, vol: number): void {
    const impactOsc = ctx.createOscillator()
    impactOsc.type = 'sine'
    impactOsc.frequency.setValueAtTime(200, now)
    impactOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08)

    const impactGain = ctx.createGain()
    impactGain.gain.setValueAtTime(vol * 0.6, now)
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    impactOsc.connect(impactGain)
    impactGain.connect(this.getOutput())
    impactOsc.start(now)
    impactOsc.stop(now + 0.18)
  }

  private playReelSpin(ctx: AudioContext, now: number, vol: number): void {
    // Continuous reel spinning sound (mechanical whir)
    const noiseSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < noiseSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 2

    const gain = ctx.createGain()
    gain.gain.value = vol * 0.3

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    source.start(now)
    // Note: Loop continues, caller should stop it
  }

  private playFootstep(ctx: AudioContext, now: number, vol: number): void {
    // Short low thud (footstep on carpet)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.1)
  }

  private playCyberReveal(ctx: AudioContext, now: number, vol: number): void {
    // Digital reveal sound (letter-by-letter)
    const osc1 = ctx.createOscillator()
    osc1.type = 'square'
    osc1.frequency.setValueAtTime(1200, now)
    osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.05)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(3500, now + 0.05)
    filter.Q.value = 1

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc1.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    osc1.start(now)
    osc1.stop(now + 0.1)
  }

  private playCyberGlitch(ctx: AudioContext, now: number, vol: number): void {
    // Short digital glitch
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.04)
  }

  private playCyberSweep(ctx: AudioContext, now: number, vol: number): void {
    // Ascending digital sweep
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.2)

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(300, now)
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.2)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.3)
  }

  private playCyberBass(ctx: AudioContext, now: number, vol: number): void {
    // Deep sub bass hit
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(60, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.7, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.5)
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.ready
  }
}

// Singleton
export const unifiedAudio = new UnifiedAudioSystem()

// ============================================
// QUICK SETUP - Register all VanVinkl sounds
// ============================================

unifiedAudio.registerAll({
  // Music (MP3 for faster loading)
  lounge: { url: '/audio/ambient/lounge.mp3', volume: 0.4, loop: true, bus: 'music' },
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

  // Player
  footstep1: { url: '/audio/player/footstep-1.wav', volume: 0.5, bus: 'sfx' },
  footstep2: { url: '/audio/player/footstep-2.wav', volume: 0.5, bus: 'sfx' },
  footstep3: { url: '/audio/player/footstep-3.wav', volume: 0.5, bus: 'sfx' },
})

// ============================================
// SIMPLE API - Backwards compatible
// ============================================

/**
 * Initialize audio (call after user interaction)
 */
export async function initUnifiedAudio(): Promise<void> {
  await unifiedAudio.init()
}

/**
 * Play an external sound
 */
export function uaPlay(id: string): string {
  return unifiedAudio.play(id)
}

/**
 * Stop a sound
 */
export function uaStop(id: string, fadeTime = 0.3): void {
  unifiedAudio.stopAll(id, fadeTime)
}

/**
 * Set volume
 */
export function uaVolume(bus: 'master' | 'music' | 'sfx' | 'ui' | 'spatial', volume: number, fadeTime = 0.1): void {
  unifiedAudio.setVolume(bus, volume, fadeTime)
}

export function uaGetVolume(bus: 'master' | 'music' | 'sfx' | 'ui' | 'spatial'): number {
  return unifiedAudio.getVolume(bus)
}

/**
 * Mute/unmute
 */
export function uaMute(muted: boolean): void {
  unifiedAudio.setMuted(muted)
}

/**
 * Check if playing
 */
export function uaIsPlaying(id: string): boolean {
  return unifiedAudio.isPlaying(id)
}

/**
 * Play synthesized sound
 */
export function uaPlaySynth(type: SynthSoundType, vol = 0.5): void {
  unifiedAudio.playSynth(type, vol)
}

/**
 * Get frequency data for visualization
 */
export function uaGetFrequencyData(): Uint8Array | null {
  return unifiedAudio.getFrequencyData()
}

/**
 * Get bass level (0-1) for reactive elements
 */
export function uaGetBassLevel(): number {
  return unifiedAudio.getBassLevel()
}
