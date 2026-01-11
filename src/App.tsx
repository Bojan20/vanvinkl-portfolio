/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback, useEffect, useRef, lazy } from 'react'
import { CasinoScene } from './components/CasinoScene'
import { IntroCamera, IntroOverlay } from './components/IntroSequence'
import { MobileControls, isMobileDevice } from './components/MobileControls'
import { MagicCursorFull } from './components/MagicCursor'

// Lazy load SlotFullScreen for better initial bundle size
const SlotFullScreen = lazy(() => import('./components/SlotFullScreen').then(m => ({ default: m.SlotFullScreen })))
import {
  WebGLErrorBoundary,
  ContextLostOverlay,
  WebGLNotSupported,
  isWebGLSupported
} from './components/WebGLErrorBoundary'
import { gameRefs } from './store'
import { audioSystem, getFrequencyData, getBassLevel } from './audio'
import { initAudio, dspPlay, dspMute, dspVolume, dspGetVolume, dspGetFrequencyData } from './audio/AudioDSP'
import { setSynthVolume } from './audio/SynthSounds'
import { achievementStore, type Achievement } from './store/achievements'
import { trackSession } from './hooks/useAnalytics'

// Controls HUD - compact bottom-center display (desktop only)
function ControlsHUD() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        padding: '10px 24px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: '1px solid rgba(0, 255, 255, 0.25)',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Arrow keys */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {['←', '↑', '↓', '→'].map(k => (
          <span key={k} style={{
            padding: '4px 8px',
            background: 'rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            borderRadius: '4px',
            color: '#00ffff',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {k}
          </span>
        ))}
        <span style={{ color: '#888899', fontSize: '12px', marginLeft: '4px' }}>MOVE</span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: 'rgba(136, 68, 255, 0.4)' }} />

      {/* Space key */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          padding: '4px 14px',
          background: 'rgba(255, 0, 170, 0.15)',
          border: '1px solid rgba(255, 0, 170, 0.5)',
          borderRadius: '4px',
          color: '#ff00aa',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          SPACE
        </span>
        <span style={{ color: '#888899', fontSize: '12px' }}>INTERACT</span>
      </div>
    </div>
  )
}

// Sound Toggle Button - persistent mute control
function SoundToggle() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('vanvinkl-muted')
    return saved === 'true'
  })
  const [isHovered, setIsHovered] = useState(false)

  // Apply saved mute state on mount
  useEffect(() => {
    audioSystem.setMuted(isMuted)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev
      localStorage.setItem('vanvinkl-muted', String(newVal))
      audioSystem.setMuted(newVal)
      dspMute(newVal) // Mute new DSP system too
      return newVal
    })
  }, [])

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        cursor: 'pointer',
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
        const saved = localStorage.getItem('vanvinkl-progress')
        if (saved) {
          const progress = JSON.parse(saved)
          if (progress.visited && Array.isArray(progress.visited)) {
            setVisitedSections(new Set(progress.visited))
          }
        }
      } catch {}
    }
    loadVisited()

    // Listen for storage changes
    const handleStorage = () => loadVisited()
    window.addEventListener('storage', handleStorage)

    // Poll for changes (same tab updates)
    const interval = setInterval(loadVisited, 1000)

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

