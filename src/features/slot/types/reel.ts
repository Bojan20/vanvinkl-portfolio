/**
 * Slot Reel Type Definitions
 *
 * Core types for slot machine reels and symbols.
 */

/**
 * Single symbol on a slot reel
 */
export interface SkillReelSymbol {
  icon: string
  label: string
  color: string
  info?: string // Extra info shown in jackpot story
}

/**
 * Configuration for a complete slot machine segment (5 reels)
 */
export interface SegmentReelConfig {
  title: string
  subtitle: string
  reels: SkillReelSymbol[][] // 5 reels × N symbols each
  stories: { indices: number[]; story: string; highlight: string }[]
  generateStory: (indices: number[], reels: SkillReelSymbol[][]) => string
}

/**
 * Reel column animation state
 */
export type ReelPhase = 'idle' | 'accelerate' | 'spin' | 'decelerate' | 'bounce'

/**
 * Props for SkillReelColumn component
 */
export interface SkillReelColumnProps {
  reelData: SkillReelSymbol[]
  spinning: boolean
  finalIndex: number
  delay: number
  reelIndex: number
  jackpot: boolean
  forceStop: boolean
  onReelStop: (index: number, symbol: SkillReelSymbol) => void
}
