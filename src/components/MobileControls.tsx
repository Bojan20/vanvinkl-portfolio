/**
 * Mobile Controls - Virtual joystick and action buttons
 *
 * ZERO LATENCY DESIGN:
 * - Touch events directly update refs (no setState)
 * - RAF-synced input polling
 * - Passive event listeners
 * - Hardware-accelerated transforms
 *
 * Layout:
 * - Left: Movement joystick
 * - Right: Action button (SPACE equivalent)
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { COLORS } from '../store/theme'

// ============================================
// TYPES
// ============================================
interface JoystickState {
  active: boolean
  x: number  // -1 to 1
  y: number  // -1 to 1
  angle: number  // radians
  distance: number  // 0 to 1
}

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void
  onAction: () => void
  visible?: boolean
  joystickSize?: number
  actionButtonSize?: number
}

// ============================================
// DETECT MOBILE
// ============================================
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

// ============================================
// VIRTUAL JOYSTICK COMPONENT
// ============================================
interface VirtualJoystickProps {
  size: number
  onMove: (x: number, y: number) => void
  onStart?: () => void
  onEnd?: () => void
}

function VirtualJoystick({
  size,
  onMove,
  onStart,
  onEnd
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<JoystickState>({
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    distance: 0
  })
  const touchIdRef = useRef<number | null>(null)

  const maxDistance = size / 2 - 20  // Knob radius padding

  const updateKnobPosition = useCallback((x: number, y: number) => {
    if (knobRef.current) {
      // Use transform for GPU acceleration
      knobRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (touchIdRef.current !== null) return  // Already tracking a touch

    const touch = e.changedTouches[0]
    touchIdRef.current = touch.identifier

    stateRef.current.active = true
    onStart?.()

    // Prevent scrolling
    e.preventDefault()
  }, [onStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchIdRef.current === null) return
    if (!containerRef.current) return

    // Find our tracked touch
    let touch: Touch | undefined
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touch = e.changedTouches[i]
        break
      }
    }
    if (!touch) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let dx = touch.clientX - centerX
    let dy = touch.clientY - centerY

    // Calculate distance and angle
    const distance = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    // Clamp to max distance
    const clampedDistance = Math.min(distance, maxDistance)

    // Normalize
    const normalizedDistance = clampedDistance / maxDistance
    const normalizedX = Math.cos(angle) * normalizedDistance
    const normalizedY = Math.sin(angle) * normalizedDistance

    // Update state
    stateRef.current.x = normalizedX
    stateRef.current.y = normalizedY
    stateRef.current.angle = angle
    stateRef.current.distance = normalizedDistance

    // Update visual position
    const visualX = Math.cos(angle) * clampedDistance
    const visualY = Math.sin(angle) * clampedDistance
    updateKnobPosition(visualX, visualY)

    // Callback
    onMove(normalizedX, normalizedY)

    e.preventDefault()
  }, [maxDistance, onMove, updateKnobPosition])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Check if our tracked touch ended
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null
        stateRef.current.active = false
        stateRef.current.x = 0
        stateRef.current.y = 0
        stateRef.current.distance = 0

        // Reset knob position
        updateKnobPosition(0, 0)

        // Callback
        onMove(0, 0)
        onEnd?.()

        break
      }
    }
  }, [onMove, onEnd, updateKnobPosition])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Store bound handlers for proper cleanup
    const touchStartHandler = handleTouchStart
    const touchMoveHandler = handleTouchMove
    const touchEndHandler = handleTouchEnd

    // Use passive: false to allow preventDefault
    container.addEventListener('touchstart', touchStartHandler, { passive: false })
    container.addEventListener('touchmove', touchMoveHandler, { passive: false })
    container.addEventListener('touchend', touchEndHandler, { passive: true })
    container.addEventListener('touchcancel', touchEndHandler, { passive: true })

    return () => {
      // Remove with same options for proper cleanup
      container.removeEventListener('touchstart', touchStartHandler)
      container.removeEventListener('touchmove', touchMoveHandler)
      container.removeEventListener('touchend', touchEndHandler)
      container.removeEventListener('touchcancel', touchEndHandler)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)`,
        border: `2px solid ${COLORS.cyan}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative'
      }}
    >
      {/* Center indicator */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: `${COLORS.cyan}30`,
        position: 'absolute'
      }} />

      {/* Movable knob */}
      <div
        ref={knobRef}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.cyan} 0%, ${COLORS.purple} 100%)`,
          boxShadow: `0 0 20px ${COLORS.cyan}80, inset 0 0 10px rgba(255,255,255,0.3)`,
          position: 'absolute',
          transform: 'translate(0px, 0px)',
          willChange: 'transform'  // Hint for GPU acceleration
        }}
      />
    </div>
  )
}

// ============================================
// ACTION BUTTON COMPONENT
// ============================================
interface ActionButtonProps {
  size: number
  onPress: () => void
  label?: string
}

function ActionButton({ size, onPress, label = 'SPIN' }: ActionButtonProps) {
  const [pressed, setPressed] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Use native event listener with passive: false to allow preventDefault
  useEffect(() => {
    const el = buttonRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      setPressed(true)
      onPress()
    }
    const handleTouchEnd = () => setPressed(false)

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [onPress])

  return (
    <button
      ref={buttonRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: pressed
          ? `radial-gradient(circle, ${COLORS.magenta} 0%, ${COLORS.purple} 100%)`
          : `radial-gradient(circle, ${COLORS.purple}80 0%, ${COLORS.magenta}40 100%)`,
        border: `3px solid ${pressed ? COLORS.magenta : COLORS.purple}`,
        boxShadow: pressed
          ? `0 0 30px ${COLORS.magenta}, inset 0 0 20px rgba(255,255,255,0.2)`
          : `0 0 15px ${COLORS.purple}60`,
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '2px',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        outline: 'none',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.05s, background 0.1s, box-shadow 0.1s'
      }}
    >
      {label}
    </button>
  )
}

// ============================================
// MAIN MOBILE CONTROLS COMPONENT
// ============================================
export function MobileControls({
  onMove,
  onAction,
  visible = true,
  joystickSize = 140,
  actionButtonSize = 90
}: MobileControlsProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Don't render on desktop
  if (!isMobile || !visible) return null

  // Use compact sizes for both orientations — CSS handles container height
  // On mobile, joystick 90px and action 60px work well in both orientations
  const finalJoystickSize = Math.min(joystickSize, 90, window.innerWidth * 0.35)
  const finalActionSize = Math.min(actionButtonSize, 60, window.innerWidth * 0.23)

  return (
    <>
      {/* CSS media query handles landscape vs portrait — zero re-renders on rotation */}
      <style>{`
        .mobile-controls-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 200px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 max(30px, env(safe-area-inset-left, 0px)) max(30px, env(safe-area-inset-bottom, 0px)) max(30px, env(safe-area-inset-right, 0px));
          pointer-events: none;
          z-index: 500;
          transition: height 0.2s ease;
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .mobile-controls-bar {
            height: 100px;
          }
        }
      `}</style>
      <div className="mobile-controls-bar" role="toolbar" aria-label="Game controls">
        {/* Left: Movement joystick */}
        <div style={{ pointerEvents: 'auto' }} role="group" aria-label="Movement joystick">
          <VirtualJoystick
            size={finalJoystickSize}
            onMove={onMove}
          />
        </div>

        {/* Right: Action button */}
        <div style={{ pointerEvents: 'auto' }} role="group" aria-label="Action button">
          <ActionButton
            size={finalActionSize}
            onPress={onAction}
          />
        </div>
      </div>
    </>
  )
}

