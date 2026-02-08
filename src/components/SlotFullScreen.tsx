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

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'

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

// Audio system
import { uaPlay, uaStop, uaVolume, uaGetVolume, uaPlaySynth } from '../audio'
import { useAudioStore } from '../store/audio'

// Security utilities
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/security'

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
  WinSparkles as _WinSparkles,
  TypewriterText,
  RippleEffect as _RippleEffect,
  SelectBurst as _SelectBurst,
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
  AudioOnlyPlayer,
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
      padding: 'clamp(12px, 2.5vh, 25px) clamp(16px, 4vw, 40px)',
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
        gap: 'clamp(6px, 1.5vw, 16px)'
      }}>
        <span style={{
          color: '#999',
          fontSize: 'clamp(10px, 1.5vh, 13px)',
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
function ContentView({ section, focusIndex, selectedProject, onBackFromProject, onActivate }: {
  section: SlotSection
  focusIndex: number
  selectedProject?: { icon: string, title: string, description: string, year: string, tags: string[], videoPath?: string, posterPath?: string, musicPath?: string, sfxPath?: string, audioTracks?: { label: string, path: string }[] } | null
  onBackFromProject?: () => void
  onActivate?: (index: number) => void
}) {
  // Show portfolio player if project selected (video projects only)
  // Audio-only projects are rendered outside contentBodyReveal wrapper in SlotFullScreen
  // because CSS filter:blur() on the animation creates a containing block that breaks position:fixed
  if (selectedProject && onBackFromProject) {
    if (selectedProject.videoPath) {
      console.log('[ContentView] Rendering PortfolioPlayer with project:', selectedProject.title)
      return <PortfolioPlayer project={selectedProject} onBack={onBackFromProject} />
    }
    // Audio-only: return null, rendered separately in SlotFullScreen
    if (selectedProject.audioTracks?.length) {
      return null
    }
  }

  console.log('[ContentView] Rendering section view:', section.type)

  switch (section.type) {
    case 'skills': return <SkillsView section={section} focusIndex={focusIndex} onSelect={onActivate} />
    case 'services': return <ServicesView section={section} focusIndex={focusIndex} onSelect={onActivate} />
    case 'about': return <AboutView section={section} focusIndex={focusIndex} onSelect={onActivate} />
    case 'projects': return <ProjectsView section={section} focusIndex={focusIndex} onSelect={onActivate} />
    case 'experience': return <ExperienceView section={section} focusIndex={focusIndex} onSelect={onActivate} />
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
  const [_currentIndices, setCurrentIndices] = useState([0, 0, 0, 0, 0])
  const [isJackpot, setIsJackpot] = useState(false)
  const [jackpotStory, setJackpotStory] = useState<{ story: string, highlight: string } | undefined>()
  const [forceStop, setForceStop] = useState(false)
  const [inspectMode, setInspectMode] = useState(false)
  const [introStep, setIntroStep] = useState(0) // 0: black, 1: lights, 2: machine, 3: ready
  const [detailItem, setDetailItem] = useState<{ type: string, index: number, data: unknown } | null>(null)
  const [selectedProject, setSelectedProject] = useState<{ icon: string, title: string, description: string, year: string, tags: string[], videoPath?: string, posterPath?: string, musicPath?: string, sfxPath?: string, audioTracks?: { label: string, path: string }[] } | null>(null)

  // Content onboarding hint - show once per visit session
  const [showContentHint, setShowContentHint] = useState(() => {
    return safeGetLocalStorage('vanvinkl-content-hint') !== 'true'
  })

  // Touch/swipe state
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  // Ref mirror for selectedProject — avoids stale closure in touch handlers
  const selectedProjectRef = useRef(selectedProject)
  selectedProjectRef.current = selectedProject

  // Music fade RAF tracking (cancellable)
  const fadeRafRef = useRef<number | null>(null)

  // Stable random values for floating particles + keyframe animation (avoid re-render jitter)
  const particleRng = useMemo(() => {
    const count = 20 // max particle count
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      w: 2 + Math.random() * 4,
      h: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5
    }))
  }, [])
  const keyframeRng = useMemo(() => ({
    tx: Math.random() * 40 - 20,
    ty: Math.random() * 40 - 20
  }), [])

  // ========== DERIVED STATE ==========
  const section = SLOT_CONTENT[machineId]
  const _theme = SLOT_THEMES[machineId] || SLOT_THEMES.skills
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
      const totalSpinTime = 1000 + 4 * 180 + 350 // Last reel stop + decel/bounce + buffer (~2070ms)
      const timer = setTimeout(() => {
        setPhase('result')
        // Only haptic feedback - no win/jackpot sounds (reel sounds are enough)
        if (isJackpot) {
          haptic.jackpot()
        } else {
          haptic.success()
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

  // Inspect Mode + auto-transition: reels stop → 400ms settle → jump to content immediately
  useEffect(() => {
    if (phase === 'result') {
      const timer = setTimeout(() => {
        setInspectMode(true)
        setPhase('content')
        uaPlaySynth('select', 0.5)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setInspectMode(false)
    }
  }, [phase])

  // Reset focus when entering content phase
  useEffect(() => {
    if (phase === 'content') {
      setFocusIndex(0) // Start with first item focused
    }
  }, [phase])

  // CRITICAL: Focus main container for keyboard events
  // Focus on mount, phase change, and when video closes
  useEffect(() => {
    const focusContainer = () => {
      if (mainContainerRef.current && !selectedProject) {
        mainContainerRef.current.focus()
      }
    }
    // Immediate focus
    focusContainer()
    // Also after short delay for safety
    const timer = setTimeout(focusContainer, 50)
    return () => clearTimeout(timer)
  }, [phase, selectedProject, detailItem])

  // Expose selectedProject to App.tsx popstate handler via window flag
  // When video is active, popstate should NOT close the entire slot
  useEffect(() => {
    ;(window as any).__videoPlayerActive = !!selectedProject
    return () => { ;(window as any).__videoPlayerActive = false }
  }, [selectedProject])

  // Listen for slot:closeVideo from App.tsx popstate handler.
  // iOS Safari native back gesture fires popstate but never fires touch events,
  // so the PortfolioPlayer swipe handler can't catch it. App.tsx catches the
  // popstate and dispatches this event instead of closing the entire slot.
  useEffect(() => {
    const handleCloseVideo = () => {
      console.log('[SlotFullScreen] slot:closeVideo received, closing video player')
      setSelectedProject(null)
    }
    window.addEventListener('slot:closeVideo', handleCloseVideo)
    return () => window.removeEventListener('slot:closeVideo', handleCloseVideo)
  }, [])

  // Lounge music: instant stop on video open, RAF fade-in on video close
  useEffect(() => {
    // Cancel any ongoing fade (prevents conflicts when rapidly entering/exiting)
    if (fadeRafRef.current !== null) {
      cancelAnimationFrame(fadeRafRef.current)
      fadeRafRef.current = null
      console.log('[Music Fade] Cancelled previous fade')
    }

    if (selectedProject) {
      // Video opened → INSTANT stop lounge music (no fade — prevents overlap with portfolio audio)
      uaVolume('music', 0, 0) // Instant zero
      uaStop('lounge', 0)     // Free resources
      console.log('[Music] Video OPENED → Lounge STOPPED instantly')

    } else {
      // Video closed → Fade IN lounge music to stored volume
      // Read target volume from audio store (respects user's slider setting)
      const targetVolume = useAudioStore.getState().musicVolume
      const currentVol = uaGetVolume('music')

      // Always restart lounge when exiting video
      if (currentVol < 0.1) {
        console.log(`[Music] Video closed → RESTART lounge + Fade IN to ${targetVolume.toFixed(2)}`)

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
            const vol = targetVolume * eased // Fade to stored volume
            uaVolume('music', vol, 0)

            if (progress < 1) {
              fadeRafRef.current = requestAnimationFrame(fadeIn)
            } else {
              fadeRafRef.current = null
              console.log(`[Music] Fade IN complete → Lounge at ${targetVolume.toFixed(2)}`)
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

  // Content hint auto-dismiss after 6 seconds in content phase
  useEffect(() => {
    if (phase === 'content' && showContentHint) {
      const timer = setTimeout(() => {
        setShowContentHint(false)
        safeSetLocalStorage('vanvinkl-content-hint', 'true')
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [phase, showContentHint])

  // Reel spin sound removed - only reel stop sounds remain

  // ========== EVENT HANDLERS ==========

  const handleActivate = useCallback((index: number) => {
    if (!section) return

    haptic.medium()
    markVisited(section.id)

    switch (section.type) {
      case 'skills': {
        uaPlaySynth('click', 0.4)
        // Resolve flat skill index → category + skill within category
        const categories = (section as SkillsSection).categories
        let remaining = index
        for (const cat of categories) {
          if (remaining < cat.skills.length) {
            const s = cat.skills[remaining]
            if (s) setDetailItem({ type: 'skill', index, data: {
              name: s.name, level: s.level,
              category: cat.name, categoryColor: cat.color, categoryIcon: cat.icon
            }})
            break
          }
          remaining -= cat.skills.length
        }
        break
      }
      case 'services': {
        uaPlaySynth('click', 0.4)
        const service = (section as ServicesSection).items[index]
        if (service) setDetailItem({ type: 'service', index, data: service })
        break
      }
      case 'about': {
        uaPlaySynth('click', 0.4)
        const stat = (section as AboutSection).stats[index]
        if (stat) setDetailItem({ type: 'stat', index, data: { ...stat, bio: (stat as any).description || (section as AboutSection).bio } })
        break
      }
      case 'projects': {
        // No click synth — video/audio auto-plays, avoids double sound
        const proj = (section as ProjectsSection).featured[index]
        if (proj && (proj.videoPath || proj.audioTracks?.length)) {
          setSelectedProject({
            icon: proj.icon,
            title: proj.title,
            description: proj.description,
            year: proj.year,
            tags: proj.tags,
            videoPath: proj.videoPath,
            posterPath: proj.posterPath,
            musicPath: proj.musicPath,
            sfxPath: proj.sfxPath,
            audioTracks: proj.audioTracks
          })
          // Push history entry for video — back gesture/button pops this, not the slot entry
          history.pushState({ video: true, slot: machineId }, '')
        }
        break
      }
      case 'experience': {
        uaPlaySynth('click', 0.4)
        const exp = (section as ExperienceSection).timeline[index]
        if (exp) setDetailItem({ type: 'experience', index, data: exp })
        break
      }
      case 'contact': {
        uaPlaySynth('click', 0.4)
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

  // Touch/swipe for mobile — COMPLETELY UNREGISTERED when PortfolioPlayer/AudioOnlyPlayer is active.
  // When selectedProject is set, no swipe listener exists on SlotFullScreen at all.
  // PortfolioPlayer has its own swipe handler that calls onBack().
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    // Do NOT register swipe listener when video/audio player is active
    if (selectedProject) return

    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      const dt = Date.now() - touchStartRef.current.time

      if (Math.abs(dx) > 60 && dt < 500 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) {
          haptic.light()
          uaPlaySynth('back', 0.4)
          onCloseRef.current()
        }
      }

      touchStartRef.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [phase, selectedProject]) // re-register when phase changes OR selectedProject changes

  // Keyboard navigation - UNIFIED handler for all phases
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // SKIP if video player is active - PortfolioPlayer handles its own keyboard
      if (selectedProject) return

      const key = e.key

      // ========== ESC - Universal close ==========
      if (key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (detailItem) {
          setDetailItem(null)
        } else {
          onClose()
        }
        return
      }

      // ========== SPACE - Spinning control ==========
      if (key === ' ') {
        e.preventDefault()
        e.stopPropagation()
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
        } else if (phase === 'result') {
          // SPACE in result = new spin
          handleSpin()
        }
        return
      }

      // ========== ENTER - Phase transitions ==========
      if (key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()

        if (phase === 'result') {
          // Result → Content
          setPhase('content')
          uaPlaySynth('select', 0.5)
        } else if (phase === 'content' && section) {
          // Content → Activate selected item
          if (focusIndex >= 0) {
            haptic.medium()
            handleActivate(focusIndex)
          } else {
            setFocusIndex(0)
          }
        }
        return
      }

      // ========== ARROWS - Content navigation with full wrap-around ==========
      if (phase === 'content' && section) {
        const itemCount = getItemCount(section)
        const columns = getGridColumns(section)

        if (key === 'ArrowRight') {
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => (prev + 1) % itemCount)
        } else if (key === 'ArrowLeft') {
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
        } else if (key === 'ArrowDown') {
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => {
            const next = prev + columns
            // Wrap around: if past end, go to same column position at top
            return next < itemCount ? next : prev % columns
          })
        } else if (key === 'ArrowUp') {
          e.preventDefault()
          haptic.light()
          uaPlaySynth('tick', 0.3)
          setFocusIndex(prev => {
            const next = prev - columns
            if (next >= 0) return next
            // Wrap around: go to same column position at bottom
            const col = prev % columns
            const lastRowStart = Math.floor((itemCount - 1) / columns) * columns
            const target = lastRowStart + col
            return target < itemCount ? target : target - columns
          })
        }
      }
    }

    // Use capture phase to intercept before any child elements
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose, phase, section, focusIndex, handleActivate, handleSpin, detailItem, segmentConfig, targetIndices, selectedProject])

  // Click handler to refocus container (ensures keyboard works after clicking)
  const handleContainerClick = useCallback(() => {
    if (!selectedProject && mainContainerRef.current) {
      mainContainerRef.current.focus()
    }
  }, [selectedProject])

  // ========== RENDER ==========
  return (
    <div
      ref={mainContainerRef}
      tabIndex={0}
      id="main-content"
      role="main"
      aria-label={`${segmentConfig.title} slot machine`}
      aria-live={phase === 'spinning' ? 'polite' : 'off'}
      aria-busy={phase === 'spinning'}
      onClick={handleContainerClick}
      style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      background: phase === 'intro' && introStep === 0
        ? '#000000'
        : 'linear-gradient(180deg, #03020a 0%, #08061a 30%, #0a0820 50%, #08061a 70%, #03020a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'hidden',
      transition: 'background 0.5s ease',
      animation: isJackpot && phase === 'result' ? 'megaShake 0.5s ease-in-out' : 'none',
      cursor: 'default',
      outline: 'none',
      willChange: 'transform',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      transform: 'translateZ(0)'
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
          {particleRng.slice(0, window.matchMedia('(pointer: coarse)').matches ? 8 : 20).map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.w}px`,
              height: `${p.h}px`,
              borderRadius: '50%',
              background: i % 3 === 0 ? primaryColor : i % 3 === 1 ? COLORS.gold : COLORS.magenta,
              opacity: p.opacity,
              animation: `floatParticle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`
            }} />
          ))}
        </div>
      )}


      {/* Content navigation hint - desktop only (no keyboard on touch devices) */}
      {phase === 'content' && showContentHint && !selectedProject && !window.matchMedia('(pointer: coarse)').matches && (
        <div
          className="content-hint"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 24px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${primaryColor}40`,
            color: 'rgba(255,255,255,0.9)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1001,
            animation: 'contentHintFade 0.4s ease-out',
            boxShadow: `0 4px 30px rgba(0,0,0,0.5), 0 0 20px ${primaryColor}20`
          }}
          onClick={() => {
            setShowContentHint(false)
            safeSetLocalStorage('vanvinkl-content-hint', 'true')
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{
              padding: '4px 8px',
              background: `${primaryColor}20`,
              borderRadius: '4px',
              border: `1px solid ${primaryColor}50`,
              fontSize: '11px',
              color: primaryColor,
              fontFamily: 'monospace'
            }}>←↑↓→</kbd>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Navigate</span>
          </span>
          <span style={{ color: `${primaryColor}60` }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{
              padding: '4px 8px',
              background: `${primaryColor}20`,
              borderRadius: '4px',
              border: `1px solid ${primaryColor}50`,
              fontSize: '11px',
              color: primaryColor,
              fontFamily: 'monospace'
            }}>ENTER</kbd>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Select</span>
          </span>
          <span style={{ color: `${primaryColor}60` }}>•</span>
          <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            cursor: 'pointer'
          }}>Click to dismiss</span>
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
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#060414',
            overflow: 'hidden',
            border: `2px solid ${primaryColor}30`,
            transform: inspectMode ? 'scale(0.97) translateZ(0)' : 'translateZ(0)',
            transition: inspectMode ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            willChange: 'transform',
            containIntrinsicSize: 'auto',
            contain: 'layout style paint'
          } as React.CSSProperties}>
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

            {/* Jackpot Story with Typewriter Effect - hidden for About section */}
            {phase === 'result' && isJackpot && jackpotStory && machineId !== 'about' && (
              <div style={{
                position: 'absolute',
                bottom: '250px',
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
                  bottom: '140px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  animation: 'totalWinReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
                  zIndex: 200,
                  cursor: 'pointer'
                }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vh, 12px)',
                  padding: 'clamp(14px, 3vh, 24px) clamp(20px, 5vw, 40px)',
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,10,30,0.95))',
                  borderRadius: '20px',
                  border: `4px solid ${primaryColor}`,
                  boxShadow: `0 0 30px ${primaryColor}60, 0 0 60px ${primaryColor}20`,
                  animation: 'totalWinPulse 2s ease-in-out infinite'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span style={{
                      padding: 'clamp(8px, 1.5vh, 12px) clamp(14px, 3vw, 24px)',
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                      borderRadius: '12px',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: 'clamp(14px, 3vw, 22px)',
                      letterSpacing: 'clamp(1px, 0.5vw, 3px)',
                      boxShadow: `0 0 30px ${primaryColor}80`,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {window.matchMedia('(pointer: coarse)').matches ? 'TAP HERE' : 'PRESS ENTER'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2vw, 16px)',
                    color: '#888',
                    letterSpacing: 'clamp(1px, 0.5vw, 3px)',
                    textTransform: 'uppercase'
                  }}>
                    to view details
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
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            padding: selectedProject ? '0' : (window.matchMedia('(pointer: coarse)').matches ? 'clamp(8px, 1.5vh, 16px) clamp(8px, 2vw, 16px)' : 'clamp(16px, 3vh, 40px) clamp(12px, 3vw, 40px)'),
            animation: 'contentWowEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            touchAction: selectedProject ? 'none' : 'pan-y',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column' as const,
            willChange: 'transform',
            transform: 'translateZ(0)'
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
          {!selectedProject && (() => {
            const isTouch = window.matchMedia('(pointer: coarse)').matches
            return (
            <div style={{
              textAlign: 'center',
              marginBottom: isTouch ? 'clamp(4px, 0.8vh, 8px)' : 'clamp(12px, 2vh, 30px)',
              animation: 'contentTitleDrop 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
              flexShrink: 0
            }}>
              <h1 style={{
                fontSize: isTouch ? 'clamp(18px, 4vw, 28px)' : 'clamp(24px, 5vw, 48px)',
                fontWeight: 900,
                color: primaryColor,
                textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}50`,
                letterSpacing: isTouch ? 'clamp(1px, 0.8vw, 4px)' : '8px',
                margin: isTouch ? '0 0 2px 0' : '0 0 8px 0',
                animation: 'contentTitleGlow 2s ease-in-out infinite'
              }}>
                {section.type.toUpperCase()}
              </h1>
              <div style={{
                width: isTouch ? '60px' : '120px',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                margin: isTouch ? '0 auto 2px' : '0 auto 8px',
                animation: 'contentUnderlineExpand 0.8s ease-out 0.5s both',
                boxShadow: `0 0 15px ${primaryColor}`
              }} />
              {section.type === 'about' ? (
                <div style={{
                  fontSize: isTouch ? 'clamp(14px, 2.5vw, 20px)' : 'clamp(20px, 3vw, 32px)',
                  animation: 'contentWowEntrance 0.8s ease-out 0.3s both',
                  color: primaryColor,
                  fontWeight: 600,
                  letterSpacing: isTouch ? '1px' : '3px',
                  opacity: 0.9,
                  textShadow: `0 0 20px ${primaryColor}50`
                }}>
                  BOJAN PETKOVIC
                </div>
              ) : (
                <div style={{
                  fontSize: isTouch ? 'clamp(16px, 4vw, 22px)' : '32px',
                  animation: 'contentWowEntrance 0.8s ease-out 0.3s both',
                  filter: `drop-shadow(0 0 20px ${primaryColor}50)`,
                  opacity: 0.8
                }}>
                  {section.type === 'skills' ? '⚡' :
                   section.type === 'services' ? '🎯' :
                   section.type === 'projects' ? '🚀' :
                   section.type === 'experience' ? '📈' :
                   section.type === 'contact' ? '💬' : '✨'}
                </div>
              )}
            </div>
            )
          })()}

          {/* Content */}
          <div style={{ animation: 'contentBodyReveal 0.8s ease-out 0.4s both', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ContentView
              section={section}
              focusIndex={focusIndex}
              selectedProject={selectedProject}
              onBackFromProject={() => {
                console.log('[SlotFullScreen] onBackFromProject → history.back()')
                history.back()
              }}
              onActivate={handleActivate}
            />
          </div>

          {/* Audio-only player rendered OUTSIDE contentBodyReveal to avoid filter:blur breaking position:fixed */}
          {selectedProject && !selectedProject.videoPath && selectedProject.audioTracks?.length && (
            <AudioOnlyPlayer
              project={selectedProject as any}
              onBack={() => {
                console.log('[SlotFullScreen] AudioOnlyPlayer onBack → history.back()')
                history.back()
              }}
            />
          )}

          {/* Mobile back button - top left */}
          {!selectedProject && window.matchMedia('(pointer: coarse)').matches && (
            <div
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                position: 'fixed',
                top: 'max(12px, env(safe-area-inset-top, 0px))',
                left: 'max(12px, env(safe-area-inset-left, 0px))',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.75)',
                border: `1px solid ${primaryColor}50`,
                color: primaryColor,
                fontSize: '13px',
                fontWeight: 600,
                zIndex: 1001,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                animation: 'fadeSlideIn 0.5s ease-out 0.5s both',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ← BACK
            </div>
          )}

          {/* Controls hint - top left (desktop only - keyboard controls) */}
          {!selectedProject && !window.matchMedia('(pointer: coarse)').matches && (
            <div style={{
              position: 'fixed',
              top: '64px',
              left: '20px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${primaryColor}30`,
              color: '#888',
              fontSize: '11px',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              zIndex: 100,
              pointerEvents: 'none',
              animation: 'fadeSlideIn 0.5s ease-out 1s both'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: primaryColor, fontSize: '10px', letterSpacing: '1px' }}>CONTROLS</div>
              <div>←↑↓→ Navigate</div>
              <div>ENTER Select</div>
            </div>
          )}
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
          50% { transform: translate(${keyframeRng.tx}px, ${keyframeRng.ty}px); opacity: 0.8; }
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
