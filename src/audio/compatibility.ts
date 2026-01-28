/**
 * Compatibility Layer - Maps old AudioDSP + SynthSounds API to UnifiedAudioSystem
 *
 * This allows gradual migration without breaking existing code.
 * Eventually, all files should import directly from UnifiedAudioSystem.
 */

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
  uaGetBassLevel
} from './UnifiedAudioSystem'

// ============================================
// AudioDSP Compatibility (External Sounds)
// ============================================

/**
 * Initialize audio (call after user interaction)
 * @deprecated Use initUnifiedAudio() instead
 */
export async function initAudio(): Promise<void> {
  await initUnifiedAudio()
}

/**
 * Play a sound
 * @deprecated Use uaPlay() instead
 */
export function dspPlay(id: string): string {
  return uaPlay(id)
}

/**
 * Stop a sound
 * @deprecated Use uaStop() instead
 */
export function dspStop(id: string, fadeTime = 0.3): void {
  uaStop(id, fadeTime)
}

/**
 * Set volume
 * @deprecated Use uaVolume() instead
 */
export function dspVolume(bus: 'master' | 'music' | 'sfx' | 'ui', volume: number): void {
  uaVolume(bus, volume)
}

/**
 * Get current volume
 * @deprecated Use uaGetVolume() instead
 */
export function dspGetVolume(bus: 'master' | 'music' | 'sfx' | 'ui'): number {
  return uaGetVolume(bus)
}

/**
 * Mute/unmute
 * @deprecated Use uaMute() instead
 */
export function dspMute(muted: boolean): void {
  uaMute(muted)
}

/**
 * Check if playing
 * @deprecated Use uaIsPlaying() instead
 */
export function dspIsPlaying(id: string): boolean {
  return uaIsPlaying(id)
}

/**
 * Get frequency data for visualization
 * @deprecated Use uaGetFrequencyData() instead
 */
export function dspGetFrequencyData(): Uint8Array | null {
  return uaGetFrequencyData()
}

/**
 * Get bass level (0-1) for reactive elements
 * @deprecated Use uaGetBassLevel() instead
 */
export function dspGetBassLevel(): number {
  return uaGetBassLevel()
}

// ============================================
// SynthSounds Compatibility (Procedural)
// ============================================

/**
 * Play tick sound - arrow navigation
 * @deprecated Use uaPlaySynth('tick', vol) instead
 */
export function playSynthTick(vol = 0.4): void {
  uaPlaySynth('tick', vol)
}

/**
 * Play select sound - enter/confirm
 * @deprecated Use uaPlaySynth('select', vol) instead
 */
export function playSynthSelect(vol = 0.5): void {
  uaPlaySynth('select', vol)
}

/**
 * Play back sound - escape/cancel
 * @deprecated Use uaPlaySynth('back', vol) instead
 */
export function playSynthBack(vol = 0.4): void {
  uaPlaySynth('back', vol)
}

/**
 * Play whoosh sound - modal open
 * @deprecated Use uaPlaySynth('whoosh', vol) instead
 */
export function playSynthWhoosh(vol = 0.5): void {
  uaPlaySynth('whoosh', vol)
}

/**
 * Play swoosh sound - modal close
 * @deprecated Use uaPlaySynth('swoosh', vol) instead
 */
export function playSynthSwoosh(vol = 0.4): void {
  uaPlaySynth('swoosh', vol)
}

/**
 * Play reveal sound - content appearing
 * @deprecated Use uaPlaySynth('reveal', vol) instead
 */
export function playSynthReveal(vol = 0.5): void {
  uaPlaySynth('reveal', vol)
}

/**
 * Play transition sound - phase change
 * @deprecated Use uaPlaySynth('transition', vol) instead
 */
export function playSynthTransition(vol = 0.4): void {
  uaPlaySynth('transition', vol)
}

/**
 * Play win sound - ascending arpeggio
 * @deprecated Use uaPlaySynth('win', vol) instead
 */
export function playSynthWin(vol = 0.5): void {
  uaPlaySynth('win', vol)
}

/**
 * Play jackpot sound - epic fanfare
 * @deprecated Use uaPlaySynth('jackpot', vol) instead
 */
export function playSynthJackpot(vol = 0.6): void {
  uaPlaySynth('jackpot', vol)
}

/**
 * Play intro whoosh - smooth cinematic swoosh
 * @deprecated Use uaPlaySynth('introWhoosh', vol) instead
 */
export function playIntroWhoosh(vol = 0.5): void {
  uaPlaySynth('introWhoosh', vol)
}

/**
 * Play cyber glitch - digital shimmer
 * @deprecated Use uaPlaySynth('cyberGlitch', vol) instead
 */
export function playCyberGlitch(vol = 0.4): void {
  uaPlaySynth('cyberGlitch', vol)
}

/**
 * Play cyber sweep - ascending digital sweep
 * @deprecated Use uaPlaySynth('cyberSweep', vol) instead
 */
export function playCyberSweep(vol = 0.4): void {
  uaPlaySynth('cyberSweep', vol)
}

/**
 * Play cyber reveal - letter by letter reveal
 * @deprecated Use uaPlaySynth('cyberReveal', vol) instead
 */
export function playCyberReveal(vol = 0.3): void {
  uaPlaySynth('cyberReveal', vol)
}

/**
 * Play cyber bass - deep sub bass hit
 * @deprecated Use uaPlaySynth('cyberBass', vol) instead
 */
export function playCyberBass(vol = 0.5): void {
  uaPlaySynth('cyberBass', vol)
}

/**
 * Play cyber wow - epic finale sound
 * @deprecated Use uaPlaySynth('cyberWow', vol) instead
 */
export function playCyberWow(vol = 0.6): void {
  uaPlaySynth('cyberWow', vol)
}

/**
 * Play magic reveal - ethereal + digital
 * @deprecated Use uaPlaySynth('magicReveal', vol) instead
 */
export function playMagicReveal(vol = 0.5): void {
  uaPlaySynth('magicReveal', vol)
}

/**
 * Play UI open - soft popup sound
 * @deprecated Use uaPlaySynth('uiOpen', vol) instead
 */
export function playUiOpen(vol = 0.4): void {
  uaPlaySynth('uiOpen', vol)
}

/**
 * Play UI close - soft dismissing sound
 * @deprecated Use uaPlaySynth('uiClose', vol) instead
 */
export function playUiClose(vol = 0.3): void {
  uaPlaySynth('uiClose', vol)
}

/**
 * Play lever pull - mechanical slot machine lever
 * @deprecated Use uaPlaySynth('leverPull', vol) instead
 */
export function playLeverPull(vol = 0.7): void {
  uaPlaySynth('leverPull', vol)
}

/**
 * Play lever release - spring mechanism
 * @deprecated Use uaPlaySynth('leverRelease', vol) instead
 */
export function playLeverRelease(vol = 0.6): void {
  uaPlaySynth('leverRelease', vol)
}

/**
 * Play footstep - solid floor footstep
 * @deprecated Use uaPlaySynth('footstep', vol) instead
 */
export function playSynthFootstep(vol = 0.3): void {
  uaPlaySynth('footstep', vol)
}

/**
 * Play reel stop - mechanical thud
 * @deprecated Use uaPlaySynth('reelStop', vol) instead
 */
export function playReelStop(vol = 0.6): void {
  uaPlaySynth('reelStop', vol)
}

// Export singleton for direct access if needed
export { unifiedAudio }
