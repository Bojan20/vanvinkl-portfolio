/**
 * SlotFullScreen - Interactive Portfolio Slot "Skill Reel" - REFACTORED
 *
 * PRODUCTION-READY ORCHESTRATOR (<800 LOC)
 * All components, configs, and utilities extracted to @/features/slot/*
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

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'

// Store imports
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
import { achievementStore } from '../store/achievements'

// Audio system
import { uaPlay, uaStop, uaVolume, uaGetVolume, uaPlaySynth } from '../audio'

// Feature module imports - ALL extracted components and utilities
import {
  // Types
  type SegmentReelConfig,
  // Configs
  SLOT_COLORS,
  SLOT_THEMES,
  getSegmentConfig,
  // Animations
  SkillReelColumn,
  CoinRain,
  ParticleBurst,
  WinSparkles,
  TypewriterText,
  RippleEffect,
  SelectBurst,
  ScreenShake,
  // UI Components
  GameMarquee,
  LEDDigit,
  WinCounter,
  SkillsDiscovered,
  PaylineIndicator,
  SpinButton,
  haptic,
  // Views
  SkillsView,
  ServicesView,
  AboutView,
  ProjectsView,
  ExperienceView,
  ContactView,
  // Portfolio
  PortfolioPlayer,
  // Detail Modal
  DetailModal,
  // Utils
  getItemCount,
  getGridColumns,
} from '../features/slot'

// GPU-accelerated color constants (from extracted configs)
const COLORS = SLOT_COLORS

// ============================================
// INFO PANEL COMPONENT (Bottom status bar)
// ============================================
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

      {/* Left: Skills Discovered */}
      <SkillsDiscovered
        count={skillsDiscovered}
        total={config.reels.reduce((sum, reel) => sum + reel.length, 0)}
        color={primaryColor}
      />

      {/* Center: Win Counter (jackpot badge) */}
      <WinCounter
        target={jackpot ? 777777 : 0}
        active={jackpot}
        color={COLORS.gold}
      />

      {/* Right: Spin Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span style={{
          color: '#666',
          fontSize: '13px',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>SPINS</span>
        <LEDDigit value={spinCount.toString().padStart(3, '0')} color={primaryColor} size={32} />
      </div>
    </div>
  )
})

// ============================================
// CONTENT VIEW ROUTER (Routes to extracted views)
// ============================================
function ContentView({ section, focusIndex, selectedProject, onBackFromProject }: {
  section: SlotSection
  focusIndex: number
  selectedProject?: { icon: string, title: string, description: string, year: string, tags: string[], videoPath?: string, musicPath?: string, sfxPath?: string } | null
  onBackFromProject?: () => void
}) {
  // Show portfolio player if project selected
  if (selectedProject && onBackFromProject) {
    console.log('[ContentView] Rendering PortfolioPlayer with project:', selectedProject.title)
    return <PortfolioPlayer project={selectedProject} onBack={onBackFromProject} />
  }

  console.log('[ContentView] Rendering section view:', section.type)

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
// MAIN COMPONENT - SLOT FULL SCREEN
// ============================================
export function SlotFullScreen({
  machineId,
  onClose
}: {
  machineId: string
  onClose: () => void
  onNavigate?: (id: string) => void
}) {
  // ========== STATE ==========
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
  const [selectedProject, setSelectedProject] = useState<{ icon: string, title: string, description: string, year: string, tags: string[], videoPath?: string, musicPath?: string, sfxPath?: string } | null>(null)

  // Touch/swipe state
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Music fade RAF tracking (cancellable)
  const fadeRafRef = useRef<number | null>(null)

  // ========== DERIVED STATE ==========
  const section = SLOT_CONTENT[machineId]
  const theme = SLOT_THEMES[machineId] || SLOT_THEMES.skills
  const primaryColor = section?.color || '#00ffff'
  const segmentConfig = getSegmentConfig(machineId)

  // ========== SPIN LOGIC ==========
  const generateSpinResult = useCallback(() => {
    // JACKPOT ONLY FOR "ABOUT" SECTION - creates special celebration effect
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

  const [targetIndices, setTargetIndices] = useState(() => generateSpinResult())

  const handleSpin = useCallback(() => {
    if (phase === 'spinning') return

    setForceStop(false) // Reset force stop for new spin
    setPhase('spinning')
    setSpinCount(prev => prev + 1)
    setTargetIndices(generateSpinResult())
    haptic.spin() // Haptic feedback on spin start
    achievementStore.trackSpin() // Track for achievements
  }, [phase, generateSpinResult])

  const handleReelStop = useCallback((reelIndex: number) => {
    // Slightly different volume for each reel for realism
    const volumes = [0.5, 0.55, 0.6, 0.55, 0.65]
    uaPlaySynth('reelStop', volumes[reelIndex] || 0.6)
  }, [])

  // ========== EFFECTS ==========

  // INTRO SEQUENCE - Cinematic entrance animation
  useEffect(() => {
    if (phase === 'intro') {
      const t1 = setTimeout(() => setIntroStep(1), 200)
      const t2 = setTimeout(() => setIntroStep(2), 600)
      const t3 = setTimeout(() => setIntroStep(3), 1000)
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

  // Auto-transition to result after all reels stop
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
  }, [phase, targetIndices, segmentConfig, isJackpot, section])

  // Reset focus when entering content phase
  useEffect(() => {
    if (phase === 'content') {
      setFocusIndex(0) // Start with first item focused
    }
  }, [phase])

  // Lounge music fade when entering/exiting portfolio video
  // ULTIMATIVNO: RAF-based, cancellable, 1000ms fade TO ZERO
  useEffect(() => {
    // Cancel any ongoing fade (prevents conflicts when rapidly entering/exiting)
    if (fadeRafRef.current !== null) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
      console.log('[Music Fade] Cancelled previous fade')
    }

    if (selectedProject) {
      // Video opened → Fade OUT lounge music (1000ms → 0 volume)
      const startVolume = uaGetVolume('music')
      const startTime = Date.now()
      const fadeDuration = 1000

      console.log(`[Music Fade] Video OPENED → OUT from ${startVolume.toFixed(3)} to 0.000`)

      const fadeOut = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / fadeDuration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
        const vol = startVolume * (1 - eased)
        uaVolume('music', Math.max(0, vol), 0)

        if (progress < 1) {
          fadeRafRef.current = requestAnimationFrame(fadeOut)
        } else {
          fadeRafRef.current = null
          // STOP lounge completely after fade (free resources)
          uaStop('lounge', 0)
          console.log('[Music] Fade OUT complete → Lounge STOPPED')
        }
      }
      fadeRafRef.current = requestAnimationFrame(fadeOut)

    } else {
      // Video closed → Fade IN lounge music (1000ms → 0.5 volume)
      // ONLY if music is actually muted (< 0.1)
      const currentVol = uaGetVolume('music')

      // Always restart lounge when exiting video
      if (currentVol < 0.1) {
        console.log('[Music] Video closed → RESTART lounge + Fade IN to 0.5')

        // Restart lounge music
        uaPlay('lounge')

        // Fade in after short delay (let lounge start)
        setTimeout(() => {
          const startTime = Date.now()
          const fadeDuration = 1000

          const fadeIn = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / fadeDuration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const vol = 0.5 * eased // Start from 0 → 0.5
            uaVolume('music', vol, 0)

            if (progress < 1) {
              fadeRafRef.current = requestAnimationFrame(fadeIn)
            } else {
              fadeRafRef.current = null
              console.log('[Music] Fade IN complete → Lounge at 0.5')
            }
          }
          fadeRafRef.current = requestAnimationFrame(fadeIn)
        }, 50)
      }
    }

    // Cleanup: Cancel ongoing fade if selectedProject changes mid-animation
    return () => {
      if (fadeRafRef.current !== null) {
        cancelAnimationFrame(fadeRafRef.current)
        fadeRafRef.current = null
      }
    }
  }, [selectedProject])

  // Reel spin sound removed - only reel stop sounds remain

  // ========== EVENT HANDLERS ==========

  const handleActivate = useCallback((index: number) => {
    if (!section) return

    // Play UI click sound
    uaPlaySynth('click', 0.4)
    haptic.medium()
    markVisited(section.id, index)

    switch (section.type) {
      case 'skills': {
        const skill = (section as SkillsSection).categories[index]
        if (skill) setDetailItem({ type: 'skill', index, data: skill })
        break
      }
      case 'services': {
        const service = (section as ServicesSection).items[index]
        if (service) setDetailItem({ type: 'service', index, data: service })
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
    if (!touchStartRef.current || !section) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    const dt = Date.now() - touchStartRef.current.time

    // Swipe detection: minimum 50px, maximum 500ms
    if (Math.abs(dx) > 50 && dt < 500 && Math.abs(dx) > Math.abs(dy) * 2) {
      const itemCount = getItemCount(section)
      if (dx > 0) {
        // Swipe right
        haptic.light()
        uaPlaySynth('tick', 0.3)
        setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
      } else {
        // Swipe left
        haptic.light()
        uaPlaySynth('tick', 0.3)
        setFocusIndex(prev => (prev + 1) % itemCount)
      }
    }

    touchStartRef.current = null
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
          setForceStop(true)
          setTimeout(() => {
            setPhase('result')
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
            setTimeout(() => setForceStop(false), 100)
          }, 150)
        } else if (phase === 'intro' || phase === 'result') {
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
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => (prev + 1) % itemCount)
          break
        case 'ArrowLeft':
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          break
        case 'ArrowDown':
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
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
          uaPlaySynth('tick', 0.3)
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

  // ========== RENDER ==========
  return (
    <div
      id="main-content"
      role="main"
      aria-label={`${segmentConfig.title} slot machine`}
      aria-live={phase === 'spinning' ? 'polite' : 'off'}
      aria-busy={phase === 'spinning'}
      style={{
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
      cursor: 'default'
    }}>
      {/* ========== ULTRA PREMIUM BACKGROUND EFFECTS ========== */}

      {/* CRT Scanlines Overlay */}
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

      {/* CRT Vignette */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.35) 100%)',
        pointerEvents: 'none',
        zIndex: 9998,
        transform: 'translateZ(0)'
      }} />

      {/* Floating particles background - only during spinning/result */}
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

      {/* ESC hint - HIDDEN when video player active */}
      {!selectedProject && (
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
      )}

      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        width: '150vw', height: '150vh',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse, ${primaryColor}12 0%, ${primaryColor}05 30%, transparent 60%)`,
        pointerEvents: 'none',
        opacity: 1
      }} />

      {/* ========== SKILL REEL SLOT MACHINE ========== */}
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

            {/* Game Title Marquee */}
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

                {/* Reel labels at top */}
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
                height: '3px',
                background: `linear-gradient(90deg, transparent, ${primaryColor}60, ${primaryColor}, ${primaryColor}60, transparent)`,
                transform: 'translateY(-50%)',
                boxShadow: `0 0 20px ${primaryColor}`,
                pointerEvents: 'none',
                opacity: phase === 'result' ? 1 : 0.3
              }} />

              {/* Spin button */}
              <SpinButton
                spinning={phase === 'spinning'}
                onSpin={handleSpin}
                color={primaryColor}
              />
            </div>

            {/* Info Panel (bottom status bar) */}
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

            {/* ENTER prompt */}
            {phase === 'result' && (
              <div
                onClick={() => setPhase('content')}
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
                  <div style={{
                    fontSize: '16px',
                    color: '#888',
                    letterSpacing: '3px',
                    textTransform: 'uppercase'
                  }}>
                    or click to view details
                  </div>
                </div>
              </div>
            )}

            {/* Coin rain & particle burst */}
            <CoinRain active={isJackpot && phase === 'result'} />
            {isJackpot && phase === 'result' && <ParticleBurst color={COLORS.gold} />}
          </div>
        </ScreenShake>
      )}

      {/* ========== CONTENT PHASE - FULL SCREEN ========== */}
      {phase === 'content' && section && (
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '100%',
            height: '100%',
            overflow: selectedProject ? 'hidden' : 'auto',
            padding: selectedProject ? '0' : '60px 40px',
            animation: 'contentWowEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            touchAction: selectedProject ? 'none' : 'pan-y',
            cursor: 'pointer'
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

          {/* Corner accents */}
          {[
            { top: 0, left: 0, borderTop: true, borderLeft: true, delay: '0.3s' },
            { top: 0, right: 0, borderTop: true, borderRight: true, delay: '0.4s' },
            { bottom: 0, left: 0, borderBottom: true, borderLeft: true, delay: '0.5s' },
            { bottom: 0, right: 0, borderBottom: true, borderRight: true, delay: '0.6s' }
          ].map((corner, i) => (
            <div key={i} style={{
              position: 'fixed',
              ...(corner.top !== undefined && { top: 0 }),
              ...(corner.bottom !== undefined && { bottom: 0 }),
              ...(corner.left !== undefined && { left: 0 }),
              ...(corner.right !== undefined && { right: 0 }),
              width: '80px',
              height: '80px',
              ...(corner.borderTop && { borderTop: `2px solid ${primaryColor}60` }),
              ...(corner.borderBottom && { borderBottom: `2px solid ${primaryColor}60` }),
              ...(corner.borderLeft && { borderLeft: `2px solid ${primaryColor}60` }),
              ...(corner.borderRight && { borderRight: `2px solid ${primaryColor}60` }),
              animation: `contentCornerReveal 0.6s ease-out ${corner.delay} both`,
              pointerEvents: 'none',
              zIndex: 50
            }} />
          ))}

          {/* Title section with icon */}
          {!selectedProject && (
            <div style={{
              textAlign: 'center',
              marginBottom: '60px',
              animation: 'contentTitleDrop 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both'
            }}>
              <h1 style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: 900,
                color: primaryColor,
                textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}50`,
                letterSpacing: '12px',
                margin: '0 0 20px 0',
                animation: 'contentTitleGlow 2s ease-in-out infinite'
              }}>
                {section.type.toUpperCase()}
              </h1>
              <div style={{
                width: '200px',
                height: '3px',
                background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                margin: '0 auto 30px',
                animation: 'contentUnderlineExpand 0.8s ease-out 0.5s both',
                boxShadow: `0 0 15px ${primaryColor}`
              }} />
              <div style={{
                fontSize: '60px',
                animation: 'contentWowEntrance 0.8s ease-out 0.3s both',
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

          {/* Content */}
          <div style={{ animation: 'contentBodyReveal 0.8s ease-out 0.4s both' }}>
            <ContentView
              section={section}
              focusIndex={focusIndex}
              selectedProject={selectedProject}
              onBackFromProject={() => {
                console.log('[SlotFullScreen] onBackFromProject called, setting selectedProject to null')
                setSelectedProject(null)
              }}
            />
          </div>
        </div>
      )}

      {/* X Button removed - ESC key handles all exit scenarios */}

      {/* Detail Modal (only for non-projects sections) */}
      {detailItem && section?.type !== 'projects' && (
        <DetailModal
          item={detailItem}
          primaryColor={primaryColor}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px); opacity: 0.8; }
        }
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
        @keyframes lightRays {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes storyReveal {
          0% { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(20px); }
          100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes totalWinReveal {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          60% { transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes totalWinPulse {
          0%, 100% { box-shadow: 0 0 60px ${primaryColor}80, 0 0 120px ${primaryColor}40, inset 0 0 40px ${primaryColor}20; }
          50% { box-shadow: 0 0 80px ${primaryColor}ff, 0 0 160px ${primaryColor}60, inset 0 0 60px ${primaryColor}30; }
        }
        @keyframes contentWowEntrance {
          0% { opacity: 0; transform: scale(1.1) translateY(-30px); filter: blur(20px) brightness(2); }
          30% { opacity: 1; filter: blur(5px) brightness(1.5); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
        }
        @keyframes contentLightBurst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        @keyframes contentScanBeam {
          0% { top: 0; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes contentCornerReveal {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        @keyframes contentTitleDrop {
          0% { opacity: 0; transform: translateY(-100px) scale(0.5) rotateX(45deg); filter: blur(10px); }
          60% { transform: translateY(10px) scale(1.05) rotateX(-5deg); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0); }
        }
        @keyframes contentTitleGlow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 20px currentColor); }
          50% { filter: brightness(1.2) drop-shadow(0 0 40px currentColor); }
        }
        @keyframes contentUnderlineExpand {
          0% { width: 0; opacity: 0; }
          100% { width: 200px; opacity: 1; }
        }
        @keyframes contentBodyReveal {
          0% { opacity: 0; transform: translateY(50px) scale(0.95); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes contentHintFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
