/**
 * Slot Content - Rich content structure for each slot machine
 *
 * Features:
 * - Skill bars with levels (0-100)
 * - Taglines for quick pitch
 * - CTAs for cross-linking
 * - Structured data for visual presentation
 */

// ============================================
// TYPES
// ============================================

export interface SkillItem {
  name: string
  level: number  // 0-100
  icon?: string
}

export interface SkillCategory {
  name: string
  icon: string
  color: string  // For progress bar
  skills: SkillItem[]
}

export interface ServiceItem {
  icon: string
  title: string
  description: string
  features: string[]
}

export interface AudioTrack {
  label: string
  path: string  // Without extension - .opus and .m4a will be appended
}

export interface ProjectItem {
  title: string
  icon: string
  tags: string[]
  description: string
  year: string
  videoPath?: string
  musicPath?: string
  sfxPath?: string
  audioTracks?: AudioTrack[]  // For audio-only projects
}

export interface TimelineItem {
  period: string
  role: string
  company: string
  highlights: string[]
}

export interface ContactMethod {
  icon: string
  label: string
  value: string
  action: 'email' | 'link' | 'copy'
  url?: string
}

export interface AboutItem {
  icon: string
  label: string
  value: string
  description?: string
}

export interface CTA {
  label: string
  machineId?: string
  external?: string
}

// Base section interface
export interface SectionBase {
  id: string
  title: string
  tagline: string
  color: string  // Theme color for this section
  cta?: CTA
}

export interface SkillsSection extends SectionBase {
  type: 'skills'
  categories: SkillCategory[]
}

export interface ServicesSection extends SectionBase {
  type: 'services'
  items: ServiceItem[]
}

export interface AboutSection extends SectionBase {
  type: 'about'
  bio: string
  stats: AboutItem[]
}

export interface ProjectsSection extends SectionBase {
  type: 'projects'
  featured: ProjectItem[]
}

export interface ExperienceSection extends SectionBase {
  type: 'experience'
  timeline: TimelineItem[]
}

export interface ContactSection extends SectionBase {
  type: 'contact'
  methods: ContactMethod[]
  availability: string
}

export type SlotSection =
  | SkillsSection
  | ServicesSection
  | AboutSection
  | ProjectsSection
  | ExperienceSection
  | ContactSection

// ============================================
// CONTENT
// ============================================

