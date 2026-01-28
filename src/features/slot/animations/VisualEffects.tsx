/**
 * VisualEffects - UI animation components
 *
 * Extracted from SlotFullScreen.tsx for better organization.
 * Includes typewriter text, ripples, bursts, and screen shake effects.
 */

import React, { useState, useEffect, memo } from 'react'

// ============================================
// TYPEWRITER TEXT EFFECT
// ============================================
export const TypewriterText = memo(function TypewriterText({
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
export const RippleEffect = memo(function RippleEffect({
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
export const SelectBurst = memo(function SelectBurst({
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

// ============================================
// SCREEN SHAKE EFFECT
// ============================================
export const ScreenShake = memo(function ScreenShake({ active, children }: { active: boolean, children: React.ReactNode }) {
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
