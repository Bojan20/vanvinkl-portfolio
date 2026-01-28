/**
 * GameUI - Extracted UI Chrome Components from SlotFullScreen
 *
 * All visual UI elements for the slot machine interface:
 * - GameMarquee: Title banner with chase lights
 * - LEDDigit: LED-style digit display
 * - WinCounter: Animated counter with LED digits
 * - SkillsDiscovered: Progress indicator
 * - PaylineIndicator: Left/right payline glow indicators
 * - SpinButton: Animated SPIN button
 *
 * PRODUCTION CODE - exact copy with all CSS animations
 */

import React, { useState, useEffect, useMemo, memo } from 'react'

// ============================================
// GAME MARQUEE - Title Banner with Chase Lights
// ============================================
export const GameMarquee = memo(function GameMarquee({
  title,
  color,
  subtitle
}: {
  title: string
  color: string
  subtitle?: string
}) {
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
        fontSize: 'clamp(32px, 5vw, 48px)',
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
          fontSize: 'clamp(13px, 2vw, 16px)',
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

// ============================================
// LED DIGIT - Single LED-style digit
// ============================================
export const LEDDigit = memo(function LEDDigit({
  value,
  color,
  size = 32
}: {
  value: string
  color: string
  size?: number
}) {
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

// ============================================
// WIN COUNTER - Animated counter with LED digits
// ============================================
export const WinCounter = memo(function WinCounter({
  target,
  active,
  color
}: {
  target: number
  active: boolean
  color: string
}) {
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

// ============================================
// SKILLS DISCOVERED - Progress indicator
// ============================================
export const SkillsDiscovered = memo(function SkillsDiscovered({
  count,
  total,
  color
}: {
  count: number
  total: number
  color: string
}) {
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

// ============================================
// PAYLINE INDICATOR - Left/right payline glow
// ============================================
export const PaylineIndicator = memo(function PaylineIndicator({
  active,
  color,
  side
}: {
  active: boolean
  color: string
  side: 'left' | 'right'
}) {
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

// ============================================
// SPIN BUTTON - Animated SPIN button (GPU accelerated)
// ============================================
export const SpinButton = memo(function SpinButton({
  spinning,
  onSpin,
  color
}: {
  spinning: boolean
  onSpin: () => void
  color: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onSpin}
      disabled={spinning}
      onMouseEnter={() => !spinning && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        bottom: '15%',
        right: '5%',
        width: 'clamp(64px, 10vw, 100px)',
        height: 'clamp(64px, 10vw, 100px)',
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
          : isHovered
            ? `0 0 50px ${color}, 0 0 80px ${color}80, inset 0 0 40px ${color}50`
            : `0 0 40px ${color}, 0 0 60px ${color}60, inset 0 0 30px ${color}40`,
        animation: spinning ? 'spinButtonPulse 0.5s ease-in-out infinite' : 'none',
        cursor: spinning ? 'not-allowed' : 'pointer',
        transform: isHovered && !spinning ? 'scale(1.05)' : 'scale(1)',
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
