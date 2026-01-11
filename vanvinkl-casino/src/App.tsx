/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Suspense, useState, useCallback, useEffect, useRef, lazy } from 'react'
import { CasinoScene } from './components/CasinoScene'
import { IntroCamera, IntroOverlay } from './components/IntroSequence'
import { MobileControls, isMobileDevice } from './components/MobileControls'

// Lazy load SlotFullScreen for better initial bundle size
const SlotFullScreen = lazy(() => import('./components/SlotFullScreen').then(m => ({ default: m.SlotFullScreen })))
import {
  WebGLErrorBoundary,
  ContextLostOverlay,
  WebGLNotSupported,
  isWebGLSupported
} from './components/WebGLErrorBoundary'
import { gameRefs } from './store'
import { audioSystem } from './audio'
import { achievementStore, type Achievement } from './store/achievements'

// 3D Scene Preloader - cyberpunk loading screen with progress
function ScenePreloader() {
  const { progress, active } = useProgress()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  // Smooth progress animation
  useEffect(() => {
    const target = Math.round(progress)
    const step = () => {
      setDisplayProgress(prev => {
        if (prev < target) return Math.min(prev + 2, target)
        return prev
      })
    }
    const interval = setInterval(step, 20)
    return () => clearInterval(interval)
  }, [progress])

  // Fade out when complete
  useEffect(() => {
    if (progress >= 100 && !active) {
      const timer = setTimeout(() => setFadeOut(true), 500)
      return () => clearTimeout(timer)
    }
  }, [progress, active])

  if (fadeOut) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #050508 0%, #0a0a12 50%, #050508 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: progress >= 100 ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      pointerEvents: progress >= 100 ? 'none' : 'auto'
    }}>
      {/* Animated background particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: i % 3 === 0 ? '#00ffff' : i % 3 === 1 ? '#ff00aa' : '#8844ff',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3 + Math.random() * 0.4,
            animation: `preloaderFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            filter: 'blur(1px)'
          }} />
        ))}
      </div>

      {/* Glowing orb background */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 60%)',
        borderRadius: '50%',
        animation: 'preloaderOrbPulse 3s ease-in-out infinite',
        filter: 'blur(60px)'
      }} />

      {/* Logo/Title */}
      <div style={{
        fontSize: '48px',
        fontWeight: 900,
        letterSpacing: '12px',
        marginBottom: '60px',
        background: 'linear-gradient(90deg, #00ffff, #ff00aa, #8844ff, #00ffff)',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'preloaderGradient 3s linear infinite',
        textShadow: '0 0 40px rgba(0,255,255,0.3)'
      }}>
        VANVINKL
      </div>

      {/* Progress container */}
      <div style={{
        width: '400px',
        maxWidth: '80vw',
        position: 'relative'
      }}>
        {/* Progress bar background */}
        <div style={{
          height: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid rgba(0,255,255,0.2)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
        }}>
          {/* Progress bar fill */}
          <div style={{
            width: `${displayProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ffff, #ff00aa)',
            borderRadius: '4px',
            boxShadow: '0 0 20px #00ffff, 0 0 40px rgba(255,0,170,0.5)',
            transition: 'width 0.1s ease-out',
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
              borderRadius: '4px 4px 0 0'
            }} />
            {/* Leading glow */}
            <div style={{
              position: 'absolute',
              right: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              background: '#fff',
              borderRadius: '50%',
              boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
              opacity: displayProgress < 100 ? 1 : 0
            }} />
          </div>
        </div>

        {/* Percentage display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '16px',
          fontFamily: 'monospace'
        }}>
          <span style={{
            color: '#666',
            fontSize: '12px',
            letterSpacing: '2px'
          }}>LOADING CASINO</span>
          <span style={{
            color: '#00ffff',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '0 0 10px #00ffff'
          }}>{displayProgress}%</span>
        </div>

        {/* Loading items indicator */}
        <div style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {['3D', 'TEX', 'SFX', 'UI'].map((item, i) => (
            <div key={item} style={{
              padding: '6px 14px',
              background: displayProgress > (i + 1) * 25
                ? 'rgba(0, 255, 255, 0.2)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${displayProgress > (i + 1) * 25 ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '20px',
              color: displayProgress > (i + 1) * 25 ? '#00ffff' : '#444',
              fontSize: '10px',
              letterSpacing: '2px',
              transition: 'all 0.3s ease'
            }}>{item}</div>
          ))}
        </div>
      </div>

      {/* Preloader animations */}
      <style>{`
        @keyframes preloaderFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes preloaderOrbPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes preloaderGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  )
}