// Spectrum Visualizer - Audio reactive bars (uses DSP frequency data)
function SpectrumVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const barCount = 16
    const barWidth = 3
    const barGap = 2
    const maxHeight = 30

    const draw = () => {
      // Try DSP first, fallback to old audio system
      let data = dspGetFrequencyData()
      if (!data) {
        data = getFrequencyData()
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (data && data.length > 0) {
        // Sample frequency data to barCount bars
        const step = Math.max(1, Math.floor(data.length / barCount))

        for (let i = 0; i < barCount; i++) {
          const value = data[i * step] / 255
          const height = Math.max(2, value * maxHeight)

          // Gradient color based on frequency (low=cyan, mid=magenta, high=gold)
          const hue = 180 - (i / barCount) * 140 // cyan to pink
          const saturation = 80 + value * 20
          const lightness = 50 + value * 20

          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
          ctx.fillRect(
            i * (barWidth + barGap),
            maxHeight - height,
            barWidth,
            height
          )

          // Glow effect
          ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
          ctx.shadowBlur = value * 8
        }
      } else {
        // Idle animation when no audio
        for (let i = 0; i < barCount; i++) {
          const idleHeight = 2 + Math.sin(Date.now() / 500 + i * 0.5) * 3
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'
          ctx.fillRect(
            i * (barWidth + barGap),
            maxHeight - idleHeight,
            barWidth,
            idleHeight
          )
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

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
      { keys: ['W', 'A', 'S', 'D'], desc: 'Move around' },
      { keys: ['↑', '←', '↓', '→'], desc: 'Alternative movement' },
    ]},
    { section: 'INTERACTION', items: [
      { keys: ['SPACE'], desc: 'Interact / Spin' },
      { keys: ['ENTER'], desc: 'Select item' },
      { keys: ['ESC'], desc: 'Close / Back' },
    ]},
    { section: 'NAVIGATION', items: [
      { keys: ['←', '→'], desc: 'Navigate items' },
      { keys: ['↑', '↓'], desc: 'Navigate grid rows' },
    ]},
    { section: 'OTHER', items: [
      { keys: ['?'], desc: 'Show this help' },
      { keys: ['M'], desc: 'Toggle sound' },
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
              cursor: 'pointer',
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
    { icon: '🎮', title: 'Move Around', text: 'WASD or Arrow keys to walk' },
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

// Audio Mixer - sliders for music and SFX (shows when sitting in lounge)
function AudioMixer({ visible }: { visible: boolean }) {
  const [musicVol, setMusicVol] = useState(() => dspGetVolume('music'))
  const [sfxVol, setSfxVol] = useState(() => dspGetVolume('sfx'))

  // Sync SynthSounds volume with DSP sfx volume on mount
  useEffect(() => {
    setSynthVolume(sfxVol)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setMusicVol(val)
    dspVolume('music', val)
  }

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setSfxVol(val)
    dspVolume('sfx', val)
    // Also update SynthSounds volume (footsteps, UI sounds, intro SFX)
    setSynthVolume(val)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      bottom: '100px',
      background: 'rgba(5, 5, 15, 0.92)',
      border: '1px solid rgba(0, 255, 255, 0.25)',
      borderRadius: '16px',
      padding: '20px 24px',
      backdropFilter: 'blur(12px)',
      zIndex: 200,
      minWidth: '200px',
      boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
      animation: 'mixerSlideIn 0.3s ease-out',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
          <rect x="4" y="2" width="4" height="20" rx="1" />
          <rect x="10" y="6" width="4" height="16" rx="1" />
          <rect x="16" y="10" width="4" height="12" rx="1" />
        </svg>
        <span style={{
          color: '#00ffff',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          AUDIO MIXER
        </span>
      </div>

      {/* Music Slider */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#ff00aa', fontSize: '11px', letterSpacing: '1px' }}>MUSIC</span>
          <span style={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
            {Math.round(musicVol * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVol}
          onChange={handleMusicChange}
          style={{
            width: '100%',
            height: '6px',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, #ff00aa ${musicVol * 100}%, rgba(255,255,255,0.1) ${musicVol * 100}%)`,
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* SFX Slider */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#00ffff', fontSize: '11px', letterSpacing: '1px' }}>SFX</span>
          <span style={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
            {Math.round(sfxVol * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sfxVol}
          onChange={handleSfxChange}
          style={{
            width: '100%',
            height: '6px',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, #00ffff ${sfxVol * 100}%, rgba(255,255,255,0.1) ${sfxVol * 100}%)`,
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Hint */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.35)',
        fontSize: '10px',
        letterSpacing: '1px'
      }}>
        RELAX MODE
      </div>

      <style>{`
        @keyframes mixerSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

// Click to Enter Splash - enables audio before intro starts
function ClickToEnterSplash({ onEnter }: { onEnter: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  const handleEnter = useCallback(() => {
    if (isClicking) return
    setIsClicking(true)
    // Immediately call onEnter - no delay needed
    onEnter()
  }, [isClicking, onEnter])

  // Listen for any key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleEnter()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleEnter])

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
        cursor: 'pointer',
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
        fontSize: '48px',
        fontWeight: 900,
        letterSpacing: '12px',
        marginBottom: '60px',
        background: 'linear-gradient(90deg, #00ffff, #ff00aa, #00ffff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
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
          animation: 'splashGlitch 2s infinite',
          opacity: 0.8
        }}>
          VANVINKL
        </div>
      </div>

      {/* Click to Enter button area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Hexagon border effect */}
        <div style={{
          padding: '24px 64px',
          background: isHovered
            ? 'rgba(0, 255, 255, 0.15)'
            : 'rgba(0, 255, 255, 0.05)',
          border: `2px solid ${isHovered ? '#00ffff' : 'rgba(0, 255, 255, 0.4)'}`,
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: isHovered
            ? '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 40px rgba(0, 255, 255, 0.1)'
            : '0 0 20px rgba(0, 255, 255, 0.2)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}>
          {/* Corner accents */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderColor: '#ff00aa',
              borderStyle: 'solid',
              borderWidth: pos.includes('top') ? '2px 0 0 0' : '0 0 2px 0',
              ...(pos.includes('left') ? { left: '-1px', borderLeftWidth: '2px' } : { right: '-1px', borderRightWidth: '2px' }),
              ...(pos.includes('top') ? { top: '-1px' } : { bottom: '-1px' })
            }} />
          ))}

          <span style={{
            color: '#00ffff',
            fontSize: '20px',
            fontWeight: 'bold',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            textShadow: isHovered ? '0 0 20px #00ffff' : 'none'
          }}>
            PRESS ANY KEY TO ENTER
          </span>
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

  // Onboarding - show only for first-time visitors
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('vanvinkl-onboarded') !== 'true'
  })

  const handleOnboardingDismiss = useCallback(() => {
    setShowOnboarding(false)
    localStorage.setItem('vanvinkl-onboarded', 'true')
  }, [])

  // Track session on mount
  useEffect(() => {
    trackSession()
  }, [])

  // Handle splash click - init audio and start intro
  const handleSplashEnter = useCallback(async () => {
    // Initialize audio systems (this click enables audio)
    audioSystem.init()

    if (localStorage.getItem('vanvinkl-muted') !== 'true') {
      await initAudio()
      dspPlay('lounge')
    }

    // Hide splash and start intro
    setShowSplash(false)
    setShowIntro(true)
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

  // Global keyboard shortcuts (? for help, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? or / for help (Shift+/ = ?)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setShowHelp(prev => !prev)
      }
      // M for mute toggle
      if (e.key === 'm' || e.key === 'M') {
        const currentMuted = localStorage.getItem('vanvinkl-muted') === 'true'
        const newMuted = !currentMuted
        localStorage.setItem('vanvinkl-muted', String(newMuted))
        audioSystem.setMuted(newMuted)
        dspMute(newMuted)
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
    // Mark as visited for skip intro next time
    localStorage.setItem('vanvinkl-visited', 'true')
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
          />
        </Suspense>
      </Canvas>

      {/* No preloader - intro starts immediately */}

      {/* Sound Toggle - always visible after intro */}
      {!showIntro && <SoundToggle />}

      {/* Audio Mixer - shows when sitting in lounge */}
      <AudioMixer visible={isSitting && !showIntro && !spinningSlot} />

      {/* Desktop Controls HUD - hidden on mobile */}
      {!showIntro && !spinningSlot && !isMobile && (
        <ControlsHUD />
      )}

      {/* Section Progress Ring - shows exploration progress */}
      {!showIntro && !spinningSlot && !isMobile && (
        <SectionProgressRing />
      )}

      {/* Spectrum Visualizer - audio reactive bars */}
      {!showIntro && !spinningSlot && !isMobile && (
        <SpectrumVisualizer />
      )}

      {/* Mobile Controls - only on mobile devices */}
      {!showIntro && !spinningSlot && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          visible={isMobile}
        />
      )}

      {/* Intro overlay - glitch text, skip button for returning visitors */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
        canSkip={localStorage.getItem('vanvinkl-visited') === 'true'}
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

      {/* Magic Cursor - particle trail + magnetic effect (desktop only) */}
      {!isMobile && <MagicCursorFull />}

      {/* Click to Enter Splash - first thing user sees */}
      {showSplash && <ClickToEnterSplash onEnter={handleSplashEnter} />}
    </WebGLErrorBoundary>
  )
}
