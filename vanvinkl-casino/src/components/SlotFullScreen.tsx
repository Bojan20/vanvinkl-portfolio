/**
 * SlotFullScreen - Ultra Realistic Full Screen Slot Experience
 *
 * - HUGE reels filling entire screen
 * - Ultra realistic spinning with motion blur
 * - NO navigation between slots - each slot is standalone
 * - Full screen content after spin
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700',
  green: '#00ff88'
}

// Themed symbols for each slot - MORE symbols for realistic feel
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
// ULTRA AAA SLOT MACHINE DISPLAY
// Vegas-grade visuals with full effects
// ============================================

// Coin Rain Particle System
function CoinRain({ active }: { active: boolean }) {
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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 200 }}>
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
}

// Screen Shake Container
function ScreenShake({ active, children }: { active: boolean, children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      animation: active ? 'screenShake 0.5s ease-out' : 'none'
    }}>
      {children}
    </div>
  )
}

// Single Reel Column - 3D Barrel Effect with Elastic Bounce
function ReelColumn({
  symbols,
  spinning,
  finalSymbol,
  onStop,
  delay = 0,
  primaryColor,
  reelIndex,
  jackpot
}: {
  symbols: string[]
  spinning: boolean
  finalSymbol: string
  onStop?: () => void
  delay?: number
  primaryColor: string
  reelIndex: number
  jackpot: boolean
}) {
  const [visibleSymbols, setVisibleSymbols] = useState<string[]>([
    symbols[0], symbols[1], symbols[2]
  ])
  const [stopped, setStopped] = useState(false)
  const [blurAmount, setBlurAmount] = useState(0)
  const [rotationX, setRotationX] = useState(0)
  const [bouncePhase, setBouncePhase] = useState<'none' | 'overshoot' | 'settle'>('none')
  const intervalRef = useRef<number | null>(null)
  const speedRef = useRef(0)
  const rotationRef = useRef(0)

  useEffect(() => {
    if (spinning && !stopped) {
      let currentSpeed = 50
      speedRef.current = currentSpeed
      setBouncePhase('none')

      // Barrel rotation animation
      const rotateInterval = setInterval(() => {
        rotationRef.current = (rotationRef.current + 15) % 360
        setRotationX(Math.sin(rotationRef.current * Math.PI / 180) * 8)
      }, 30)

      // Smooth acceleration
      const accelerate = setInterval(() => {
        currentSpeed = Math.max(currentSpeed - 5, 18)
        speedRef.current = currentSpeed
        setBlurAmount(Math.min((50 - currentSpeed) / 2, 12))
        if (currentSpeed <= 18) clearInterval(accelerate)
      }, 60)

      // Delayed start based on reel position
      setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          setVisibleSymbols(prev => {
            const newSymbols = [...prev]
            newSymbols.unshift(symbols[Math.floor(Math.random() * symbols.length)])
            newSymbols.pop()
            return newSymbols
          })
        }, speedRef.current)
      }, delay * 120)

      // Staggered stop timing
      const stopTime = 1600 + delay * 450
      setTimeout(() => {
        clearInterval(rotateInterval)
        const decelerate = setInterval(() => {
          speedRef.current += 18
          setBlurAmount(prev => Math.max(prev - 3, 0))
          setRotationX(prev => prev * 0.8)
          if (speedRef.current > 200) {
            clearInterval(decelerate)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setVisibleSymbols([
              symbols[Math.floor(Math.random() * symbols.length)],
              finalSymbol,
              symbols[Math.floor(Math.random() * symbols.length)]
            ])
            // Elastic bounce sequence
            setBouncePhase('overshoot')
            setTimeout(() => setBouncePhase('settle'), 150)
            setTimeout(() => {
              setBouncePhase('none')
              setStopped(true)
              setBlurAmount(0)
              setRotationX(0)
              onStop?.()
            }, 300)
          }
        }, 30)
      }, stopTime)

      return () => {
        clearInterval(rotateInterval)
        clearInterval(accelerate)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [spinning, stopped, symbols, delay, finalSymbol, onStop])

  useEffect(() => {
    if (!spinning) {
      setStopped(false)
      setBlurAmount(0)
      setRotationX(0)
      setBouncePhase('none')
      setVisibleSymbols([symbols[0], symbols[1], symbols[2]])
    }
  }, [spinning, symbols])

  // Calculate bounce transform
  const getBounceTransform = () => {
    switch (bouncePhase) {
      case 'overshoot': return 'translateY(-15px) scale(1.03)'
      case 'settle': return 'translateY(5px) scale(0.98)'
      default: return 'translateY(0) scale(1)'
    }
  }

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
      transform: getBounceTransform(),
      transition: bouncePhase !== 'none' ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
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

      {/* Reel background with 3D depth */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(8,8,25,0.7) 15%, rgba(12,12,35,0.6) 50%, rgba(8,8,25,0.7) 85%, rgba(0,0,0,0.9) 100%)',
        borderRadius: '4px',
        transform: `rotateX(${rotationX}deg)`,
        transformStyle: 'preserve-3d',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }} />

      {/* Symbols with 3D barrel effect */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: `rotateX(${rotationX}deg)`,
        transformStyle: 'preserve-3d'
      }}>
        {visibleSymbols.map((symbol, i) => {
          const isCenter = i === 1
          const isWinning = isCenter && jackpot && stopped
          const rowRotation = (i - 1) * 25 // -25, 0, 25 degrees

          return (
            <div key={i} style={{
              position: 'relative',
              width: '100%',
              height: '33.33%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isCenter ? 'clamp(50px, 9vw, 90px)' : 'clamp(30px, 5vw, 45px)',
              filter: `blur(${blurAmount}px)`,
              opacity: isCenter ? 1 : 0.4,
              transform: `rotateX(${spinning && !stopped ? rowRotation : 0}deg) translateZ(${isCenter ? 10 : -5}px)`,
              textShadow: isWinning
                ? `0 0 40px ${COLORS.gold}, 0 0 80px ${COLORS.gold}, 0 0 120px ${COLORS.gold}`
                : isCenter
                ? `0 0 25px ${primaryColor}, 0 0 50px ${primaryColor}60`
                : 'none',
              transition: stopped ? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              animation: isWinning ? 'winSymbolUltra 0.6s ease-in-out infinite' : 'none'
            }}>
              {/* Symbol with holographic effect */}
              <span style={{
                position: 'relative',
                display: 'inline-block'
              }}>
                {symbol}
                {/* Holographic shimmer overlay */}
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

      {/* Separator lines with glow */}
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
}

// Game Title Marquee - Ultra with chase lights
function GameMarquee({ title, color }: { title: string, color: string }) {
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
        fontSize: 'clamp(36px, 7vw, 64px)',
        fontWeight: 900,
        color: '#fff',
        textShadow: `
          0 0 10px ${color},
          0 0 30px ${color},
          0 0 60px ${color},
          0 0 100px ${color}80,
          0 2px 0 ${color}
        `,
        letterSpacing: '10px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        zIndex: 1,
        animation: 'titlePulse 2s ease-in-out infinite'
      }}>
        {title}
      </h1>

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
}

// LED Display Digit Component
function LEDDigit({ value, color, size = 32 }: { value: string, color: string, size?: number }) {
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
}

// Animated Win Counter
function WinCounter({ target, active, color }: { target: number, active: boolean, color: string }) {
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
}

// Bottom Info Panel - Ultra with LED displays
function InfoPanel({ primaryColor, jackpot }: { primaryColor: string, jackpot: boolean }) {
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

      {/* Credits */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: '#00ff88',
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '8px',
          textShadow: '0 0 10px #00ff88'
        }}>CREDITS</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {'1,000'.split('').map((char, i) => (
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

      {/* Bet */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: primaryColor,
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '8px',
          textShadow: `0 0 10px ${primaryColor}`
        }}>BET</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {'100'.split('').map((char, i) => (
            <LEDDigit key={i} value={char} color={primaryColor} />
          ))}
        </div>
      </div>

      {/* Decorative divider */}
      <div style={{
        width: '2px',
        height: '60px',
        background: `linear-gradient(180deg, transparent, ${primaryColor}60, transparent)`
      }} />

      {/* Win - with count-up animation */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: jackpot ? COLORS.gold : '#666688',
          fontSize: '11px',
          letterSpacing: '3px',
          marginBottom: '8px',
          textShadow: jackpot ? `0 0 15px ${COLORS.gold}` : 'none',
          animation: jackpot ? 'winLabelFlash 0.3s ease-out 3' : 'none'
        }}>WIN</div>
        <WinCounter target={5000} active={jackpot} color={jackpot ? COLORS.gold : '#444466'} />
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
}

// Payline Indicator
function PaylineIndicator({ active, color, side }: { active: boolean, color: string, side: 'left' | 'right' }) {
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
}

// Spin Button (decorative)
function SpinButton({ spinning, color }: { spinning: boolean, color: string }) {
  return (
    <div style={{
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
      animation: spinning ? 'spinButtonPulse 0.5s ease-in-out infinite' : 'none'
    }}>
      <div style={{
        fontSize: 'clamp(10px, 2vw, 14px)',
        fontWeight: 'bold',
        color: spinning ? color + '80' : '#fff',
        letterSpacing: '2px',
        textShadow: spinning ? 'none' : `0 0 10px ${color}`
      }}>
        {spinning ? '...' : 'SPIN'}
      </div>
    </div>
  )
}

// ============================================
// CONTENT VIEWS - FULL SCREEN
// ============================================
function SkillsView({ section }: { section: SkillsSection }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {section.categories.map((cat, i) => (
        <div key={cat.name} style={{ animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>{cat.icon}</span>
            <span style={{ color: cat.color, fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px' }}>{cat.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cat.skills.map(skill => (
              <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#aaaacc', fontSize: '16px', width: '140px', fontWeight: '500' }}>{skill.name}</span>
                <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${skill.level}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}80)`,
                    borderRadius: '6px',
                    boxShadow: `0 0 15px ${cat.color}60`,
                    animation: `barGrow 1s ease-out ${i * 0.1}s both`
                  }} />
                </div>
                <span style={{ color: cat.color, fontSize: '16px', width: '50px', fontWeight: 'bold' }}>{skill.level}%</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ServicesView({ section }: { section: ServicesSection }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
      {section.items.map((item, i) => (
        <div key={item.title} style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid rgba(255,0,170,0.2)',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
          <h3 style={{ margin: '0 0 12px 0', color: '#ff00aa', fontSize: '20px', fontWeight: 'bold' }}>{item.title}</h3>
          <p style={{ margin: '0 0 16px 0', color: '#888899', fontSize: '15px', lineHeight: 1.6 }}>{item.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {item.features.map(f => (
              <span key={f} style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: 'rgba(255,0,170,0.15)',
                borderRadius: '20px',
                color: '#ff00aa',
                fontWeight: '500'
              }}>{f}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AboutView({ section }: { section: AboutSection }) {
  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      <p style={{ color: '#ccccee', fontSize: '20px', lineHeight: 1.8, marginBottom: '40px', textAlign: 'center', maxWidth: '700px', margin: '0 auto 40px' }}>
        {section.bio}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {section.stats.map((stat, i) => (
          <div key={stat.label} style={{
            background: 'rgba(136,68,255,0.1)',
            borderRadius: '20px',
            padding: '30px 20px',
            textAlign: 'center',
            border: '1px solid rgba(136,68,255,0.2)',
            animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{stat.icon}</div>
            <div style={{ color: '#8844ff', fontWeight: 'bold', fontSize: '24px', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ color: '#666688', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectsView({ section }: { section: ProjectsSection }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
      {section.featured.map((proj, i) => (
        <div key={proj.title} style={{
          background: 'rgba(255,215,0,0.03)',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid rgba(255,215,0,0.2)',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px' }}>{proj.icon}</span>
            <span style={{ color: '#666688', fontSize: '14px', background: 'rgba(255,215,0,0.1)', padding: '4px 12px', borderRadius: '12px' }}>{proj.year}</span>
          </div>
          <h3 style={{ margin: '0 0 12px 0', color: '#ffd700', fontSize: '22px', fontWeight: 'bold' }}>{proj.title}</h3>
          <p style={{ margin: '0 0 16px 0', color: '#888899', fontSize: '15px', lineHeight: 1.5 }}>{proj.description}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {proj.tags.map(t => (
              <span key={t} style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: 'rgba(255,215,0,0.15)',
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
}

function ExperienceView({ section }: { section: ExperienceSection }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '700px', margin: '0 auto' }}>
      {section.timeline.map((item, i) => (
        <div key={item.period} style={{
          borderLeft: '3px solid #00ff88',
          paddingLeft: '28px',
          animation: `fadeSlideIn 0.5s ease-out ${i * 0.15}s both`,
          position: 'relative'
        }}>
          {/* Timeline dot */}
          <div style={{
            position: 'absolute',
            left: '-8px',
            top: '0',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 15px #00ff88'
          }} />
          <div style={{ color: '#00ff88', fontSize: '14px', marginBottom: '8px', fontWeight: '500', letterSpacing: '1px' }}>{item.period}</div>
          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '22px', marginBottom: '4px' }}>{item.role}</div>
          <div style={{ color: '#888899', fontSize: '16px', marginBottom: '16px' }}>{item.company}</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {item.highlights.map((h, j) => (
              <li key={j} style={{ color: '#777799', fontSize: '15px', marginBottom: '8px', lineHeight: 1.5 }}>{h}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ContactView({ section, focusIndex, onActivate }: { section: ContactSection, focusIndex: number, onActivate: (index: number) => void }) {
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
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out', textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto 40px' }}>
        {section.methods.map((method, i) => {
          const isFocused = focusIndex === i
          return (
            <button
              key={method.label}
              onClick={() => handleClick(method)}
              style={{
                background: isFocused ? 'rgba(255,68,68,0.25)' : 'rgba(255,68,68,0.08)',
                border: isFocused ? '2px solid #ff4444' : '2px solid rgba(255,68,68,0.3)',
                borderRadius: '20px',
                padding: '28px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isFocused ? '0 0 30px rgba(255,68,68,0.4)' : 'none',
                outline: 'none'
              }}
              onMouseEnter={e => {
                if (!isFocused) {
                  e.currentTarget.style.background = 'rgba(255,68,68,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,68,68,0.2)'
                }
              }}
              onMouseLeave={e => {
                if (!isFocused) {
                  e.currentTarget.style.background = 'rgba(255,68,68,0.08)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{method.icon}</div>
              <div style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>{method.label}</div>
              <div style={{ color: '#888899', fontSize: '14px' }}>{method.value}</div>
            </button>
          )
        })}
      </div>
      <p style={{ color: '#00ff88', fontSize: '18px', fontWeight: '500' }}>
        {section.availability}
      </p>
      {/* Keyboard hint */}
      <div style={{ marginTop: '30px', color: '#444466', fontSize: '14px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <span><span style={{ color: '#666688', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>←→↑↓</span> Navigate</span>
        <span><span style={{ color: '#666688', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>ENTER</span> Open</span>
      </div>
    </div>
  )
}

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

function ContentView({ section, focusIndex, onActivate }: {
  section: SlotSection
  focusIndex: number
  onActivate: (index: number) => void
}) {
  switch (section.type) {
    case 'skills': return <SkillsView section={section} />
    case 'services': return <ServicesView section={section} />
    case 'about': return <AboutView section={section} />
    case 'projects': return <ProjectsView section={section} />
    case 'experience': return <ExperienceView section={section} />
    case 'contact': return <ContactView section={section} focusIndex={focusIndex} onActivate={onActivate} />
    default: return null
  }
}

// ============================================
// PARTICLE BURST
// ============================================
function ParticleBurst({ color }: { color: string }) {
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
    <div style={{ position: 'fixed', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 100 }}>
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
            '--angle': `${p.angle}deg`,
            '--distance': `${p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

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
  const [phase, setPhase] = useState<'spinning' | 'jackpot' | 'content'>('spinning')
  const [focusIndex, setFocusIndex] = useState(0)

  const section = SLOT_CONTENT[machineId]
  const theme = SLOT_THEMES[machineId] || SLOT_THEMES.skills
  const primaryColor = section?.color || '#00ffff'

  // Reset focus when entering content phase
  useEffect(() => {
    if (phase === 'content') {
      setFocusIndex(0)
    }
  }, [phase])

  useEffect(() => {
    markVisited(machineId)
  }, [machineId])

  const handleReelStop = useCallback(() => {
    // Called when last reel stops
    setTimeout(() => setPhase('jackpot'), 200)
  }, [])

  useEffect(() => {
    if (phase === 'jackpot') {
      const timer = setTimeout(() => setPhase('content'), 1500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Handle activation (Enter key press on focused item)
  const handleActivate = useCallback((index: number) => {
    if (section?.type === 'contact') {
      const methods = (section as ContactSection).methods
      const method = methods[index]
      if (method?.action === 'email' && method.url) {
        window.location.href = method.url
      } else if (method?.action === 'link' && method.url) {
        window.open(method.url, '_blank', 'noopener,noreferrer')
      } else if (method?.action === 'copy') {
        navigator.clipboard.writeText(method.value)
      }
    }
  }, [section])

  // Keyboard navigation for content phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC always closes
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Only handle arrow/enter in content phase
      if (phase !== 'content' || !section) return

      const itemCount = getItemCount(section)
      const columns = getGridColumns(section)

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          setFocusIndex(prev => (prev + 1) % itemCount)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          break
        case 'ArrowDown':
          e.preventDefault()
          if (columns > 1) {
            // Grid navigation
            setFocusIndex(prev => {
              const next = prev + columns
              return next < itemCount ? next : prev
            })
          } else {
            // Vertical list
            setFocusIndex(prev => (prev + 1) % itemCount)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (columns > 1) {
            // Grid navigation
            setFocusIndex(prev => {
              const next = prev - columns
              return next >= 0 ? next : prev
            })
          } else {
            // Vertical list
            setFocusIndex(prev => (prev - 1 + itemCount) % itemCount)
          }
          break
        case 'Enter':
          e.preventDefault()
          handleActivate(focusIndex)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, phase, section, focusIndex, handleActivate])

  const finalSymbol = theme.symbols[0]

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(180deg, #03020a 0%, #08061a 30%, #0a0820 50%, #08061a 70%, #03020a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        width: '150vw', height: '150vh',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse, ${primaryColor}08 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(255,255,255,0.1)',
          color: '#666688',
          fontSize: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,100,100,0.2)'
          e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'
          e.currentTarget.style.color = '#ff6666'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = '#666688'
        }}
      >
        ×
      </button>

      {/* SLOT MACHINE SCREEN */}
      {(phase === 'spinning' || phase === 'jackpot') && (
        <ScreenShake active={phase === 'jackpot'}>
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
              0 0 2px ${primaryColor}40
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
            <GameMarquee title={theme.title} color={primaryColor} />

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
              {/* Ambient light rays */}
              {phase === 'jackpot' && (
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
              <PaylineIndicator active={phase === 'jackpot'} color={COLORS.gold} side="left" />
              <PaylineIndicator active={phase === 'jackpot'} color={COLORS.gold} side="right" />

              {/* 5 Reel columns with chrome frame */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'stretch',
                width: '88%',
                height: '72%',
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

                {[0, 1, 2, 3, 4].map(i => (
                  <ReelColumn
                    key={i}
                    symbols={theme.symbols}
                    spinning={phase === 'spinning'}
                    finalSymbol={finalSymbol}
                    onStop={i === 4 ? handleReelStop : undefined}
                    delay={i}
                    primaryColor={primaryColor}
                    reelIndex={i}
                    jackpot={phase === 'jackpot'}
                  />
                ))}
              </div>

              {/* Center payline highlight - enhanced */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '8%',
                right: '8%',
                height: phase === 'jackpot' ? '6px' : '2px',
                background: phase === 'jackpot'
                  ? `linear-gradient(90deg, transparent, ${COLORS.gold}, ${COLORS.gold}, transparent)`
                  : `linear-gradient(90deg, transparent, ${primaryColor}50, ${primaryColor}50, transparent)`,
                transform: 'translateY(-50%)',
                boxShadow: phase === 'jackpot'
                  ? `0 0 40px ${COLORS.gold}, 0 0 80px ${COLORS.gold}, 0 0 120px ${COLORS.gold}60`
                  : 'none',
                animation: phase === 'jackpot' ? 'winLineUltra 0.4s ease-in-out infinite' : 'none',
                pointerEvents: 'none',
                borderRadius: '3px'
              }} />

              {/* Spin Button */}
              <SpinButton spinning={phase === 'spinning'} color={primaryColor} />

              {/* Jackpot overlay - enhanced with multi-layer text */}
              {phase === 'jackpot' && (
                <>
                  {/* Glow layer */}
                  <div style={{
                    position: 'absolute',
                    top: '12%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'clamp(50px, 10vw, 100px)',
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
                    top: '12%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'clamp(50px, 10vw, 100px)',
                    fontWeight: 900,
                    color: COLORS.gold,
                    textShadow: `
                      0 0 20px ${COLORS.gold},
                      0 0 40px ${COLORS.gold},
                      0 0 80px ${COLORS.gold},
                      0 0 120px ${COLORS.gold}80,
                      0 4px 0 #b8860b,
                      0 6px 0 #8b6914,
                      0 8px 20px rgba(0,0,0,0.5)
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
            </div>

            {/* Bottom Info Panel */}
            <InfoPanel primaryColor={primaryColor} jackpot={phase === 'jackpot'} />

            {/* Coin Rain on jackpot */}
            <CoinRain active={phase === 'jackpot'} />

            {/* Particle explosion on jackpot */}
            {phase === 'jackpot' && <ParticleBurst color={COLORS.gold} />}
          </div>
        </ScreenShake>
      )}

      {/* CONTENT PHASE - FULL SCREEN */}
      {phase === 'content' && section && (
        <div style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          padding: '60px 40px',
          animation: 'contentReveal 0.6s ease-out'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '64px',
                fontWeight: 900,
                color: primaryColor,
                textShadow: `0 0 30px ${primaryColor}80`,
                letterSpacing: '8px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {section.title}
              </h1>
              <p style={{ margin: '16px 0 0 0', color: '#888899', fontSize: '20px', fontStyle: 'italic' }}>
                {section.tagline}
              </p>
            </div>

            {/* Content */}
            <ContentView section={section} focusIndex={focusIndex} onActivate={handleActivate} />

            {/* ESC hint */}
            <div style={{
              textAlign: 'center',
              marginTop: '60px',
              color: '#444466',
              fontSize: '14px'
            }}>
              Press <span style={{ color: '#666688', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>ESC</span> to return
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
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

        /* 3D Reel Animations */
        @keyframes glowPulse3D {
          0%, 100% { opacity: 0.8; filter: blur(20px); }
          50% { opacity: 1; filter: blur(25px); }
        }
        @keyframes symbolPop {
          0% { transform: translateZ(20px) scale(0.5); opacity: 0; }
          50% { transform: translateZ(40px) scale(1.2); }
          100% { transform: translateZ(20px) scale(1); opacity: 1; }
        }
        @keyframes holoShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes borderGlow3D {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @keyframes cornerPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes winLine3D {
          0%, 100% {
            height: 6px;
            box-shadow: 0 0 30px ${COLORS.gold}, 0 0 60px ${COLORS.gold}80;
          }
          50% {
            height: 8px;
            box-shadow: 0 0 50px ${COLORS.gold}, 0 0 100px ${COLORS.gold};
          }
        }
        @keyframes sideNeon {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes winSymbolPulse {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.2); }
        }
        @keyframes winSymbolUltra {
          0%, 100% { transform: scale(1.1) rotateY(0deg); filter: brightness(1.2); }
          25% { transform: scale(1.15) rotateY(5deg); filter: brightness(1.5); }
          50% { transform: scale(1.2) rotateY(0deg); filter: brightness(1.8); }
          75% { transform: scale(1.15) rotateY(-5deg); filter: brightness(1.5); }
        }
        @keyframes marqueeSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(80px); }
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
        @keyframes winCountUp {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
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
      `}</style>
    </div>
  )
}
