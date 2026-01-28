/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback, useEffect, useRef, lazy } from 'react'
import { CasinoScene } from './components/CasinoScene'
// MagicCursor removed - particle trail now follows avatar instead

// Inline mobile detection (avoid importing MobileControls module)
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// Lazy load components (reduce initial bundle - load on demand)
const SlotFullScreen = lazy(() => import('./components/SlotFullScreen').then(m => ({ default: m.SlotFullScreen })))
const IntroCamera = lazy(() => import('./components/IntroSequence').then(m => ({ default: m.IntroCamera })))
const IntroOverlay = lazy(() => import('./components/IntroSequence').then(m => ({ default: m.IntroOverlay })))
const MobileControls = lazy(() => import('./components/MobileControls').then(m => ({ default: m.MobileControls })))
const AudioVolumeSync = lazy(() => import('./components/AudioVolumeSync').then(m => ({ default: m.AudioVolumeSync })))
import {
  WebGLErrorBoundary,
  ContextLostOverlay,
  WebGLNotSupported,
  isWebGLSupported
} from './components/WebGLErrorBoundary'
import { gameRefs } from './store'
// Unified Audio System (NEW API)
import {
  initUnifiedAudio,
  uaPlay,
  uaMute,
  uaVolume,
  uaGetVolume,
  uaGetFrequencyData
} from './audio'
import { achievementStore, type Achievement } from './store/achievements'
import { trackSession } from './hooks/useAnalytics'
import { useQualityStore, initQualitySystem } from './store/quality'
import { FPSMonitor } from './utils/performance'
import { safeGetLocalStorage, safeSetLocalStorage } from './utils/security'


