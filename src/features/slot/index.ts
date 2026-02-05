/**
 * Central barrel export for the entire slot feature module
 * Provides unified access to all slot machine components, utilities, and configurations
 *
 * TREE-SHAKING: All exports are named for optimal bundle size
 * PRODUCTION: Ready for distribution
 */

// ============================================
// VIEW COMPONENTS
// ============================================
export {
  AboutView,
  ContactView,
  ExperienceView,
  ProjectsView,
  ServicesView,
  SkillsView,
} from './views'

// ============================================
// ANIMATION COMPONENTS
// ============================================
export {
  SkillReelColumn,
  CoinRain,
  ParticleBurst,
  WinSparkles,
  TypewriterText,
  RippleEffect,
  SelectBurst,
  ScreenShake,
} from './animations'

// ============================================
// UI COMPONENTS & HAPTIC
// ============================================
export {
  GameMarquee,
  LEDDigit,
  WinCounter,
  SkillsDiscovered,
  PaylineIndicator,
  SpinButton,
  haptic,
} from './ui'

// ============================================
// CONFIGURATIONS
// ============================================
export {
  SKILLS_CONFIG,
  EXPERIENCE_CONFIG,
  SERVICES_CONFIG,
  ABOUT_CONFIG,
  PROJECTS_CONFIG,
  CONTACT_CONFIG,
  SEGMENT_CONFIGS,
  getSegmentConfig,
  SLOT_THEMES,
  SLOT_COLORS,
  THEMES,
} from './configs'

// ============================================
// CUSTOM HOOKS
// ============================================
export { useRAF } from './hooks'

// ============================================
// UTILITY FUNCTIONS
// ============================================
export {
  getNavigableItems,
  getItemCount,
  getGridColumns,
} from './utils'

// ============================================
// PORTFOLIO PLAYER
// ============================================
export { PortfolioPlayer, AudioOnlyPlayer } from './portfolio'

// ============================================
// DETAIL MODAL
// ============================================
export { DetailModal } from './detail'

// ============================================
// TYPES (Re-export from types module)
// ============================================
export type {
  SegmentReelConfig,
  SkillReelSymbol,
  SlotSection,
  AboutSection,
} from './types'
