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

export interface ProjectItem {
  title: string
  icon: string
  tags: string[]
  description: string
  year: string
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
    tagline: 'Full-stack game development expertise',
    color: '#00ffff',
    categories: [
      {
        name: 'Programming',
        icon: '💻',
        color: '#00ffff',
        skills: [
          { name: 'TypeScript', level: 95 },
          { name: 'C#', level: 90 },
          { name: 'Rust', level: 75 },
          { name: 'Python', level: 85 },
          { name: 'C++', level: 70 }
        ]
      },
      {
        name: 'Game Engines',
        icon: '🎮',
        color: '#ff00aa',
        skills: [
          { name: 'Unity', level: 95 },
          { name: 'Unreal Engine', level: 80 },
          { name: 'Godot', level: 85 },
          { name: 'Custom Engines', level: 75 }
        ]
      },
      {
        name: 'Web 3D',
        icon: '🌐',
        color: '#8844ff',
        skills: [
          { name: 'Three.js', level: 95 },
          { name: 'React Three Fiber', level: 95 },
          { name: 'WebGL/WGSL', level: 85 },
          { name: 'GSAP', level: 90 }
        ]
      },
      {
        name: 'Audio',
        icon: '🔊',
        color: '#ffd700',
        skills: [
          { name: 'FMOD', level: 85 },
          { name: 'Wwise', level: 80 },
          { name: 'Web Audio API', level: 90 },
          { name: 'Sound Design', level: 75 }
        ]
      }
    ],
    cta: { label: 'See My Work', machineId: 'projects' }
  },

  services: {
    id: 'services',
    type: 'services',
    title: 'SERVICES',
    tagline: 'End-to-end casino game solutions',
    color: '#ff00aa',
    items: [
      {
        icon: '🎰',
        title: 'Slot Machine Development',
        description: 'Complete slot game creation from concept to deployment',
        features: ['Math models & RNG', 'Multi-platform', 'Certification ready']
      },
      {
        icon: '🃏',
        title: 'Table Games',
        description: 'Blackjack, Roulette, Poker and custom variants',
        features: ['Realistic physics', 'Live dealer integration', 'Multi-player']
      },
      {
        icon: '🌐',
        title: '3D Web Experiences',
        description: 'Interactive WebGL applications and portfolios',
        features: ['Three.js/R3F', '60fps optimized', 'Mobile-ready']
      },
      {
        icon: '🔧',
        title: 'Technical Consulting',
        description: 'Architecture review and performance optimization',
        features: ['Code audits', 'Performance tuning', 'Best practices']
      }
    ],
    cta: { label: 'Get In Touch', machineId: 'contact' }
  },

  about: {
    id: 'about',
    type: 'about',
    title: 'ABOUT',
    tagline: 'Passionate about creating immersive experiences',
    color: '#8844ff',
    bio: "Game developer with 10+ years of experience specializing in casino games and interactive web experiences. I combine technical expertise with creative vision to deliver AAA-quality products.",
    stats: [
      { icon: '📅', label: 'Experience', value: '10+ Years' },
      { icon: '🎮', label: 'Games Shipped', value: '50+' },
      { icon: '🌍', label: 'Location', value: 'Remote / Serbia' },
      { icon: '💬', label: 'Languages', value: 'EN / SR' }
    ],
    cta: { label: 'My Journey', machineId: 'experience' }
  },

  projects: {
    id: 'projects',
    type: 'projects',
    title: 'PROJECTS',
    tagline: 'Selected works from my portfolio',
    color: '#ffd700',
    featured: [
      {
        title: 'Neon Nights Casino',
        icon: '🌃',
        tags: ['Unity', 'WebGL', 'B2B'],
        description: 'Full casino platform with 12 slot titles and live games',
        year: '2024'
      },
      {
        title: 'Crypto Slots',
        icon: '₿',
        tags: ['React', 'Three.js', 'Blockchain'],
        description: 'Provably fair slot machines with crypto integration',
        year: '2023'
      },
      {
        title: 'VR Poker Room',
        icon: '🥽',
        tags: ['Unreal', 'VR', 'Multiplayer'],
        description: 'Immersive multiplayer poker in virtual reality',
        year: '2023'
      },
      {
        title: 'Retro Arcade',
        icon: '👾',
        tags: ['Godot', 'Mobile', 'Casual'],
        description: 'Collection of 8-bit style casino mini-games',
        year: '2022'
      }
    ],
    cta: { label: 'View GitHub', external: 'https://github.com/vanvinkl' }
  },

  experience: {
    id: 'experience',
    type: 'experience',
    title: 'EXPERIENCE',
    tagline: 'Professional journey in gaming',
    color: '#00ff88',
    timeline: [
      {
        period: '2021 - Present',
        role: 'Lead Game Developer',
        company: 'iGaming Studio',
        highlights: [
          'Led team of 8 developers',
          '25+ slot titles shipped',
          'Migrated platform to WebGL'
        ]
      },
      {
        period: '2018 - 2021',
        role: 'Senior Unity Developer',
        company: 'Casino Games Inc.',
        highlights: [
          'Built slot framework used in 40+ games',
          'Implemented RNG certification',
          'Performance optimization specialist'
        ]
      },
      {
        period: '2015 - 2018',
        role: 'Game Developer',
        company: 'Interactive Studios',
        highlights: [
          'First casino game projects',
          'Mobile game development',
          'UI/UX implementation'
        ]
      },
      {
        period: '2014 - 2015',
        role: 'Junior Developer',
        company: 'Startup Lab',
        highlights: [
          'Web development basics',
          'First game prototypes',
          'Learning and growth'
        ]
      }
    ],
    cta: { label: 'My Skills', machineId: 'skills' }
  },

  contact: {
    id: 'contact',
    type: 'contact',
    title: 'CONTACT',
    tagline: "Let's build something amazing together",
    color: '#ff4444',
    methods: [
      {
        icon: '📧',
        label: 'Email',
        value: 'hello@vanvinkl.com',
        action: 'email',
        url: 'mailto:hello@vanvinkl.com'
      },
      {
        icon: '💼',
        label: 'LinkedIn',
        value: '/in/vanvinkl',
        action: 'link',
        url: 'https://linkedin.com/in/vanvinkl'
      },
      {
        icon: '🐙',
        label: 'GitHub',
        value: '/vanvinkl',
        action: 'link',
        url: 'https://github.com/vanvinkl'
      },
      {
        icon: '🌐',
        label: 'Website',
        value: 'vanvinkl.com',
        action: 'link',
        url: 'https://vanvinkl.com'
      }
    ],
    availability: 'Available for projects starting February 2025',
    cta: { label: 'Send Email', external: 'mailto:hello@vanvinkl.com?subject=Project%20Inquiry' }
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
