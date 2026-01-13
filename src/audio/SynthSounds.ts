/**
 * Synthesized UI Sounds - Zero External Dependencies
 *
 * Generates casino-style UI sounds using Web Audio API
 * Used as fallback when audio files are not available
 */

type SynthSoundType =
  | 'tick'      // Navigation tick
  | 'select'    // Enter/confirm
  | 'back'      // Escape/cancel
  | 'whoosh'    // Modal open
  | 'swoosh'    // Modal close
  | 'reveal'    // Content reveal
  | 'transition'// Phase transition
  | 'win'       // Small win
  | 'jackpot'   // Big jackpot
  | 'spinMech'  // Mechanical reel spin
  | 'introWhoosh'    // Smooth intro animation sound
  | 'footstep'       // Solid floor footstep
  | 'cyberGlitch'    // Glitchy digital distortion
  | 'cyberSweep'     // Cyberpunk sweep up
  | 'cyberReveal'    // Text reveal with digital artifacts
  | 'cyberBass'      // Deep bass hit
  | 'cyberWow'       // Epic finale sound - shimmering impact
  | 'magicReveal'    // Magical cyber reveal - ethereal + digital
  | 'leverPull'      // Slot machine lever pull down
  | 'leverRelease'   // Slot machine lever spring back
  | 'uiOpen'         // Soft UI popup/info panel open
  | 'uiClose'        // Soft UI popup/info panel close
  | 'reelSpin'       // Continuous reel spinning sound
  | 'reelStop'       // Single reel stopping with mechanical thud

class SynthSoundGenerator {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _volumeMultiplier = 1.0  // Controlled by DSP sfx slider

  /**
   * Initialize audio context - MUST be called on user interaction (click)
   * This ensures AudioContext is not blocked by browser autoplay policy
   */
  init(): void {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = this._volumeMultiplier
      this.masterGain.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
    console.log('[SynthSounds] AudioContext initialized, state:', this.context.state)
  }

  /**
   * Set volume multiplier (0-1) - called by DSP system
   */
  setVolumeMultiplier(vol: number): void {
    this._volumeMultiplier = Math.max(0, Math.min(1, vol))
    // Also update master gain if context exists
    if (this.masterGain && this.context) {
      this.masterGain.gain.setValueAtTime(this._volumeMultiplier, this.context.currentTime)
    }
  }

