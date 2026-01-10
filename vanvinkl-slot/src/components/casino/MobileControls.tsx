'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import nipplejs from 'nipplejs'

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number } | null) => void
  onInteract: () => void
  showInteract: boolean
}

/**
 * Mobile Controls Component
 *
 * Features:
 * - Virtual joystick (nipplejs) for movement
 * - Interact button when near machine
 * - Touch-optimized, 60fps responsive
 * - Auto-hide on desktop
 */
export function MobileControls({ onMove, onInteract, showInteract }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<nipplejs.JoystickManager | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile/touch device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window ||
                           navigator.maxTouchPoints > 0 ||
                           window.innerWidth < 1024
      setIsMobile(isTouchDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize joystick
  useEffect(() => {
    if (!isMobile || !joystickRef.current) return

    const manager = nipplejs.create({
      zone: joystickRef.current,
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: '#d4af37',
      size: 120,
      restOpacity: 0.5,
      fadeTime: 0,
    })

    managerRef.current = manager

    // Movement handler
    manager.on('move', (_, data) => {
      if (data.vector) {
        // Normalize to -1 to 1 range
        const x = data.vector.x
        const y = -data.vector.y // Invert Y for forward/backward
        onMove({ x, y })
      }
    })

    // Stop movement on release
    manager.on('end', () => {
      onMove(null)
    })

    return () => {
      manager.destroy()
      managerRef.current = null
    }
  }, [isMobile, onMove])

  // Handle interact button
  const handleInteract = useCallback(() => {
    onInteract()
  }, [onInteract])

  // Don't render on desktop
  if (!isMobile) return null

  return (
    <>
      {/* Joystick zone */}
      <div
        ref={joystickRef}
        className="fixed bottom-0 left-0 z-50 pointer-events-auto"
        style={{
          width: '180px',
          height: '180px',
          touchAction: 'none',
        }}
      />

      {/* Interact button */}
      {showInteract && (
        <button
          onClick={handleInteract}
          onTouchStart={handleInteract}
          className="fixed bottom-16 right-8 z-50 pointer-events-auto"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
            border: '3px solid #b8860b',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            color: '#1a1a1a',
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          TAP
        </button>
      )}

      {/* Pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </>
  )
}

/**
 * Hook to integrate mobile controls with avatar movement
 */
export function useMobileControls() {
  const [mobileInput, setMobileInput] = useState<{ x: number; y: number } | null>(null)

  const handleMove = useCallback((direction: { x: number; y: number } | null) => {
    setMobileInput(direction)
  }, [])

  return {
    mobileInput,
    handleMove,
  }
}
