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

class SynthSoundGenerator {
  private context: AudioContext | null = null

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
    }
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
    return this.context
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
    gain.connect(ctx.destination)

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
    gain1.connect(ctx.destination)
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
    gain2.connect(ctx.destination)
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
    gain.connect(ctx.destination)

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
    gain.connect(ctx.destination)

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
    gain.connect(ctx.destination)

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
      gain.connect(ctx.destination)

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
    gain.connect(ctx.destination)

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
      gain.connect(ctx.destination)

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
    bassGain.connect(ctx.destination)
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
      gain.connect(ctx.destination)

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
    shimmerGain.connect(ctx.destination)

    shimmerSource.start(now)
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