export const SLOT_CONTENT: Record<string, SlotSection> = {
  skills: {
    id: 'skills',
    type: 'skills',
    title: 'SKILLS',
    tagline: 'Professional Audio Production & Sound Design Expertise',
    color: '#00ffff',
    categories: [
      {
        name: 'Game Audio Design',
        icon: '🎮',
        color: '#00ffff',
        skills: [
          { name: 'Slot Game Sound Design', level: 98 },
          { name: 'Feature-Focused Audio', level: 95 },
          { name: 'Event-Based Implementation', level: 92 },
          { name: 'Audio QA & Build Validation', level: 95 },
          { name: 'Adaptive Music Systems', level: 93 }
        ]
      },
      {
        name: 'Tools & DAWs',
        icon: '⚙️',
        color: '#ff00aa',
        skills: [
          { name: 'Logic Pro', level: 96 },
          { name: 'Reaper', level: 94 },
          { name: 'iZotope RX', level: 92 },
          { name: 'Event-Driven Systems', level: 90 },
          { name: 'In-House Audio Tools', level: 88 }
        ]
      },
      {
        name: 'Music Production',
        icon: '🎹',
        color: '#8844ff',
        skills: [
          { name: 'Original Composition', level: 96 },
          { name: 'Layered Music Systems', level: 95 },
          { name: 'Orchestral Arrangement', level: 88 },
          { name: 'Electronic Production', level: 92 },
          { name: 'Adaptive Transitions', level: 93 }
        ]
      },
      {
        name: 'Audio Post-Production',
        icon: '🎚️',
        color: '#ffd700',
        skills: [
          { name: 'Mixing & Mastering', level: 95 },
          { name: 'Foley Recording', level: 85 },
          { name: 'Custom Sound Libraries', level: 93 },
          { name: 'Audio Restoration', level: 88 },
          { name: 'Format Optimization', level: 92 }
        ]
      }
    ],
    cta: { label: 'See My Work', machineId: 'projects' }
  },

  services: {
    id: 'services',
    type: 'services',
    title: 'SERVICES',
    tagline: 'Complete Audio Solutions for Games & Interactive Media',
    color: '#ff00aa',
    items: [
      {
        icon: '🎰',
        title: 'Slot Game Audio Packages',
        description: 'End-to-end audio production for slot games — from creative direction through implementation logic to final delivery. Production-ready packages for EU regulated markets.',
        features: [
          'Full soundtrack (base game, free spins, feature states)',
          'Complete SFX library with event-based implementation',
          'Adaptive music with smooth state transitions',
          'Multi-format delivery (WAV, MP3, OGG, FLAC, AAC, Opus)',
          'Parallel production across multiple titles'
        ]
      },
      {
        icon: '🎵',
        title: 'Original Music Composition',
        description: 'Adaptive and layered music structures aligned with gameplay progression. Clear escalation, smooth transitions and musically coherent systems for every game state.',
        features: [
          'Layered music systems (base game, features, bonus)',
          'Adaptive transitions between game states',
          'Theme-based original compositions',
          'Loop-friendly arrangements',
          'Multiple variations for volatility pacing'
        ]
      },
      {
        icon: '🔊',
        title: 'Sound Design & SFX',
        description: 'Feature-focused sound design crafted to support gameplay mechanics and player feedback. Every sound reinforces visual presentation and emotional pacing.',
        features: [
          'Custom Foley recording',
          'Custom sound libraries',
          'UI/UX audio design',
          'Win celebration & big win sequences',
          'Ambient soundscapes & atmosphere'
        ]
      },
      {
        icon: '🎚️',
        title: 'Audio QA & Mastering',
        description: 'Structured QA and polish passes to identify missing events, balance issues and integration gaps. Professional mastering for consistent quality across platforms.',
        features: [
          'Audio trigger validation across builds',
          'Loudness normalization (LUFS standards)',
          'Cross-platform testing & optimization',
          'Audio bug identification & reporting',
          'Final mastering & delivery preparation'
        ]
      }
    ],
    cta: { label: 'Get In Touch', machineId: 'contact' }
  },

  about: {
    id: 'about',
    type: 'about',
    title: 'ABOUT',
    tagline: 'Bojan Petkovic — Audio Producer | Sound Designer | Composer',
    color: '#8844ff',
    bio: "Senior Audio Producer, Lead Sound Designer and Composer with over ten years of experience in slot and mobile game development. I work across the full audio pipeline — from creative direction and production to implementation logic, build validation and final delivery.\n\nMy focus is on building clear, feature-driven and musically coherent audio systems that support gameplay flow, volatility pacing and long-term player engagement, with strong experience in EU regulated markets.\n\nI am equally comfortable working hands-on and at a production level, collaborating closely with producers, designers, artists and engineers while maintaining audio quality under tight schedules and parallel production pressure. I also bring leadership experience through mentoring sound designers, planning workloads and setting practical audio standards that hold up in real production environments.",
    stats: [
      { icon: '📅', label: 'Industry Experience', value: '10+ Years', description: 'Over ten years of experience in slot and mobile game development, covering the full audio pipeline from creative direction and production to implementation logic, build validation and final delivery.' },
      { icon: '🎰', label: 'Slot Titles', value: '50+', description: 'Contributed to more than fifty slot game titles for EU regulated markets with full audio ownership on multiple productions, including sound design, music composition and implementation.' },
      { icon: '🏢', label: 'IGT', value: 'Senior Sound Designer, Audio Lead', description: 'Worked as Senior Sound Designer and Audio Lead on multiple slot titles within a large international studio. Led and mentored a team of three sound designers, overseeing task planning, reviews and overall audio quality. Focused on clarity, pacing and player feedback for regulated markets.' },
      { icon: '🏢', label: 'Playnetic', value: 'Audio Producer, Lead Sound Designer', description: 'Responsible for end-to-end audio production across approximately ten slot game productions running in parallel. Designed adaptive and layered music structures for base game, free spins and feature states. Validated audio triggers and coverage across builds with structured QA and polish passes.' },
      { icon: '🎓', label: 'Education', value: 'SAE Institute + BA Music', description: 'Diploma in Audio Production from SAE Institute in Belgrade with specialization in audio for interactive media. Bachelor\'s degree in accordion and piano performance, providing a strong foundation in harmony, arrangement and musical structure.' },
      { icon: '🌐', label: 'Work Style', value: 'Remote / International', description: 'Collaborating with international clients in fully remote production setups, delivering production-ready audio and maintaining clear, reliable communication throughout development cycles.' }
    ],
    cta: { label: 'My Journey', machineId: 'experience' }
  },

  projects: {
    id: 'projects',
    type: 'projects',
    title: 'PROJECTS',
    tagline: 'Selected Works & Case Studies',
    color: '#ffd700',
    featured: [
      {
        title: 'Piggy Plunger',
        icon: '🐷',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'Interactive slot game portfolio featuring synchronized video and audio presentation. Complete production showcase with background music and sound effects.',
        year: '2025',
        videoPath: '/videoSlotPortfolio/Piggy Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Piggy-Plunger-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'
      },
      {
        title: 'Smash Factory',
        icon: '🔨',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'High-energy slot game audio production with dynamic soundscape. Features explosive sound design and driving music tracks synchronized with gameplay mechanics.',
        year: '2025',
        videoPath: '/videoSlotPortfolio/Smash Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Smash-Factory-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Smash-Factory-SFX'
      },
      {
        title: 'Starlight Travelers',
        icon: '✨',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'Cosmic-themed slot game audio with ethereal soundscapes and atmospheric music. Immersive space exploration experience with layered audio design.',
        year: '2025',
        videoPath: '/videoSlotPortfolio/Starlight Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Starlight-Travelers-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Starlight-Travelers-SFX'
      },
      {
        title: 'Mummy',
        icon: '🏺',
        tags: ['Slots', 'Audio'],
        description: 'Ancient Egypt-themed slot game with layered music system and dramatic big win audio.',
        year: '2026',
        audioTracks: [
          { label: 'Base Game (3 Layers)', path: '/audioSlotPortfolio/portfolio/Mummy-BG' },
          { label: 'Big Win', path: '/audioSlotPortfolio/portfolio/Mummy-BW' }
        ]
      },
      {
        title: 'Valkyries',
        icon: '⚔️',
        tags: ['Slots', 'Audio'],
        description: 'Norse mythology slot with epic orchestral layers and powerful big win celebration audio.',
        year: '2026',
        audioTracks: [
          { label: 'Base Game (3 Layers)', path: '/audioSlotPortfolio/portfolio/Valkyries-BG' },
          { label: 'Big Win', path: '/audioSlotPortfolio/portfolio/Valkyries-BW' }
        ]
      },
      {
        title: 'Zhulongs',
        icon: '🐉',
        tags: ['Slots', 'Audio'],
        description: 'Asian dragon-themed slot featuring layered base game music and celebratory big win sequences.',
        year: '2025',
        audioTracks: [
          { label: 'Base Game (3 Layers)', path: '/audioSlotPortfolio/portfolio/Zhulongs-BG' },
          { label: 'Big Win', path: '/audioSlotPortfolio/portfolio/Zhulongs-BW' }
        ]
      },
      {
        title: "Blazin's",
        icon: '🔥',
        tags: ['Slots', 'Audio'],
        description: 'High-energy slot game with multi-layered base game audio design.',
        year: '2025',
        audioTracks: [
          { label: 'Base Game (3 Layers)', path: '/audioSlotPortfolio/portfolio/Blazins-BG' }
        ]
      },
      {
        title: 'Midnight',
        icon: '🌙',
        tags: ['Slots', 'Audio'],
        description: 'Atmospheric midnight-themed slot with layered ambient music composition.',
        year: '2026',
        audioTracks: [
          { label: 'Base Game (2 Layers)', path: '/audioSlotPortfolio/portfolio/Midnight-BG' }
        ]
      }
    ],
    cta: { label: 'Listen to Demo Reel', external: 'https://vanvinkl.com/demos' }
  },

  experience: {
    id: 'experience',
    type: 'experience',
    title: 'EXPERIENCE',
    tagline: 'Professional Journey in Audio Production',
    color: '#00ff88',
    timeline: [
      {
        period: 'Jun 2024 - Feb 2026',
        role: 'Audio Producer, Lead Sound Designer, Composer',
        company: 'Playnetic',
        highlights: [
          'End-to-end audio production across ~10 slot games in parallel',
          'Adaptive and layered music for base game, free spins and feature states',
          'Audio trigger validation, structured QA and polish passes',
          'Collaboration with production, game design, art and engineering'
        ]
      },
      {
        period: 'May 2024 - Present',
        role: 'Founder, Audio Producer',
        company: 'VanVinkl Studio',
        highlights: [
          'Independent audio production studio for slot and mobile games',
          'Full audio solutions: sound design, music, implementation, mastering',
          'International clients in fully remote production setups',
          'Production-ready audio with clear, reliable communication'
        ]
      },
      {
        period: 'Sep 2020 - May 2024',
        role: 'Senior Sound Designer, Audio Lead',
        company: 'IGT (International Game Technology)',
        highlights: [
          'Led and mentored team of 3 sound designers',
          'Complete sound design and music packages for multiple slot titles',
          'Audio iteration based on playtests and build feedback',
          'Internal workflows and review processes for EU regulated markets'
        ]
      },
      {
        period: 'Education',
        role: 'Audio Production & Music Performance',
        company: 'SAE Institute & Faculty of Music Belgrade',
        highlights: [
          'Audio Production Diploma — SAE Institute, Belgrade',
          'Specialization in audio for interactive media',
          'BA in Accordion & Piano Performance',
          'Foundation in harmony, arrangement and musical structure'
        ]
      }
    ],
    cta: { label: 'My Skills', machineId: 'skills' }
  },

  contact: {
    id: 'contact',
    type: 'contact',
    title: 'CONTACT',
    tagline: "Let's Create Something Amazing Together",
    color: '#ff4444',
    methods: [
      {
        icon: '📧',
        label: 'Email',
        value: 'vanvinklstudio@gmail.com',
        action: 'email',
        url: 'mailto:vanvinklstudio@gmail.com'
      },
      {
        icon: '📱',
        label: 'Phone',
        value: '+381 69 400 0062',
        action: 'copy',
        url: 'tel:+381694000062'
      },
      {
        icon: '💼',
        label: 'LinkedIn',
        value: 'Bojan Petkovic',
        action: 'link',
        url: 'https://linkedin.com/in/bojan-petkovic-audio'
      },
      {
        icon: '🌐',
        label: 'Website',
        value: 'vanvinkl.com',
        action: 'link',
        url: 'https://vanvinkl.com'
      }
    ],
    availability: 'Currently accepting new projects. Typical turnaround: 2-4 weeks for full slot audio packages.',
    cta: { label: 'Send Project Inquiry', external: 'mailto:vanvinklstudio@gmail.com?subject=Project%20Inquiry%20-%20Slot%20Audio' }
  }
}

