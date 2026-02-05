/**
 * SkillReelColumn - Single reel column animation component
 *
 * PRODUCTION-CRITICAL: RAF-based 4-phase state machine
 * - Phase 1: Accelerate (0-500ms) - Speed up, add blur
 * - Phase 2: Spin (500ms-stopTime) - Full speed cycling
 * - Phase 3: Decelerate (300ms) - Slow down, remove blur
 * - Phase 4: Bounce (300ms) - Overshoot + settle animation
 *
 * ZERO-LATENCY FEATURES:
 * - Touch-to-stop: Space key instantly stops all reels
 * - Batched state: Single state object reduces re-renders
 * - GPU acceleration: transform3d, will-change hints
 * - RAF loop: No setInterval jitter, perfect 60fps
 *
 * Extracted from SlotFullScreen.tsx (lines 670-1074)
 */

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import useRAF from '../hooks/useRAF'
import type { SkillReelSymbol } from '../types'
import { SLOT_COLORS } from '../configs/themes'

// GPU-accelerated color constants
const COLORS = SLOT_COLORS

interface SkillReelColumnProps {
  reelData: SkillReelSymbol[]
  spinning: boolean
  finalIndex: number
  delay?: number
  reelIndex: number
  jackpot: boolean
  forceStop?: boolean
  onReelStop?: (reelIndex: number) => void
}

const SkillReelColumn = memo(function SkillReelColumn({
  reelData,
  spinning,
  finalIndex,
  delay = 0,
  reelIndex,
  jackpot,
  forceStop = false,
  onReelStop
}: SkillReelColumnProps) {
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

export default SkillReelColumn
