/**
 * SlotFullScreen - Interactive Portfolio Slot "Skill Reel"
 *
 * ZERO-LATENCY OPTIMIZATIONS (Claude.md Roles):
 * - Chief Audio Architect: Audio-first timing, no visual jank
 * - Lead DSP Engineer: RAF-based animations, no setInterval stutters
 * - Engine Architect: Memoization, single render paths
 * - Graphics Engineer: GPU compositing via will-change, transform3d
 * - UI/UX Expert: 60fps target, instant feedback
 *
 * Each reel shows REAL CV data about Bojan Petkovic
 * Combinations form coherent sentences about skills/experience
 * Jackpot reveals detailed case studies
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import {
  SLOT_CONTENT,
  markVisited,
  type SlotSection,
  type SkillsSection,
  type ServicesSection,
  type AboutSection,
  type ProjectsSection,
  type ExperienceSection,
  type ContactSection
} from '../store/slotContent'
import {
  playNavTick,
  playNavSelect,
  playNavBack,
  playModalOpen,
  playModalClose,
  playContentReveal,
  playPhaseTransition,
  playSound,
  playSynthJackpot,
  playSynthWin,
  startDucking,
  stopDucking
} from '../audio'
import { playReelSpin, playReelStop } from '../audio/SynthSounds'
import { achievementStore } from '../store/achievements'
import { useAudioStore } from '../store/audio'
import { dspVolume, dspGetVolume } from '../audio/AudioDSP'

// HAPTIC FEEDBACK - Mobile vibration patterns
const haptic = {
  // Light tap - navigation, hover
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },
  // Medium tap - selection, button press
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25)
    }
  },
  // Strong tap - important actions
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  },
  // Double tap - confirmation
  double: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30])
    }
  },
  // Success pattern - win
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50, 100, 100])
    }
  },
  // Jackpot pattern - big win
  jackpot: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100, 50, 200])
    }
  },
  // Spin pattern - continuous during spin
  spin: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 80, 20, 80, 20])
    }
  }
}

// GPU-ACCELERATED COLOR CONSTANTS - Precomputed for zero runtime cost
const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700',
  green: '#00ff88'
} as const

// PERFORMANCE: Shared style objects for GPU compositing
const GPU_ACCELERATED_BASE: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)', // Force GPU layer
  backfaceVisibility: 'hidden'
}

// ============================================
// TYPEWRITER EFFECT COMPONENT
// ============================================
const TypewriterText = memo(function TypewriterText({
  text,
  speed = 30,
  delay = 0,
  color = '#fff',
  fontSize = '16px',
  onComplete
}: {
  text: string
  speed?: number
  delay?: number
  color?: string
  fontSize?: string
  onComplete?: () => void
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)

    const startTimeout = setTimeout(() => {
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(interval)
          setIsComplete(true)
          onComplete?.()
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [text, speed, delay, onComplete])

  return (
    <span style={{ color, fontSize }}>
      {displayedText}
      {!isComplete && (
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '1em',
          background: color,
          marginLeft: '2px',
          animation: 'cursorBlink 0.8s step-end infinite',
          verticalAlign: 'text-bottom'
        }} />
      )}
    </span>
  )
})

// ============================================
// RIPPLE EFFECT COMPONENT
// ============================================
const RippleEffect = memo(function RippleEffect({
  x, y, color, onComplete
}: {
  x: number
  y: number
  color: string
  onComplete: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed',
      left: x,
      top: y,
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: color,
      transform: 'translate(-50%, -50%)',
      animation: 'ripple 0.6s ease-out forwards',
      pointerEvents: 'none',
      zIndex: 9999
    }} />
  )
})

// ============================================
// SELECT BURST EFFECT
// ============================================
const SelectBurst = memo(function SelectBurst({
  x, y, color, onComplete
}: {
  x: number
  y: number
  color: string
  onComplete: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed',
      left: x,
      top: y,
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {/* Central burst */}
      <div style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        border: `3px solid ${color}`,
        animation: 'selectBurst 0.5s ease-out forwards'
      }} />
      {/* Particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 10px ${color}`,
          animation: 'particleFly 0.5s ease-out forwards',
          '--angle': `${i * 45}deg`,
          '--distance': '80px'
        } as React.CSSProperties} />
      ))}
    </div>
  )
})

// RAF-based animation hook for zero-jitter animations
function useRAF(callback: (deltaTime: number) => void, active: boolean) {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const animate = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16.67
      lastTimeRef.current = time
      callbackRef.current(delta)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active])
}

// ============================================
// SEGMENT-SPECIFIC REEL DATA - Based on Bojan's CV
// Each slot machine shows info about its own segment
// ============================================

interface SkillReelSymbol {
  icon: string
  label: string
  color: string
  info?: string  // Extra info shown in story
}

interface SegmentReelConfig {
  title: string
  subtitle: string
  reels: SkillReelSymbol[][]
  stories: { indices: number[], story: string, highlight: string }[]
  generateStory: (indices: number[], reels: SkillReelSymbol[][]) => string
}

// ============================================
// SKILLS SEGMENT - Audio/Technical Skills
// ============================================
const SKILLS_CONFIG: SegmentReelConfig = {
  title: 'SKILLS',
  subtitle: 'Audio Expertise',
  reels: [
    // Reel 1: Skill Category
    [
      { icon: '🎼', label: 'Game Audio', color: '#00ffff' },
      { icon: '🎚️', label: 'Sound Design', color: '#ff00aa' },
      { icon: '🎹', label: 'Music Composition', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' },
      { icon: '🎙️', label: 'Recording', color: '#ffd700' }
    ],
    // Reel 2: Specific Skill
    [
      { icon: '🔄', label: 'Adaptive Music', color: '#00ffff' },
      { icon: '🎯', label: 'Interactive SFX', color: '#ff00aa' },
      { icon: '📊', label: 'Mix Balancing', color: '#8844ff' },
      { icon: '📝', label: 'JSON Logic', color: '#00ff88' },
      { icon: '🎤', label: 'Foley', color: '#ffd700' }
    ],
    // Reel 3: Level
    [
      { icon: '⭐⭐⭐⭐⭐', label: 'Expert', color: '#ffd700' },
      { icon: '⭐⭐⭐⭐', label: 'Advanced', color: '#00ff88' },
      { icon: '⭐⭐⭐', label: 'Proficient', color: '#00ffff' }
    ],
    // Reel 4: Years
    [
      { icon: '🔟', label: '10+ godina', color: '#ffd700' },
      { icon: '5️⃣', label: '5+ godina', color: '#00ff88' },
      { icon: '3️⃣', label: '3+ godina', color: '#00ffff' }
    ],
    // Reel 5: Context
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '🎮', label: 'Game Dev', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '📱', label: 'Mobile', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Game Audio Design sa adaptivnom muzikom na Expert nivou. 10+ godina iskustva u slot igrama.", highlight: "Layered Music Systems" },
    { indices: [1, 1, 1, 1, 1], story: "Sound Design sa Interactive SFX, Advanced nivo. 5+ godina rada na game development projektima.", highlight: "Performance-Based SFX" },
    { indices: [2, 2, 2, 2, 2], story: "Music Composition sa Mix Balancing ekspertizom. Proficient u trailer produkciji.", highlight: "Cinematic Scores" }
  ],
  generateStory: (indices, reels) => {
    const cat = reels[0][indices[0] % reels[0].length]
    const skill = reels[1][indices[1] % reels[1].length]
    const level = reels[2][indices[2] % reels[2].length]
    const years = reels[3][indices[3] % reels[3].length]
    const ctx = reels[4][indices[4] % reels[4].length]
    return `${cat.label}: ${skill.label} na ${level.label} nivou. ${years.label} iskustva u ${ctx.label} produkciji.`
  }
}

// ============================================
// EXPERIENCE SEGMENT - Work History
// ============================================
const EXPERIENCE_CONFIG: SegmentReelConfig = {
  title: 'EXPERIENCE',
  subtitle: 'Work History',
  reels: [
    // Reel 1: Company
    [
      { icon: '🎨', label: 'VanVinkl Studio', color: '#00ffff', info: 'May 2024 - Present' },
      { icon: '🏢', label: 'IGT', color: '#ff00aa', info: 'Sep 2020 - May 2024' },
      { icon: '🎵', label: 'Studio Strip', color: '#8844ff', info: 'Apr 2020 - Dec 2022' }
    ],
    // Reel 2: Role
    [
      { icon: '🎛️', label: 'Audio Producer', color: '#00ffff' },
      { icon: '🎼', label: 'Lead Sound Designer', color: '#ff00aa' },
      { icon: '🔊', label: 'Composer', color: '#8844ff' }
    ],
    // Reel 3: Responsibility
    [
      { icon: '🌍', label: 'International Clients', color: '#ffd700' },
      { icon: '👥', label: 'Team of 2', color: '#00ff88' },
      { icon: '🎯', label: 'Full Pipeline', color: '#00ffff' }
    ],
    // Reel 4: Achievement
    [
      { icon: '📦', label: 'Complete Packages', color: '#ffd700' },
      { icon: '🎰', label: '50+ Slot Games', color: '#ff00aa' },
      { icon: '✅', label: 'QA Testing', color: '#00ff88' }
    ],
    // Reel 5: Market
    [
      { icon: '🇪🇺', label: 'European', color: '#00ffff' },
      { icon: '🌍', label: 'Global', color: '#ffd700' },
      { icon: '🎮', label: 'Gaming', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "VanVinkl Studio (2024-Present): Audio Producer za međunarodne klijente. Vodim kompletnu audio produkciju - od koncepta do masteringa.", highlight: "Founder & Audio Producer" },
    { indices: [1, 1, 1, 1, 1], story: "IGT (2020-2024): Lead Sound Designer. Vodio tim od 2 audio dizajnera, kreirao 50+ slot soundtracks za evropsko i globalno tržište.", highlight: "4 godine • 50+ slot games" },
    { indices: [2, 2, 2, 2, 2], story: "Studio Strip (2020-2022): Asistencija u muzičkoj produkciji, event koordinacija i korporativni eventi.", highlight: "Studio Production" }
  ],
  generateStory: (indices, reels) => {
    const company = reels[0][indices[0] % reels[0].length]
    const role = reels[1][indices[1] % reels[1].length]
    const resp = reels[2][indices[2] % reels[2].length]
    const achieve = reels[3][indices[3] % reels[3].length]
    const market = reels[4][indices[4] % reels[4].length]
    return `${company.label}: ${role.label}. ${resp.label}. Dostignuće: ${achieve.label}. Tržište: ${market.label}.`
  }
}

// ============================================
// SERVICES SEGMENT - What I Offer
// ============================================
const SERVICES_CONFIG: SegmentReelConfig = {
  title: 'SERVICES',
  subtitle: 'Audio Services',
  reels: [
    // Reel 1: Service Type
    [
      { icon: '🎵', label: 'Music Production', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Design', color: '#00ffff' },
      { icon: '🎚️', label: 'Audio Mastering', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' }
    ],
    // Reel 2: Platform
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '📱', label: 'Mobile Games', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '🎮', label: 'Video Games', color: '#00ff88' }
    ],
    // Reel 3: Deliverable
    [
      { icon: '📦', label: 'Full Package', color: '#ffd700' },
      { icon: '🎼', label: 'Original Score', color: '#ff00aa' },
      { icon: '💥', label: 'SFX Library', color: '#00ffff' },
      { icon: '🔧', label: 'Integration', color: '#00ff88' }
    ],
    // Reel 4: Quality
    [
      { icon: '⭐', label: 'AAA Quality', color: '#ffd700' },
      { icon: '🏆', label: 'Industry Standard', color: '#00ff88' },
      { icon: '✨', label: 'Premium', color: '#8844ff' }
    ],
    // Reel 5: Turnaround
    [
      { icon: '⚡', label: 'Fast Delivery', color: '#ffd700' },
      { icon: '🤝', label: 'Collaborative', color: '#00ffff' },
      { icon: '🔄', label: 'Iterative', color: '#00ff88' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Music Production za Slot Games: Full audio package sa AAA kvalitetom i brzom isporukom.", highlight: "Complete Slot Audio" },
    { indices: [1, 1, 1, 1, 1], story: "Sound Design za Mobile Games: Original SFX library, industry standard kvalitet, kolaborativan pristup.", highlight: "Mobile Game Audio" },
    { indices: [2, 2, 2, 2, 2], story: "Audio Mastering za Trailers: Premium kvalitet finalnog miksa sa iterativnim procesom.", highlight: "Trailer Mastering" }
  ],
  generateStory: (indices, reels) => {
    const service = reels[0][indices[0] % reels[0].length]
    const platform = reels[1][indices[1] % reels[1].length]
    const deliverable = reels[2][indices[2] % reels[2].length]
    const quality = reels[3][indices[3] % reels[3].length]
    const turnaround = reels[4][indices[4] % reels[4].length]
    return `${service.label} za ${platform.label}: ${deliverable.label}. ${quality.label} kvalitet. ${turnaround.label}.`
  }
}

// ============================================
// ABOUT SEGMENT - Personal Info
// ============================================
const ABOUT_CONFIG: SegmentReelConfig = {
  title: 'ABOUT',
  subtitle: 'Bojan Petkovic',
  reels: [
    // Reel 1: Identity
    [
      { icon: '👨‍🎤', label: 'Audio Producer', color: '#8844ff' },
      { icon: '🎵', label: 'Composer', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Designer', color: '#00ffff' }
    ],
    // Reel 2: Background
    [
      { icon: '🎓', label: 'SAE Institute', color: '#8844ff' },
      { icon: '🎹', label: 'BA Music', color: '#ff00aa' },
      { icon: '📜', label: 'Classical Training', color: '#ffd700' }
    ],
    // Reel 3: Experience
    [
      { icon: '🔟', label: '10+ Years', color: '#ffd700' },
      { icon: '🎰', label: 'Game Industry', color: '#00ffff' },
      { icon: '🌍', label: 'International', color: '#00ff88' }
    ],
    // Reel 4: Location
    [
      { icon: '📍', label: 'Belgrade', color: '#ff00aa' },
      { icon: '🇷🇸', label: 'Serbia', color: '#00ffff' },
      { icon: '🌐', label: 'Remote', color: '#00ff88' }
    ],
    // Reel 5: Trait
    [
      { icon: '✨', label: 'High Quality', color: '#ffd700' },
      { icon: '🎯', label: 'Consistent', color: '#00ff88' },
      { icon: '🤝', label: 'Collaborative', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Audio Producer sa SAE Institute obrazovanjem. 10+ godina iskustva u gaming industriji. Beograd, Srbija. Poznat po visokom kvalitetu rada.", highlight: "Founder of VanVinkl Studio" },
    { indices: [1, 1, 1, 1, 1], story: "Composer sa BA diplomom iz muzike. Klasična obuka + gaming industrija. Remote saradnja sa klijentima širom sveta.", highlight: "Classical + Digital" },
    { indices: [2, 2, 2, 2, 2], story: "Sound Designer sa klasičnom obukom. Međunarodno iskustvo u game audio produkciji. Kolaborativan pristup.", highlight: "10+ Years Experience" }
  ],
  generateStory: (indices, reels) => {
    const identity = reels[0][indices[0] % reels[0].length]
    const bg = reels[1][indices[1] % reels[1].length]
    const exp = reels[2][indices[2] % reels[2].length]
    const loc = reels[3][indices[3] % reels[3].length]
    const trait = reels[4][indices[4] % reels[4].length]
    return `${identity.label} • ${bg.label} • ${exp.label} iskustva • ${loc.label} • ${trait.label}`
  }
}

// ============================================
// PROJECTS SEGMENT - Portfolio
// ============================================
const PROJECTS_CONFIG: SegmentReelConfig = {
  title: 'PROJECTS',
  subtitle: 'Portfolio',
  reels: [
    // Reel 1: Project Type
    [
      { icon: '🎰', label: 'Slot Games', color: '#ffd700' },
      { icon: '📱', label: 'Mobile Titles', color: '#00ffff' },
      { icon: '🎬', label: 'Trailers', color: '#ff00aa' },
      { icon: '🎮', label: 'Game Audio', color: '#00ff88' }
    ],
    // Reel 2: Scale
    [
      { icon: '📊', label: '50+ Projects', color: '#ffd700' },
      { icon: '🌍', label: 'International', color: '#00ffff' },
      { icon: '🏢', label: 'B2B', color: '#8844ff' }
    ],
    // Reel 3: Role
    [
      { icon: '🎼', label: 'Full Score', color: '#ff00aa' },
      { icon: '🔊', label: 'SFX Design', color: '#00ffff' },
      { icon: '🎚️', label: 'Mix & Master', color: '#8844ff' },
      { icon: '⚙️', label: 'Implementation', color: '#00ff88' }
    ],
    // Reel 4: Client
    [
      { icon: '🏢', label: 'IGT', color: '#ff00aa' },
      { icon: '🎮', label: 'Game Studios', color: '#00ffff' },
      { icon: '🌐', label: 'Global Clients', color: '#ffd700' }
    ],
    // Reel 5: Result
    [
      { icon: '✅', label: 'Shipped', color: '#00ff88' },
      { icon: '🏆', label: 'Award Quality', color: '#ffd700' },
      { icon: '⭐', label: 'Client Approved', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "Slot Games: 50+ projekata sa full score-om za IGT. Svi projekti uspešno isporučeni i odobreni.", highlight: "50+ Slot Soundtracks" },
    { indices: [1, 1, 1, 1, 1], story: "Mobile Titles: Međunarodni B2B projekti sa kompletnim SFX dizajnom za game studios.", highlight: "International Mobile Games" },
    { indices: [2, 2, 2, 2, 2], story: "Trailers: Mix & Master za globalne klijente. Award quality produkcija.", highlight: "Cinematic Trailers" }
  ],
  generateStory: (indices, reels) => {
    const type = reels[0][indices[0] % reels[0].length]
    const scale = reels[1][indices[1] % reels[1].length]
    const role = reels[2][indices[2] % reels[2].length]
    const client = reels[3][indices[3] % reels[3].length]
    const result = reels[4][indices[4] % reels[4].length]
    return `${type.label}: ${scale.label}. Uloga: ${role.label}. Klijent: ${client.label}. Status: ${result.label}.`
  }
}

// ============================================
// CONTACT SEGMENT
// ============================================
const CONTACT_CONFIG: SegmentReelConfig = {
  title: 'CONTACT',
  subtitle: 'Get In Touch',
  reels: [
    // Reel 1: Method
    [
      { icon: '📧', label: 'Email', color: '#ff4444' },
      { icon: '💼', label: 'LinkedIn', color: '#0077b5' },
      { icon: '📱', label: 'Phone', color: '#00ff88' }
    ],
    // Reel 2: Purpose
    [
      { icon: '🎵', label: 'Music Project', color: '#ff00aa' },
      { icon: '🔊', label: 'Sound Design', color: '#00ffff' },
      { icon: '🤝', label: 'Collaboration', color: '#8844ff' },
      { icon: '💬', label: 'Inquiry', color: '#ffd700' }
    ],
    // Reel 3: Timeline
    [
      { icon: '⚡', label: 'ASAP', color: '#ff4444' },
      { icon: '📅', label: 'This Month', color: '#ffd700' },
      { icon: '🗓️', label: 'Flexible', color: '#00ff88' }
    ],
    // Reel 4: Budget
    [
      { icon: '💎', label: 'Premium', color: '#ffd700' },
      { icon: '💰', label: 'Standard', color: '#00ff88' },
      { icon: '🤝', label: 'Negotiable', color: '#00ffff' }
    ],
    // Reel 5: Response
    [
      { icon: '✅', label: 'Available', color: '#00ff88' },
      { icon: '⏰', label: '24h Response', color: '#ffd700' },
      { icon: '🌍', label: 'Worldwide', color: '#00ffff' }
    ]
  ],
  stories: [
    { indices: [0, 0, 0, 0, 0], story: "📧 vanvinklstudio@gmail.com - Za music projekte. Brz odgovor garantovan. Premium i standard opcije dostupne.", highlight: "vanvinklstudio@gmail.com" },
    { indices: [1, 1, 1, 1, 1], story: "💼 LinkedIn - Profesionalna saradnja i networking. Fleksibilan timeline. Dostupan za worldwide projekte.", highlight: "LinkedIn Connection" },
    { indices: [2, 2, 2, 2, 2], story: "📱 +381694000062 - Direktan kontakt za hitne projekte. 24h response time.", highlight: "+381 69 400 0062" }
  ],
  generateStory: (indices, reels) => {
    const method = reels[0][indices[0] % reels[0].length]
    const purpose = reels[1][indices[1] % reels[1].length]
    const timeline = reels[2][indices[2] % reels[2].length]
    const budget = reels[3][indices[3] % reels[3].length]
    const response = reels[4][indices[4] % reels[4].length]
    return `Kontakt: ${method.label} za ${purpose.label}. Timeline: ${timeline.label}. Budget: ${budget.label}. ${response.label}.`
  }
}

// ============================================
// SEGMENT CONFIG MAP
// ============================================
const SEGMENT_CONFIGS: Record<string, SegmentReelConfig> = {
  skills: SKILLS_CONFIG,
  experience: EXPERIENCE_CONFIG,
  services: SERVICES_CONFIG,
  about: ABOUT_CONFIG,
  projects: PROJECTS_CONFIG,
  contact: CONTACT_CONFIG
}

// Get config for machine or default to skills
function getSegmentConfig(machineId: string): SegmentReelConfig {
  return SEGMENT_CONFIGS[machineId] || SKILLS_CONFIG
}

// Themed symbols for each slot - legacy for fallback
const SLOT_THEMES: Record<string, {
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

// ============================================
// SKILL REEL COMPONENTS
// ============================================

// ZERO-LATENCY Skill Reel Column - RAF-based, GPU-accelerated
const SkillReelColumn = memo(function SkillReelColumn({
  reelData,
  spinning,
  finalIndex,
  delay = 0,
  reelIndex,
  jackpot,
  forceStop = false,
  onReelStop
}: {
  reelData: SkillReelSymbol[]
  spinning: boolean
  finalIndex: number
  delay?: number
  reelIndex: number
  jackpot: boolean
  forceStop?: boolean
  onReelStop?: (reelIndex: number) => void
}) {
  // BATCHED STATE: Single state object reduces re-renders
  const [reelState, setReelState] = useState({
    visibleSymbols: (() => {
      const len = reelData.length
      return [
        reelData[(0 - 1 + len) % len],
        reelData[0],
        reelData[1 % len]
      ]
    })(),
    stopped: true,
    blurAmount: 0,
    rotationX: 0,
    bouncePhase: 'none' as 'none' | 'overshoot' | 'settle'
  })

  // REFS: No re-renders for animation state
  const animStateRef = useRef({
    speed: 50,
    rotation: 0,
    currentIndex: 0,
    hasStopped: true,
    startTime: 0,
    phase: 'idle' as 'idle' | 'accelerating' | 'spinning' | 'decelerating' | 'bouncing'
  })

  const stopTimeoutRef = useRef<number | null>(null)
  const startTimeoutRef = useRef<number | null>(null)
  const bounceTimeoutRef = useRef<number | null>(null)

  // MEMOIZED: Get 3 visible symbols - zero allocation when possible
  const getVisibleSymbols = useCallback((idx: number) => {
    const len = reelData.length
    return [
      reelData[(idx - 1 + len) % len],
      reelData[idx % len],
      reelData[(idx + 1) % len]
    ]
  }, [reelData])

  // SINGLE CLEANUP - fewer allocations
  const cleanupTimers = useCallback(() => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
    if (bounceTimeoutRef.current) clearTimeout(bounceTimeoutRef.current)
    stopTimeoutRef.current = null
    startTimeoutRef.current = null
    bounceTimeoutRef.current = null
  }, [])

  // RAF-BASED SPINNING - Single animation loop, zero jitter
  useRAF((deltaTime) => {
    const state = animStateRef.current
    if (state.phase === 'idle') return

    const elapsed = performance.now() - state.startTime
    const delayMs = delay * 120

    // Phase transitions based on elapsed time
    if (state.phase === 'accelerating') {
      // Accelerate: 0-500ms
      const accelProgress = Math.min(elapsed / 500, 1)
      state.speed = 50 - (32 * accelProgress) // 50 → 18
      const blur = Math.min((50 - state.speed) / 2, 12)
      state.rotation = (state.rotation + deltaTime * 0.5) % 360
      const rotX = Math.sin(state.rotation * Math.PI / 180) * 8

      // Only update state when values change significantly
      if (elapsed > delayMs) {
        state.currentIndex = (state.currentIndex + 1) % reelData.length
      }

      setReelState(prev => ({
        ...prev,
        visibleSymbols: getVisibleSymbols(state.currentIndex),
        blurAmount: blur,
        rotationX: rotX,
        stopped: false
      }))

      if (accelProgress >= 1) state.phase = 'spinning'
    }
    else if (state.phase === 'spinning') {
      // Full speed: 500ms - stopTime
      const stopTime = 1800 + delay * 500
      state.rotation = (state.rotation + deltaTime * 0.5) % 360
      const rotX = Math.sin(state.rotation * Math.PI / 180) * 8

      // Symbol cycling at ~60fps equivalent
      if (elapsed > delayMs) {
        state.currentIndex = Math.floor((elapsed - delayMs) / 60) % reelData.length
      }

      setReelState(prev => ({
        ...prev,
        visibleSymbols: getVisibleSymbols(state.currentIndex),
        rotationX: rotX
      }))

      if (elapsed >= stopTime) state.phase = 'decelerating'
    }
    else if (state.phase === 'decelerating') {
      // Decelerate: ~300ms
      const decelStart = 1800 + delay * 500
      const decelElapsed = elapsed - decelStart
      const decelProgress = Math.min(decelElapsed / 300, 1)

      state.speed = 18 + (182 * decelProgress) // 18 → 200
      const blur = Math.max(12 - (12 * decelProgress), 0)
      const rotX = (1 - decelProgress) * 8 * Math.sin(state.rotation * Math.PI / 180)

      setReelState(prev => ({
        ...prev,
        blurAmount: blur,
        rotationX: rotX
      }))

      if (decelProgress >= 1) {
        state.phase = 'bouncing'
        state.currentIndex = finalIndex
        setReelState(prev => ({
          ...prev,
          visibleSymbols: getVisibleSymbols(finalIndex),
          bouncePhase: 'overshoot'
        }))

        // Play reel stop sound when this reel locks into place
        onReelStop?.(reelIndex)

        // Bounce sequence via timeouts (small, predictable)
        bounceTimeoutRef.current = window.setTimeout(() => {
          setReelState(prev => ({ ...prev, bouncePhase: 'settle' }))
          setTimeout(() => {
            setReelState(prev => ({
              ...prev,
              bouncePhase: 'none',
              stopped: true,
              blurAmount: 0,
              rotationX: 0
            }))
            state.hasStopped = true
            state.phase = 'idle'
          }, 150)
        }, 150)
      }
    }
  }, spinning && !forceStop)

  // Initialize spin
  useEffect(() => {
    if (spinning) {
      const state = animStateRef.current
      state.hasStopped = false
      state.startTime = performance.now()
      state.phase = 'accelerating'
      state.speed = 50
      state.currentIndex = 0
      state.rotation = 0

      setReelState(prev => ({
        ...prev,
        stopped: false,
        bouncePhase: 'none'
      }))
    } else {
      cleanupTimers()
      animStateRef.current.hasStopped = true
      animStateRef.current.phase = 'idle'
      setReelState({
        visibleSymbols: getVisibleSymbols(0),
        stopped: true,
        blurAmount: 0,
        rotationX: 0,
        bouncePhase: 'none'
      })
    }
  }, [spinning, getVisibleSymbols, cleanupTimers])

  // FORCE STOP - instant stop when SPACE pressed (zero latency)
  useEffect(() => {
    if (forceStop && !animStateRef.current.hasStopped) {
      cleanupTimers()
      animStateRef.current.hasStopped = true
      animStateRef.current.phase = 'idle'
      animStateRef.current.currentIndex = finalIndex

      // Instant final state - no animation
      setReelState({
        visibleSymbols: getVisibleSymbols(finalIndex),
        stopped: true,
        blurAmount: 0,
        rotationX: 0,
        bouncePhase: 'none'
      })
    }
  }, [forceStop, finalIndex, getVisibleSymbols, cleanupTimers])

  // MEMOIZED: Bounce transform - GPU-friendly transforms only
  const bounceTransform = useMemo(() => {
    switch (reelState.bouncePhase) {
      case 'overshoot': return 'translate3d(0, -15px, 0) scale(1.03)'
      case 'settle': return 'translate3d(0, 5px, 0) scale(0.98)'
      default: return 'translate3d(0, 0, 0) scale(1)'
    }
  }, [reelState.bouncePhase])

  const primaryColor = reelState.visibleSymbols[1]?.color || COLORS.cyan

  // Destructure for cleaner JSX
  const { visibleSymbols, stopped, blurAmount, rotationX, bouncePhase } = reelState

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '18%',
      height: '100%',
      position: 'relative',
      perspective: '500px',
      transform: bounceTransform,
      transition: bouncePhase !== 'none' ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
      willChange: 'transform', // GPU hint for smoother animation
      contain: 'layout style paint' // CSS containment for perf
    }}>
      {/* Chrome bezel frame */}
      <div style={{
        position: 'absolute',
        top: -4, left: -3, right: -3, bottom: -4,
        background: 'linear-gradient(180deg, #4a4a5a 0%, #2a2a3a 20%, #1a1a2a 50%, #2a2a3a 80%, #4a4a5a 100%)',
        borderRadius: '8px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.5)'
      }} />

      {/* LED strip left */}
      <div style={{
        position: 'absolute',
        top: '10%', bottom: '10%', left: -2,
        width: '3px',
        background: `linear-gradient(180deg, transparent, ${primaryColor}, transparent)`,
        boxShadow: `0 0 8px ${primaryColor}, 0 0 15px ${primaryColor}60`,
        animation: 'ledPulse 1.5s ease-in-out infinite',
        animationDelay: `${reelIndex * 0.1}s`,
        borderRadius: '2px'
      }} />

      {/* LED strip right */}
      <div style={{
        position: 'absolute',
        top: '10%', bottom: '10%', right: -2,
        width: '3px',
        background: `linear-gradient(180deg, transparent, ${primaryColor}, transparent)`,
        boxShadow: `0 0 8px ${primaryColor}, 0 0 15px ${primaryColor}60`,
        animation: 'ledPulse 1.5s ease-in-out infinite',
        animationDelay: `${reelIndex * 0.1 + 0.5}s`,
        borderRadius: '2px'
      }} />

      {/* Reel background with 3D depth - GPU accelerated */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(8,8,25,0.7) 15%, rgba(12,12,35,0.6) 50%, rgba(8,8,25,0.7) 85%, rgba(0,0,0,0.9) 100%)',
        borderRadius: '4px',
        transform: `rotateX(${rotationX}deg) translateZ(0)`, // GPU layer
        transformStyle: 'preserve-3d',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }} />

      {/* Symbols with labels - GPU compositing */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: `rotateX(${rotationX}deg) translateZ(0)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}>
        {visibleSymbols.map((symbol, i) => {
          const isCenter = i === 1
          const isWinning = isCenter && jackpot && stopped
          const rowRotation = (i - 1) * 25

          return (
            <div key={i} style={{
              position: 'relative',
              width: '100%',
              height: '33.33%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              filter: `blur(${blurAmount}px)`,
              opacity: isCenter ? 1 : 0.35,
              transform: `rotateX(${spinning && !stopped ? rowRotation : 0}deg) translateZ(${isCenter ? 10 : -5}px)`,
              transition: stopped ? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              animation: isWinning ? 'winSymbolUltra 0.6s ease-in-out infinite' : 'none'
            }}>
              {/* Icon */}
              <span style={{
                fontSize: isCenter ? 'clamp(40px, 7vw, 70px)' : 'clamp(24px, 4vw, 36px)',
                textShadow: isWinning
                  ? `0 0 40px ${COLORS.gold}, 0 0 80px ${COLORS.gold}`
                  : isCenter
                  ? `0 0 25px ${symbol.color}, 0 0 50px ${symbol.color}60`
                  : 'none',
                position: 'relative'
              }}>
                {symbol.icon}
                {/* Holographic shimmer */}
                {isCenter && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                    backgroundSize: '200% 200%',
                    animation: spinning ? 'holoShimmer 0.3s linear infinite' : 'holoShimmerSlow 3s ease-in-out infinite',
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay'
                  }} />
                )}
              </span>

              {/* Label - only show on center when stopped */}
              {isCenter && stopped && (
                <span style={{
                  fontSize: 'clamp(10px, 1.5vw, 14px)',
                  color: symbol.color,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginTop: '8px',
                  textShadow: `0 0 10px ${symbol.color}`,
                  animation: 'fadeSlideIn 0.3s ease-out',
                  whiteSpace: 'nowrap'
                }}>
                  {symbol.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Glass reflection overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
        borderRadius: '4px 4px 0 0',
        pointerEvents: 'none'
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      {/* Separator lines */}
      <div style={{
        position: 'absolute',
        top: '33%', left: '5%', right: '5%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${primaryColor}60, transparent)`,
        boxShadow: `0 0 10px ${primaryColor}40`
      }} />
      <div style={{
        position: 'absolute',
        top: '66%', left: '5%', right: '5%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${primaryColor}60, transparent)`,
        boxShadow: `0 0 10px ${primaryColor}40`
      }} />
    </div>
  )
})