  getVolumeMultiplier(): number {
    return this._volumeMultiplier
  }

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      // Create master gain for volume control
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = this._volumeMultiplier
      this.masterGain.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
    return this.context
  }

  /**
   * Get output node - either master gain or destination
   */
  private getOutput(): AudioNode {
    const ctx = this.getContext()
    return this.masterGain || ctx.destination
  }

  /**
   * Play a synthesized sound
   */
  play(type: SynthSoundType, volume = 0.5): void {
    try {
      const ctx = this.getContext()
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
        case 'spinMech':
          this.playSpinMechanical(ctx, now, volume)
          break
        case 'introWhoosh':
          this.playIntroWhoosh(ctx, now, volume)
          break
        case 'footstep':
          this.playFootstep(ctx, now, volume)
          break
        case 'cyberGlitch':
          this.playCyberGlitch(ctx, now, volume)
          break
        case 'cyberSweep':
          this.playCyberSweep(ctx, now, volume)
          break
        case 'cyberReveal':
          this.playCyberReveal(ctx, now, volume)
          break
        case 'cyberBass':
          this.playCyberBass(ctx, now, volume)
          break
        case 'cyberWow':
          console.log('[SynthSounds] Playing cyberWow, ctx state:', ctx.state, 'volume:', volume, 'masterGain:', this.masterGain?.gain.value)
          // Force resume if suspended
          if (ctx.state === 'suspended') {
            console.log('[SynthSounds] Resuming suspended AudioContext...')
            ctx.resume()
          }
          this.playCyberWow(ctx, now, volume)
          break
        case 'magicReveal':
          console.log('[SynthSounds] Playing magicReveal')
          if (ctx.state === 'suspended') ctx.resume()
          this.playMagicReveal(ctx, now, volume)
          break
        case 'leverPull':
          this.playLeverPull(ctx, now, volume)
          break
        case 'leverRelease':
          this.playLeverRelease(ctx, now, volume)
          break
        case 'uiOpen':
          this.playUiOpen(ctx, now, volume)
          break
        case 'uiClose':
          this.playUiClose(ctx, now, volume)
          break
        case 'reelSpin':
          this.playReelSpin(ctx, now, volume)
          break
        case 'reelStop':
          this.playReelStop(ctx, now, volume)
          break
      }
    } catch (e) {
      console.warn('[SynthSounds] Failed to play:', e)
    }
  }

  /**
   * Short tick - arrow navigation
   */
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

  /**
   * Confirm/select - two-tone positive
   */
  private playSelect(ctx: AudioContext, now: number, vol: number): void {
    // First tone
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

    // Second tone (higher)
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

  /**
   * Back/cancel - descending tone
   */
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

  /**
   * Whoosh - modal open (noise sweep up)
   */
  private playWhoosh(ctx: AudioContext, now: number, vol: number): void {
    const bufferSize = ctx.sampleRate * 0.2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // Filtered noise
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

  /**
   * Swoosh - modal close (noise sweep down)
   */
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

  /**
   * Reveal - content appearing (shimmering chord)
   */
  private playReveal(ctx: AudioContext, now: number, vol: number): void {
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 (major chord)

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

  /**
   * Phase transition - electronic sweep
   */
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

  /**
   * Win sound - ascending arpeggio
   */
  private playWin(ctx: AudioContext, now: number, vol: number): void {
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

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

  /**
   * Jackpot - epic fanfare
   */
  private playJackpot(ctx: AudioContext, now: number, vol: number): void {
    // Bass hit
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

    // Chord fanfare
    const chordNotes = [
      { freq: 261.63, delay: 0 },      // C4
      { freq: 329.63, delay: 0.05 },   // E4
      { freq: 392.00, delay: 0.1 },    // G4
      { freq: 523.25, delay: 0.15 },   // C5
      { freq: 659.25, delay: 0.2 },    // E5
      { freq: 783.99, delay: 0.25 },   // G5
      { freq: 1046.50, delay: 0.3 },   // C6
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

    // Shimmer noise
    const shimmerSize = ctx.sampleRate * 1
    const shimmerBuffer = ctx.createBuffer(1, shimmerSize, ctx.sampleRate)
    const shimmerData = shimmerBuffer.getChannelData(0)

    for (let i = 0; i < shimmerSize; i++) {
      shimmerData[i] = (Math.random() * 2 - 1) * 0.3
    }

    const shimmerSource = ctx.createBufferSource()
    shimmerSource.buffer = shimmerBuffer

    const shimmerFilter = ctx.createBiquadFilter()
    shimmerFilter.type = 'highpass'
    shimmerFilter.frequency.value = 8000

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.setValueAtTime(0, now)
    shimmerGain.gain.linearRampToValueAtTime(vol * 0.15, now + 0.2)
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1)

    shimmerSource.connect(shimmerFilter)
    shimmerFilter.connect(shimmerGain)
    shimmerGain.connect(this.getOutput())

    shimmerSource.start(now)
  }

  /**
   * Mechanical spin - casino reel spinning sound
   * Low rumble + clicking mechanism
   */
  private playSpinMechanical(ctx: AudioContext, now: number, vol: number): void {
    // Low mechanical rumble
    const rumbleSize = ctx.sampleRate * 2
    const rumbleBuffer = ctx.createBuffer(1, rumbleSize, ctx.sampleRate)
    const rumbleData = rumbleBuffer.getChannelData(0)

    // Generate rumble with periodic clicks
    for (let i = 0; i < rumbleSize; i++) {
      const t = i / ctx.sampleRate
      // Low frequency rumble
      const rumble = Math.sin(t * 30 * Math.PI * 2) * 0.3
      // Periodic mechanical clicks (12 per second)
      const clickPhase = (t * 12) % 1
      const click = clickPhase < 0.05 ? Math.random() * 0.5 : 0
      // Combine
      rumbleData[i] = (rumble + click) * (1 - t * 0.3) // Slight fade
    }

    const rumbleSource = ctx.createBufferSource()
    rumbleSource.buffer = rumbleBuffer
    rumbleSource.loop = true

    // Low-pass filter for rumble
    const lowPass = ctx.createBiquadFilter()
    lowPass.type = 'lowpass'
    lowPass.frequency.value = 400
    lowPass.Q.value = 1

    // Bandpass for mechanical character
    const bandPass = ctx.createBiquadFilter()
    bandPass.type = 'bandpass'
    bandPass.frequency.value = 200
    bandPass.Q.value = 2

    const rumbleGain = ctx.createGain()
    rumbleGain.gain.setValueAtTime(vol * 0.15, now)

    rumbleSource.connect(lowPass)
    lowPass.connect(bandPass)
    bandPass.connect(rumbleGain)
    rumbleGain.connect(this.getOutput())

    rumbleSource.start(now)

    // Store reference for stopping
    ;(this as any)._spinSource = rumbleSource
    ;(this as any)._spinGain = rumbleGain
  }

  /**
   * Footstep - solid floor footstep sound
   * Like walking on marble/hard floor in a casino
   */
  private playFootstep(ctx: AudioContext, now: number, vol: number): void {
    // Impact thud - low frequency
    const thudOsc = ctx.createOscillator()
    thudOsc.type = 'sine'
    thudOsc.frequency.setValueAtTime(80 + Math.random() * 20, now)
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08)

    const thudGain = ctx.createGain()
    thudGain.gain.setValueAtTime(vol * 0.4, now)
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    // Click/tap - high frequency transient
    const clickBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate)
    const clickData = clickBuffer.getChannelData(0)
    for (let i = 0; i < clickBuffer.length; i++) {
      const t = i / clickBuffer.length
      // Sharp attack, quick decay
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.5
    }

    const clickSource = ctx.createBufferSource()
    clickSource.buffer = clickBuffer

    // Bandpass to make it sound like hard surface
    const clickFilter = ctx.createBiquadFilter()
    clickFilter.type = 'bandpass'
    clickFilter.frequency.value = 2000 + Math.random() * 1000
    clickFilter.Q.value = 2

    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(vol * 0.25, now)

    // Connect thud
    thudOsc.connect(thudGain)
    thudGain.connect(this.getOutput())

    // Connect click
    clickSource.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(this.getOutput())

    // Start
    thudOsc.start(now)
    thudOsc.stop(now + 0.12)
    clickSource.start(now)
  }

  /**
   * Intro whoosh - smooth cinematic swoosh for intro animation
   * Warm, pleasant sound that builds anticipation
   */
  private playIntroWhoosh(ctx: AudioContext, now: number, vol: number): void {
    // Smooth filtered noise sweep - like wind
    const noiseSize = ctx.sampleRate * 2.5
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    for (let i = 0; i < noiseSize; i++) {
      // Pink-ish noise (less harsh than white)
      noiseData[i] = (Math.random() * 2 - 1) * 0.5
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    // Low-pass filter that sweeps up then down
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 1
    filter.frequency.setValueAtTime(100, now)
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.8)
    filter.frequency.exponentialRampToValueAtTime(300, now + 2.0)

    // Gentle envelope
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.linearRampToValueAtTime(vol * 0.15, now + 0.3)
    noiseGain.gain.linearRampToValueAtTime(vol * 0.1, now + 1.5)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

    // Sub bass layer for depth
    const bassOsc = ctx.createOscillator()
    bassOsc.type = 'sine'
    bassOsc.frequency.setValueAtTime(50, now)
    bassOsc.frequency.linearRampToValueAtTime(80, now + 1.0)
    bassOsc.frequency.linearRampToValueAtTime(40, now + 2.0)

    const bassGain = ctx.createGain()
    bassGain.gain.setValueAtTime(0, now)
    bassGain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.5)
    bassGain.gain.linearRampToValueAtTime(vol * 0.15, now + 1.5)
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

    // Shimmer - high harmonic
    const shimmerOsc = ctx.createOscillator()
    shimmerOsc.type = 'sine'
    shimmerOsc.frequency.setValueAtTime(800, now)
    shimmerOsc.frequency.linearRampToValueAtTime(1200, now + 1.0)
    shimmerOsc.frequency.linearRampToValueAtTime(600, now + 2.0)

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.setValueAtTime(0, now)
    shimmerGain.gain.linearRampToValueAtTime(vol * 0.05, now + 0.5)
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)

    // Connect noise path
    noiseSource.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.getOutput())

    // Connect bass
    bassOsc.connect(bassGain)
    bassGain.connect(this.getOutput())

    // Connect shimmer
    shimmerOsc.connect(shimmerGain)
    shimmerGain.connect(this.getOutput())

    // Start all
    noiseSource.start(now)
    bassOsc.start(now)
    bassOsc.stop(now + 2.5)
    shimmerOsc.start(now)
    shimmerOsc.stop(now + 2.5)
  }

  /**
   * Stop the mechanical spin sound with fade out
   */
  stopSpinMechanical(): void {
    const source = (this as any)._spinSource as AudioBufferSourceNode | undefined
    const gain = (this as any)._spinGain as GainNode | undefined

    if (source && gain && this.context) {
      const now = this.context.currentTime
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      setTimeout(() => {
        try { source.stop() } catch {}
      }, 350)
    }

    ;(this as any)._spinSource = null
    ;(this as any)._spinGain = null
  }

  // ============================================
  // CYBER SFX - Intro Animation Sounds
  // ============================================

  /**
   * Cyber glitch - clean digital shimmer with wow factor
   * Smooth tonal blip with harmonics and subtle modulation
   */
  private playCyberGlitch(ctx: AudioContext, now: number, vol: number): void {
    // Primary tone - clean sine with pitch bend
    const baseFreq = 400 + Math.random() * 200
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(baseFreq, now)
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.03)
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.1)

    // Harmonic layer - adds shimmer
    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(baseFreq * 2, now)
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.05)

    // Sub layer for body
    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(baseFreq * 0.5, now)

    // Smooth envelopes
    const gain1 = ctx.createGain()
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(vol * 0.3, now + 0.01)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(vol * 0.15, now + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    const gain3 = ctx.createGain()
    gain3.gain.setValueAtTime(0, now)
    gain3.gain.linearRampToValueAtTime(vol * 0.2, now + 0.01)
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    // Low-pass for smooth character
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 4000
    filter.Q.value = 1

    // Connect
    osc1.connect(gain1)
    osc2.connect(gain2)
    osc3.connect(gain3)
    gain1.connect(filter)
    gain2.connect(filter)
    gain3.connect(filter)
    filter.connect(this.getOutput())

    // Start
    osc1.start(now)
    osc1.stop(now + 0.15)
    osc2.start(now)
    osc2.stop(now + 0.1)
    osc3.start(now)
    osc3.stop(now + 0.12)
  }

  /**
   * Cyber sweep - ascending digital sweep
   */
  private playCyberSweep(ctx: AudioContext, now: number, vol: number): void {
    // Sawtooth sweep
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, now)
    osc.frequency.exponentialRampToValueAtTime(3000, now + 0.4)

    // Low-pass filter sweep
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, now)
    filter.frequency.exponentialRampToValueAtTime(8000, now + 0.35)
    filter.Q.value = 5

    // Add some noise for texture
    const noiseSize = ctx.sampleRate * 0.5
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3
    }
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(500, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(4000, now + 0.4)
    noiseFilter.Q.value = 2

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(vol * 0.15, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(vol * 0.3, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(filter)
    filter.connect(oscGain)
    oscGain.connect(this.getOutput())

    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.5)
    noiseSource.start(now)
  }

  /**
   * Cyber reveal - letter by letter reveal sound
   */
  private playCyberReveal(ctx: AudioContext, now: number, vol: number): void {
    // Quick blip with harmonics
    const frequencies = [800, 1600, 2400]

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      const startTime = now + i * 0.01
      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(vol * (0.2 - i * 0.05), startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08)

      osc.connect(gain)
      gain.connect(this.getOutput())

      osc.start(startTime)
      osc.stop(startTime + 0.1)
    })
  }

  /**
   * Cyber bass - deep sub bass hit
   */
  private playCyberBass(ctx: AudioContext, now: number, vol: number): void {
    // Sub bass oscillator
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(60, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5)

    // Second layer for punch
    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(120, now)
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.3)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol * 0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(vol * 0.3, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(this.getOutput())

    osc2.connect(gain2)
    gain2.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.7)
    osc2.start(now)
    osc2.stop(now + 0.5)
  }

  /**
   * Cyber WOW - Epic finale sound with shimmer, bass impact, and rising chord
   */
  private playCyberWow(ctx: AudioContext, now: number, vol: number): void {
    // Boost volume significantly for impact
    const boostVol = vol * 1.5

    // === BASS IMPACT ===
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

    // === RISING CHORD - C major with shimmer ===
    const chordFreqs = [261.63, 329.63, 392.00, 523.25, 659.25] // C4, E4, G4, C5, E5

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

    // === SHIMMER SWEEP ===
    const shimmerOsc = ctx.createOscillator()
    shimmerOsc.type = 'sawtooth'
    shimmerOsc.frequency.setValueAtTime(2000, now)
    shimmerOsc.frequency.exponentialRampToValueAtTime(8000, now + 0.3)
    shimmerOsc.frequency.exponentialRampToValueAtTime(4000, now + 0.8)

    const shimmerFilter = ctx.createBiquadFilter()
    shimmerFilter.type = 'bandpass'
    shimmerFilter.frequency.setValueAtTime(3000, now)
    shimmerFilter.frequency.exponentialRampToValueAtTime(6000, now + 0.4)
    shimmerFilter.Q.value = 3

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.setValueAtTime(0, now)
    shimmerGain.gain.linearRampToValueAtTime(boostVol * 0.2, now + 0.1)
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    shimmerOsc.connect(shimmerFilter)
    shimmerFilter.connect(shimmerGain)
    shimmerGain.connect(this.getOutput())
    shimmerOsc.start(now)
    shimmerOsc.stop(now + 0.9)

    // === SPARKLE NOISE ===
    const sparkleSize = ctx.sampleRate * 0.8
    const sparkleBuffer = ctx.createBuffer(1, sparkleSize, ctx.sampleRate)
    const sparkleData = sparkleBuffer.getChannelData(0)

    for (let i = 0; i < sparkleSize; i++) {
      const t = i / sparkleSize
      // Sparse sparkle hits
      sparkleData[i] = Math.random() < 0.02 ? (Math.random() * 2 - 1) : 0
    }

    const sparkleSource = ctx.createBufferSource()
    sparkleSource.buffer = sparkleBuffer

    const sparkleFilter = ctx.createBiquadFilter()
    sparkleFilter.type = 'highpass'
    sparkleFilter.frequency.value = 6000

    const sparkleGain = ctx.createGain()
    sparkleGain.gain.setValueAtTime(0, now)
    sparkleGain.gain.linearRampToValueAtTime(boostVol * 0.35, now + 0.15)
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    sparkleSource.connect(sparkleFilter)
    sparkleFilter.connect(sparkleGain)
    sparkleGain.connect(this.getOutput())
    sparkleSource.start(now + 0.05)
  }

  /**
   * Magic Reveal - Clean ethereal sound
   * Pure sine/triangle only - NO noise, NO distortion
   */
  private playMagicReveal(ctx: AudioContext, now: number, vol: number): void {
    const v = vol * 1.2

    // === WARM PAD CHORD - C major 7 ===
    const padFreqs = [261.63, 329.63, 392.00, 493.88] // C4, E4, G4, B4

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      // Gentle vibrato
      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 3
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = freq * 0.004 // Very subtle
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start(now)
      lfo.stop(now + 1.8)

      // Soft lowpass
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

    // === BELL TONES - clean high sparkle ===
    const bellFreqs = [1046.50, 1318.51, 1567.98, 2093.00] // C6, E6, G6, C7
    const bellTimes = [0.05, 0.12, 0.19, 0.26]

    bellFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + bellTimes[i])

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + bellTimes[i])
      gain.gain.linearRampToValueAtTime(v * 0.08, now + bellTimes[i] + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, now + bellTimes[i] + 0.6)

      osc.connect(gain)
      gain.connect(this.getOutput())
      osc.start(now + bellTimes[i])
      osc.stop(now + bellTimes[i] + 0.7)
    })

    // === RISING SHIMMER - pure sine sweep ===
    const shimmerOsc = ctx.createOscillator()
    shimmerOsc.type = 'sine'
    shimmerOsc.frequency.setValueAtTime(800, now)
    shimmerOsc.frequency.exponentialRampToValueAtTime(2400, now + 0.5)
    shimmerOsc.frequency.exponentialRampToValueAtTime(1600, now + 1.0)

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.setValueAtTime(0, now)
    shimmerGain.gain.linearRampToValueAtTime(v * 0.06, now + 0.15)
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

    shimmerOsc.connect(shimmerGain)
    shimmerGain.connect(this.getOutput())
    shimmerOsc.start(now)
    shimmerOsc.stop(now + 1.0)

    // === SOFT SUB - foundation ===
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(65, now) // C2
    subOsc.frequency.linearRampToValueAtTime(82, now + 0.3)
    subOsc.frequency.linearRampToValueAtTime(65, now + 0.7)

    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(0, now)
    subGain.gain.linearRampToValueAtTime(v * 0.18, now + 0.1)
    subGain.gain.setValueAtTime(v * 0.15, now + 0.5)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

    subOsc.connect(subGain)
    subGain.connect(this.getOutput())
    subOsc.start(now)
    subOsc.stop(now + 1.0)
  }

  /**
   * Lever Pull - Mechanical slot machine lever being pulled down
   * Metallic click + ratchet sound + spring tension
   */
  private playLeverPull(ctx: AudioContext, now: number, vol: number): void {
    // === INITIAL CLICK - metal contact ===
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

    // === RATCHET CLICKS - mechanical teeth ===
    const ratchetCount = 4
    for (let i = 0; i < ratchetCount; i++) {
      const delay = 0.02 + i * 0.035
      const ratchetOsc = ctx.createOscillator()
      ratchetOsc.type = 'square'
      ratchetOsc.frequency.setValueAtTime(600 - i * 80, now + delay)
      ratchetOsc.frequency.exponentialRampToValueAtTime(200, now + delay + 0.015)

      const ratchetFilter = ctx.createBiquadFilter()
      ratchetFilter.type = 'highpass'
      ratchetFilter.frequency.value = 400
      ratchetFilter.Q.value = 1

      const ratchetGain = ctx.createGain()
      ratchetGain.gain.setValueAtTime(vol * (0.25 - i * 0.04), now + delay)
      ratchetGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.025)

      ratchetOsc.connect(ratchetFilter)
      ratchetFilter.connect(ratchetGain)
      ratchetGain.connect(this.getOutput())
      ratchetOsc.start(now + delay)
      ratchetOsc.stop(now + delay + 0.03)
    }

    // === SPRING TENSION - low rumble ===
    const springOsc = ctx.createOscillator()
    springOsc.type = 'sine'
    springOsc.frequency.setValueAtTime(80, now)
    springOsc.frequency.linearRampToValueAtTime(120, now + 0.15)

    const springGain = ctx.createGain()
    springGain.gain.setValueAtTime(0, now)
    springGain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.05)
    springGain.gain.linearRampToValueAtTime(vol * 0.15, now + 0.15)
    springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    springOsc.connect(springGain)
    springGain.connect(this.getOutput())
    springOsc.start(now)
    springOsc.stop(now + 0.25)

    // === METAL CREAK - friction sound ===
    const creakOsc = ctx.createOscillator()
    creakOsc.type = 'sawtooth'
    creakOsc.frequency.setValueAtTime(150, now + 0.02)
    creakOsc.frequency.linearRampToValueAtTime(200, now + 0.12)

    const creakFilter = ctx.createBiquadFilter()
    creakFilter.type = 'bandpass'
    creakFilter.frequency.value = 180
    creakFilter.Q.value = 8

    const creakGain = ctx.createGain()
    creakGain.gain.setValueAtTime(0, now + 0.02)
    creakGain.gain.linearRampToValueAtTime(vol * 0.08, now + 0.05)
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    creakOsc.connect(creakFilter)
    creakFilter.connect(creakGain)
    creakGain.connect(this.getOutput())
    creakOsc.start(now + 0.02)
    creakOsc.stop(now + 0.18)
  }

  /**
   * Lever Release - Spring mechanism releasing and snapping back
   * Whoosh + spring boing + impact
   */
  private playLeverRelease(ctx: AudioContext, now: number, vol: number): void {
    // === SPRING RELEASE - twang sound ===
    const springOsc = ctx.createOscillator()
    springOsc.type = 'sine'
    springOsc.frequency.setValueAtTime(400, now)
    springOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15)

    // Modulate for spring wobble
    const wobbleLfo = ctx.createOscillator()
    wobbleLfo.type = 'sine'
    wobbleLfo.frequency.setValueAtTime(25, now)
    wobbleLfo.frequency.exponentialRampToValueAtTime(8, now + 0.15)
    const wobbleGain = ctx.createGain()
    wobbleGain.gain.setValueAtTime(50, now)
    wobbleGain.gain.exponentialRampToValueAtTime(10, now + 0.15)
    wobbleLfo.connect(wobbleGain)
    wobbleGain.connect(springOsc.frequency)
    wobbleLfo.start(now)
    wobbleLfo.stop(now + 0.2)

    const springGain = ctx.createGain()
    springGain.gain.setValueAtTime(vol * 0.3, now)
    springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    springOsc.connect(springGain)
    springGain.connect(this.getOutput())
    springOsc.start(now)
    springOsc.stop(now + 0.2)

    // === WHOOSH - air movement ===
    const whooshSize = ctx.sampleRate * 0.1
    const whooshBuffer = ctx.createBuffer(1, whooshSize, ctx.sampleRate)
    const whooshData = whooshBuffer.getChannelData(0)
    for (let i = 0; i < whooshSize; i++) {
      whooshData[i] = (Math.random() * 2 - 1) * (1 - i / whooshSize)
    }

    const whooshSource = ctx.createBufferSource()
    whooshSource.buffer = whooshBuffer

    const whooshFilter = ctx.createBiquadFilter()
    whooshFilter.type = 'bandpass'
    whooshFilter.frequency.setValueAtTime(2000, now)
    whooshFilter.frequency.exponentialRampToValueAtTime(500, now + 0.08)
    whooshFilter.Q.value = 1

    const whooshGain = ctx.createGain()
    whooshGain.gain.setValueAtTime(vol * 0.15, now)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    whooshSource.connect(whooshFilter)
    whooshFilter.connect(whooshGain)
    whooshGain.connect(this.getOutput())
    whooshSource.start(now)

    // === IMPACT THUD - lever hitting stop ===
    const impactOsc = ctx.createOscillator()
    impactOsc.type = 'sine'
    impactOsc.frequency.setValueAtTime(150, now + 0.08)
    impactOsc.frequency.exponentialRampToValueAtTime(60, now + 0.12)

    const impactGain = ctx.createGain()
    impactGain.gain.setValueAtTime(vol * 0.4, now + 0.08)
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    impactOsc.connect(impactGain)
    impactGain.connect(this.getOutput())
    impactOsc.start(now + 0.08)
    impactOsc.stop(now + 0.18)

    // === METAL CLANK - final stop ===
    const clankOsc = ctx.createOscillator()
    clankOsc.type = 'square'
    clankOsc.frequency.setValueAtTime(800, now + 0.08)
    clankOsc.frequency.exponentialRampToValueAtTime(400, now + 0.1)

    const clankFilter = ctx.createBiquadFilter()
    clankFilter.type = 'bandpass'
    clankFilter.frequency.value = 600
    clankFilter.Q.value = 3

    const clankGain = ctx.createGain()
    clankGain.gain.setValueAtTime(vol * 0.25, now + 0.08)
    clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    clankOsc.connect(clankFilter)
    clankFilter.connect(clankGain)
    clankGain.connect(this.getOutput())
    clankOsc.start(now + 0.08)
    clankOsc.stop(now + 0.15)
  }

  /**
   * UI Open - Soft, pleasant popup sound
   * Gentle rising tone with soft attack - like a notification
   */
  private playUiOpen(ctx: AudioContext, now: number, vol: number): void {
    // Soft sine tone - rising
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15)

    // Second harmonic for richness
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(800, now)
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.15)

    // Soft envelope
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(vol * 0.15, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(vol * 0.1, now + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    // Low-pass filter for softness
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2000
    filter.Q.value = 0.5

    osc.connect(gain)
    osc2.connect(gain2)
    gain.connect(filter)
    gain2.connect(filter)
    filter.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.35)
    osc2.start(now)
    osc2.stop(now + 0.3)
  }

  /**
   * UI Close - Soft descending tone
   * Gentle falling tone - like dismissing a notification
   */
  private playUiClose(ctx: AudioContext, now: number, vol: number): void {
    // Soft sine tone - falling
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(500, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15)

    // Soft envelope
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    // Low-pass filter for softness
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.5

    osc.connect(gain)
    gain.connect(filter)
    filter.connect(this.getOutput())

    osc.start(now)
    osc.stop(now + 0.25)
  }

  /**
   * Reel Spin - Continuous mechanical spinning sound
   * Realistic slot machine reel rotation with bearing noise
   */
  private playReelSpin(ctx: AudioContext, now: number, vol: number): void {
    const duration = 0.4 // Short burst, called repeatedly

    // === MECHANICAL BEARING NOISE - filtered noise ===
    const noiseSize = ctx.sampleRate * duration
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    // Generate rhythmic mechanical noise
    for (let i = 0; i < noiseSize; i++) {
      const t = i / ctx.sampleRate
      // Rhythmic clicking pattern (simulates symbols passing)
      const clickRate = 30 // clicks per second
      const clickPhase = (t * clickRate) % 1
      const isClick = clickPhase < 0.1
      noiseData[i] = (Math.random() * 2 - 1) * (isClick ? 0.8 : 0.2)
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    // Bandpass for mechanical character
    const mechFilter = ctx.createBiquadFilter()
    mechFilter.type = 'bandpass'
    mechFilter.frequency.value = 800
    mechFilter.Q.value = 2

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(vol * 0.25, now)
    noiseGain.gain.exponentialRampToValueAtTime(vol * 0.2, now + duration)

    noiseSource.connect(mechFilter)
    mechFilter.connect(noiseGain)
    noiseGain.connect(this.getOutput())
    noiseSource.start(now)

    // === LOW MOTOR HUM - continuous rotation ===
    const motorOsc = ctx.createOscillator()
    motorOsc.type = 'sine'
    motorOsc.frequency.value = 60 // Motor hum

    const motorOsc2 = ctx.createOscillator()
    motorOsc2.type = 'sine'
    motorOsc2.frequency.value = 120 // Harmonic

    const motorGain = ctx.createGain()
    motorGain.gain.setValueAtTime(vol * 0.08, now)

    const motorGain2 = ctx.createGain()
    motorGain2.gain.setValueAtTime(vol * 0.04, now)

    motorOsc.connect(motorGain)
    motorOsc2.connect(motorGain2)
    motorGain.connect(this.getOutput())
    motorGain2.connect(this.getOutput())

    motorOsc.start(now)
    motorOsc.stop(now + duration)
    motorOsc2.start(now)
    motorOsc2.stop(now + duration)

    // === SYMBOL TICKING - rapid clicks ===
    const tickCount = 8
    for (let i = 0; i < tickCount; i++) {
      const delay = (i / tickCount) * duration
      const tickOsc = ctx.createOscillator()
      tickOsc.type = 'square'
      tickOsc.frequency.setValueAtTime(1500 - i * 50, now + delay)
      tickOsc.frequency.exponentialRampToValueAtTime(800, now + delay + 0.02)

      const tickFilter = ctx.createBiquadFilter()
      tickFilter.type = 'highpass'
      tickFilter.frequency.value = 600

      const tickGain = ctx.createGain()
      tickGain.gain.setValueAtTime(vol * 0.12, now + delay)
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.025)

      tickOsc.connect(tickFilter)
      tickFilter.connect(tickGain)
      tickGain.connect(this.getOutput())
      tickOsc.start(now + delay)
      tickOsc.stop(now + delay + 0.03)
    }
  }

  /**
   * Reel Stop - Mechanical thud when reel locks into place
   * Satisfying "chunk" sound with metal impact
   */
  private playReelStop(ctx: AudioContext, now: number, vol: number): void {
    // === MAIN IMPACT - heavy mechanical thud ===
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

    // === METAL CLICK - locking mechanism ===
    const clickOsc = ctx.createOscillator()
    clickOsc.type = 'square'
    clickOsc.frequency.setValueAtTime(2000, now)
    clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.02)

    const clickFilter = ctx.createBiquadFilter()
    clickFilter.type = 'bandpass'
    clickFilter.frequency.value = 1200
    clickFilter.Q.value = 3

    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(vol * 0.4, now)
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    clickOsc.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(this.getOutput())
    clickOsc.start(now)
    clickOsc.stop(now + 0.05)

    // === SPRING RESONANCE - slight wobble after stop ===
    const springOsc = ctx.createOscillator()
    springOsc.type = 'sine'
    springOsc.frequency.setValueAtTime(180, now + 0.02)
    springOsc.frequency.exponentialRampToValueAtTime(120, now + 0.1)

    // Wobble LFO
    const wobbleLfo = ctx.createOscillator()
    wobbleLfo.type = 'sine'
    wobbleLfo.frequency.value = 15
    const wobbleGain = ctx.createGain()
    wobbleGain.gain.value = 20
    wobbleLfo.connect(wobbleGain)
    wobbleGain.connect(springOsc.frequency)
    wobbleLfo.start(now + 0.02)
    wobbleLfo.stop(now + 0.12)

    const springGain = ctx.createGain()
    springGain.gain.setValueAtTime(0, now + 0.02)
    springGain.gain.linearRampToValueAtTime(vol * 0.15, now + 0.03)
    springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    springOsc.connect(springGain)
    springGain.connect(this.getOutput())
    springOsc.start(now + 0.02)
    springOsc.stop(now + 0.15)

    // === SUB BASS THUMP - weight of reel ===
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(80, now)
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1)

    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(vol * 0.35, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    subOsc.connect(subGain)
    subGain.connect(this.getOutput())
    subOsc.start(now)
    subOsc.stop(now + 0.15)

    // === SECONDARY CLICK - mechanical lock ===
    const lockOsc = ctx.createOscillator()
    lockOsc.type = 'triangle'
    lockOsc.frequency.setValueAtTime(800, now + 0.01)
    lockOsc.frequency.exponentialRampToValueAtTime(400, now + 0.03)

    const lockGain = ctx.createGain()
    lockGain.gain.setValueAtTime(vol * 0.2, now + 0.01)
    lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    lockOsc.connect(lockGain)
    lockGain.connect(this.getOutput())
    lockOsc.start(now + 0.01)
    lockOsc.stop(now + 0.06)
  }
}

