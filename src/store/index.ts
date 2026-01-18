/**
 * Store exports
 */

export {
  useGameStore,
  gameRefs,
  resetGameRefs,
  // Selectors
  selectShowIntro,
  selectIsSitting,
  selectNearMachine,
  selectNearCouch,
  selectSpinningMachine,
  selectWinMachine,
  selectIsJackpot,
  selectModalData,
  selectMuted
} from './gameStore'

export {
  COLORS,
  MATERIAL_CONFIGS,
  TIMING,
  DISTANCES,
  SPEEDS,
  SLOT_CONFIG,
  SLOT_SYMBOLS,
  type ColorKey,
  type SlotMachineId
} from './theme'

export {
  SLOT_CONTENT,
  MACHINE_ORDER,
  getNextMachine,
  getPrevMachine,
  getProgress,
  markVisited,
  recordJackpot,
  type SlotSection,
  type SkillsSection,
  type ServicesSection,
  type AboutSection,
  type ProjectsSection,
  type ExperienceSection,
  type ContactSection,
  type SkillItem,
  type SkillCategory,
  type ServiceItem,
  type ProjectItem,
  type TimelineItem,
  type ContactMethod,
  type AboutItem,
  type CTA,
  type VisitorProgress
} from './slotContent'