// MEMOIZED Coin Rain Particle System - GPU accelerated
const CoinRain = memo(function CoinRain({ active }: { active: boolean }) {
  // Pre-computed coins array - stable reference
  const coins = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1,
      size: 20 + Math.random() * 15,
      rotation: Math.random() * 360
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 200,
      contain: 'strict' // Full CSS containment
    }}>
      {coins.map(coin => (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            left: `${coin.x}%`,
            top: '-50px',
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${COLORS.gold}, #b8860b, #8b6914)`,
            boxShadow: `0 0 10px ${COLORS.gold}, inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.3)`,
            animation: `coinFall ${coin.duration}s ease-in ${coin.delay}s infinite`,
            willChange: 'transform',
            transform: 'translateZ(0)',
            '--rotation': `${coin.rotation}deg`
          } as React.CSSProperties}
        >
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${coin.size * 0.5}px`,
            color: '#8b6914',
            fontWeight: 'bold',
            textShadow: '1px 1px 0 #ffd700'
          }}>$</div>
        </div>
      ))}
    </div>
  )
})

// MEMOIZED Screen Shake Container - GPU layer
const ScreenShake = memo(function ScreenShake({ active, children }: { active: boolean, children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      animation: active ? 'screenShake 0.5s ease-out' : 'none',
      willChange: active ? 'transform' : 'auto',
      transform: 'translateZ(0)'
    }}>
      {children}
    </div>
  )
})

// MEMOIZED Game Title Marquee - Ultra with chase lights
const GameMarquee = memo(function GameMarquee({ title, color, subtitle }: { title: string, color: string, subtitle?: string }) {
  const lights = useMemo(() => Array.from({ length: 20 }, (_, i) => i), [])

  return (
    <div style={{
      width: '100%',
      padding: '20px 0 15px',
      background: `linear-gradient(180deg, ${color}25 0%, ${color}08 50%, transparent 100%)`,
      borderBottom: `3px solid ${color}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Chase light bulbs top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '8px',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        {lights.map(i => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
            animation: 'chaseLights 1s ease-in-out infinite',
            animationDelay: `${i * 0.05}s`
          }} />
        ))}
      </div>

      {/* Animated sweep */}
      <div style={{
        position: 'absolute',
        top: 0, left: '-100%', right: 0, bottom: 0,
        width: '200%',
        background: `linear-gradient(90deg, transparent 0%, ${color}20 45%, ${color}40 50%, ${color}20 55%, transparent 100%)`,
        animation: 'marqueeSweep 2s ease-in-out infinite'
      }} />

      <h1 style={{
        margin: 0,
        textAlign: 'center',
        fontSize: 'clamp(28px, 5vw, 48px)',
        fontWeight: 900,
        color: '#fff',
        textShadow: `
          0 0 10px ${color},
          0 0 30px ${color},
          0 0 60px ${color},
          0 0 100px ${color}80,
          0 2px 0 ${color}
        `,
        letterSpacing: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        zIndex: 1,
        animation: 'titlePulse 2s ease-in-out infinite'
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          margin: '8px 0 0 0',
          textAlign: 'center',
          fontSize: 'clamp(12px, 2vw, 16px)',
          color: color,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          opacity: 0.8
        }}>
          {subtitle}
        </p>
      )}

      {/* Neon tube effect */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: '10%', right: '10%',
        height: '3px',
        background: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
        animation: 'neonFlicker 3s ease-in-out infinite'
      }} />
    </div>
  )
})

