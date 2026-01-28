// ============================================
// SLOT THEMES - Symbol Sets for Each Segment
// ============================================

// Color constants
export const SLOT_COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  lime: '#00ff88',
  gold: '#ffd700',
  red: '#ff4444',
  linkedin: '#0077b5'
} as const

// Themed symbols for each slot - legacy for fallback
export const SLOT_THEMES: Record<string, {
  symbols: string[]
  title: string
}> = {
  skills: {
    symbols: ['⚡', '🔧', '💻', '🎯', '⚙️', '🚀', '💡', '🔥', '⭐', '💎'],
    title: 'SKILLS'
  },
  services: {
    symbols: ['🎰', '🎮', '🌐', '📱', '🔨', '💼', '🎯', '🛠️', '📊', '🎨'],
    title: 'SERVICES'
  },
  about: {
    symbols: ['👨‍💻', '🏆', '🌍', '💬', '✨', '🎓', '💪', '🧠', '❤️', '🌟'],
    title: 'ABOUT'
  },
  projects: {
    symbols: ['🎰', '🃏', '🎮', '📊', '🔧', '🎨', '🔥', '💎', '🏆', '⭐'],
    title: 'PROJECTS'
  },
  experience: {
    symbols: ['🏢', '🎰', '🌐', '🎓', '📜', '⭐', '🚀', '💼', '🏆', '📈'],
    title: 'EXPERIENCE'
  },
  contact: {
    symbols: ['📧', '💼', '🐙', '🌐', '📱', '💬', '🤝', '✉️', '🔗', '📞'],
    title: 'CONTACT'
  }
}
