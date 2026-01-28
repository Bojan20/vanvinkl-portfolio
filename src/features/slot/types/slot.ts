/**
 * Slot Machine Type Definitions
 *
 * Re-exports from store + local slot types.
 */

// Re-export slot section types from store
export type {
  SlotSection,
  SkillsSection,
  ServicesSection,
  AboutSection,
  ProjectsSection,
  ExperienceSection,
  ContactSection
} from '../../../store/slotContent'

/**
 * Slot machine phase (state machine)
 */
export type SlotPhase = 'intro' | 'spinning' | 'result' | 'content'

/**
 * Intro animation step
 */
export type IntroStep = 'fade-in' | 'title' | 'instructions' | 'ready'

/**
 * Navigable item (for keyboard/touch navigation)
 */
export interface NavigableItem {
  icon: string
  title: string
  subtitle?: string
  details?: string
}

/**
 * Slot theme colors
 */
export interface SlotTheme {
  primary: string
  secondary: string
  accent: string
  glow: string
}
