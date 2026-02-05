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
          { name: 'Slot Game Audio', level: 98 },
          { name: 'Interactive Sound Design', level: 95 },
          { name: 'Adaptive Music Systems', level: 92 },
          { name: 'UI/UX Sound Design', level: 95 },
          { name: 'Ambient & Atmosphere', level: 90 }
        ]
      },
      {
        name: 'Sound Implementation',
        icon: '⚙️',
        color: '#ff00aa',
        skills: [
          { name: 'FMOD Studio', level: 95 },
          { name: 'Wwise', level: 90 },
          { name: 'Unity Audio', level: 95 },
          { name: 'JSON Audio Logic', level: 92 },
          { name: 'Web Audio API', level: 85 }
        ]
      },
      {
        name: 'Music Production',
        icon: '🎹',
        color: '#8844ff',
        skills: [
          { name: 'Original Composition', level: 95 },
          { name: 'Orchestral Arrangement', level: 88 },
          { name: 'Electronic Production', level: 92 },
          { name: 'Trailer Music', level: 90 },
          { name: 'Layered Music Systems', level: 95 }
        ]
      },
      {
        name: 'Audio Post-Production',
        icon: '🎚️',
        color: '#ffd700',
        skills: [
          { name: 'Mixing & Mastering', level: 95 },
          { name: 'Foley Recording', level: 85 },
          { name: 'Sound Effects Creation', level: 95 },
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
        description: 'End-to-end audio production for slot games including music, SFX, and implementation. Delivered as ready-to-integrate packages with documentation.',
        features: [
          'Full soundtrack composition (base game, features, bonus rounds)',
          'Complete SFX library (spins, wins, UI, ambience)',
          'Implementation-ready audio with JSON logic',
          'Multi-format delivery (OGG, MP3, WAV)',
          'Performance optimization for mobile & web'
        ]
      },
      {
        icon: '🎵',
        title: 'Original Music Composition',
        description: 'Custom music tailored to your game\'s theme and mood. From epic orchestral to modern electronic, composed to enhance player experience.',
        features: [
          'Theme-based original compositions',
          'Adaptive/layered music systems',
          'Loop-friendly arrangements',
          'Multiple variations for game states',
          'Unlimited revisions until perfect'
        ]
      },
      {
        icon: '🔊',
        title: 'Sound Design & SFX',
        description: 'High-quality sound effects from scratch or library curation. Every sound crafted to provide satisfying player feedback.',
        features: [
          'Custom Foley recording',
          'Synthesized effects creation',
          'UI/UX audio design',
          'Win celebration sounds',
          'Ambient soundscapes'
        ]
      },
      {
        icon: '🎚️',
        title: 'Audio Mastering & QA',
        description: 'Professional mastering and quality assurance to ensure your audio meets industry standards across all platforms.',
        features: [
          'Loudness normalization (LUFS standards)',
          'Cross-platform testing',
          'Compression & format optimization',
          'Audio bug testing & reporting',
          'Final delivery preparation'
        ]
      }
    ],
    cta: { label: 'Get In Touch', machineId: 'contact' }
  },

  about: {
    id: 'about',
    type: 'about',
    title: 'ABOUT',
    tagline: 'Audio Producer | Sound Designer | Composer',
    color: '#8844ff',
    bio: "I'm Bojan Petkovic, founder of VanVinkl Studio - a professional audio production company based in Belgrade, Serbia. With over a decade of experience in the gaming industry, I specialize in creating immersive audio experiences for slot games and interactive entertainment.\n\nMy journey began with classical music education at the Faculty of Music in Belgrade, followed by professional audio engineering training at SAE Institute. This foundation, combined with 4+ years as Lead Sound Designer at IGT (one of the world's largest slot machine manufacturers), has given me deep expertise in what makes game audio truly engaging.\n\nAt VanVinkl Studio, I deliver complete audio solutions - from original music composition and sound design to technical implementation. I understand the unique requirements of iGaming: the need for loop-friendly music, the importance of satisfying win sounds, and the technical constraints of web and mobile platforms.\n\nEvery project receives my full attention, ensuring high-quality audio that enhances player experience and meets the demanding standards of the gaming industry.",
    stats: [
      { icon: '📅', label: 'Industry Experience', value: '10+ Years' },
      { icon: '🎰', label: 'Slot Games Completed', value: '50+' },
      { icon: '🏢', label: 'Notable Client', value: 'IGT (4 years)' },
      { icon: '🎓', label: 'Education', value: 'SAE Institute + BA Music' },
      { icon: '🌍', label: 'Location', value: 'Belgrade, Serbia' },
      { icon: '🌐', label: 'Work Style', value: 'Remote / International' }
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
        title: 'Piggy Plunger Game',
        icon: '🐷',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'Interactive slot game portfolio featuring synchronized video and audio presentation. Complete production showcase with background music and sound effects.',
        year: '2024',
        videoPath: '/videoSlotPortfolio/Piggy Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Piggy-Plunger-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'
      },
      {
        title: 'Smash Factory',
        icon: '🔨',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'High-energy slot game audio production with dynamic soundscape. Features explosive sound design and driving music tracks synchronized with gameplay mechanics.',
        year: '2024',
        videoPath: '/videoSlotPortfolio/Smash Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Smash-Factory-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Smash-Factory-SFX'
      },
      {
        title: 'Starlight Travelers',
        icon: '✨',
        tags: ['Slots', 'Audio', 'Video'],
        description: 'Cosmic-themed slot game audio with ethereal soundscapes and atmospheric music. Immersive space exploration experience with layered audio design.',
        year: '2024',
        videoPath: '/videoSlotPortfolio/Starlight Portfolio Video.mp4',
        musicPath: '/audioSlotPortfolio/music/Starlight-Travelers-Music',
        sfxPath: '/audioSlotPortfolio/sfx/Starlight-Travelers-SFX'
      },
      {
        title: 'Mummy',
        icon: '🏺',
        tags: ['Slots', 'Audio'],
        description: 'Ancient Egypt-themed slot game with layered music system and dramatic big win audio.',
        year: '2024',
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
        year: '2024',
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
        year: '2024',
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
        year: '2024',
        audioTracks: [
          { label: 'Base Game (3 Layers)', path: '/audioSlotPortfolio/portfolio/Blazins-BG' }
        ]
      },
      {
        title: 'Midnight',
        icon: '🌙',
        tags: ['Slots', 'Audio'],
        description: 'Atmospheric midnight-themed slot with layered ambient music composition.',
        year: '2024',
        audioTracks: [
          { label: 'Base Game (2 Layers)', path: '/audioSlotPortfolio/portfolio/Midnight-BG' }
        ]
      },
      {
        title: 'VanVinkl Studio Packages',
        icon: '📦',
        tags: ['Turnkey', 'International', 'B2B'],
        description: 'Full audio packages for international gaming clients. Each package includes original soundtrack, complete SFX library, implementation documentation, and ongoing support. Designed for seamless integration into slot game engines.',
        year: '2024-Present'
      },
      {
        title: 'Trailer Music Compositions',
        icon: '🎬',
        tags: ['Cinematic', 'Orchestral', 'Epic'],
        description: 'Original trailer music for game marketing and promotional content. Epic orchestral arrangements combined with modern production techniques to create impactful, emotionally engaging compositions.',
        year: 'Ongoing'
      },
      {
        title: 'Live Event Audio',
        icon: '🎤',
        tags: ['Live', 'Corporate', 'Production'],
        description: 'Audio production and coordination for live corporate events during my work with Music Studio "Strip". Experience includes on-site sound management, artist coordination, and event audio logistics.',
        year: '2020-2022'
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
        period: 'May 2024 - Present',
        role: 'Founder & Audio Producer',
        company: 'VanVinkl Studio',
        highlights: [
          'Founded professional audio production studio in Belgrade',
          'Delivering complete slot game audio packages to international clients',
          'End-to-end production: composition, sound design, implementation',
          'Building long-term partnerships with gaming companies worldwide',
          'Maintaining IGT-level quality standards as an independent studio'
        ]
      },
      {
        period: 'Sep 2020 - May 2024',
        role: 'Lead Sound Designer',
        company: 'IGT (International Game Technology)',
        highlights: [
          'Led audio team of 2 sound designers for European slot production',
          'Completed 50+ slot game titles with full audio packages',
          'Created adaptive music systems and interactive soundscapes',
          'Established audio production pipelines and documentation standards',
          'Delivered for both land-based and online slot platforms',
          'Mentored junior audio designers in game audio best practices'
        ]
      },
      {
        period: 'Apr 2020 - Dec 2022',
        role: 'Music Production Assistant',
        company: 'Music Studio "Strip"',
        highlights: [
          'Assisted in music production for various projects',
          'Coordinated live corporate events and concerts',
          'Managed on-site audio for public gatherings',
          'Developed project management and client communication skills'
        ]
      },
      {
        period: '2015 - 2019',
        role: 'Education & Early Career',
        company: 'SAE Institute & Faculty of Music Belgrade',
        highlights: [
          'BA in Music Education - Faculty of Music, University of Belgrade',
          'Audio Engineering Diploma - SAE Institute Belgrade',
          'Specialized in game audio and interactive sound design',
          'Classical music foundation with modern production techniques'
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