// Slot Loading Skeleton - premium cyberpunk loading animation
function SlotLoadingSkeleton() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      overflow: 'hidden'
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'skeletonGridMove 20s linear infinite'
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'skeletonOrbPulse 3s ease-in-out infinite',
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255, 0, 170, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'skeletonOrbPulse 3s ease-in-out infinite 1.5s',
        filter: 'blur(30px)',
        transform: 'translate(100px, 50px)'
      }} />

      {/* Slot machine frame skeleton */}
      <div style={{
        position: 'relative',
        width: '90%',
        maxWidth: '800px',
        padding: '40px',
        background: 'rgba(20, 20, 30, 0.8)',
        borderRadius: '24px',
        border: '2px solid rgba(0, 255, 255, 0.2)',
        boxShadow: `
          0 0 60px rgba(0, 255, 255, 0.1),
          inset 0 0 60px rgba(0, 0, 0, 0.5)
        `
      }}>
        {/* Header skeleton */}
        <div style={{
          height: '40px',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1))',
          backgroundSize: '200% 100%',
          animation: 'skeletonShimmer 1.5s ease-in-out infinite',
          borderRadius: '8px',
          marginBottom: '30px'
        }} />

        {/* Reels skeleton */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '180px',
              height: '300px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 255, 0.15)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Scrolling symbols skeleton */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(180deg,
                    rgba(0, 255, 255, 0.05) 0%,
                    rgba(255, 0, 170, 0.05) 33%,
                    rgba(136, 68, 255, 0.05) 66%,
                    rgba(0, 255, 255, 0.05) 100%
                  )
                `,
                backgroundSize: '100% 400%',
                animation: `skeletonReelSpin 1s linear infinite`,
                animationDelay: `${i * 0.15}s`
              }} />
              {/* Symbol placeholders */}
              {[0, 1, 2, 3].map(j => (
                <div key={j} style={{
                  width: '60%',
                  height: '50px',
                  margin: '20px auto',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${j * 0.1}s`,
                  borderRadius: '8px'
                }} />
              ))}
            </div>
          ))}
        </div>

        {/* Loading text */}
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            color: '#00ffff',
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff40',
            letterSpacing: '8px',
            animation: 'skeletonTextPulse 1s ease-in-out infinite'
          }}>
            LOADING
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px'
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                background: '#00ffff',
                borderRadius: '50%',
                boxShadow: '0 0 10px #00ffff',
                animation: 'skeletonDotBounce 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton animations */}
      <style>{`
        @keyframes skeletonGridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes skeletonOrbPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes skeletonReelSpin {
          0% { background-position: 0 0; }
          100% { background-position: 0 400%; }
        }
        @keyframes skeletonTextPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeletonDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-12px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

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

export function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [cameraComplete, setCameraComplete] = useState(false)
  const [spinningSlot, setSpinningSlot] = useState<string | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [konamiActive, resetKonami] = useKonamiCode()
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)

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
            introActive={showIntro}
            slotOpen={!!spinningSlot}
          />
        </Suspense>
      </Canvas>

      {/* 3D Scene Preloader with progress bar */}
      <ScenePreloader />

      {/* Sound Toggle - always visible after intro */}
      {!showIntro && <SoundToggle />}

      {/* Desktop Controls HUD - hidden on mobile */}
      {!showIntro && !spinningSlot && !isMobile && (
        <ControlsHUD />
      )}

      {/* Mobile Controls - only on mobile devices */}
      {!showIntro && !spinningSlot && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          visible={isMobile}
        />
      )}

      {/* Intro overlay - glitch text */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
      />

      {/* Full screen slot experience - includes content after spin */}
      {spinningSlot && (
        <Suspense fallback={<SlotLoadingSkeleton />}>
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
    </WebGLErrorBoundary>
  )
}