// Singleton
export const synthSounds = new SynthSoundGenerator()

// Quick play functions
export const playSynthTick = (vol = 0.4) => synthSounds.play('tick', vol)
export const playSynthSelect = (vol = 0.5) => synthSounds.play('select', vol)
export const playSynthBack = (vol = 0.4) => synthSounds.play('back', vol)
export const playSynthWhoosh = (vol = 0.5) => synthSounds.play('whoosh', vol)
export const playSynthSwoosh = (vol = 0.4) => synthSounds.play('swoosh', vol)
export const playSynthReveal = (vol = 0.5) => synthSounds.play('reveal', vol)
export const playSynthTransition = (vol = 0.4) => synthSounds.play('transition', vol)
export const playSynthWin = (vol = 0.5) => synthSounds.play('win', vol)
export const playSynthJackpot = (vol = 0.6) => synthSounds.play('jackpot', vol)
export const playSynthSpinMech = (vol = 0.2) => synthSounds.play('spinMech', vol)
export const stopSynthSpinMech = () => synthSounds.stopSpinMechanical()
export const playIntroWhoosh = (vol = 0.5) => synthSounds.play('introWhoosh', vol)
export const playSynthFootstep = (vol = 0.3) => synthSounds.play('footstep', vol)

// Cyber SFX exports
export const playCyberGlitch = (vol = 0.4) => synthSounds.play('cyberGlitch', vol)
export const playCyberSweep = (vol = 0.4) => synthSounds.play('cyberSweep', vol)
export const playCyberReveal = (vol = 0.3) => synthSounds.play('cyberReveal', vol)
export const playCyberBass = (vol = 0.5) => synthSounds.play('cyberBass', vol)
export const playCyberWow = (vol = 0.6) => synthSounds.play('cyberWow', vol)
export const playMagicReveal = (vol = 0.5) => synthSounds.play('magicReveal', vol)

// UI SFX exports - soft notification sounds
export const playUiOpen = (vol = 0.4) => synthSounds.play('uiOpen', vol)
export const playUiClose = (vol = 0.3) => synthSounds.play('uiClose', vol)

// Lever SFX exports - slot machine lever sounds (louder)
export const playLeverPull = (vol = 0.7) => synthSounds.play('leverPull', vol)
export const playLeverRelease = (vol = 0.6) => synthSounds.play('leverRelease', vol)

// Reel SFX exports - slot machine reel sounds
export const playReelSpin = (vol = 0.5) => synthSounds.play('reelSpin', vol)
export const playReelStop = (vol = 0.6) => synthSounds.play('reelStop', vol)

// Volume control - connects to DSP sfx slider
export const setSynthVolume = (vol: number) => synthSounds.setVolumeMultiplier(vol)
export const getSynthVolume = () => synthSounds.getVolumeMultiplier()

// Initialize audio context - call on user click to enable audio
export const initSynthSounds = () => synthSounds.init()
