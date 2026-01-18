/**
 * Centralized Theme - Single source of truth for colors, sizes, timing
 * ZERO re-renders - values are static exports
 */

// ============================================
// COLORS - Cyberpunk palette
// ============================================
export const COLORS = {
  // Primary neons
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700',

  // Secondary
  blue: '#4466ff',
  green: '#00ff88',
  orange: '#ff6600',

  // Backgrounds
  deepPurple: '#2a0040',
  black: '#050508',
  darkBlue: '#0a0a14',

  // Materials
  chrome: '#aaaabc',
  screen: '#101820',

  // UI
  textPrimary: '#ffffff',
  textSecondary: '#aaaacc',
  textMuted: '#666688'
} as const

// ============================================
// MATERIALS - Pre-computed THREE.js material configs
// ============================================
export const MATERIAL_CONFIGS = {
  floor: { color: '#1a1520', metalness: 0.4, roughness: 0.7 },
  wall: { color: '#1a1420', metalness: 0.6, roughness: 0.4 },
  ceiling: { color: '#151218', metalness: 0.7, roughness: 0.3 },
  ceilingPanel: { color: '#201828', metalness: 0.8, roughness: 0.2 },
  velvetPurple: { color: '#6b2d7b', metalness: 0.05, roughness: 0.9 },
  velvetTeal: { color: '#1a5c6b', metalness: 0.05, roughness: 0.9 },
  velvetWine: { color: '#7b2d4a', metalness: 0.05, roughness: 0.9 },
  goldChrome: { color: '#c9a227', metalness: 1, roughness: 0.15 },
  chrome: { color: '#666666', metalness: 1, roughness: 0.1 },
  darkMetal: { color: '#0a0a12', metalness: 0.7, roughness: 0.3 },
  barTop: { color: '#1a1a28', metalness: 0.8, roughness: 0.2 },
  barBody: { color: '#080810', metalness: 0.6, roughness: 0.4 }
} as const

// ============================================
// TIMING - Animation durations (ms)
// ALL values optimized for zero-perceived-latency
// ============================================
export const TIMING = {
  // Instant feedback (<16ms = same frame)
  instant: 0,

  // Quick responses (perceptible but snappy)
  quick: 100,

  // Standard animations
  fast: 150,
  normal: 250,

  // Intro/cinematic (allowed to be longer)
  intro: 3500,

  // Slot machine
  spinDuration: 1500,
  reelStopInterval: 200,
  winCelebration: 1000,

  // Movement
  footstepInterval: 350  // ms between footsteps
} as const

// ============================================
// DISTANCES - Game world measurements
// ============================================
export const DISTANCES = {
  // Interaction ranges
  machineInteract: 4,
  couchInteract: 3,

  // Camera
  followDistance: 10,
  followHeight: 4,
  orbitMinDistance: 3,
  orbitMaxDistance: 12,

  // Audio
  ambientRefDistance: 20,
  ambientMaxDistance: 100,
  neonRefDistance: 3,
  neonMaxDistance: 15
} as const

// ============================================
// SPEEDS - Movement and animation rates
// ============================================
export const SPEEDS = {
  // Avatar movement (units/second)
  walk: 8,

  // Camera orbit (radians/second)
  orbitRotation: 5,
  orbitPitch: 3,

  // Slot reel spin
  reelSpin: [15, 14, 13, 12, 11]  // Per-reel speeds
} as const

// ============================================
// SLOT MACHINE CONFIG
// ============================================
export const SLOT_CONFIG = {
  machines: [
    { id: 'skills', label: 'SKILLS', x: -15 },
    { id: 'services', label: 'SERVICES', x: -9 },
    { id: 'about', label: 'ABOUT', x: -3 },
    { id: 'projects', label: 'PROJECTS', x: 3 },
    { id: 'experience', label: 'EXPERIENCE', x: 9 },
    { id: 'contact', label: 'CONTACT', x: 15 }
  ],
  machineZ: -3,
  jackpotChance: 0.2
} as const

// ============================================
// THEMED SYMBOLS - Per-machine icons
// ============================================
export const SLOT_SYMBOLS: Record<string, { symbols: string[], colors: string[] }> = {
  skills: {
    symbols: ['⚡', '🔧', '💻', '🎯', '⚙️', '🎨', '🔊', '📐'],
    colors: [COLORS.cyan, COLORS.gold, COLORS.magenta, COLORS.green, COLORS.purple, COLORS.orange, '#00aaff', '#ffaa00']
  },
  services: {
    symbols: ['🎰', '🎮', '🌐', '📱', '🔨', '💡', '🚀', '⭐'],
    colors: [COLORS.gold, COLORS.magenta, COLORS.cyan, COLORS.green, COLORS.purple, '#ffaa00', COLORS.orange, '#00aaff']
  },
  about: {
    symbols: ['👨‍💻', '🏆', '🌍', '💬', '✨', '🎯', '💼', '🔥'],
    colors: [COLORS.cyan, COLORS.gold, COLORS.purple, COLORS.magenta, COLORS.green, '#ffaa00', COLORS.orange, '#00aaff']
  },
  projects: {
    symbols: ['🎰', '🃏', '🎮', '📊', '🔧', '💎', '🎲', '🏆'],
    colors: [COLORS.magenta, COLORS.gold, COLORS.cyan, COLORS.purple, COLORS.green, '#ffaa00', COLORS.orange, '#00aaff']
  },
  experience: {
    symbols: ['🏢', '🎰', '🌐', '🎓', '📜', '⭐', '💼', '🚀'],
    colors: [COLORS.purple, COLORS.gold, COLORS.cyan, COLORS.magenta, COLORS.green, '#ffaa00', COLORS.orange, '#00aaff']
  },
  contact: {
    symbols: ['📧', '💼', '🐙', '🌐', '📱', '💬', '🤝', '✉️'],
    colors: [COLORS.cyan, COLORS.purple, COLORS.gold, COLORS.magenta, COLORS.green, '#ffaa00', COLORS.orange, '#00aaff']
  }
}

// Type exports
export type ColorKey = keyof typeof COLORS
export type SlotMachineId = typeof SLOT_CONFIG.machines[number]['id']