// Machine order for navigation
export const MACHINE_ORDER = ['skills', 'services', 'about', 'projects', 'experience', 'contact'] as const

// Get next/previous machine
export function getNextMachine(currentId: string): string {
  const index = MACHINE_ORDER.indexOf(currentId as typeof MACHINE_ORDER[number])
  return MACHINE_ORDER[(index + 1) % MACHINE_ORDER.length]
}

export function getPrevMachine(currentId: string): string {
  const index = MACHINE_ORDER.indexOf(currentId as typeof MACHINE_ORDER[number])
  return MACHINE_ORDER[(index - 1 + MACHINE_ORDER.length) % MACHINE_ORDER.length]
}

// Progress tracking
export interface VisitorProgress {
  visited: string[]
  lastVisit: number
  jackpots: number
}

export function getProgress(): VisitorProgress {
  try {
    const stored = localStorage.getItem('vanvinkl-progress')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return { visited: [], lastVisit: Date.now(), jackpots: 0 }
}

export function markVisited(machineId: string): VisitorProgress {
  const progress = getProgress()
  if (!progress.visited.includes(machineId)) {
    progress.visited.push(machineId)
  }
  progress.lastVisit = Date.now()
  try {
    localStorage.setItem('vanvinkl-progress', JSON.stringify(progress))
  } catch (e) {
    // Ignore localStorage errors
  }
  return progress
}

export function recordJackpot(): VisitorProgress {
  const progress = getProgress()
  progress.jackpots++
  progress.lastVisit = Date.now()
  try {
    localStorage.setItem('vanvinkl-progress', JSON.stringify(progress))
  } catch (e) {
    // Ignore localStorage errors
  }
  return progress
}