// Sound Toggle Button - persistent mute control
function SoundToggle() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = safeGetLocalStorage('vanvinkl-muted')
    return saved === 'true'
  })
  const [isHovered, setIsHovered] = useState(false)

  // Apply saved mute state on mount
  useEffect(() => {
    uaMute(isMuted) // Unified audio mute state
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev
      safeSetLocalStorage('vanvinkl-muted', String(newVal))
      uaMute(newVal) // Unified audio mute
      return newVal
    })
  }, [])

  // Listen for M key to sync state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        // Toggle mute and sync UI
        setIsMuted(prev => {
          const newVal = !prev
          safeSetLocalStorage('vanvinkl-muted', String(newVal))
          uaMute(newVal) // Unified audio mute
          return newVal
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={isMuted}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: isHovered
          ? 'rgba(0, 255, 255, 0.2)'
          : 'rgba(10, 10, 20, 0.8)',
        border: `2px solid ${isMuted ? 'rgba(255, 100, 100, 0.5)' : 'rgba(0, 255, 255, 0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        boxShadow: isHovered
          ? `0 0 20px ${isMuted ? 'rgba(255,100,100,0.3)' : 'rgba(0,255,255,0.3)'}`
          : 'none'
      }}
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        // Muted icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6666" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Sound on icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      )}
      {/* M key hint - left of speaker, red color for visibility */}
      <span style={{
        position: 'absolute',
        left: '-32px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
        fontWeight: 700,
        color: '#ff4444',
        textShadow: '0 0 10px rgba(255, 68, 68, 0.7)',
        letterSpacing: '1px'
      }}>M</span>
    </button>
  )
}

// Section Progress Ring - Shows exploration progress
function SectionProgressRing() {
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set())
  const totalSections = 6 // skills, services, about, projects, experience, contact

  // Load visited sections from localStorage (reads from vanvinkl-progress)
  useEffect(() => {
    const loadVisited = () => {
      try {
        const saved = safeGetLocalStorage('vanvinkl-progress')
        if (saved) {
          const progress = JSON.parse(saved)
          if (progress.visited && Array.isArray(progress.visited)) {
            setVisitedSections(new Set(progress.visited))
          }
        }
      } catch {}
    }
    loadVisited()

    // Listen for storage changes (cross-tab)
    const handleStorage = () => loadVisited()
    window.addEventListener('storage', handleStorage)

    // Poll less frequently - 5s instead of 1s (reduces CPU during intro)
    const interval = setInterval(loadVisited, 5000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const progress = visitedSections.size / totalSections
  const circumference = 2 * Math.PI * 18 // radius 18
  const strokeDashoffset = circumference * (1 - progress)

  // Section colors
  const sectionColors: Record<string, string> = {
    skills: '#00ffff',
    services: '#ff00aa',
    about: '#ffd700',
    projects: '#00ff88',
    experience: '#8844ff',
    contact: '#ff4444'
  }

  const allSections = ['skills', 'services', 'about', 'projects', 'experience', 'contact']

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(5, 5, 15, 0.85)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Progress Ring */}
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          {/* Progress arc */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffff" />
              <stop offset="50%" stopColor="#ff00aa" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center percentage */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '11px',
          fontWeight: 'bold',
          color: progress === 1 ? '#ffd700' : '#ffffff'
        }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Section indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', marginBottom: '2px' }}>
          EXPLORED
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {allSections.map(section => (
            <div
              key={section}
              title={section.charAt(0).toUpperCase() + section.slice(1)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: visitedSections.has(section)
                  ? sectionColors[section]
                  : 'rgba(255,255,255,0.15)',
                boxShadow: visitedSections.has(section)
                  ? `0 0 8px ${sectionColors[section]}`
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// FPS & Quality Indicator - Shows current performance (dev tool)
function FPSIndicator() {
  const { currentFPS, averageFPS, resolvedQuality, preset } = useQualityStore()

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '20px',
      padding: '8px 12px',
      background: 'rgba(5, 5, 15, 0.85)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      fontFamily: 'monospace',
      fontSize: '11px'
    }}>
      <div style={{ color: currentFPS < 50 ? '#ff4444' : currentFPS < 55 ? '#ffaa00' : '#00ff88' }}>
        FPS: {Math.round(currentFPS)}
      </div>
      <div style={{ color: '#00ffff', fontSize: '9px', marginTop: '2px' }}>
        Avg: {Math.round(averageFPS)}
      </div>
      <div style={{ color: '#8844ff', fontSize: '9px', marginTop: '2px' }}>
        Quality: {resolvedQuality.toUpperCase()}
      </div>
      {preset === 'auto' && (
        <div style={{ color: '#666', fontSize: '8px', marginTop: '2px' }}>
          (AUTO)
        </div>
      )}
    </div>
  )
}

// Spectrum Visualizer - Audio reactive bars (uses DSP frequency data)
// OPTIMIZED: Throttled to 20fps instead of 60fps
function SpectrumVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const lastDrawRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const barCount = 16
    const barWidth = 3
    const barGap = 2
    const maxHeight = 30
    const targetFps = 20 // Throttle to 20fps for performance
    const frameInterval = 1000 / targetFps

    // Pre-calculate bar colors to avoid HSL string creation every frame
    const barColors = Array.from({ length: barCount }, (_, i) => {
      const hue = 180 - (i / barCount) * 140
      return { hue, base: `hsl(${hue}, 80%, 50%)`, glow: `hsl(${hue}, 100%, 60%)` }
    })

    const draw = (timestamp: number) => {
      animationRef.current = requestAnimationFrame(draw)

      // Throttle to targetFps
      const elapsed = timestamp - lastDrawRef.current
      if (elapsed < frameInterval) return
      lastDrawRef.current = timestamp - (elapsed % frameInterval)

      // Get frequency data from unified audio system
      const data = uaGetFrequencyData()

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.shadowBlur = 0 // Reset shadow for performance

      if (data && data.length > 0) {
        const step = Math.max(1, Math.floor(data.length / barCount))

        for (let i = 0; i < barCount; i++) {
          const value = data[i * step] / 255
          const height = Math.max(2, value * maxHeight)

          ctx.fillStyle = barColors[i].base
          ctx.fillRect(
            i * (barWidth + barGap),
            maxHeight - height,
            barWidth,
            height
          )
        }
      } else {
        // Idle animation when no audio - simplified
        const now = timestamp / 500
        for (let i = 0; i < barCount; i++) {
          const idleHeight = 2 + Math.sin(now + i * 0.5) * 3
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'
          ctx.fillRect(
            i * (barWidth + barGap),
            maxHeight - idleHeight,
            barWidth,
            idleHeight
          )
        }
      }
    }

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      padding: '8px 12px',
      background: 'rgba(5, 5, 15, 0.85)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      zIndex: 100
    }}>
      <canvas
        ref={canvasRef}
        width={80}
        height={30}
        style={{ display: 'block' }}
      />
    </div>
  )
}

// Keyboard Shortcuts Help Modal
function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null

  const shortcuts = [
    { section: 'MOVEMENT', items: [
      { keys: ['↑', '←', '↓', '→'], desc: 'Move around' },
    ]},
    { section: 'INTERACTION', items: [
      { keys: ['SPACE'], desc: 'Interact / Spin' },
      { keys: ['ESC'], desc: 'Close / Back' },
    ]},
    { section: 'AUDIO', items: [
      { keys: ['M'], desc: 'Mute / Unmute' },
      { keys: ['A'], desc: 'Audio settings' },
    ]},
    { section: 'OTHER', items: [
      { keys: ['?'], desc: 'Show this help' },
    ]}
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'helpModalFadeIn 0.3s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0a0a12 0%, #12121a 100%)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '2px solid rgba(0, 255, 255, 0.2)',
          boxShadow: '0 0 60px rgba(0, 255, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'helpModalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #00ffff, #ff00aa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '3px'
          }}>
            KEYBOARD SHORTCUTS
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 100, 100, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ff6666',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcuts */}
        {shortcuts.map(section => (
          <div key={section.section} style={{ marginBottom: '24px' }}>
            <div style={{
              color: '#666',
              fontSize: '11px',
              letterSpacing: '3px',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              {section.section}
            </div>
            {section.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.keys.map(key => (
                    <span key={key} style={{
                      padding: '6px 12px',
                      background: 'rgba(0, 255, 255, 0.1)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      borderRadius: '6px',
                      color: '#00ffff',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      minWidth: '32px',
                      textAlign: 'center'
                    }}>
                      {key}
                    </span>
                  ))}
                </div>
                <span style={{ color: '#888', fontSize: '14px' }}>{item.desc}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Footer tip */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(136, 68, 255, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(136, 68, 255, 0.2)',
          textAlign: 'center',
          color: '#8844ff',
          fontSize: '13px'
        }}>
          Press <span style={{
            padding: '2px 8px',
            background: 'rgba(136, 68, 255, 0.2)',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>?</span> anytime to show this help
        </div>
      </div>

      <style>{`
        @keyframes helpModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes helpModalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Achievement Toast Notification
function AchievementToast({ achievement, onClose }: { achievement: Achievement | null, onClose: () => void }) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, rgba(136, 68, 255, 0.95), rgba(255, 0, 170, 0.95))',
      borderRadius: '16px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 15000,
      boxShadow: '0 10px 40px rgba(136, 68, 255, 0.4), 0 0 60px rgba(255, 0, 170, 0.2)',
      animation: 'achievementSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '40px',
        animation: 'achievementIconBounce 0.6s ease-out'
      }}>
        {achievement.icon}
      </div>

      {/* Content */}
      <div>
        <div style={{
          color: '#ffd700',
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '4px',
          textTransform: 'uppercase'
        }}>
          🏆 Achievement Unlocked!
        </div>
        <div style={{
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {achievement.title}
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          marginTop: '2px'
        }}>
          {achievement.description}
        </div>
      </div>

      <style>{`
        @keyframes achievementSlideIn {
          from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes achievementIconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

// Konami Code Easter Egg Component
function KonamiEasterEgg({ active, onComplete }: { active: boolean, onComplete: () => void }) {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(onComplete, 5000)
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  if (!active) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      animation: 'konamiFlash 0.2s ease-out'
    }}>
      {/* Rainbow text */}
      <div style={{
        fontSize: '64px',
        fontWeight: 900,
        background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8800ff, #ff0077)',
        backgroundSize: '400% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'konamiRainbow 2s linear infinite',
        marginBottom: '30px',
        textShadow: '0 0 50px rgba(255,255,255,0.5)'
      }}>
        🎮 KONAMI CODE! 🎮
      </div>

      {/* Secret message */}
      <div style={{
        color: '#00ffff',
        fontSize: '24px',
        textAlign: 'center',
        animation: 'konamiFadeIn 0.5s ease-out 0.3s both'
      }}>
        You found the secret!
      </div>
      <div style={{
        color: '#ff00aa',
        fontSize: '18px',
        marginTop: '20px',
        animation: 'konamiFadeIn 0.5s ease-out 0.6s both'
      }}>
        +30 Lives 🚀
      </div>

      {/* Floating emojis */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            bottom: '-50px',
            fontSize: `${20 + Math.random() * 30}px`,
            animation: `konamiFloat ${2 + Math.random() * 3}s ease-out ${Math.random() * 2}s forwards`
          }}
        >
          {['🎮', '⬆️', '⬇️', '⬅️', '➡️', '🅰️', '🅱️', '⭐', '🌟', '✨'][Math.floor(Math.random() * 10)]}
        </div>
      ))}

      <style>{`
        @keyframes konamiFlash {
          0% { background: white; }
          100% { background: rgba(0, 0, 0, 0.95); }
        }
        @keyframes konamiRainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
        @keyframes konamiFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes konamiFloat {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Custom hook for Konami code detection
function useKonamiCode(): [boolean, () => void] {
  const [konamiActive, setKonamiActive] = useState(false)
  const sequenceRef = useRef<string[]>([])
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sequenceRef.current.push(e.key)
      // Keep only last 10 keys
      if (sequenceRef.current.length > 10) {
        sequenceRef.current.shift()
      }
      // Check if sequence matches Konami code
      if (sequenceRef.current.join(',') === KONAMI.join(',')) {
        setKonamiActive(true)
        sequenceRef.current = []
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const reset = useCallback(() => setKonamiActive(false), [])
  return [konamiActive, reset]
}

// Loading screen component
function LoadingScreen() {
  return (
    <mesh>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial color="#0a0812" />
    </mesh>
  )
}

// Onboarding tooltip for first-time visitors
function OnboardingTooltip({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const tips = [
    { icon: '🎮', title: 'Move Around', text: 'Arrow keys to walk' },
    { icon: '🎰', title: 'Spin Slots', text: 'Press SPACE near a machine' },
    { icon: '🛋️', title: 'Sit & Relax', text: 'Press SPACE near a couch' },
    { icon: '❓', title: 'Need Help?', text: 'Press ? anytime for controls' }
  ]

  const handleNext = useCallback(() => {
    if (step < tips.length - 1) {
      setStep(s => s + 1)
    } else {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }
  }, [step, tips.length, onDismiss])

  const handleSkip = useCallback(() => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }, [onDismiss])

  // Keyboard: ENTER = next, ESC = skip all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handleSkip])

  if (!visible) return null

  const tip = tips[step]

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10, 10, 20, 0.95)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '24px 32px',
      zIndex: 9000,
      minWidth: '320px',
      boxShadow: '0 0 40px rgba(0, 255, 255, 0.2)',
      animation: 'tooltipSlideUp 0.3s ease-out'
    }}>
      {/* Progress dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {tips.map((_, i) => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i === step ? '#00ffff' : 'rgba(255,255,255,0.2)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      {/* Tip content */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tip.icon}</div>
        <div style={{
          color: '#00ffff',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>{tip.title}</div>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px'
        }}>{tip.text}</div>
      </div>

      {/* Keyboard hints */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '20px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <span><kbd style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          marginRight: '6px'
        }}>ESC</kbd> Skip all</span>
        <span><kbd style={{
          background: 'rgba(0,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: '4px',
          marginRight: '6px',
          color: '#00ffff'
        }}>ENTER</kbd> {step < tips.length - 1 ? 'Next' : 'Done'}</span>
      </div>

      <style>{`
        @keyframes tooltipSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Audio Settings - Opens with A key, controlled with arrow keys
function AudioSettings({ disabled, isOpen, setIsOpen }: {
  disabled?: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const [selected, setSelected] = useState<'music' | 'sfx'>('music')
  const [musicVol, setMusicVol] = useState(() => uaGetVolume('music'))
  const [sfxVol, setSfxVol] = useState(() => uaGetVolume('sfx'))

  // Note: Unified audio system handles all volumes via uaVolume()
  // SynthSounds now integrated, no separate setSynthVolume needed

  // Keyboard controls
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // A key toggles menu
      if (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey && !isOpen) {
        // Don't capture A if used for movement - only when not moving
        // Actually, let's use it regardless since it's a settings panel
        e.preventDefault()
        setIsOpen(true)
        return
      }

      // Only handle other keys when menu is open
      if (!isOpen) return

      const step = 0.05 // 5% per press

      switch (e.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault()
          setSelected(prev => prev === 'music' ? 'sfx' : 'music')
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (selected === 'music') {
            const newVal = Math.max(0, musicVol - step)
            setMusicVol(newVal)
            uaVolume('music', newVal)
          } else {
            const newVal = Math.max(0, sfxVol - step)
            setSfxVol(newVal)
            uaVolume('sfx', newVal) // Now controls both sfx AND ui bus
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (selected === 'music') {
            const newVal = Math.min(1, musicVol + step)
            setMusicVol(newVal)
            uaVolume('music', newVal)
          } else {
            const newVal = Math.min(1, sfxVol + step)
            setSfxVol(newVal)
            uaVolume('sfx', newVal) // Now controls both sfx AND ui bus
          }
          break

        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, isOpen, selected, musicVol, sfxVol])

  return (
    <>
      {/* Hint in controls bar - always visible */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: '1px solid rgba(136, 68, 255, 0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.3 : 1
      }}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{
          padding: '2px 8px',
          background: 'rgba(136, 68, 255, 0.2)',
          border: '1px solid rgba(136, 68, 255, 0.5)',
          borderRadius: '4px',
          color: '#8844ff',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          A
        </span>
        <span style={{ color: '#888899', fontSize: '11px' }}>AUDIO</span>
      </div>

      {/* Audio Settings Panel */}
      {isOpen && !disabled && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '20px',
          background: 'rgba(5, 5, 15, 0.95)',
          border: '1px solid rgba(136, 68, 255, 0.4)',
          borderRadius: '16px',
          padding: '16px 20px',
          backdropFilter: 'blur(12px)',
          zIndex: 200,
          minWidth: '220px',
          boxShadow: '0 0 40px rgba(136, 68, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
          animation: 'audioSettingsIn 0.2s ease-out',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8844ff" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span style={{
                color: '#8844ff',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>
                AUDIO
              </span>
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '9px',
              letterSpacing: '1px'
            }}>
              ESC TO CLOSE
            </span>
          </div>

          {/* Music Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              background: selected === 'music' ? 'rgba(255, 0, 170, 0.15)' : 'transparent',
              border: selected === 'music' ? '1px solid rgba(255, 0, 170, 0.4)' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{
              color: selected === 'music' ? '#ff00aa' : '#666',
              fontSize: '11px',
              letterSpacing: '1px',
              fontWeight: selected === 'music' ? 'bold' : 'normal'
            }}>
              MUSIC
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Volume bar */}
              <div style={{
                width: '80px',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${musicVol * 100}%`,
                  height: '100%',
                  background: selected === 'music'
                    ? 'linear-gradient(90deg, #ff00aa, #ff66cc)'
                    : 'rgba(255, 0, 170, 0.5)',
                  borderRadius: '3px',
                  transition: 'width 0.1s ease'
                }} />
              </div>
              <span style={{
                color: selected === 'music' ? '#ff00aa' : '#666',
                fontSize: '11px',
                fontFamily: 'monospace',
                minWidth: '32px',
                textAlign: 'right'
              }}>
                {Math.round(musicVol * 100)}%
              </span>
            </div>
          </div>

          {/* SFX Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              background: selected === 'sfx' ? 'rgba(0, 255, 255, 0.15)' : 'transparent',
              border: selected === 'sfx' ? '1px solid rgba(0, 255, 255, 0.4)' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{
              color: selected === 'sfx' ? '#00ffff' : '#666',
              fontSize: '11px',
              letterSpacing: '1px',
              fontWeight: selected === 'sfx' ? 'bold' : 'normal'
            }}>
              SFX
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Volume bar */}
              <div style={{
                width: '80px',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${sfxVol * 100}%`,
                  height: '100%',
                  background: selected === 'sfx'
                    ? 'linear-gradient(90deg, #00ffff, #66ffff)'
                    : 'rgba(0, 255, 255, 0.5)',
                  borderRadius: '3px',
                  transition: 'width 0.1s ease'
                }} />
              </div>
              <span style={{
                color: selected === 'sfx' ? '#00ffff' : '#666',
                fontSize: '11px',
                fontFamily: 'monospace',
                minWidth: '32px',
                textAlign: 'right'
              }}>
                {Math.round(sfxVol * 100)}%
              </span>
            </div>
          </div>

          {/* Controls hint */}
          <div style={{
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                color: '#666',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}>↑↓</span>
              <span style={{ color: '#555', fontSize: '9px' }}>SELECT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                color: '#666',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}>←→</span>
              <span style={{ color: '#555', fontSize: '9px' }}>ADJUST</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes audioSettingsIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// Keyboard Controls Hint - shows arrow keys at bottom center
function KeyboardControlsHint() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 18px',
      background: 'rgba(5, 5, 15, 0.75)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '20px',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Arrow keys display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{
          width: '22px',
          height: '22px',
          background: 'rgba(0, 255, 255, 0.15)',
          border: '1px solid rgba(0, 255, 255, 0.4)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ffff',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>↑</div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {['←', '↓', '→'].map(arrow => (
            <div key={arrow} style={{
              width: '22px',
              height: '22px',
              background: 'rgba(0, 255, 255, 0.15)',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00ffff',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>{arrow}</div>
          ))}
        </div>
      </div>

      <span style={{ color: '#888899', fontSize: '11px', marginLeft: '4px' }}>MOVE</span>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

      <div style={{
        padding: '6px 12px',
        background: 'rgba(136, 68, 255, 0.15)',
        border: '1px solid rgba(136, 68, 255, 0.4)',
        borderRadius: '6px',
        color: '#8844ff',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>SPACE</div>

      <span style={{ color: '#888899', fontSize: '11px' }}>ACTION</span>
    </div>
  )
}

// Click to Enter Splash - enables audio before intro starts
function ClickToEnterSplash({ onEnter }: { onEnter: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Preload critical assets before allowing entry
  useEffect(() => {
    let mounted = true
    const preloadAssets = async () => {
      // Simulate progressive loading with real asset preloading
      const stages = [
        // Stage 1: Preload fonts (10%)
        async () => {
          await document.fonts.ready
          if (mounted) setLoadProgress(10)
        },
        // Stage 2: Preload lounge music (40%)
        async () => {
          try {
            const response = await fetch('/audio/ambient/lounge.mp3')
            await response.arrayBuffer()
          } catch {}
          if (mounted) setLoadProgress(40)
        },
        // Stage 3: Preload Three.js core (60%)
        async () => {
          // Import Three.js to warm up the module
          await import('three')
          if (mounted) setLoadProgress(60)
        },
        // Stage 4: Preload React Three Fiber (80%)
        async () => {
          await import('@react-three/fiber')
          if (mounted) setLoadProgress(80)
        },
        // Stage 5: Final preparations (100%)
        async () => {
          // Small delay for GPU shader compilation to start
          await new Promise(r => setTimeout(r, 200))
          if (mounted) {
            setLoadProgress(100)
            // Brief pause before showing button
            setTimeout(() => {
              if (mounted) setIsLoaded(true)
            }, 300)
          }
        }
      ]

      for (const stage of stages) {
        await stage()
        if (!mounted) break
      }
    }

    preloadAssets()
    return () => { mounted = false }
  }, [])

  const handleEnter = useCallback(() => {
    if (isClicking || !isLoaded) return
    setIsClicking(true)
    onEnter()
  }, [isClicking, isLoaded, onEnter])

  // Listen for any key press (only when loaded)
  useEffect(() => {
    if (!isLoaded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleEnter()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleEnter, isLoaded])

  return (
    <div
      onClick={handleEnter}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0a0a14 0%, #050508 50%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50000,
        opacity: isClicking ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      {/* Glowing orb behind text */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(255,0,170,0.1) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'splashPulse 3s ease-in-out infinite',
        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.5s ease'
      }} />

      {/* VanVinkl logo text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '60px'
      }}>
        {/* VANVINKL - main title */}
        <div style={{
          fontSize: '48px',
          fontWeight: 900,
          letterSpacing: '12px',
          background: 'linear-gradient(90deg, #00ffff, #ff00aa, #00ffff)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'splashGradient 3s linear infinite',
          textShadow: '0 0 60px rgba(0, 255, 255, 0.5)',
          position: 'relative'
        }}>
          VANVINKL
          {/* Glitch layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'inherit',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'splashGlitch 2s infinite',
            opacity: 0.8
          }}>
            VANVINKL
          </div>
        </div>

        {/* STUDIO - below main title */}
        <div style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '16px',
          marginTop: '8px',
          color: '#00ffff',
          textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(136, 68, 255, 0.5)'
        }}>
          STUDIO
        </div>
      </div>

      {/* Click to Enter button area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Hexagon border effect - shows loading or enter button */}
        <div style={{
          padding: '24px 64px',
          background: isLoaded && isHovered
            ? 'rgba(0, 255, 255, 0.15)'
            : 'rgba(0, 255, 255, 0.05)',
          border: `2px solid ${isLoaded && isHovered ? '#00ffff' : 'rgba(0, 255, 255, 0.4)'}`,
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: isLoaded && isHovered
            ? '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 40px rgba(0, 255, 255, 0.1)'
            : '0 0 20px rgba(0, 255, 255, 0.2)',
          transform: isLoaded && isHovered ? 'scale(1.05)' : 'scale(1)',
          minWidth: '340px',
          cursor: isLoaded ? 'pointer' : 'default'
        }}>
          {/* Corner accents */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderColor: isLoaded ? '#ff00aa' : '#8844ff',
              borderStyle: 'solid',
              borderWidth: pos.includes('top') ? '2px 0 0 0' : '0 0 2px 0',
              ...(pos.includes('left') ? { left: '-1px', borderLeftWidth: '2px' } : { right: '-1px', borderRightWidth: '2px' }),
              ...(pos.includes('top') ? { top: '-1px' } : { bottom: '-1px' }),
              transition: 'border-color 0.3s ease'
            }} />
          ))}

          {/* Loading state */}
          {!isLoaded && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                color: '#8844ff',
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '4px',
                textTransform: 'uppercase'
              }}>
                LOADING
              </span>
              {/* Progress bar */}
              <div style={{
                width: '200px',
                height: '4px',
                background: 'rgba(136, 68, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${loadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8844ff, #00ffff)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(136, 68, 255, 0.5)'
                }} />
              </div>
              <span style={{
                color: 'rgba(136, 68, 255, 0.7)',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {loadProgress}%
              </span>
            </div>
          )}

          {/* Ready state */}
          {isLoaded && (
            <span style={{
              color: '#00ffff',
              fontSize: '20px',
              fontWeight: 'bold',
              letterSpacing: '6px',
              textTransform: 'uppercase',
              textShadow: isHovered ? '0 0 20px #00ffff' : 'none',
              animation: 'splashReady 0.5s ease-out'
            }}>
              PRESS ANY KEY TO ENTER
            </span>
          )}
        </div>

        {/* Sound hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '12px',
          letterSpacing: '2px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          <span>SOUND ON FOR BEST EXPERIENCE</span>
        </div>

        {/* CASINO LOUNGE - at the very bottom */}
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '6px',
          marginTop: '30px',
          color: '#ffd700',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)',
          opacity: 0.85
        }}>
          CASINO LOUNGE
        </div>
      </div>

      {/* Floating particles */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: i % 2 === 0 ? '#00ffff' : '#ff00aa',
            borderRadius: '50%',
            opacity: 0.3 + Math.random() * 0.4,
            animation: `splashFloat ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes splashGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes splashGlitch {
          0%, 90%, 100% { clip-path: inset(0); transform: translate(0); }
          92% { clip-path: inset(40% 0 30% 0); transform: translate(-3px, 0); }
          94% { clip-path: inset(10% 0 60% 0); transform: translate(3px, 0); }
          96% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 0); }
          98% { clip-path: inset(20% 0 50% 0); transform: translate(2px, 0); }
        }
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        @keyframes splashReady {
          0% { opacity: 0; transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export function App() {
  const [showSplash, setShowSplash] = useState(true) // Click to enter splash
  const [showIntro, setShowIntro] = useState(false) // Intro waits for splash
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [cameraComplete, setCameraComplete] = useState(false)
  const [spinningSlot, setSpinningSlot] = useState<string | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [konamiActive, resetKonami] = useKonamiCode()
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [isSitting, setIsSitting] = useState(false)
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false)

  // Onboarding - show only for first-time visitors
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return safeGetLocalStorage('vanvinkl-onboarded') !== 'true'
  })

  const handleOnboardingDismiss = useCallback(() => {
    setShowOnboarding(false)
    safeSetLocalStorage('vanvinkl-onboarded', 'true')
  }, [])

  // Track session on mount
  useEffect(() => {
    trackSession()
  }, [])

  // Initialize quality system - detect device tier
  useEffect(() => {
    initQualitySystem()
    console.log('[Quality] System initialized, device tier detected')
  }, [])

  // FPS Monitoring - adaptive quality adjustment
  useEffect(() => {
    const updateFPS = useQualityStore.getState().updateFPS
    const monitor = new FPSMonitor()
    monitor.start()

    // Update store every 500ms (balance between responsiveness and overhead)
    const interval = setInterval(() => {
      const fps = monitor.getFPS()
      updateFPS(fps)
    }, 500)

    return () => {
      clearInterval(interval)
      monitor.stop()
    }
  }, [])

  // Handle splash click - init audio and start intro
  const handleSplashEnter = useCallback(async () => {
    // Initialize Unified Audio System (single AudioContext - replaces legacy systems)
    await initUnifiedAudio()
    console.log('[Audio] Unified system initialized, starting lounge music...')

    // Always try to play music (mute state is handled by masterGain)
    uaPlay('lounge')

    // Check if user has permanently skipped intro (v2 key - forces intro reset)
    const introSkipped = safeGetLocalStorage('vanvinkl-intro-skipped-v2') === 'true'

    // Hide splash
    setShowSplash(false)

    if (introSkipped) {
      // User has already skipped intro before → go directly to lounge
      console.log('[Intro] Permanently skipped - going directly to lounge')
      setShowIntro(false)
    } else {
      // First time or hasn't skipped → show intro
      setShowIntro(true)
    }
  }, [])

  // Subscribe to achievement unlocks
  useEffect(() => {
    const unsubscribe = achievementStore.onUnlock((achievement) => {
      setUnlockedAchievement(achievement)
    })
    return unsubscribe
  }, [])

  // Track Konami code for achievement
  useEffect(() => {
    if (konamiActive) {
      achievementStore.trackKonami()
    }
  }, [konamiActive])

  // Mobile movement ref - updated by joystick
  const mobileMovementRef = useRef({ x: 0, y: 0 })

  // Check for mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Global keyboard shortcuts (? for help)
  // Note: M for mute is handled by SoundToggle component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? or / for help (Shift+/ = ?)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setShowHelp(prev => !prev)
      }
      // ESC closes help
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  // Check WebGL support
  if (!isWebGLSupported()) {
    return <WebGLNotSupported />
  }

  const handleSlotSpin = useCallback((machineId: string) => {
    setSpinningSlot(machineId)
  }, [])

  const handleIntroOverlayComplete = useCallback(() => {
    setOverlayComplete(true)
  }, [])

  const handleIntroCameraComplete = useCallback(() => {
    setCameraComplete(true)
  }, [])

  // End intro when BOTH camera and overlay are complete
  useEffect(() => {
    if (overlayComplete && cameraComplete) {
      setShowIntro(false)
    }
  }, [overlayComplete, cameraComplete])

  // Mobile joystick handler - directly updates gameRefs for zero latency
  const handleMobileMove = useCallback((x: number, y: number) => {
    mobileMovementRef.current.x = x
    mobileMovementRef.current.y = y
    // Update game refs directly - Avatar component reads these
    gameRefs.isMoving = x !== 0 || y !== 0
  }, [])

  // Mobile action button - simulates SPACE key
  const handleMobileAction = useCallback(() => {
    // Dispatch a synthetic keydown event for SPACE
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })
    window.dispatchEvent(event)
  }, [])

  // Context lost handler
  const handleContextLost = useCallback(() => {
    setContextLost(true)
  }, [])

  // Show context lost overlay
  if (contextLost) {
    return <ContextLostOverlay />
  }

  return (
    <WebGLErrorBoundary>
      {/* Global audio volume synchronization */}
      <AudioVolumeSync />

      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          precision: 'highp',
          failIfMajorPerformanceCaveat: false
        }}
        camera={{
          fov: 55,
          near: 0.5,
          far: 80,
          position: [0, 5, 18]
        }}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 200
        }}
        frameloop="always"
        flat
        onCreated={({ gl }) => {
          // Listen for context loss
          gl.domElement.addEventListener('webglcontextlost', handleContextLost)
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          {showIntro && (
            <IntroCamera
              onComplete={handleIntroCameraComplete}
              avatarSpawnPosition={[0, 0, 10]}
            />
          )}

          <CasinoScene
            onSlotSpin={handleSlotSpin}
            onSitChange={setIsSitting}
            introActive={showIntro}
            slotOpen={!!spinningSlot}
            audioSettingsOpen={audioSettingsOpen}
          />
        </Suspense>
      </Canvas>

      {/* No preloader - intro starts immediately */}

      {/* Sound Toggle - always visible after intro */}
      {!showIntro && <SoundToggle />}

      {/* Audio Settings - keyboard-controlled panel (A key to open) */}
      {!showIntro && <AudioSettings disabled={!!spinningSlot} isOpen={audioSettingsOpen} setIsOpen={setAudioSettingsOpen} />}


      {/* Section Progress Ring - shows exploration progress */}
      {!showIntro && !spinningSlot && !isMobile && (
        <SectionProgressRing />
      )}

      {/* Spectrum Visualizer - audio reactive bars */}
      {!showIntro && !spinningSlot && !isMobile && (
        <SpectrumVisualizer />
      )}

      {/* FPS & Quality Indicator - performance monitoring */}
      {!showIntro && !spinningSlot && !isMobile && (
        <FPSIndicator />
      )}

      {/* Keyboard Controls Hint - arrow keys + space at bottom center */}
      {!showIntro && !spinningSlot && !isMobile && (
        <KeyboardControlsHint />
      )}

      {/* Mobile Controls - only on mobile devices */}
      {!showIntro && !spinningSlot && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          visible={isMobile}
        />
      )}

      {/* Intro overlay - glitch text with ESC/ENTER skip (sets permanent flag) */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
      />

      {/* Full screen slot experience - includes content after spin */}
      {spinningSlot && (
        <Suspense fallback={null}>
          <SlotFullScreen
            machineId={spinningSlot}
            onClose={() => setSpinningSlot(null)}
            onNavigate={setSpinningSlot}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Konami Code Easter Egg */}
      <KonamiEasterEgg active={konamiActive} onComplete={resetKonami} />

      {/* Achievement Toast */}
      <AchievementToast
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      {/* Onboarding tooltip - only for first-time visitors, after intro */}
      {showOnboarding && !showIntro && !spinningSlot && (
        <OnboardingTooltip onDismiss={handleOnboardingDismiss} />
      )}

      {/* Magic Cursor removed - particle trail now follows avatar in 3D scene */}

      {/* Click to Enter Splash - first thing user sees */}
      {showSplash && <ClickToEnterSplash onEnter={handleSplashEnter} />}
    </WebGLErrorBoundary>
  )
}