// LED Display Digit Component
// MEMOIZED LED Components for zero re-render
const LEDDigit = memo(function LEDDigit({ value, color, size = 32 }: { value: string, color: string, size?: number }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      fontWeight: 'bold',
      color: color,
      textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}60`,
      background: 'rgba(0,0,0,0.5)',
      padding: '4px 6px',
      margin: '0 1px',
      borderRadius: '4px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
    }}>
      {value}
    </span>
  )
})

// MEMOIZED Animated Win Counter
const WinCounter = memo(function WinCounter({ target, active, color }: { target: number, active: boolean, color: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (active && target > 0) {
      const duration = 1000
      const steps = 20
      const increment = target / steps
      let current = 0
      const interval = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(interval)
        }
        setDisplayValue(Math.floor(current))
      }, duration / steps)
      return () => clearInterval(interval)
    } else if (!active) {
      setDisplayValue(0)
    }
  }, [active, target])

  const formatted = displayValue.toLocaleString()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      animation: active ? 'winNumberPop 0.3s ease-out' : 'none'
    }}>
      {formatted.split('').map((char, i) => (
        <LEDDigit key={i} value={char} color={color} />
      ))}
    </div>
  )
})

// MEMOIZED Skills Discovered Counter
const SkillsDiscovered = memo(function SkillsDiscovered({ count, total, color }: { count: number, total: number, color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: color,
        fontSize: '11px',
        letterSpacing: '3px',
        marginBottom: '8px',
        textShadow: `0 0 10px ${color}`
      }}>SKILLS DISCOVERED</div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: color,
          textShadow: `0 0 15px ${color}`
        }}>{count}</span>
        <span style={{ fontSize: '16px', color: '#666' }}>/</span>
        <span style={{ fontSize: '16px', color: '#888' }}>{total}</span>
      </div>
    </div>
  )
})

// Helper to get navigable items from section
function getNavigableItems(section: SlotSection): { icon: string; title: string; subtitle?: string; details: React.ReactNode }[] {
  switch (section.type) {
    case 'skills':
      return section.categories.map(cat => ({
        icon: cat.icon,
        title: cat.name,
        subtitle: `${cat.skills.length} skills`,
        details: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cat.skills.map(skill => (
              <div key={skill.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#fff' }}>{skill.name}</span>
                  <span style={{ color: cat.color, fontWeight: 'bold' }}>{skill.level}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                  <div style={{ width: `${skill.level}%`, height: '100%', background: cat.color, borderRadius: '4px', boxShadow: `0 0 10px ${cat.color}60` }} />
                </div>
              </div>
            ))}
          </div>
        )
      }))
    case 'services':
      return section.items.map(item => ({
        icon: item.icon,
        title: item.title,
        subtitle: item.description.slice(0, 60) + '...',
        details: (
          <div>
            <p style={{ color: '#bbb', lineHeight: 1.8, marginBottom: '20px' }}>{item.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {item.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: section.color }}>✓</span>
                  <span style={{ color: '#aaa' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }))
    case 'about':
      return [
        {
          icon: '👤',
          title: 'Biography',
          subtitle: 'Full story',
          details: <p style={{ color: '#bbb', lineHeight: 2, whiteSpace: 'pre-line' }}>{section.bio}</p>
        },
        ...section.stats.map(stat => ({
          icon: stat.icon,
          title: stat.label,
          subtitle: stat.value,
          details: <div style={{ fontSize: '48px', color: section.color, textAlign: 'center' as const }}>{stat.value}</div>
        }))
      ]
    case 'projects':
      return section.featured.map(proj => ({
        icon: proj.icon,
        title: proj.title,
        subtitle: proj.year,
        details: (
          <div>
            <p style={{ color: '#bbb', lineHeight: 1.8, marginBottom: '20px' }}>{proj.description}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {proj.tags.map(t => (
                <span key={t} style={{ padding: '6px 14px', background: `${section.color}20`, borderRadius: '20px', color: section.color, fontSize: '13px' }}>{t}</span>
              ))}
            </div>
          </div>
        )
      }))
    case 'experience':
      return section.timeline.map(item => ({
        icon: '💼',
        title: item.role,
        subtitle: `${item.company} • ${item.period}`,
        details: (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {item.highlights.map((h, i) => (
              <li key={i} style={{ color: '#aaa', marginBottom: '12px', paddingLeft: '20px', position: 'relative' as const, lineHeight: 1.6 }}>
                <span style={{ position: 'absolute' as const, left: 0, color: section.color }}>•</span>
                {h}
              </li>
            ))}
          </ul>
        )
      }))
    case 'contact':
      return section.methods.map(method => ({
        icon: method.icon,
        title: method.label,
        subtitle: method.value,
        details: (
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>{method.icon}</div>
            <div style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>{method.value}</div>
            <button
              onClick={() => {
                if (method.action === 'email' && method.url) window.location.href = method.url
                else if (method.action === 'link' && method.url) window.open(method.url, '_blank', 'noopener,noreferrer')
                else if (method.action === 'copy') navigator.clipboard.writeText(method.value)
              }}
              style={{
                background: section.color,
                color: '#000',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '20px'
              }}
            >
              {method.action === 'email' ? 'Send Email' : method.action === 'link' ? 'Open Link' : 'Copy to Clipboard'}
            </button>
          </div>
        )
      }))
    default:
      return []
  }
}

// FULL CONTENT PANEL - Navigable with arrow keys + ENTER for details
const FullContentPanel = memo(function FullContentPanel({
  section,
  visible,
  isJackpot,
  primaryColor
}: {
  section: SlotSection | undefined
  visible: boolean
  isJackpot: boolean
  primaryColor: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1) // -1 = nothing selected initially
  const [showDetails, setShowDetails] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => section ? getNavigableItems(section) : [], [section])

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        if (showDetails) {
          setShowDetails(false)
        } else {
          // If nothing selected, select first item
          if (selectedIndex === -1) {
            setSelectedIndex(0)
          } else {
            setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (showDetails) {
          setShowDetails(false)
        } else {
          // If nothing selected, select first item
          if (selectedIndex === -1) {
            setSelectedIndex(0)
          } else {
            setSelectedIndex(prev => (prev + 1) % items.length)
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Only toggle details if something is selected
        if (selectedIndex >= 0) {
          setShowDetails(prev => !prev)
        } else {
          // Select first item on Enter when nothing selected
          setSelectedIndex(0)
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setShowDetails(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, items.length, showDetails, selectedIndex])

  // Reset on section change
  useEffect(() => {
    setSelectedIndex(-1) // Start with nothing selected
    setShowDetails(false)
  }, [section?.id])

  if (!visible || !section || items.length === 0) return null

  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null

  return (
    <div ref={containerRef} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, rgba(3,2,10,0.98) 0%, rgba(8,6,26,0.99) 50%, rgba(3,2,10,0.98) 100%)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      animation: 'contentReveal 0.5s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '25px 40px',
        borderBottom: `1px solid ${primaryColor}30`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 900,
            color: primaryColor,
            textShadow: `0 0 30px ${primaryColor}80`,
            letterSpacing: '4px'
          }}>
            {section.title}
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>{section.tagline}</p>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Item List (Left) */}
        <div style={{
          width: showDetails ? '300px' : '100%',
          maxWidth: showDetails ? '300px' : '600px',
          margin: showDetails ? 0 : '0 auto',
          padding: '20px',
          overflowY: 'auto',
          transition: 'all 0.3s ease',
          borderRight: showDetails ? `1px solid ${primaryColor}20` : 'none'
        }}>
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedIndex(index)
                if (index === selectedIndex) setShowDetails(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                marginBottom: '8px',
                borderRadius: '12px',
                background: index === selectedIndex
                  ? `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`
                  : 'rgba(255,255,255,0.02)',
                border: index === selectedIndex
                  ? `2px solid ${primaryColor}`
                  : '2px solid transparent',
                boxShadow: index === selectedIndex
                  ? `0 0 30px ${primaryColor}30, inset 0 0 20px ${primaryColor}10`
                  : 'none',
                transform: index === selectedIndex ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                fontSize: '32px',
                filter: index === selectedIndex ? 'none' : 'grayscale(50%)',
                transition: 'filter 0.2s'
              }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: index === selectedIndex ? '#fff' : '#888',
                  fontWeight: index === selectedIndex ? 'bold' : 'normal',
                  fontSize: '16px',
                  marginBottom: '4px',
                  transition: 'color 0.2s'
                }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{
                    color: index === selectedIndex ? primaryColor : '#555',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{item.subtitle}</div>
                )}
              </div>
              {index === selectedIndex && (
                <span style={{ color: primaryColor, fontSize: '20px' }}>›</span>
              )}
            </div>
          ))}
        </div>

        {/* Details Panel (Right) */}
        {showDetails && selectedItem && (
          <div style={{
            flex: 1,
            padding: '30px 40px',
            overflowY: 'auto',
            animation: 'fadeSlideIn 0.3s ease-out'
          }}>
            {/* Detail Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: `1px solid ${primaryColor}30`
            }}>
              <span style={{ fontSize: '56px' }}>{selectedItem.icon}</span>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>{selectedItem.title}</h2>
                {selectedItem.subtitle && (
                  <p style={{ margin: '8px 0 0 0', color: primaryColor, fontSize: '16px' }}>{selectedItem.subtitle}</p>
                )}
              </div>
            </div>

            {/* Detail Content */}
            <div style={{ fontSize: '15px', lineHeight: 1.7 }}>
              {selectedItem.details}
            </div>

            {/* Back hint */}
            <div style={{
              marginTop: '40px',
              padding: '15px 20px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#555',
              fontSize: '13px'
            }}>
              Pritisni <span style={{ color: primaryColor, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>←</span> ili <span style={{ color: primaryColor, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>BACKSPACE</span> za povratak na listu
            </div>
          </div>
        )}
      </div>

      {/* Jackpot badge */}
      {isJackpot && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, #b8860b 100%)`,
          color: '#000',
          padding: '8px 30px',
          borderRadius: '30px',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          boxShadow: `0 0 30px ${COLORS.gold}, 0 5px 20px rgba(0,0,0,0.5)`,
          animation: 'jackpotBadgePulse 1s ease-in-out infinite',
          zIndex: 20
        }}>
          JACKPOT!
        </div>
      )}

      {/* Counter indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px'
      }}>
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === selectedIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === selectedIndex ? primaryColor : 'rgba(255,255,255,0.2)',
              boxShadow: i === selectedIndex ? `0 0 10px ${primaryColor}` : 'none',
              transition: 'all 0.2s ease'
            }}
          />
        ))}
      </div>
    </div>
  )
})

// FULL SKILLS CONTENT
const FullSkillsContent = memo(function FullSkillsContent({ section }: { section: SkillsSection }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {section.categories.map((cat, catIndex) => (
        <div key={cat.name} style={{ animation: `fadeSlideIn 0.5s ease-out ${catIndex * 0.1}s both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <span style={{ fontSize: '36px' }}>{cat.icon}</span>
            <h2 style={{ margin: 0, color: cat.color, fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>{cat.name}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {cat.skills.map((skill, skillIndex) => (
              <div key={skill.name} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '16px 20px',
                border: `1px solid ${cat.color}30`,
                animation: `fadeSlideIn 0.4s ease-out ${catIndex * 0.1 + skillIndex * 0.05}s both`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>{skill.name}</span>
                  <span style={{ color: cat.color, fontSize: '14px', fontWeight: 'bold' }}>{skill.level}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${skill.level}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}80)`,
                    borderRadius: '4px',
                    boxShadow: `0 0 10px ${cat.color}60`,
                    animation: `barGrow 1s ease-out ${catIndex * 0.1 + skillIndex * 0.05}s both`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

// FULL SERVICES CONTENT
const FullServicesContent = memo(function FullServicesContent({ section }: { section: ServicesSection }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
      {section.items.map((item, i) => (
        <div key={item.title} style={{
          background: 'rgba(255,0,170,0.05)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255,0,170,0.2)',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
          <h3 style={{ margin: '0 0 12px 0', color: '#ff00aa', fontSize: '22px', fontWeight: 'bold' }}>{item.title}</h3>
          <p style={{ margin: '0 0 20px 0', color: '#999', fontSize: '15px', lineHeight: 1.7 }}>{item.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {item.features.map((f, fi) => (
              <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#ff00aa', fontSize: '14px' }}>✓</span>
                <span style={{ color: '#bbb', fontSize: '14px', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

// FULL ABOUT CONTENT
const FullAboutContent = memo(function FullAboutContent({ section }: { section: AboutSection }) {
  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Bio */}
      <div style={{
        background: 'rgba(136,68,255,0.05)',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid rgba(136,68,255,0.2)'
      }}>
        <p style={{
          color: '#ddd',
          fontSize: '17px',
          lineHeight: 1.9,
          margin: 0,
          whiteSpace: 'pre-line'
        }}>
          {section.bio}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
        {section.stats.map((stat, i) => (
          <div key={stat.label} style={{
            background: 'rgba(136,68,255,0.08)',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            border: '1px solid rgba(136,68,255,0.2)',
            animation: `fadeSlideIn 0.5s ease-out ${i * 0.08}s both`
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{stat.icon}</div>
            <div style={{ color: '#8844ff', fontWeight: 'bold', fontSize: '22px', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
})

// FULL PROJECTS CONTENT
const FullProjectsContent = memo(function FullProjectsContent({ section }: { section: ProjectsSection }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
      {section.featured.map((proj, i) => (
        <div key={proj.title} style={{
          background: 'rgba(255,215,0,0.03)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255,215,0,0.2)',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px' }}>{proj.icon}</span>
            <span style={{
              color: '#ffd700',
              fontSize: '13px',
              background: 'rgba(255,215,0,0.15)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>{proj.year}</span>
          </div>
          <h3 style={{ margin: '0 0 12px 0', color: '#ffd700', fontSize: '24px', fontWeight: 'bold' }}>{proj.title}</h3>
          <p style={{ margin: '0 0 20px 0', color: '#999', fontSize: '15px', lineHeight: 1.7 }}>{proj.description}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {proj.tags.map(t => (
              <span key={t} style={{
                fontSize: '12px',
                padding: '6px 14px',
                background: 'rgba(255,215,0,0.12)',
                borderRadius: '20px',
                color: '#ffd700',
                fontWeight: '500'
              }}>{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

// FULL EXPERIENCE CONTENT
const FullExperienceContent = memo(function FullExperienceContent({ section }: { section: ExperienceSection }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {section.timeline.map((item, i) => (
        <div key={item.period} style={{
          borderLeft: '3px solid #00ff88',
          paddingLeft: '35px',
          paddingBottom: i < section.timeline.length - 1 ? '40px' : 0,
          marginLeft: '10px',
          position: 'relative',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.15}s both`
        }}>
          {/* Timeline dot */}
          <div style={{
            position: 'absolute',
            left: '-9px',
            top: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 20px #00ff88',
            border: '3px solid #0a0820'
          }} />

          {/* Period badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,255,136,0.15)',
            color: '#00ff88',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '12px'
          }}>
            {item.period}
          </div>

          <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{item.role}</h3>
          <div style={{ color: '#00ff88', fontSize: '16px', marginBottom: '16px', fontWeight: '500' }}>{item.company}</div>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {item.highlights.map((h, j) => (
              <li key={j} style={{
                color: '#aaa',
                fontSize: '15px',
                marginBottom: '10px',
                lineHeight: 1.6,
                paddingLeft: '20px',
                position: 'relative'
              }}>
                <span style={{ position: 'absolute', left: 0, color: '#00ff88' }}>•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
})

// FULL CONTACT CONTENT
const FullContactContent = memo(function FullContactContent({ section }: { section: ContactSection }) {
  const handleClick = (method: typeof section.methods[0]) => {
    if (method.action === 'email' && method.url) {
      window.location.href = method.url
    } else if (method.action === 'link' && method.url) {
      window.open(method.url, '_blank', 'noopener,noreferrer')
    } else if (method.action === 'copy') {
      navigator.clipboard.writeText(method.value)
    }
  }

  return (
    <div style={{ textAlign: 'center', animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Contact methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto 50px' }}>
        {section.methods.map((method, i) => (
          <button
            key={method.label}
            onClick={() => handleClick(method)}
            style={{
              background: 'rgba(255,68,68,0.08)',
              border: '2px solid rgba(255,68,68,0.3)',
              borderRadius: '20px',
              padding: '30px 25px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,68,68,0.15)'
              e.currentTarget.style.borderColor = '#ff4444'
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,68,68,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,68,68,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,68,68,0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '14px' }}>{method.icon}</div>
            <div style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '18px', marginBottom: '6px' }}>{method.label}</div>
            <div style={{ color: '#aaa', fontSize: '14px' }}>{method.value}</div>
          </button>
        ))}
      </div>

      {/* Availability */}
      <div style={{
        background: 'rgba(0,255,136,0.1)',
        borderRadius: '16px',
        padding: '25px 40px',
        maxWidth: '700px',
        margin: '0 auto',
        border: '1px solid rgba(0,255,136,0.2)'
      }}>
        <p style={{ margin: 0, color: '#00ff88', fontSize: '18px', fontWeight: '500', lineHeight: 1.6 }}>
          {section.availability}
        </p>
      </div>
    </div>
  )
})

// MEMOIZED Bottom Info Panel - Ultra with LED displays
const InfoPanel = memo(function InfoPanel({
  primaryColor,
  jackpot,
  skillsDiscovered,
  spinCount,
  config
}: {
  primaryColor: string
  jackpot: boolean
  skillsDiscovered: number
  spinCount: number
  config: SegmentReelConfig
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      padding: '25px 40px',
      background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(15,15,35,0.9) 50%, rgba(20,20,45,0.85) 100%)',
      borderTop: `3px solid ${primaryColor}60`,
      position: 'relative'
    }}>
      {/* Chrome trim top */}
      <div style={{
        position: 'absolute',
        top: 0, left: '5%', right: '5%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
      }} />

      {/* Spins (like Credits) */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: '#00ff88',
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '8px',
          textShadow: '0 0 10px #00ff88'
        }}>SPINS</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {spinCount.toString().split('').map((char, i) => (
            <LEDDigit key={i} value={char} color="#00ff88" />
          ))}
        </div>
      </div>

      {/* Decorative divider */}
      <div style={{
        width: '2px',
        height: '60px',
        background: `linear-gradient(180deg, transparent, ${primaryColor}60, transparent)`
      }} />

      {/* Skills Discovered (like Bet) */}
      <SkillsDiscovered
        count={skillsDiscovered}
        total={config.reels.reduce((sum, reel) => sum + reel.length, 0)}
        color={primaryColor}
      />

      {/* Decorative divider */}
      <div style={{
        width: '2px',
        height: '60px',
        background: `linear-gradient(180deg, transparent, ${primaryColor}60, transparent)`
      }} />

      {/* Jackpots Found (like Win) */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: jackpot ? COLORS.gold : '#666688',
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '8px',
          textShadow: jackpot ? `0 0 15px ${COLORS.gold}` : 'none',
          animation: jackpot ? 'winLabelFlash 0.3s ease-out 3' : 'none'
        }}>JACKPOTS</div>
        <WinCounter target={jackpot ? 1 : 0} active={jackpot} color={jackpot ? COLORS.gold : '#444466'} />
      </div>

      {/* Ambient glow on jackpot */}
      {jackpot && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at center bottom, ${COLORS.gold}20 0%, transparent 60%)`,
          pointerEvents: 'none',
          animation: 'ambientPulse 1s ease-in-out infinite'
        }} />
      )}
    </div>
  )
})

// MEMOIZED Payline Indicator
const PaylineIndicator = memo(function PaylineIndicator({ active, color, side }: { active: boolean, color: string, side: 'left' | 'right' }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      [side]: '2%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      {[1, 2, 3].map(num => (
        <div key={num} style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: active && num === 2 ? color : 'rgba(50,50,70,0.8)',
          border: `2px solid ${active && num === 2 ? color : 'rgba(100,100,120,0.5)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active && num === 2 ? '#fff' : '#555',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: active && num === 2 ? `0 0 20px ${color}, 0 0 40px ${color}60` : 'none',
          animation: active && num === 2 ? 'paylinePulse 0.5s ease-in-out infinite' : 'none'
        }}>
          {num}
        </div>
      ))}
    </div>
  )
})

// MEMOIZED Spin Button - GPU accelerated hover
const SpinButton = memo(function SpinButton({ spinning, onSpin, color }: { spinning: boolean, onSpin: () => void, color: string }) {
  return (
    <button
      onClick={onSpin}
      disabled={spinning}
      style={{
        position: 'absolute',
        bottom: '15%',
        right: '5%',
        width: 'clamp(60px, 10vw, 100px)',
        height: 'clamp(60px, 10vw, 100px)',
        borderRadius: '50%',
        background: spinning
          ? `radial-gradient(circle, ${color}40 0%, ${color}20 50%, transparent 70%)`
          : `radial-gradient(circle, ${color} 0%, ${color}80 50%, ${color}40 100%)`,
        border: `3px solid ${spinning ? color + '60' : color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: spinning
          ? `0 0 30px ${color}40`
          : `0 0 40px ${color}, 0 0 60px ${color}60, inset 0 0 30px ${color}40`,
        animation: spinning ? 'spinButtonPulse 0.5s ease-in-out infinite' : 'none',
        cursor: spinning ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{
        fontSize: 'clamp(10px, 2vw, 14px)',
        fontWeight: 'bold',
        color: spinning ? color + '80' : '#fff',
        letterSpacing: '2px',
        textShadow: spinning ? 'none' : `0 0 10px ${color}`
      }}>
        {spinning ? '...' : 'SPIN'}
      </div>
    </button>
  )
})

// ============================================
// CONTENT VIEWS - FULL SCREEN (Memoized)
// ============================================
const SkillsView = memo(function SkillsView({ section, focusIndex }: { section: SkillsSection, focusIndex: number }) {
  // Flatten all skills for navigation
  let itemIndex = 0
  const catCount = section.categories.length
  const columns = catCount <= 2 ? catCount : catCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '40px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {section.categories.map((cat, catIdx) => (
        <div key={cat.name} style={{ animation: `fadeSlideIn 0.5s ease-out ${catIdx * 0.1}s both` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
            paddingBottom: '14px',
            borderBottom: `2px solid ${cat.color}40`
          }}>
            <span style={{
              fontSize: '36px',
              filter: `drop-shadow(0 0 12px ${cat.color})`
            }}>{cat.icon}</span>
            <span style={{
              color: cat.color,
              fontWeight: 'bold',
              fontSize: '22px',
              letterSpacing: '2px',
              textShadow: `0 0 12px ${cat.color}50`
            }}>{cat.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cat.skills.map(skill => {
              const currentIndex = itemIndex
              const isFocused = focusIndex === currentIndex
              itemIndex++
              return (
                <div
                  key={skill.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: isFocused ? `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)` : 'rgba(255,255,255,0.02)',
                    border: isFocused ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isFocused ? `0 8px 30px ${cat.color}25` : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{
                    color: isFocused ? '#fff' : '#aaaacc',
                    fontSize: '16px',
                    minWidth: '110px',
                    flex: '0 0 auto',
                    fontWeight: isFocused ? '600' : '500'
                  }}>{skill.name}</span>
                  <div style={{
                    flex: 1,
                    height: '14px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '7px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${skill.level}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${cat.color}90, ${cat.color})`,
                      borderRadius: '7px',
                      boxShadow: isFocused ? `0 0 18px ${cat.color}60` : `0 0 10px ${cat.color}30`,
                      animation: `barGrow 1s ease-out ${catIdx * 0.1}s both`
                    }} />
                  </div>
                  <span style={{
                    color: cat.color,
                    fontSize: '16px',
                    width: '55px',
                    fontWeight: 'bold',
                    textAlign: 'right'
                  }}>{skill.level}%</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})

const ServicesView = memo(function ServicesView({ section, focusIndex }: { section: ServicesSection, focusIndex: number }) {
  const itemCount = section.items.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 2 ? '900px' : '1400px',
      margin: '0 auto'
    }}>
      {section.items.map((item, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={item.title}
            style={{
              background: isFocused
                ? 'linear-gradient(135deg, rgba(255,0,170,0.15), rgba(255,0,170,0.05))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              borderRadius: '20px',
              padding: '36px',
              border: isFocused ? '2px solid #ff00aa' : '1px solid rgba(255,0,170,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              boxShadow: isFocused
                ? '0 16px 50px rgba(255,0,170,0.2)'
                : '0 6px 25px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              fontSize: '52px',
              marginBottom: '20px',
              filter: isFocused ? 'drop-shadow(0 0 18px rgba(255,0,170,0.5))' : 'none'
            }}>{item.icon}</div>
            <h3 style={{
              margin: '0 0 14px 0',
              color: '#ff00aa',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>{item.title}</h3>
            <p style={{
              margin: '0 0 20px 0',
              color: isFocused ? '#ccc' : '#888899',
              fontSize: '15px',
              lineHeight: 1.7
            }}>{item.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {item.features.map((f) => (
                <span key={f} style={{
                  fontSize: '12px',
                  padding: '8px 14px',
                  background: 'rgba(255,0,170,0.1)',
                  borderRadius: '14px',
                  color: '#ff00aa',
                  fontWeight: '600'
                }}>{f}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

const AboutView = memo(function AboutView({ section, focusIndex }: { section: AboutSection, focusIndex: number }) {
  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Bio - prominent centered text */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(136,68,255,0.08), rgba(136,68,255,0.02))',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid rgba(136,68,255,0.15)',
        maxWidth: '1000px',
        margin: '0 auto 40px'
      }}>
        <p style={{
          color: '#ddddf0',
          fontSize: '20px',
          lineHeight: 1.9,
          textAlign: 'center',
          margin: 0,
          textShadow: '0 2px 15px rgba(0,0,0,0.4)'
        }}>
          {section.bio}
        </p>
      </div>
      {/* Stats grid - 4 in a row on desktop, 2 on tablet, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(section.stats.length, 4)}, 1fr)`,
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {section.stats.map((stat, i) => {
          const isFocused = focusIndex === i
          return (
            <div
              key={stat.label}
              style={{
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(136,68,255,0.18), rgba(136,68,255,0.06))'
                  : 'linear-gradient(135deg, rgba(136,68,255,0.06), rgba(136,68,255,0.02))',
                borderRadius: '20px',
                padding: '40px 24px',
                textAlign: 'center',
                border: isFocused ? '2px solid #8844ff' : '1px solid rgba(136,68,255,0.12)',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused ? '0 16px 50px rgba(136,68,255,0.2)' : '0 6px 25px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '52px',
                marginBottom: '16px',
                filter: isFocused ? 'drop-shadow(0 0 20px rgba(136,68,255,0.6))' : 'none'
              }}>{stat.icon}</div>
              <div style={{
                color: '#8844ff',
                fontWeight: 'bold',
                fontSize: '40px',
                marginBottom: '10px',
                fontFamily: 'monospace',
                textShadow: isFocused ? '0 0 20px rgba(136,68,255,0.4)' : 'none'
              }}>{stat.value}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#666688',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600
              }}>{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

const ProjectsView = memo(function ProjectsView({ section, focusIndex }: { section: ProjectsSection, focusIndex: number }) {
  const itemCount = section.featured.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 2 ? '950px' : '1400px',
      margin: '0 auto'
    }}>
      {section.featured.map((proj, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={proj.title}
            style={{
              background: isFocused
                ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))'
                : 'linear-gradient(135deg, rgba(255,215,0,0.04), rgba(255,215,0,0.01))',
              borderRadius: '20px',
              padding: '36px',
              border: isFocused ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              boxShadow: isFocused ? '0 16px 50px rgba(255,215,0,0.15)' : '0 6px 25px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <span style={{
                fontSize: '52px',
                filter: isFocused ? 'drop-shadow(0 0 15px rgba(255,215,0,0.5))' : 'none'
              }}>{proj.icon}</span>
              <span style={{
                color: '#ffd700',
                fontSize: '13px',
                background: 'rgba(255,215,0,0.12)',
                padding: '8px 16px',
                borderRadius: '14px',
                fontWeight: 600,
                border: '1px solid rgba(255,215,0,0.25)'
              }}>{proj.year}</span>
            </div>
            <h3 style={{
              margin: '0 0 12px 0',
              color: '#ffd700',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>{proj.title}</h3>
            <p style={{
              margin: '0 0 20px 0',
              color: isFocused ? '#ccc' : '#888899',
              fontSize: '15px',
              lineHeight: 1.7
            }}>{proj.description}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {proj.tags.map((t) => (
                <span key={t} style={{
                  fontSize: '12px',
                  padding: '8px 14px',
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: '14px',
                  color: '#ffd700',
                  fontWeight: '500'
                }}>{t}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

const ExperienceView = memo(function ExperienceView({ section, focusIndex }: { section: ExperienceSection, focusIndex: number }) {
  const itemCount = section.timeline.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 1 ? '600px' : columns === 2 ? '1000px' : '1400px',
      margin: '0 auto'
    }}>
      {section.timeline.map((item, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={item.period}
            style={{
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              background: isFocused
                ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.03))'
                : 'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(0,255,136,0.01))',
              padding: '28px',
              borderRadius: '16px',
              border: isFocused ? '2px solid #00ff88' : '1px solid rgba(0,255,136,0.15)',
              boxShadow: isFocused ? '0 12px 40px rgba(0,255,136,0.15)' : '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  marginBottom: '4px'
                }}>{item.role}</div>
                <div style={{
                  color: isFocused ? '#00ff88' : '#888899',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>{item.company}</div>
              </div>
              <div style={{
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: 'rgba(0,255,136,0.1)',
                borderRadius: '20px',
                border: '1px solid rgba(0,255,136,0.3)',
                textShadow: isFocused ? '0 0 10px rgba(0,255,136,0.4)' : 'none',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}>{item.period}</div>
            </div>
            {/* Highlights */}
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {item.highlights.map((h, j) => (
                <li key={j} style={{
                  color: isFocused ? '#ccc' : '#888899',
                  fontSize: '14px',
                  marginBottom: '8px',
                  lineHeight: 1.6
                }}>{h}</li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
})

const ContactView = memo(function ContactView({ section, focusIndex }: { section: ContactSection, focusIndex: number }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleClick = (method: typeof section.methods[0], index: number) => {
    if (method.action === 'email' && method.url) {
      window.location.href = method.url
    } else if (method.action === 'link' && method.url) {
      window.open(method.url, '_blank', 'noopener,noreferrer')
    } else if (method.action === 'copy') {
      navigator.clipboard.writeText(method.value)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  // Determine columns based on item count
  const itemCount = section.methods.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Contact cards - fixed columns based on count */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '28px',
        maxWidth: columns === 2 ? '800px' : '1200px',
        margin: '0 auto 50px'
      }}>
        {section.methods.map((method, i) => {
          const isFocused = focusIndex === i
          const isCopied = copiedIndex === i
          return (
            <button
              key={method.label}
              onClick={() => handleClick(method, i)}
              style={{
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(255,68,68,0.15), rgba(255,68,68,0.05))'
                  : 'linear-gradient(135deg, rgba(255,68,68,0.06), rgba(255,68,68,0.02))',
                border: isFocused ? '2px solid #ff4444' : '1px solid rgba(255,68,68,0.12)',
                borderRadius: '20px',
                padding: '48px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused
                  ? '0 16px 50px rgba(255,68,68,0.2)'
                  : '0 6px 30px rgba(0,0,0,0.12)',
                outline: 'none'
              }}
            >
              <div style={{
                fontSize: '60px',
                marginBottom: '20px',
                filter: isFocused ? 'drop-shadow(0 0 15px rgba(255,68,68,0.6))' : 'none',
                transition: 'all 0.3s ease'
              }}>{method.icon}</div>
              <div style={{
                color: isFocused ? '#ff6666' : '#ff4444',
                fontWeight: 'bold',
                fontSize: '26px',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}>{method.label}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#777788',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}>
                {isCopied ? '✓ Copied!' : method.value}
              </div>
            </button>
          )
        })}
      </div>
      {/* Availability badge */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))',
          padding: '18px 48px',
          borderRadius: '30px',
          border: '1px solid rgba(0,255,136,0.3)'
        }}>
          <p style={{
            color: '#00ff88',
            fontSize: '22px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 0 20px rgba(0,255,136,0.4)'
          }}>
            {section.availability}
          </p>
        </div>
      </div>
    </div>
  )
})

// Get item count for keyboard navigation
function getItemCount(section: SlotSection): number {
  switch (section.type) {
    case 'skills': return section.categories.length
    case 'services': return section.items.length
    case 'about': return section.stats.length
    case 'projects': return section.featured.length
    case 'experience': return section.timeline.length
    case 'contact': return section.methods.length
    default: return 0
  }
}

// Get grid columns for 2D navigation
function getGridColumns(section: SlotSection): number {
  switch (section.type) {
    case 'services': return 2
    case 'about': return 4
    case 'projects': return 2
    case 'contact': return 2
    default: return 1 // Vertical lists
  }
}

// Portfolio Video Player - Full screen inline player with keyboard nav
const PortfolioPlayer = memo(function PortfolioPlayer({
  project,
  onBack
}: {
  project: { icon: string, title: string, description: string, year: string, tags: string[], videoPath?: string, musicPath?: string, sfxPath?: string }
  onBack: () => void
}) {
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioStore()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const musicRef = React.useRef<HTMLAudioElement>(null)
  const sfxRef = React.useRef<HTMLAudioElement>(null)
  const [showContent, setShowContent] = React.useState(false)
  const [focusIndex, setFocusIndex] = React.useState(1) // 1: music mute, 2: music slider, 3: sfx mute, 4: sfx slider, 5: ESC overlay
  const [musicMuted, setMusicMuted] = React.useState(false)
  const [sfxMuted, setSfxMuted] = React.useState(false)

  // Focus items count
  const FOCUS_ITEMS = 5

  // Staggered reveal
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Lounge music is now handled by parent (selectedProject state change)

  // Reset video and audio to beginning when component mounts
  React.useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (video) {
      video.currentTime = 0
      video.pause()
      video.loop = false // Video stops at last frame, doesn't loop
    }
    if (music) {
      music.currentTime = 0
      music.pause()
    }
    if (sfx) {
      sfx.currentTime = 0
      sfx.pause()
    }

    console.log('[PortfolioPlayer] Video and audio reset to start, video.loop = false')
  }, [])

  // Synchronize audio with video (audio continues after video ends)
  React.useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (!video || !music || !sfx) return

    const handlePlay = () => {
      music.play().catch(e => console.warn('Music play failed:', e))
      sfx.play().catch(e => console.warn('SFX play failed:', e))
    }

    const handlePause = () => {
      // Only pause audio if video is paused manually (not ended)
      if (!video.ended) {
        music.pause()
        sfx.pause()
      }
    }

    const handleSeeked = () => {
      const time = video.currentTime
      music.currentTime = time
      sfx.currentTime = time
    }

    const handleTimeUpdate = () => {
      // Only sync if video is still playing (not ended)
      if (video.ended) return

      const drift = Math.abs(video.currentTime - music.currentTime)
      if (drift > 0.3) {
        music.currentTime = video.currentTime
        sfx.currentTime = video.currentTime
      }
    }

    const handleEnded = () => {
      // Video ended but audio continues playing
      console.log('[PortfolioPlayer] Video ended, audio continues')
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Update audio volumes with mute support
  React.useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicMuted ? 0 : musicVolume
    }
  }, [musicVolume, musicMuted])

  React.useEffect(() => {
    if (sfxRef.current) {
      sfxRef.current.volume = sfxMuted ? 0 : sfxVolume
    }
  }, [sfxVolume, sfxMuted])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setFocusIndex(prev => {
            const next = prev - 1
            return next < 1 ? 5 : next
          })
          playNavTick(0.3)
          break

        case 'ArrowDown':
          e.preventDefault()
          setFocusIndex(prev => {
            const next = prev + 1
            return next > 5 ? 1 : next
          })
          playNavTick(0.3)
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (focusIndex === 2) {
            // Music slider
            setMusicVolume(Math.max(0, musicVolume - 0.05))
            playNavTick(0.2)
          } else if (focusIndex === 4) {
            // SFX slider
            setSfxVolume(Math.max(0, sfxVolume - 0.05))
            playNavTick(0.2)
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (focusIndex === 2) {
            // Music slider
            setMusicVolume(Math.min(1, musicVolume + 0.05))
            playNavTick(0.2)
          } else if (focusIndex === 4) {
            // SFX slider
            setSfxVolume(Math.min(1, sfxVolume + 0.05))
            playNavTick(0.2)
          }
          break

        case ' ':
          e.preventDefault()
          // SPACE always plays/pauses video (regardless of focus)
          const video = videoRef.current
          if (video) {
            if (video.paused) {
              video.play()
              playNavSelect(0.5)
            } else {
              video.pause()
              playNavSelect(0.3)
            }
          }
          break

        case 'Enter':
          e.preventDefault()
          if (focusIndex === 1) {
            // Music mute toggle
            setMusicMuted(!musicMuted)
            playNavSelect(0.4)
          } else if (focusIndex === 3) {
            // SFX mute toggle
            setSfxMuted(!sfxMuted)
            playNavSelect(0.4)
          } else if (focusIndex === 5) {
            // ESC overlay - back
            playNavBack(0.4)
            onBack()
          }
          break

        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          console.log('[PortfolioPlayer] ESC pressed, calling onBack()')
          playNavBack(0.4)
          onBack()
          break
      }
    }

    // Use capture phase to intercept before parent handlers
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [focusIndex, musicVolume, sfxVolume, musicMuted, sfxMuted, setMusicVolume, setSfxVolume, onBack])

  const isFocused = (index: number) => focusIndex === index

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      margin: '0',
      padding: '0',
      animation: showContent ? 'fadeSlideIn 0.5s ease-out' : 'none',
      overflow: 'hidden',
      backgroundColor: '#000',
      cursor: 'pointer'
    }}>
      {/* Video Player - FULL SCREEN */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const video = videoRef.current
          if (video) {
            if (video.paused) video.play()
            else video.pause()
          }
        }}
        onDoubleClick={() => {
          const video = videoRef.current
          if (video) {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              video.requestFullscreen().catch(e => console.warn('Fullscreen failed:', e))
            }
          }
        }}
      >
        <source src={`${project.videoPath || '/videoSlotPortfolio/Piggy Portfolio Video.mp4'}?v=5`} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      {/* Hidden audio tracks */}
      <audio ref={musicRef} style={{ display: 'none' }}>
        <source src={`${project.musicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.opus`} type="audio/opus" />
        <source src={`${project.musicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.m4a`} type="audio/mp4" />
      </audio>

      <audio ref={sfxRef} style={{ display: 'none' }}>
        <source src={`${project.sfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.opus`} type="audio/opus" />
        <source src={`${project.sfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.m4a`} type="audio/mp4" />
      </audio>

      {/* ESC Button Overlay - Top Right (focus 5) */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          border: isFocused(5) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.4)',
          borderRadius: '8px',
          background: isFocused(5) ? 'rgba(255,215,0,0.25)' : 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(15px)',
          color: isFocused(5) ? '#ffd700' : '#ccc',
          fontSize: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: isFocused(5) ? '0 0 25px rgba(255,215,0,0.6)' : '0 4px 20px rgba(0,0,0,0.6)',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          zIndex: 1001
        }}
      >
        ESC
      </button>

      {/* Controls Overlay - Bottom */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255,215,0,0.2)',
        zIndex: 1000,
        cursor: 'pointer'
      }}>
        {/* Music Mute Button (focus 1) */}
        <button
          onClick={() => setMusicMuted(!musicMuted)}
          style={{
            width: '32px',
            height: '32px',
            padding: '0',
            border: isFocused(1) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
            borderRadius: '6px',
            background: musicMuted ? 'rgba(255,0,0,0.2)' : (isFocused(1) ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.5)'),
            color: musicMuted ? '#ff4444' : (isFocused(1) ? '#ffd700' : '#999'),
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: isFocused(1) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {musicMuted ? '🔇' : '🎵'}
        </button>

        {/* Music Slider (focus 2) */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          border: isFocused(2) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
          borderRadius: '6px',
          background: isFocused(2) ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
          boxShadow: isFocused(2) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
          transition: 'all 0.2s ease'
        }}>
          <span style={{
            fontSize: '11px',
            color: isFocused(2) ? '#ffd700' : '#ccc',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap'
          }}>
            🎵 {Math.round(musicVolume * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume * 100}
            onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${musicVolume * 100}%, rgba(255,215,0,0.3) ${musicVolume * 100}%, rgba(255,215,0,0.3) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
        </div>

        {/* SFX Mute Button (focus 3) */}
        <button
          onClick={() => setSfxMuted(!sfxMuted)}
          style={{
            width: '32px',
            height: '32px',
            padding: '0',
            border: isFocused(3) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
            borderRadius: '6px',
            background: sfxMuted ? 'rgba(255,0,0,0.2)' : (isFocused(3) ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.5)'),
            color: sfxMuted ? '#ff4444' : (isFocused(3) ? '#ffd700' : '#999'),
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: isFocused(3) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {sfxMuted ? '🔇' : '🔊'}
        </button>

        {/* SFX Slider (focus 4) */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          border: isFocused(4) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
          borderRadius: '6px',
          background: isFocused(4) ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
          boxShadow: isFocused(4) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
          transition: 'all 0.2s ease'
        }}>
          <span style={{
            fontSize: '11px',
            color: isFocused(4) ? '#ffd700' : '#ccc',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap'
          }}>
            🔊 {Math.round(sfxVolume * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume * 100}
            onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${sfxVolume * 100}%, rgba(255,215,0,0.3) ${sfxVolume * 100}%, rgba(255,215,0,0.3) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
})

function ContentView({ section, focusIndex, selectedProject, onBackFromProject, onSelectProject }: {
  section: SlotSection
  focusIndex: number
  selectedProject?: { icon: string, title: string, description: string, year: string, tags: string[] } | null
  onBackFromProject?: () => void
  onSelectProject?: (proj: { icon: string, title: string, description: string, year: string, tags: string[] }) => void
}) {
  // Show portfolio player if project selected
  if (selectedProject && onBackFromProject) {
    return <PortfolioPlayer project={selectedProject} onBack={onBackFromProject} />
  }

  switch (section.type) {
    case 'skills': return <SkillsView section={section} focusIndex={focusIndex} />
    case 'services': return <ServicesView section={section} focusIndex={focusIndex} />
    case 'about': return <AboutView section={section} focusIndex={focusIndex} />
    case 'projects': return <ProjectsView section={section} focusIndex={focusIndex} />
    case 'experience': return <ExperienceView section={section} focusIndex={focusIndex} />
    case 'contact': return <ContactView section={section} focusIndex={focusIndex} />
    default: return null
  }
}

// ============================================
// ULTRA PREMIUM DETAIL MODAL - AAA Vegas Quality
// ============================================
const DetailModal = memo(function DetailModal({
  item,
  primaryColor,
  onClose
}: {
  item: { type: string, index: number, data: unknown }
  primaryColor: string
  onClose: () => void
}) {
  const [showContent, setShowContent] = useState(false)
  const [barAnimated, setBarAnimated] = useState(false)

  // Staggered reveal animation
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 100)
    const t2 = setTimeout(() => setBarAnimated(true), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const renderContent = () => {
    switch (item.type) {
      case 'skill': {
        const skill = item.data as { name: string, level: number, category: string, categoryColor: string, categoryIcon: string }
        return (
          <div style={{ textAlign: 'center' }}>
            {/* Animated icon with glow pulse */}
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              animation: 'modalIconPulse 2s ease-in-out infinite',
              filter: `drop-shadow(0 0 30px ${skill.categoryColor})`
            }}>{skill.categoryIcon}</div>

            {/* Category badge */}
            <div style={{
              display: 'inline-block',
              color: skill.categoryColor,
              fontSize: '12px',
              letterSpacing: '4px',
              marginBottom: '16px',
              padding: '8px 20px',
              background: `${skill.categoryColor}15`,
              borderRadius: '30px',
              border: `1px solid ${skill.categoryColor}40`,
              textTransform: 'uppercase',
              animation: showContent ? 'modalBadgeReveal 0.5s ease-out' : 'none',
              opacity: showContent ? 1 : 0
            }}>{skill.category}</div>

            {/* Skill name with glitch effect */}
            <h2 style={{
              margin: '0 0 40px 0',
              fontSize: '48px',
              color: '#fff',
              fontWeight: 900,
              textShadow: `0 0 20px ${skill.categoryColor}60, 0 0 40px ${skill.categoryColor}30`,
              animation: showContent ? 'modalTitleReveal 0.6s ease-out 0.1s both' : 'none'
            }}>{skill.name}</h2>

            {/* Premium progress bar */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '24px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {/* Animated fill */}
              <div style={{
                width: barAnimated ? `${skill.level}%` : '0%',
                height: '100%',
                background: `linear-gradient(90deg, ${skill.categoryColor}80, ${skill.categoryColor}, ${skill.categoryColor}80)`,
                borderRadius: '12px',
                boxShadow: `0 0 30px ${skill.categoryColor}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}>
                {/* Shine effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
                  borderRadius: '12px 12px 0 0'
                }} />
                {/* Moving sparkle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '8px',
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #fff, 0 0 20px #fff',
                  animation: barAnimated ? 'modalSparkle 1s ease-in-out infinite' : 'none',
                  opacity: barAnimated ? 1 : 0
                }} />
              </div>
              {/* Grid lines */}
              {[25, 50, 75].map(pos => (
                <div key={pos} style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${pos}%`,
                  width: '1px',
                  background: 'rgba(255,255,255,0.1)'
                }} />
              ))}
            </div>

            {/* Percentage with counter animation */}
            <div style={{
              fontSize: '64px',
              fontWeight: 900,
              color: skill.categoryColor,
              textShadow: `0 0 40px ${skill.categoryColor}80`,
              fontFamily: 'monospace'
            }}>{barAnimated ? skill.level : 0}%</div>
            <div style={{
              color: '#666',
              marginTop: '8px',
              fontSize: '14px',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>Proficiency Level</div>
          </div>
        )
      }
      case 'service': {
        const service = item.data as { icon: string, title: string, description: string, features: string[] }
        return (
          <div>
            {/* Floating icon with particles */}
            <div style={{
              position: 'relative',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <div style={{
                fontSize: '100px',
                animation: 'modalIconFloat 3s ease-in-out infinite',
                filter: 'drop-shadow(0 0 40px rgba(255,0,170,0.5))'
              }}>{service.icon}</div>
              {/* Orbiting particles */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '8px',
                  height: '8px',
                  background: '#ff00aa',
                  borderRadius: '50%',
                  boxShadow: '0 0 15px #ff00aa',
                  animation: `modalOrbit 3s linear infinite`,
                  animationDelay: `${i * 1}s`,
                  transformOrigin: '0 0'
                }} />
              ))}
            </div>

            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '40px',
              color: '#ff00aa',
              fontWeight: 900,
              textAlign: 'center',
              textShadow: '0 0 30px rgba(255,0,170,0.5)',
              animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
            }}>{service.title}</h2>

            <p style={{
              color: '#999',
              fontSize: '18px',
              lineHeight: 2,
              marginBottom: '35px',
              textAlign: 'center',
              animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
            }}>{service.description}</p>

            {/* Feature tags with staggered animation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {service.features.map((f, i) => (
                <span key={f} style={{
                  fontSize: '14px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, rgba(255,0,170,0.2), rgba(255,0,170,0.1))',
                  borderRadius: '30px',
                  color: '#ff00aa',
                  fontWeight: '600',
                  border: '1px solid rgba(255,0,170,0.4)',
                  boxShadow: '0 4px 20px rgba(255,0,170,0.2)',
                  animation: showContent ? `modalTagReveal 0.4s ease-out ${0.1 + i * 0.05}s both` : 'none',
                  cursor: 'default',
                  transition: 'all 0.3s ease'
                }}>{f}</span>
              ))}
            </div>
          </div>
        )
      }
      case 'project': {
        const proj = item.data as { icon: string, title: string, description: string, year: string, tags: string[] }

        // Global audio volume controls
        const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioStore()

        // Refs for synchronized audio playback
        const videoRef = React.useRef<HTMLVideoElement>(null)
        const musicRef = React.useRef<HTMLAudioElement>(null)
        const sfxRef = React.useRef<HTMLAudioElement>(null)

        // Synchronize audio with video playback
        React.useEffect(() => {
          const video = videoRef.current
          const music = musicRef.current
          const sfx = sfxRef.current

          if (!video || !music || !sfx) return

          const handlePlay = () => {
            music.play().catch(e => console.warn('Music play failed:', e))
            sfx.play().catch(e => console.warn('SFX play failed:', e))
          }

          const handlePause = () => {
            music.pause()
            sfx.pause()
          }

          const handleSeeked = () => {
            const time = video.currentTime
            music.currentTime = time
            sfx.currentTime = time
          }

          const handleTimeUpdate = () => {
            // Sync audio if drift > 0.3s
            const drift = Math.abs(video.currentTime - music.currentTime)
            if (drift > 0.3) {
              music.currentTime = video.currentTime
              sfx.currentTime = video.currentTime
            }
          }

          video.addEventListener('play', handlePlay)
          video.addEventListener('pause', handlePause)
          video.addEventListener('seeked', handleSeeked)
          video.addEventListener('timeupdate', handleTimeUpdate)

          return () => {
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
            video.removeEventListener('seeked', handleSeeked)
            video.removeEventListener('timeupdate', handleTimeUpdate)
          }
        }, [])

        // Update audio volumes
        React.useEffect(() => {
          if (musicRef.current) musicRef.current.volume = musicVolume
        }, [musicVolume])

        React.useEffect(() => {
          if (sfxRef.current) sfxRef.current.volume = sfxVolume
        }, [sfxVolume])

        return (
          <div>
            {/* Header with icon and year */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '30px'
            }}>
              <span style={{
                fontSize: '90px',
                animation: 'modalIconBounce 0.6s ease-out',
                filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.5))'
              }}>{proj.icon}</span>
              <div style={{
                color: '#ffd700',
                fontSize: '16px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
                padding: '12px 24px',
                borderRadius: '25px',
                border: '1px solid rgba(255,215,0,0.5)',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
                animation: 'modalYearPulse 2s ease-in-out infinite'
              }}>{proj.year}</div>
            </div>

            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '40px',
              color: '#ffd700',
              fontWeight: 900,
              textShadow: '0 0 30px rgba(255,215,0,0.5)',
              animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
            }}>{proj.title}</h2>

            <p style={{
              color: '#999',
              fontSize: '18px',
              lineHeight: 2,
              marginBottom: '35px',
              animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
            }}>{proj.description}</p>

            {/* Portfolio Video Player with Synchronized Audio */}
            <div style={{
              marginBottom: '30px',
              animation: showContent ? 'modalTextReveal 0.7s ease-out 0.2s both' : 'none'
            }}>
              <video
                ref={videoRef}
                controls
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '16px',
                  border: '2px solid rgba(255,215,0,0.3)',
                  boxShadow: '0 8px 40px rgba(255,215,0,0.2)',
                  backgroundColor: '#000'
                }}
                poster="/logo_van.png"
              >
                <source src="/videoSlotPortfolio/Piggy Portfolio Video.mp4?v=5" type="video/mp4" />
                Your browser does not support video playback.
              </video>

              {/* Hidden synchronized audio tracks */}
              <audio ref={musicRef} style={{ display: 'none' }}>
                <source src="/audioSlotPortfolio/music/Piggy-Plunger-Music.opus" type="audio/opus" />
                <source src="/audioSlotPortfolio/music/Piggy-Plunger-Music.m4a" type="audio/mp4" />
              </audio>

              <audio ref={sfxRef} style={{ display: 'none' }}>
                <source src="/audioSlotPortfolio/sfx/Piggy-Plunger-SFX.opus" type="audio/opus" />
                <source src="/audioSlotPortfolio/sfx/Piggy-Plunger-SFX.m4a" type="audio/mp4" />
              </audio>
            </div>

            {/* Audio Volume Controls */}
            <div style={{
              marginBottom: '30px',
              animation: showContent ? 'modalTextReveal 0.8s ease-out 0.3s both' : 'none'
            }}>
              {/* Music Volume Slider */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#ffd700',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎵</span>
                    Music
                  </label>
                  <span style={{
                    fontSize: '13px',
                    color: '#999',
                    fontFamily: 'monospace'
                  }}>{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume * 100}
                  onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${musicVolume * 100}%, rgba(255,215,0,0.2) ${musicVolume * 100}%, rgba(255,215,0,0.2) 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              </div>

              {/* SFX Volume Slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '14px',
                    color: '#ffd700',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🔊</span>
                    SFX
                  </label>
                  <span style={{
                    fontSize: '13px',
                    color: '#999',
                    fontFamily: 'monospace'
                  }}>{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume * 100}
                  onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${sfxVolume * 100}%, rgba(255,215,0,0.2) ${sfxVolume * 100}%, rgba(255,215,0,0.2) 100%)`,
                    outline: 'none',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              </div>
            </div>

            {/* Tech tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {proj.tags.map((t, i) => (
                <span key={t} style={{
                  fontSize: '14px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))',
                  borderRadius: '30px',
                  color: '#ffd700',
                  fontWeight: '600',
                  border: '1px solid rgba(255,215,0,0.4)',
                  boxShadow: '0 4px 20px rgba(255,215,0,0.2)',
                  animation: showContent ? `modalTagReveal 0.4s ease-out ${0.1 + i * 0.05}s both` : 'none'
                }}>{t}</span>
              ))}
            </div>
          </div>
        )
      }
      case 'experience': {
        const exp = item.data as { period: string, role: string, company: string, highlights: string[] }
        return (
          <div>
            {/* Timeline badge */}
            <div style={{
              display: 'inline-block',
              color: '#00ff88',
              fontSize: '14px',
              marginBottom: '16px',
              letterSpacing: '3px',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))',
              borderRadius: '30px',
              border: '1px solid rgba(0,255,136,0.4)',
              boxShadow: '0 0 20px rgba(0,255,136,0.2)',
              animation: 'modalPeriodGlow 2s ease-in-out infinite'
            }}>{exp.period}</div>

            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: '40px',
              color: '#fff',
              fontWeight: 900,
              textShadow: '0 0 20px rgba(0,255,136,0.3)',
              animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
            }}>{exp.role}</h2>

            <div style={{
              color: '#666',
              fontSize: '22px',
              marginBottom: '35px',
              fontWeight: 500,
              animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
            }}>{exp.company}</div>

            {/* Animated highlights */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {exp.highlights.map((h, i) => (
                <li key={i} style={{
                  color: '#aaa',
                  fontSize: '16px',
                  marginBottom: '18px',
                  lineHeight: 1.8,
                  paddingLeft: '32px',
                  position: 'relative',
                  animation: showContent ? `modalHighlightReveal 0.5s ease-out ${0.2 + i * 0.1}s both` : 'none'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '2px',
                    color: '#00ff88',
                    fontSize: '18px',
                    textShadow: '0 0 10px rgba(0,255,136,0.5)'
                  }}>▸</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )
      }
      case 'stat': {
        const stat = item.data as { icon: string, value: string, label: string, bio: string }
        return (
          <div style={{ textAlign: 'center' }}>
            {/* Mega icon with effects */}
            <div style={{
              fontSize: '100px',
              marginBottom: '30px',
              animation: 'modalIconPulse 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 40px rgba(136,68,255,0.5))'
            }}>{stat.icon}</div>

            {/* Animated counter value */}
            <div style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#8844ff',
              marginBottom: '12px',
              textShadow: '0 0 50px rgba(136,68,255,0.8)',
              fontFamily: 'monospace',
              animation: 'modalValuePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>{stat.value}</div>

            <div style={{
              color: '#666',
              fontSize: '16px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              marginBottom: '30px'
            }}>{stat.label}</div>

            {/* Bio section */}
            {stat.bio && (
              <div style={{
                marginTop: '30px',
                padding: '20px 30px',
                background: 'rgba(136,68,255,0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(136,68,255,0.3)',
                color: '#888',
                fontSize: '15px',
                lineHeight: 1.8,
                fontStyle: 'italic',
                animation: showContent ? 'modalTextReveal 0.6s ease-out 0.2s both' : 'none'
              }}>
                "{stat.bio}"
              </div>
            )}
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'modalBackdropReveal 0.4s ease-out forwards',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Cinematic light rays */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200vw',
        height: '200vh',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse at center, ${primaryColor}20 0%, transparent 50%)`,
        animation: 'modalLightPulse 3s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Corner decorations */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner, i) => (
        <div key={corner} style={{
          position: 'absolute',
          [corner.includes('top') ? 'top' : 'bottom']: '20px',
          [corner.includes('left') ? 'left' : 'right']: '20px',
          width: '60px',
          height: '60px',
          borderTop: corner.includes('top') ? `2px solid ${primaryColor}60` : 'none',
          borderBottom: corner.includes('bottom') ? `2px solid ${primaryColor}60` : 'none',
          borderLeft: corner.includes('left') ? `2px solid ${primaryColor}60` : 'none',
          borderRight: corner.includes('right') ? `2px solid ${primaryColor}60` : 'none',
          animation: `modalCornerReveal 0.5s ease-out ${0.1 * i}s both`,
          pointerEvents: 'none'
        }} />
      ))}

      {/* Main modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #18182e 0%, #0c0c18 100%)',
          borderRadius: '28px',
          padding: '60px',
          maxWidth: '650px',
          width: '90%',
          border: `2px solid ${primaryColor}50`,
          boxShadow: `
            0 0 80px ${primaryColor}40,
            0 0 120px ${primaryColor}20,
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 0 40px rgba(0,0,0,0.5)
          `,
          animation: 'modalCardReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top shine line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${primaryColor}80, transparent)`,
          animation: 'modalShineMove 3s linear infinite'
        }} />

        {/* Content */}
        {renderContent()}

        {/* Close hint with enhanced style */}
        <div style={{
          marginTop: '50px',
          textAlign: 'center',
          color: '#444',
          fontSize: '14px',
          animation: 'modalHintReveal 0.5s ease-out 0.5s both'
        }}>
          Press <span style={{
            color: primaryColor,
            padding: '6px 16px',
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
            borderRadius: '8px',
            border: `1px solid ${primaryColor}40`,
            fontWeight: 600,
            boxShadow: `0 2px 10px ${primaryColor}20`
          }}>ESC</span> to close
        </div>
      </div>
    </div>
  )
})

// ============================================
// MEMOIZED PARTICLE BURST - GPU accelerated
// ============================================
const ParticleBurst = memo(function ParticleBurst({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      angle: (i / 50) * 360 + Math.random() * 10,
      distance: 200 + Math.random() * 400,
      size: 4 + Math.random() * 10,
      delay: Math.random() * 0.2
    })),
    []
  )

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      pointerEvents: 'none',
      zIndex: 100,
      contain: 'strict'
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            animation: `particleFly 0.8s ease-out ${p.delay}s forwards`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            '--angle': `${p.angle}deg`,
            '--distance': `${p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
})

// Win Sparkles - subtle celebration for all wins (not just jackpot)
const WinSparkles = memo(function WinSparkles({ active, color = '#00ffff' }: { active: boolean, color?: string }) {
  const sparkles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 1.5
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 150
    }}>
      {sparkles.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${s.size * 3}px ${color}, 0 0 ${s.size * 6}px ${color}50`,
            animation: `sparkleFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: 0.8
          }}
        />
      ))}
      <style>{`
        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) scale(1.5);
            opacity: 0.8;
          }
          80% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================
export function SlotFullScreen({
  machineId,
  onClose
}: {
  machineId: string
  onClose: () => void
  onNavigate?: (id: string) => void
}) {
  const [phase, setPhase] = useState<'intro' | 'spinning' | 'result' | 'content'>('spinning')
  const [focusIndex, setFocusIndex] = useState(-1) // -1 = nothing focused initially
  const [spinCount, setSpinCount] = useState(0)
  const [skillsDiscovered, setSkillsDiscovered] = useState(new Set<string>())
  const [currentIndices, setCurrentIndices] = useState([0, 0, 0, 0, 0])
  const [isJackpot, setIsJackpot] = useState(false)
  const [jackpotStory, setJackpotStory] = useState<{ story: string, highlight: string } | undefined>()
  const [forceStop, setForceStop] = useState(false)
  const [introStep, setIntroStep] = useState(0) // 0: black, 1: lights, 2: machine, 3: ready
  const [detailItem, setDetailItem] = useState<{ type: string, index: number, data: unknown } | null>(null)
  const [selectedProject, setSelectedProject] = useState<{ icon: string, title: string, description: string, year: string, tags: string[] } | null>(null)

  // Touch/swipe state
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const section = SLOT_CONTENT[machineId]
  const theme = SLOT_THEMES[machineId] || SLOT_THEMES.skills
  const primaryColor = section?.color || '#00ffff'

  // Get segment-specific reel config
  const segmentConfig = getSegmentConfig(machineId)

  // Generate random indices for this spin
  const generateSpinResult = useCallback(() => {
    // JACKPOT ONLY FOR "ABOUT" SECTION - creates special celebration effect
    // Other sections get random results without jackpot celebration
    const isAboutSection = machineId === 'about'

    if (isAboutSection && segmentConfig.stories.length > 0) {
      // About section ALWAYS gets jackpot celebration
      const combo = segmentConfig.stories[Math.floor(Math.random() * segmentConfig.stories.length)]
      setIsJackpot(true)
      setJackpotStory({ story: combo.story, highlight: combo.highlight })
      return combo.indices
    } else {
      // All other sections - random results, NO jackpot celebration
      setIsJackpot(false)
      setJackpotStory(undefined)
      return segmentConfig.reels.map(reel => Math.floor(Math.random() * reel.length))
    }
  }, [segmentConfig, machineId])

  // Initial spin indices
  const [targetIndices, setTargetIndices] = useState(() => generateSpinResult())

  // Auto-transition to result after all reels stop
  // Last reel (index 4) stops at: 1800 + 4*500 + 300 (bounce) = 4100ms
  useEffect(() => {
    if (phase === 'spinning') {
      const totalSpinTime = 1800 + 4 * 500 + 400 // Last reel stop + bounce + buffer
      const timer = setTimeout(() => {
        setPhase('result')
        // Only haptic feedback - no win/jackpot sounds (reel sounds are enough)
        if (isJackpot) {
          haptic.jackpot()
          achievementStore.trackJackpot()
        } else {
          haptic.success()
        }
        // Track section visit for achievement
        if (section) {
          achievementStore.trackSectionVisit(section.type)
        }
        // Update discovered skills using segment config
        targetIndices.forEach((idx, reelIdx) => {
          const reel = segmentConfig.reels[reelIdx]
          if (reel) {
            const symbol = reel[idx % reel.length]
            if (symbol) {
              setSkillsDiscovered(prev => new Set([...prev, `${reelIdx}-${symbol.label}`]))
            }
          }
        })
        setCurrentIndices(targetIndices)
      }, totalSpinTime)
      return () => clearTimeout(timer)
    }
  }, [phase, targetIndices, segmentConfig, isJackpot])

  // Reset focus when entering content phase
  useEffect(() => {
    if (phase === 'content') {
      setFocusIndex(0) // Start with first item focused
    }
  }, [phase])

  // Control lounge music based on selectedProject state
  useEffect(() => {
    if (selectedProject) {
      // User selected a project (video player active)
      // Pause lounge music with 1300ms fadeout
      console.log('[SlotFullScreen] Project selected, fading out lounge music (1300ms)')
      const originalVolume = dspGetVolume('music')

      let currentVol = originalVolume
      const fadeSteps = 26
      const volStep = originalVolume / fadeSteps

      const fadeInterval = setInterval(() => {
        currentVol -= volStep
        if (currentVol <= 0) {
          currentVol = 0
          clearInterval(fadeInterval)
        }
        dspVolume('music', Math.max(0, currentVol))
      }, 50)

      return () => {
        clearInterval(fadeInterval)
      }
    } else if (phase === 'content' && section?.type === 'projects') {
      // User returned to grid (selectedProject null)
      // Resume lounge music with 1000ms fadein
      console.log('[SlotFullScreen] Back to grid, fading in lounge music (1000ms)')
      const originalVolume = dspGetVolume('music') || 1.0

      let vol = 0
      const fadeInSteps = 20
      const fadeInInterval = setInterval(() => {
        vol += originalVolume / fadeInSteps
        if (vol >= originalVolume) {
          vol = originalVolume
          clearInterval(fadeInInterval)
        }
        dspVolume('music', Math.min(originalVolume, vol))
      }, 50)

      return () => {
        clearInterval(fadeInInterval)
      }
    }
  }, [selectedProject, phase, section])

  useEffect(() => {
    markVisited(machineId)
  }, [machineId])

  // Continuous reel spin sound during spinning phase (quieter)
  useEffect(() => {
    if (phase === 'spinning') {
      // Play spin sound repeatedly during spin - reduced volume
      playReelSpin(0.25)
      const interval = setInterval(() => {
        playReelSpin(0.2)
      }, 380) // Slightly less than duration to overlap smoothly

      return () => clearInterval(interval)
    }
  }, [phase])

  // Handle individual reel stop - plays synced sound
  const handleReelStop = useCallback((reelIndex: number) => {
    // Slightly different volume for each reel for realism
    const volumes = [0.5, 0.55, 0.6, 0.55, 0.65]
    playReelStop(volumes[reelIndex] || 0.6)
  }, [])

  // Touch/swipe handlers for mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || phase !== 'content' || !section) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Minimum swipe distance and max time for gesture
    const minSwipeDistance = 50
    const maxSwipeTime = 300

    if (deltaTime < maxSwipeTime) {
      const itemCount = getItemCount(section)
      const cols = getGridColumns(section)

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right = previous
          if (focusIndex === -1) {
            setFocusIndex(0)
          } else {
            setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          }
        } else {
          // Swipe left = next
          if (focusIndex === -1) {
            setFocusIndex(0)
          } else {
            setFocusIndex(prev => (prev + 1) % itemCount)
          }
        }
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe down = previous row
          if (focusIndex === -1) {
            setFocusIndex(0)
          } else {
            setFocusIndex(prev => {
              const newIdx = prev - cols
              return newIdx < 0 ? prev : newIdx
            })
          }
        } else {
          // Swipe up = next row
          if (focusIndex === -1) {
            setFocusIndex(0)
          } else {
            setFocusIndex(prev => {
              const newIdx = prev + cols
              return newIdx >= itemCount ? prev : newIdx
            })
          }
        }
      }
    }

    touchStartRef.current = null
  }, [phase, section])

  // Handle new spin
  const handleSpin = useCallback(() => {
    if (phase === 'spinning') return

    setForceStop(false) // Reset force stop for new spin
    setPhase('spinning')
    setSpinCount(prev => prev + 1)
    setTargetIndices(generateSpinResult())
    haptic.spin() // Haptic feedback on spin start
    achievementStore.trackSpin() // Track for achievements
  }, [phase, generateSpinResult])

  // INTRO SEQUENCE - Cinematic entrance animation
  useEffect(() => {
    if (phase === 'intro') {
      // Step 1: Lights flicker on (300ms)
      const t1 = setTimeout(() => setIntroStep(1), 200)
      // Step 2: Machine reveals (600ms)
      const t2 = setTimeout(() => setIntroStep(2), 600)
      // Step 3: Ready state (1000ms)
      const t3 = setTimeout(() => setIntroStep(3), 1000)
      // Step 4: Auto-start first spin (1500ms)
      const t4 = setTimeout(() => {
        setPhase('spinning')
        setSpinCount(1)
        setTargetIndices(generateSpinResult())
      }, 1500)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [phase, generateSpinResult])

  // Handle activation (Enter key press on focused item)
  const handleActivate = useCallback((index: number) => {
    if (!section) return

    // Track detail view for achievements
    achievementStore.trackDetailView()

    switch (section.type) {
      case 'skills': {
        // Flatten skills to find the right one
        let itemIndex = 0
        for (const cat of (section as SkillsSection).categories) {
          for (const skill of cat.skills) {
            if (itemIndex === index) {
              setDetailItem({ type: 'skill', index, data: { ...skill, category: cat.name, categoryColor: cat.color, categoryIcon: cat.icon } })
              return
            }
            itemIndex++
          }
        }
        break
      }
      case 'services': {
        const item = (section as ServicesSection).items[index]
        if (item) setDetailItem({ type: 'service', index, data: item })
        break
      }
      case 'about': {
        const stat = (section as AboutSection).stats[index]
        if (stat) setDetailItem({ type: 'stat', index, data: { ...stat, bio: (section as AboutSection).bio } })
        break
      }
      case 'projects': {
        const proj = (section as ProjectsSection).featured[index]
        if (proj) {
          // Show video player for selected project
          setSelectedProject({
            icon: proj.icon,
            title: proj.title,
            description: proj.description,
            year: proj.year,
            tags: proj.tags,
            videoPath: proj.videoPath,
            musicPath: proj.musicPath,
            sfxPath: proj.sfxPath
          })
        }
        break
      }
      case 'experience': {
        const exp = (section as ExperienceSection).timeline[index]
        if (exp) setDetailItem({ type: 'experience', index, data: exp })
        break
      }
      case 'contact': {
        const methods = (section as ContactSection).methods
        const method = methods[index]
        if (method?.action === 'email' && method.url) {
          window.location.href = method.url
        } else if (method?.action === 'link' && method.url) {
          window.open(method.url, '_blank', 'noopener,noreferrer')
        } else if (method?.action === 'copy') {
          navigator.clipboard.writeText(method.value)
        }
        break
      }
    }
  }, [section])

  // Keyboard navigation with sound effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - close detail modal first, then close slot
      if (e.key === 'Escape') {
        if (detailItem) {
          setDetailItem(null)
          return
        }
        onClose()
        return
      }

      // SPACE - hard stop if spinning, new spin only if in valid phase
      if (e.key === ' ') {
        e.preventDefault()
        if (phase === 'spinning') {
          // HARD STOP - immediately stop all reels and show result
          // No click sound - reel stop sounds will play instead
          setForceStop(true)
          // Small delay to let reels react, then show result
          setTimeout(() => {
            setPhase('result')
            // No transition sound - reel stop sounds are enough
            // Update discovered skills
            targetIndices.forEach((idx, reelIdx) => {
              const reel = segmentConfig.reels[reelIdx]
              if (reel) {
                const symbol = reel[idx % reel.length]
                if (symbol) {
                  setSkillsDiscovered(prev => new Set([...prev, `${reelIdx}-${symbol.label}`]))
                }
              }
            })
            setCurrentIndices(targetIndices)
            // Reset forceStop for next spin
            setTimeout(() => setForceStop(false), 100)
          }, 150)
        } else if (phase === 'intro' || phase === 'result') {
          // Only allow new spin in intro or result phase (NOT during spinning or content)
          // No click sound - reel spin sound will start instead
          handleSpin()
        }
        return
      }

      // ENTER in result phase → go to content
      if (e.key === 'Enter' && phase === 'result') {
        e.preventDefault()
        setPhase('content')
        return
      }

      // Only handle arrow/enter in content phase
      if (phase !== 'content' || !section) return

      const itemCount = getItemCount(section)
      const columns = getGridColumns(section)

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          haptic.light()
          playNavTick(0.3)
          setFocusIndex(prev => (prev + 1) % itemCount)
          break
        case 'ArrowLeft':
          e.preventDefault()
          haptic.light()
          playNavTick(0.3)
          setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          break
        case 'ArrowDown':
          e.preventDefault()
          haptic.light()
          playNavTick(0.3)
          if (columns > 1) {
            setFocusIndex(prev => {
              const next = prev + columns
              return next < itemCount ? next : prev
            })
          } else {
            setFocusIndex(prev => (prev + 1) % itemCount)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          haptic.light()
          playNavTick(0.3)
          if (columns > 1) {
            setFocusIndex(prev => {
              const next = prev - columns
              return next >= 0 ? next : prev
            })
          } else {
            setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          }
          break
        case 'Enter':
          e.preventDefault()
          if (focusIndex >= 0) {
            haptic.medium()
            handleActivate(focusIndex)
          } else {
            setFocusIndex(0)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, phase, section, focusIndex, handleActivate, handleSpin, detailItem, segmentConfig, targetIndices])

  // PortfolioPlayer handles its own keyboard events (no blocking needed here)

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: phase === 'intro' && introStep === 0
        ? '#000000'
        : 'linear-gradient(180deg, #03020a 0%, #08061a 30%, #0a0820 50%, #08061a 70%, #03020a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto',
      transition: 'background 0.5s ease',
      animation: isJackpot && phase === 'result' ? 'megaShake 0.5s ease-in-out' : 'none',
      cursor: 'default' // Always show pointer
    }}>
      {/* ========== ULTRA PREMIUM BACKGROUND EFFECTS ========== */}

      {/* CRT Scanlines Overlay - GPU accelerated */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.4,
        willChange: 'opacity',
        transform: 'translateZ(0)'
      }} />

      {/* CRT Vignette - GPU accelerated */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.35) 100%)',
        pointerEvents: 'none',
        zIndex: 9998,
        transform: 'translateZ(0)'
      }} />

      {/* Parallax Floating Orbs - Optimized with GPU acceleration */}
      {phase !== 'intro' && (
        <>
          <div style={{
            position: 'fixed',
            top: '10%', left: '5%',
            width: '250px', height: '250px',
            background: `radial-gradient(circle, ${primaryColor}12 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(30px)',
            animation: 'parallaxFloat1 20s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'transform',
            transform: 'translateZ(0)'
          }} />
          <div style={{
            position: 'fixed',
            bottom: '20%', right: '10%',
            width: '200px', height: '200px',
            background: `radial-gradient(circle, ${COLORS.magenta}12 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'parallaxFloat2 25s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'transform',
            transform: 'translateZ(0)'
          }} />

          {/* Star Field - Reduced to 8 for performance */}
          {[15, 35, 55, 75, 25, 65, 85, 45].map((pos, i) => (
            <div key={`star-${i}`} style={{
              position: 'fixed',
              top: `${pos}%`,
              left: `${(pos * 1.3 + i * 10) % 100}%`,
              width: '3px',
              height: '3px',
              background: '#fff',
              borderRadius: '50%',
              boxShadow: '0 0 6px #fff',
              animation: `starTwinkle ${2.5 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.5,
              transform: 'translateZ(0)'
            }} />
          ))}

          {/* Floating Energy Orbs - Reduced to 3 for performance */}
          {[
            { top: '25%', left: '15%', color: primaryColor, dur: 8 },
            { top: '55%', left: '75%', color: COLORS.cyan, dur: 10 },
            { top: '75%', left: '35%', color: COLORS.magenta, dur: 12 }
          ].map((orb, i) => (
            <div key={`orb-${i}`} style={{
              position: 'fixed',
              top: orb.top,
              left: orb.left,
              width: '6px',
              height: '6px',
              background: orb.color,
              borderRadius: '50%',
              boxShadow: `0 0 15px ${orb.color}`,
              animation: `floatingOrb ${orb.dur}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
              pointerEvents: 'none',
              zIndex: 2,
              willChange: 'transform',
              transform: 'translateZ(0)'
            }} />
          ))}
        </>
      )}

      {/* Jackpot Rainbow Border Flash */}
      {isJackpot && phase === 'result' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          border: '4px solid transparent',
          borderImage: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1',
          animation: 'rainbowShift 1s linear infinite',
          pointerEvents: 'none',
          zIndex: 100
        }} />
      )}

      {/* INTRO PHASE - ULTIMATE WOW Cinematic Entrance */}
      {phase === 'intro' && (
        <>
          {/* Electric grid background */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `
              linear-gradient(${primaryColor}08 1px, transparent 1px),
              linear-gradient(90deg, ${primaryColor}08 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: introStep >= 1 ? 1 : 0,
            transition: 'opacity 0.5s ease',
            animation: introStep >= 1 ? 'introGridPulse 2s ease-in-out infinite' : 'none',
            pointerEvents: 'none'
          }} />

          {/* Scanning lines effect */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
            opacity: introStep >= 1 ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            animation: introStep >= 1 ? 'scanLines 0.1s linear infinite' : 'none'
          }} />

          {/* Horizontal laser beam */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: 0,
            right: 0,
            height: introStep >= 1 ? '3px' : '0px',
            background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
            boxShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}, 0 0 100px ${primaryColor}`,
            transform: 'translateY(-50%)',
            animation: introStep >= 1 ? 'introLaserScan 1s ease-out forwards' : 'none',
            pointerEvents: 'none',
            zIndex: 5
          }} />

          {/* Vertical laser beams */}
          <div style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: '50%',
            width: introStep >= 1 ? '2px' : '0px',
            background: `linear-gradient(180deg, transparent, ${primaryColor}, transparent)`,
            boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
            transform: 'translateX(-50%)',
            animation: introStep >= 1 ? 'introVerticalLaser 0.8s ease-out 0.3s both' : 'none',
            pointerEvents: 'none',
            zIndex: 5
          }} />

          {/* Light beams from top - enhanced */}
          {introStep >= 1 && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200%',
              height: '100%',
              background: `conic-gradient(from 180deg at 50% 0%, transparent 35%, ${primaryColor}20 42%, ${primaryColor}50 50%, ${primaryColor}20 58%, transparent 65%)`,
              opacity: introStep >= 2 ? 1 : 0.5,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              animation: 'introLightSweep 2s ease-out forwards'
            }} />
          )}

          {/* Rotating light rays */}
          {introStep >= 2 && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '200vw',
              height: '200vh',
              transform: 'translate(-50%, -50%)',
              background: `conic-gradient(from 0deg, transparent, ${primaryColor}10, transparent, ${primaryColor}10, transparent, ${primaryColor}10, transparent, ${primaryColor}10, transparent)`,
              animation: 'introLightRotate 8s linear infinite',
              pointerEvents: 'none',
              opacity: 0.5
            }} />
          )}

          {/* Center spotlight - enhanced */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            width: introStep >= 2 ? '150vw' : '0vw',
            height: introStep >= 2 ? '150vh' : '0vh',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, ${primaryColor}30 0%, ${primaryColor}10 20%, transparent 50%)`,
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none'
          }} />

          {/* Particle explosion from center */}
          {introStep >= 2 && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '10px',
              height: '10px',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 15
            }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: primaryColor,
                  boxShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`,
                  animation: `introParticleExplode 1s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                  '--angle': `${i * 30}deg`,
                  '--distance': '200px'
                } as React.CSSProperties} />
              ))}
            </div>
          )}

          {/* Corner brackets */}
          {introStep >= 2 && (
            <>
              <div style={{
                position: 'fixed', top: '20%', left: '20%',
                width: '60px', height: '60px',
                borderTop: `3px solid ${primaryColor}`,
                borderLeft: `3px solid ${primaryColor}`,
                animation: 'introCornerSlide 0.5s ease-out 0.2s both',
                boxShadow: `0 0 20px ${primaryColor}50`
              }} />
              <div style={{
                position: 'fixed', top: '20%', right: '20%',
                width: '60px', height: '60px',
                borderTop: `3px solid ${primaryColor}`,
                borderRight: `3px solid ${primaryColor}`,
                animation: 'introCornerSlide 0.5s ease-out 0.3s both',
                boxShadow: `0 0 20px ${primaryColor}50`
              }} />
              <div style={{
                position: 'fixed', bottom: '20%', left: '20%',
                width: '60px', height: '60px',
                borderBottom: `3px solid ${primaryColor}`,
                borderLeft: `3px solid ${primaryColor}`,
                animation: 'introCornerSlide 0.5s ease-out 0.4s both',
                boxShadow: `0 0 20px ${primaryColor}50`
              }} />
              <div style={{
                position: 'fixed', bottom: '20%', right: '20%',
                width: '60px', height: '60px',
                borderBottom: `3px solid ${primaryColor}`,
                borderRight: `3px solid ${primaryColor}`,
                animation: 'introCornerSlide 0.5s ease-out 0.5s both',
                boxShadow: `0 0 20px ${primaryColor}50`
              }} />
            </>
          )}

          {/* Title reveal - ULTIMATE */}
          <div style={{
            position: 'relative',
            zIndex: 20,
            textAlign: 'center',
            opacity: introStep >= 2 ? 1 : 0,
            transform: introStep >= 2 ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.5)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: introStep >= 2 ? 'blur(0)' : 'blur(10px)'
          }}>
            {/* Glitch effect layers */}
            <div style={{ position: 'relative' }}>
              <h1 style={{
                fontSize: 'clamp(48px, 12vw, 120px)',
                fontWeight: 900,
                color: '#fff',
                textShadow: `
                  0 0 20px ${primaryColor},
                  0 0 40px ${primaryColor},
                  0 0 80px ${primaryColor},
                  0 0 120px ${primaryColor}80,
                  0 0 200px ${primaryColor}40
                `,
                letterSpacing: '15px',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                animation: introStep >= 3 ? 'introTitleGlitch 3s ease-in-out infinite' : 'none',
                WebkitTextStroke: `1px ${primaryColor}40`
              }}>
                {segmentConfig.title}
              </h1>
              {/* Glitch copies */}
              {introStep >= 3 && (
                <>
                  <h1 style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    fontSize: 'clamp(48px, 12vw, 120px)',
                    fontWeight: 900,
                    color: '#ff0066',
                    letterSpacing: '15px',
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    animation: 'introGlitchRed 0.3s ease-in-out infinite',
                    opacity: 0.5,
                    mixBlendMode: 'screen'
                  }}>
                    {segmentConfig.title}
                  </h1>
                  <h1 style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    fontSize: 'clamp(48px, 12vw, 120px)',
                    fontWeight: 900,
                    color: '#00ffff',
                    letterSpacing: '15px',
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    animation: 'introGlitchCyan 0.3s ease-in-out infinite',
                    opacity: 0.5,
                    mixBlendMode: 'screen'
                  }}>
                    {segmentConfig.title}
                  </h1>
                </>
              )}
            </div>
            <p style={{
              fontSize: 'clamp(16px, 3vw, 28px)',
              color: primaryColor,
              marginTop: '24px',
              letterSpacing: '8px',
              textTransform: 'uppercase',
              opacity: introStep >= 3 ? 1 : 0,
              transform: introStep >= 3 ? 'translateY(0) scaleX(1)' : 'translateY(20px) scaleX(0.8)',
              transition: 'all 0.5s ease 0.2s',
              textShadow: `0 0 20px ${primaryColor}80`
            }}>
              {segmentConfig.subtitle}
            </p>
            {/* Decorative line under subtitle */}
            <div style={{
              width: introStep >= 3 ? '300px' : '0px',
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
              margin: '20px auto 0',
              transition: 'width 0.6s ease 0.4s',
              boxShadow: `0 0 15px ${primaryColor}`
            }} />
          </div>

          {/* Loading indicator - enhanced */}
          {introStep >= 3 && (
            <div style={{
              position: 'absolute',
              bottom: '12%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              animation: 'fadeIn 0.5s ease'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: primaryColor,
                    boxShadow: `0 0 15px ${primaryColor}, 0 0 30px ${primaryColor}50`,
                    animation: 'introDotPulse 0.8s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`
                  }} />
                ))}
              </div>
              <div style={{
                fontSize: '12px',
                letterSpacing: '4px',
                color: '#666',
                textTransform: 'uppercase',
                animation: 'introLoadingText 1.5s ease-in-out infinite'
              }}>
                INITIALIZING
              </div>
            </div>
          )}
        </>
      )}

      {/* Ambient glow - enhanced */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        width: '150vw', height: '150vh',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse, ${primaryColor}12 0%, ${primaryColor}05 30%, transparent 60%)`,
        pointerEvents: 'none',
        opacity: 1
      }} />

      {/* Floating particles background - only during spinning/result, NOT in content */}
      {(phase === 'spinning' || phase === 'result') && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              borderRadius: '50%',
              background: i % 3 === 0 ? primaryColor : i % 3 === 1 ? COLORS.gold : COLORS.magenta,
              opacity: 0.3 + Math.random() * 0.4,
              animation: `floatParticle ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }} />
          ))}
        </div>
      )}

      {/* ESC hint - keyboard navigation indicator */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${primaryColor}40`,
          color: primaryColor,
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          opacity: 0.9
        }}
      >
        <span style={{
          padding: '4px 8px',
          background: `${primaryColor}20`,
          borderRadius: '4px',
          border: `1px solid ${primaryColor}60`,
          fontSize: '12px'
        }}>ESC</span>
        EXIT
      </div>

      {/* SKILL REEL SLOT MACHINE */}
      {(phase === 'spinning' || phase === 'result') && (
        <ScreenShake active={isJackpot && phase === 'result'}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            background: 'linear-gradient(180deg, #03020a 0%, #08061a 10%, #0c0a22 50%, #08061a 90%, #03020a 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: `
              0 0 120px rgba(0,0,0,0.95),
              inset 0 0 60px ${primaryColor}08,
              0 0 2px ${primaryColor}40,
              0 0 80px ${primaryColor}15
            `,
            border: `2px solid ${primaryColor}30`,
            position: 'relative'
          }}>
            {/* Outer chrome frame */}
            <div style={{
              position: 'absolute',
              top: -3, left: -3, right: -3, bottom: -3,
              borderRadius: '28px',
              background: 'linear-gradient(180deg, #3a3a4a 0%, #1a1a2a 50%, #2a2a3a 100%)',
              zIndex: -1,
              boxShadow: '0 0 30px rgba(0,0,0,0.8)'
            }} />

            {/* Game Title Marquee - uses segment config */}
            <GameMarquee
              title={segmentConfig.title}
              subtitle={segmentConfig.subtitle}
              color={primaryColor}
            />

            {/* Main Reel Area */}
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: `radial-gradient(ellipse at center, ${primaryColor}10 0%, transparent 50%)`
            }}>
              {/* Ambient light rays on jackpot */}
              {isJackpot && phase === 'result' && (
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '200%', height: '200%',
                  transform: 'translate(-50%, -50%)',
                  background: `conic-gradient(from 0deg, transparent, ${COLORS.gold}10, transparent, ${COLORS.gold}10, transparent, ${COLORS.gold}10, transparent, ${COLORS.gold}10, transparent)`,
                  animation: 'lightRays 4s linear infinite',
                  pointerEvents: 'none',
                  opacity: 0.5
                }} />
              )}

              {/* Payline indicators */}
              <PaylineIndicator active={phase === 'result' && isJackpot} color={COLORS.gold} side="left" />
              <PaylineIndicator active={phase === 'result' && isJackpot} color={COLORS.gold} side="right" />

              {/* 5 Skill Reel columns */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
                width: '88%',
                height: '60%',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(10,10,30,0.5) 15%, rgba(15,15,40,0.4) 50%, rgba(10,10,30,0.5) 85%, rgba(0,0,0,0.7) 100%)',
                borderRadius: '16px',
                border: `3px solid ${primaryColor}50`,
                overflow: 'hidden',
                boxShadow: `
                  inset 0 0 80px rgba(0,0,0,0.9),
                  0 0 40px rgba(0,0,0,0.5),
                  inset 0 1px 0 rgba(255,255,255,0.1)
                `,
                position: 'relative'
              }}>
                {/* Inner chrome bezel */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: '14px',
                  boxShadow: 'inset 0 0 0 4px rgba(40,40,60,0.8)',
                  pointerEvents: 'none'
                }} />

                {/* Reel labels at top - dynamic based on segment */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: 0, right: 0,
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '0 20px',
                  zIndex: 10
                }}>
                  {segmentConfig.reels.map((reel, i) => {
                    const firstSymbol = reel[0]
                    return (
                      <span key={i} style={{
                        fontSize: '10px',
                        color: firstSymbol?.color || primaryColor,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        opacity: 0.7,
                        textShadow: `0 0 10px ${firstSymbol?.color || primaryColor}40`
                      }}>
                        {firstSymbol?.label?.split(' ')[0] || `REEL ${i + 1}`}
                      </span>
                    )
                  })}
                </div>

                {segmentConfig.reels.map((reelData, i) => (
                  <SkillReelColumn
                    key={i}
                    reelData={reelData}
                    spinning={phase === 'spinning'}
                    finalIndex={targetIndices[i]}
                    delay={i}
                    reelIndex={i}
                    jackpot={isJackpot && phase === 'result'}
                    forceStop={forceStop}
                    onReelStop={handleReelStop}
                  />
                ))}
              </div>

              {/* Center payline highlight */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '8%',
                right: '8%',
                height: phase === 'result' && isJackpot ? '6px' : '2px',
                background: phase === 'result' && isJackpot
                  ? `linear-gradient(90deg, transparent, ${COLORS.gold}, ${COLORS.gold}, transparent)`
                  : `linear-gradient(90deg, transparent, ${primaryColor}50, ${primaryColor}50, transparent)`,
                transform: 'translateY(-50%)',
                boxShadow: phase === 'result' && isJackpot
                  ? `0 0 40px ${COLORS.gold}, 0 0 80px ${COLORS.gold}, 0 0 120px ${COLORS.gold}60`
                  : 'none',
                animation: phase === 'result' && isJackpot ? 'winLineUltra 0.4s ease-in-out infinite' : 'none',
                pointerEvents: 'none',
                borderRadius: '3px'
              }} />

              {/* Spin Button */}
              <SpinButton
                spinning={phase === 'spinning'}
                onSpin={handleSpin}
                color={primaryColor}
              />

              {/* Jackpot overlay */}
              {isJackpot && phase === 'result' && (
                <>
                  {/* Glow layer */}
                  <div style={{
                    position: 'absolute',
                    top: '8%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'clamp(40px, 8vw, 80px)',
                    fontWeight: 900,
                    color: 'transparent',
                    WebkitTextStroke: `2px ${COLORS.gold}40`,
                    letterSpacing: '15px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    filter: 'blur(8px)',
                    animation: 'jackpotGlow 0.5s ease-out',
                    zIndex: 99
                  }}>
                    JACKPOT!
                  </div>
                  {/* Main text */}
                  <div style={{
                    position: 'absolute',
                    top: '8%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'clamp(40px, 8vw, 80px)',
                    fontWeight: 900,
                    color: COLORS.gold,
                    textShadow: `
                      0 0 20px ${COLORS.gold},
                      0 0 40px ${COLORS.gold},
                      0 0 80px ${COLORS.gold},
                      0 4px 0 #b8860b,
                      0 6px 0 #8b6914
                    `,
                    letterSpacing: '15px',
                    animation: 'jackpotRevealUltra 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    zIndex: 100
                  }}>
                    JACKPOT!
                  </div>
                </>
              )}

              {/* Full Content Panel - DISABLED in result phase, only shows in content phase */}
              {/* <FullContentPanel
                section={section}
                visible={phase === 'result'}
                isJackpot={isJackpot}
                primaryColor={primaryColor}
              /> */}
            </div>

            {/* Bottom Info Panel */}
            <InfoPanel
              primaryColor={primaryColor}
              jackpot={isJackpot && phase === 'result'}
              skillsDiscovered={skillsDiscovered.size}
              spinCount={spinCount}
              config={segmentConfig}
            />

            {/* Jackpot Story with Typewriter Effect */}
            {phase === 'result' && isJackpot && jackpotStory && (
              <div style={{
                position: 'absolute',
                bottom: '140px',
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '600px',
                textAlign: 'center',
                padding: '20px 30px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
                borderRadius: '16px',
                border: '2px solid rgba(255,215,0,0.4)',
                boxShadow: '0 0 40px rgba(255,215,0,0.3), inset 0 0 30px rgba(255,215,0,0.1)',
                animation: 'storyReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
                zIndex: 200
              }}>
                <div style={{
                  color: COLORS.gold,
                  fontSize: '14px',
                  letterSpacing: '4px',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  textShadow: `0 0 20px ${COLORS.gold}`
                }}>
                  {jackpotStory.highlight}
                </div>
                <TypewriterText
                  text={jackpotStory.story}
                  speed={25}
                  delay={800}
                  color="#fff"
                  fontSize="18px"
                />
              </div>
            )}

            {/* ENTER prompt - Centered plaque like TOTAL WIN */}
            {phase === 'result' && (
              <div
                onClick={() => {
                  setPhase('content')
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  animation: 'totalWinReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
                  zIndex: 200,
                  cursor: 'pointer'
                }}>
                {/* Main plaque */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '40px 60px',
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,10,30,0.95))',
                  borderRadius: '20px',
                  border: `4px solid ${primaryColor}`,
                  boxShadow: `
                    0 0 60px ${primaryColor}80,
                    0 0 120px ${primaryColor}40,
                    inset 0 0 40px ${primaryColor}20
                  `,
                  animation: 'totalWinPulse 2s ease-in-out infinite'
                }}>
                  {/* PRESS ENTER */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span style={{
                      padding: '12px 24px',
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                      borderRadius: '12px',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '22px',
                      letterSpacing: '3px',
                      boxShadow: `0 0 30px ${primaryColor}80`,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      PRESS ENTER
                    </span>
                  </div>
                  {/* FOR PORTFOLIO INFO */}
                  <div style={{
                    color: '#fff',
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    textShadow: `0 0 20px ${primaryColor}, 0 4px 10px rgba(0,0,0,0.5)`
                  }}>
                    FOR PORTFOLIO INFO
                  </div>
                </div>
              </div>
            )}

            {/* Win Sparkles for all wins */}
            <WinSparkles active={phase === 'result'} color={primaryColor} />

            {/* Coin Rain on jackpot */}
            <CoinRain active={isJackpot && phase === 'result'} />

            {/* Particle explosion on jackpot */}
            {isJackpot && phase === 'result' && <ParticleBurst color={COLORS.gold} />}
          </div>
        </ScreenShake>
      )}

      {/* CONTENT PHASE - FULL SCREEN with WOW animations */}
      {phase === 'content' && section && (
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '100%',
            height: '100%',
            overflow: selectedProject ? 'hidden' : 'auto', // No scroll in video player
            padding: selectedProject ? '0' : '60px 40px', // No padding in video mode
            animation: 'contentWowEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            touchAction: selectedProject ? 'none' : 'pan-y', // Block touch scroll in video
            cursor: 'pointer' // Force pointer visibility
          }}
        >

          {/* Epic light burst on entry */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '300vw',
            height: '300vh',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${primaryColor}30 0%, ${primaryColor}15 20%, transparent 50%)`,
            animation: 'contentLightBurst 1.5s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Scanning beam effect */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
            animation: 'contentScanBeam 0.8s ease-out forwards',
            boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
            pointerEvents: 'none',
            zIndex: 100
          }} />

          {/* Corner accents - smaller for cleaner look */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '80px',
            height: '80px',
            borderTop: `2px solid ${primaryColor}60`,
            borderLeft: `2px solid ${primaryColor}60`,
            animation: 'contentCornerReveal 0.6s ease-out 0.3s both',
            pointerEvents: 'none',
            zIndex: 50
          }} />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '80px',
            height: '80px',
            borderTop: `2px solid ${primaryColor}60`,
            borderRight: `2px solid ${primaryColor}60`,
            animation: 'contentCornerReveal 0.6s ease-out 0.4s both',
            pointerEvents: 'none',
            zIndex: 50
          }} />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '80px',
            height: '80px',
            borderBottom: `2px solid ${primaryColor}60`,
            borderLeft: `2px solid ${primaryColor}60`,
            animation: 'contentCornerReveal 0.6s ease-out 0.5s both',
            pointerEvents: 'none',
            zIndex: 50
          }} />
          <div style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '80px',
            height: '80px',
            borderBottom: `2px solid ${primaryColor}60`,
            borderRight: `2px solid ${primaryColor}60`,
            animation: 'contentCornerReveal 0.6s ease-out 0.6s both',
            pointerEvents: 'none',
            zIndex: 50
          }} />

          <div style={{
            maxWidth: selectedProject ? 'none' : '1400px',
            margin: selectedProject ? '0' : '0 auto',
            position: 'relative',
            zIndex: 10,
            height: selectedProject ? '100%' : 'auto',
            width: selectedProject ? '100%' : 'auto'
          }}>
            {/* Header - HIDDEN when video player active */}
            {!selectedProject && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '40px',
                paddingBottom: '24px',
                borderBottom: `1px solid ${primaryColor}30`,
                animation: 'contentTitleDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both'
              }}>
                <div>
                  <h1 style={{
                    margin: 0,
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    fontWeight: 900,
                    color: primaryColor,
                    textShadow: `
                      0 0 20px ${primaryColor}60,
                      0 0 40px ${primaryColor}40
                    `,
                    letterSpacing: '4px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {section.title}
                  </h1>
                  <p style={{
                    margin: '8px 0 0 0',
                    color: '#666688',
                    fontSize: '16px',
                    fontStyle: 'italic'
                  }}>
                    {section.tagline}
                  </p>
                </div>
                {/* Section icon */}
                <div style={{
                  fontSize: '48px',
                  filter: `drop-shadow(0 0 20px ${primaryColor}50)`,
                  opacity: 0.8
                }}>
                  {section.type === 'skills' ? '⚡' :
                   section.type === 'services' ? '🎯' :
                   section.type === 'about' ? '👤' :
                   section.type === 'projects' ? '🚀' :
                   section.type === 'experience' ? '📈' :
                   section.type === 'contact' ? '💬' : '✨'}
                </div>
              </div>
            )}

            {/* Content - full width utilization */}
            <div style={{ animation: 'contentBodyReveal 0.8s ease-out 0.4s both' }}>
              <ContentView
                section={section}
                focusIndex={focusIndex}
                selectedProject={selectedProject}
                onBackFromProject={() => {
                  setSelectedProject(null)
                }}
              />
            </div>

          </div>

          {/* Close Button - Fixed position (always visible) */}
          <button
            onClick={() => {
              onClose()
            }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255,68,68,0.9)',
              border: '2px solid #ff6666',
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,68,68,0.4), 0 0 30px rgba(255,68,68,0.2)',
              animation: 'contentHintFade 0.5s ease-out 0.5s both'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Detail Modal (only for non-projects sections) */}
      {detailItem && section?.type !== 'projects' && (
        <DetailModal
          item={detailItem}
          primaryColor={primaryColor}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* CSS */}
      <style>{`
        /* Result Phase ENTER Prompt Animations */
        @keyframes totalWinReveal {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          60% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes totalWinPulse {
          0%, 100% {
            box-shadow: 0 0 60px ${primaryColor}80, 0 0 120px ${primaryColor}40, inset 0 0 40px ${primaryColor}20;
          }
          50% {
            box-shadow: 0 0 80px ${primaryColor}ff, 0 0 160px ${primaryColor}60, inset 0 0 60px ${primaryColor}30;
          }
        }

        @keyframes resultPromptReveal {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(30px) scale(0.8);
          }
          60% {
            transform: translateX(-50%) translateY(-5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes resultArrowBounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(8px);
            opacity: 1;
          }
        }

        @keyframes resultBoxGlow {
          0%, 100% {
            box-shadow: 0 0 30px ${primaryColor}30, inset 0 0 20px ${primaryColor}10;
          }
          50% {
            box-shadow: 0 0 50px ${primaryColor}50, inset 0 0 30px ${primaryColor}20;
          }
        }

        /* ULTRA PREMIUM MODAL ANIMATIONS */
        @keyframes modalBackdropReveal {
          0% { background: rgba(0,0,0,0); }
          100% { background: rgba(0,0,0,0.95); }
        }

        @keyframes modalCardReveal {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(50px) rotateX(15deg);
            filter: blur(10px);
          }
          50% {
            transform: scale(1.02) translateY(-5px) rotateX(-2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotateX(0);
            filter: blur(0);
          }
        }

        @keyframes modalCornerReveal {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes modalLightPulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes modalShineMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes modalIconPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
        }

        @keyframes modalIconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(3deg); }
          75% { transform: translateY(-5px) rotate(-3deg); }
        }

        @keyframes modalIconBounce {
          0% { transform: scale(0) rotate(-30deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes modalOrbit {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }

        @keyframes modalBadgeReveal {
          0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes modalTitleReveal {
          0% { opacity: 0; transform: translateY(30px); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes modalTextReveal {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalTagReveal {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes modalSparkle {
          0%, 100% { opacity: 1; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.5; transform: translateY(-50%) scale(1.5); }
        }

        @keyframes modalYearPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 4px 40px rgba(255,215,0,0.6); }
        }

        @keyframes modalPeriodGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,136,0.2); }
          50% { box-shadow: 0 0 40px rgba(0,255,136,0.5); }
        }

        @keyframes modalHighlightReveal {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes modalValuePop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes modalHintReveal {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Legacy support */
        @keyframes detailModalFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes detailModalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes jackpotReveal {
          0% { transform: scale(0.3) translateY(20px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes particleFly {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance));
            opacity: 0;
          }
        }
        @keyframes contentReveal {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* WOW Content Entry Animations */
        @keyframes contentWowEntrance {
          0% {
            opacity: 0;
            transform: scale(1.1) translateY(-30px);
            filter: blur(20px) brightness(2);
          }
          30% {
            opacity: 1;
            filter: blur(5px) brightness(1.5);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) brightness(1);
          }
        }

        @keyframes contentLightBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.3);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        @keyframes contentScanBeam {
          0% {
            top: 0;
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes contentCornerReveal {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
        }

        @keyframes contentTitleDrop {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5) rotateX(45deg);
            filter: blur(10px);
          }
          60% {
            transform: translateY(10px) scale(1.05) rotateX(-5deg);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0);
          }
        }

        @keyframes contentTitleGlow {
          0%, 100% {
            filter: brightness(1) drop-shadow(0 0 20px currentColor);
          }
          50% {
            filter: brightness(1.2) drop-shadow(0 0 40px currentColor);
          }
        }

        @keyframes contentTaglineSlide {
          0% {
            opacity: 0;
            transform: translateX(-50px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        @keyframes contentUnderlineExpand {
          0% {
            width: 0;
            opacity: 0;
          }
          100% {
            width: 200px;
            opacity: 1;
          }
        }

        @keyframes contentBodyReveal {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes contentHintFade {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleGlow {
          0%, 100% { text-shadow: 0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}50; }
          50% { text-shadow: 0 0 60px ${primaryColor}, 0 0 120px ${primaryColor}70; }
        }
        @keyframes symbolBounce {
          0% { transform: scale(1.5) translateY(-20px); }
          60% { transform: scale(1.2) translateY(10px); }
          100% { transform: scale(1.3) translateY(0); }
        }
        @keyframes winLinePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}; }
          50% { opacity: 0.7; box-shadow: 0 0 30px ${COLORS.gold}, 0 0 60px ${COLORS.gold}; }
        }
        @keyframes barGrow {
          0% { width: 0; }
        }
        @keyframes jackpotBadgePulse {
          0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 30px ${COLORS.gold}, 0 5px 20px rgba(0,0,0,0.5); }
          50% { transform: translateX(-50%) scale(1.05); box-shadow: 0 0 50px ${COLORS.gold}, 0 8px 30px rgba(0,0,0,0.5); }
        }
        @keyframes winSymbolUltra {
          0%, 100% { transform: scale(1.1) rotateY(0deg); filter: brightness(1.2); }
          25% { transform: scale(1.15) rotateY(5deg); filter: brightness(1.5); }
          50% { transform: scale(1.2) rotateY(0deg); filter: brightness(1.8); }
          75% { transform: scale(1.15) rotateY(-5deg); filter: brightness(1.5); }
        }
        @keyframes marqueeSweep {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes chaseLights {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 15px currentColor; }
        }
        @keyframes titlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes neonFlicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.9; }
          97% { opacity: 1; }
        }
        @keyframes winNumberPop {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes winLabelFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; color: #fff; }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes paylinePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px ${COLORS.gold}; }
          50% { transform: scale(1.1); box-shadow: 0 0 30px ${COLORS.gold}; }
        }
        @keyframes spinButtonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes ledPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; box-shadow: 0 0 15px currentColor; }
        }
        @keyframes holoShimmer {
          0% { background-position: -200% -200%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes holoShimmerSlow {
          0%, 100% { background-position: 0% 0%; opacity: 0.3; }
          50% { background-position: 100% 100%; opacity: 0.6; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, -3px) rotate(-0.5deg); }
          20% { transform: translate(5px, 2px) rotate(0.5deg); }
          30% { transform: translate(-4px, 4px) rotate(-0.3deg); }
          40% { transform: translate(4px, -2px) rotate(0.3deg); }
          50% { transform: translate(-3px, 3px) rotate(-0.2deg); }
          60% { transform: translate(3px, -3px) rotate(0.2deg); }
          70% { transform: translate(-2px, 2px) rotate(-0.1deg); }
          80% { transform: translate(2px, -1px) rotate(0.1deg); }
          90% { transform: translate(-1px, 1px) rotate(0deg); }
        }
        @keyframes coinFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes lightRays {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes winLineUltra {
          0%, 100% {
            height: 6px;
            box-shadow: 0 0 40px ${COLORS.gold}, 0 0 80px ${COLORS.gold};
          }
          50% {
            height: 10px;
            box-shadow: 0 0 60px ${COLORS.gold}, 0 0 120px ${COLORS.gold}, 0 0 160px ${COLORS.gold};
          }
        }
        @keyframes jackpotRevealUltra {
          0% {
            transform: translateX(-50%) scale(0.3) rotateX(90deg);
            opacity: 0;
            filter: blur(20px);
          }
          50% {
            transform: translateX(-50%) scale(1.2) rotateX(-10deg);
            filter: blur(0);
          }
          70% {
            transform: translateX(-50%) scale(0.95) rotateX(5deg);
          }
          100% {
            transform: translateX(-50%) scale(1) rotateX(0deg);
            opacity: 1;
          }
        }
        @keyframes jackpotGlow {
          0% { opacity: 0; filter: blur(20px); }
          100% { opacity: 1; filter: blur(8px); }
        }
        @keyframes storyReveal {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(30px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        /* INTRO ANIMATIONS - Cinematic entrance */
        @keyframes scanLines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        @keyframes introLightSweep {
          0% {
            opacity: 0;
            transform: translateX(-50%) scaleY(0.5);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) scaleY(1.2);
          }
          100% {
            opacity: 0.8;
            transform: translateX(-50%) scaleY(1);
          }
        }
        @keyframes introTitlePulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.2);
          }
        }

        /* NEW WOW Intro Animations */
        @keyframes introGridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        @keyframes introLaserScan {
          0% {
            opacity: 1;
            clip-path: inset(0 100% 0 0);
          }
          50% {
            opacity: 1;
            clip-path: inset(0 0 0 0);
          }
          100% {
            opacity: 0;
            clip-path: inset(0 0 0 100%);
          }
        }

        @keyframes introVerticalLaser {
          0% {
            opacity: 1;
            clip-path: inset(100% 0 0 0);
          }
          50% {
            opacity: 1;
            clip-path: inset(0 0 0 0);
          }
          100% {
            opacity: 0.3;
          }
        }

        @keyframes introLightRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes introParticleExplode {
          0% {
            transform: rotate(var(--angle)) translateX(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--angle)) translateX(var(--distance));
            opacity: 0;
          }
        }

        @keyframes introCornerSlide {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes introTitleGlitch {
          0%, 90%, 100% {
            transform: translateX(0);
            filter: brightness(1);
          }
          92% {
            transform: translateX(-3px);
            filter: brightness(1.3);
          }
          94% {
            transform: translateX(3px);
            filter: brightness(0.8);
          }
          96% {
            transform: translateX(-2px);
            filter: brightness(1.5);
          }
          98% {
            transform: translateX(2px);
            filter: brightness(1);
          }
        }

        @keyframes introGlitchRed {
          0%, 90%, 100% { transform: translateX(0); opacity: 0; }
          92% { transform: translateX(-5px); opacity: 0.7; }
          94% { transform: translateX(3px); opacity: 0.3; }
          96% { transform: translateX(-2px); opacity: 0.5; }
        }

        @keyframes introGlitchCyan {
          0%, 90%, 100% { transform: translateX(0); opacity: 0; }
          91% { transform: translateX(4px); opacity: 0.5; }
          93% { transform: translateX(-4px); opacity: 0.7; }
          95% { transform: translateX(2px); opacity: 0.3; }
        }

        @keyframes introLoadingText {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes introDotPulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.5;
          }
        }
        @keyframes machineReveal {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(50px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        /* ========================================
           ULTRA PREMIUM EFFECTS
           ======================================== */

        /* CRT Scanline Effect */
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        /* Item Hover Glow */
        @keyframes itemHoverGlow {
          0%, 100% { box-shadow: 0 0 20px var(--glow-color, ${primaryColor}40); }
          50% { box-shadow: 0 0 40px var(--glow-color, ${primaryColor}60), 0 0 60px var(--glow-color, ${primaryColor}30); }
        }

        /* Focus Trail Effect */
        @keyframes focusTrail {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        /* Typewriter Cursor Blink */
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Parallax Float */
        @keyframes parallaxFloat1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(1deg); }
          50% { transform: translate(-5px, -25px) rotate(-1deg); }
          75% { transform: translate(-15px, -10px) rotate(0.5deg); }
        }

        @keyframes parallaxFloat2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, 10px) rotate(-2deg); }
          66% { transform: translate(15px, -20px) rotate(1deg); }
        }

        @keyframes parallaxFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        /* Particle Burst on Select */
        @keyframes selectBurst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        /* Ripple Effect */
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* Electric Arc */
        @keyframes electricArc {
          0%, 100% { clip-path: polygon(0 45%, 20% 55%, 40% 45%, 60% 55%, 80% 45%, 100% 55%, 100% 100%, 0 100%); }
          25% { clip-path: polygon(0 55%, 20% 45%, 40% 55%, 60% 45%, 80% 55%, 100% 45%, 100% 100%, 0 100%); }
          50% { clip-path: polygon(0 48%, 25% 52%, 50% 48%, 75% 52%, 100% 48%, 100% 100%, 0 100%); }
          75% { clip-path: polygon(0 52%, 15% 48%, 35% 52%, 65% 48%, 85% 52%, 100% 48%, 100% 100%, 0 100%); }
        }

        /* Neon Pulse for Items */
        @keyframes neonItemPulse {
          0%, 100% {
            text-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
            filter: brightness(1);
          }
          50% {
            text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
            filter: brightness(1.2);
          }
        }

        /* Matrix Rain Background */
        @keyframes matrixFall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* Hologram Flicker */
        @keyframes holoFlicker {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          92% { opacity: 1; transform: scaleY(1); }
          93% { opacity: 0.8; transform: scaleY(0.98); }
          94% { opacity: 1; transform: scaleY(1); }
          96% { opacity: 0.9; transform: scaleY(0.99); }
          97% { opacity: 1; transform: scaleY(1); }
        }

        /* Glitch Text */
        @keyframes glitchText {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        /* Energy Charge */
        @keyframes energyCharge {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }

        /* Jackpot Mega Shake */
        @keyframes megaShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          10% { transform: translate(-8px, -5px) rotate(-1deg) scale(1.02); }
          20% { transform: translate(8px, 4px) rotate(1deg) scale(0.98); }
          30% { transform: translate(-6px, 6px) rotate(-0.5deg) scale(1.01); }
          40% { transform: translate(6px, -4px) rotate(0.5deg) scale(0.99); }
          50% { transform: translate(-4px, 4px) rotate(-0.3deg) scale(1.005); }
          60% { transform: translate(4px, -4px) rotate(0.3deg) scale(0.995); }
          70% { transform: translate(-3px, 3px) rotate(-0.2deg) scale(1); }
          80% { transform: translate(3px, -2px) rotate(0.2deg) scale(1); }
          90% { transform: translate(-1px, 1px) rotate(-0.1deg) scale(1); }
        }

        /* Rainbow Shift for Jackpot */
        @keyframes rainbowShift {
          0% { filter: hue-rotate(0deg) brightness(1.2); }
          100% { filter: hue-rotate(360deg) brightness(1.2); }
        }

        /* Beam Scan */
        @keyframes beamScan {
          0% { left: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }

        /* Star Twinkle */
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Floating Orb */
        @keyframes floatingOrb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          25% { transform: translate(20px, -30px) scale(1.1); opacity: 0.8; }
          50% { transform: translate(-10px, -50px) scale(0.9); opacity: 1; }
          75% { transform: translate(-30px, -20px) scale(1.05); opacity: 0.7; }
        }

        /* Timeline Dot Pulse for Experience */
        @keyframes timelineDotPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px #00ff88, 0 0 60px rgba(0,255,136,0.5); }
          50% { transform: scale(1.3); box-shadow: 0 0 40px #00ff88, 0 0 80px rgba(0,255,136,0.7); }
        }

        /* Shimmer Sweep for Projects */
        @keyframes shimmerSweep {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }

        /* Contact Button Glow */
        @keyframes contactGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,68,68,0.3), 0 8px 32px rgba(255,68,68,0.2); }
          50% { box-shadow: 0 0 40px rgba(255,68,68,0.5), 0 12px 48px rgba(255,68,68,0.35); }
        }

        /* Keyboard Hints Entry */
        @keyframes keyboardHintsEntry {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        /* Keyboard Hints Fade Out */
        @keyframes keyboardHintsFade {
          0% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        /* Mobile Swipe Hint Animation */
        @keyframes swipeHint {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        /* Data Stream */
        @keyframes dataStream {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }

        /* Hover Lift */
        .hover-lift {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px) scale(1.02);
        }

        /* Focus Glow Ring */
        .focus-ring {
          position: relative;
        }
        .focus-ring::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 2px solid transparent;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .focus-ring:focus::after,
        .focus-ring.focused::after {
          border-color: ${primaryColor};
          opacity: 1;
          animation: focusRingPulse 1.5s ease-in-out infinite;
        }

        @keyframes focusRingPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${primaryColor}40; }
          50% { box-shadow: 0 0 0 8px ${primaryColor}00; }
        }
      `}</style>
    </div>
  )
}
