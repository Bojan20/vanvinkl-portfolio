/**
 * CUSTOM CYBERPUNK CURSOR
 *
 * - Neon crosshair design
 * - Particle trail on movement
 * - Color shifts based on proximity
 * - Smooth, responsive follow
 */

import { useEffect, useRef, useState } from 'react'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff'
}

interface TrailParticle {
  x: number
  y: number
  life: number
  color: string
  size: number
}

export function CyberpunkCursor({ active = true }: { active?: boolean }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)
  const [particles, setParticles] = useState<TrailParticle[]>([])
  const lastMoveTime = useRef(Date.now())
  const lastPos = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const movingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Track mouse movement
  useEffect(() => {
    if (!active) return

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY }
      setPosition(newPos)

      // Calculate velocity for particle spawning
      const dx = newPos.x - lastPos.current.x
      const dy = newPos.y - lastPos.current.y
      const velocity = Math.sqrt(dx * dx + dy * dy)

      // Spawn particles based on velocity
      if (velocity > 3) {
        setIsMoving(true)
        clearTimeout(movingTimeout.current)
        movingTimeout.current = setTimeout(() => setIsMoving(false), 100)

        // Add new particle
        if (velocity > 8) {
          setParticles(prev => {
            const newParticles = [...prev]
            // Limit particle count
            if (newParticles.length > 30) {
              newParticles.shift()
            }
            newParticles.push({
              x: newPos.x + (Math.random() - 0.5) * 10,
              y: newPos.y + (Math.random() - 0.5) * 10,
              life: 1,
              color: [COLORS.cyan, COLORS.magenta, COLORS.purple][Math.floor(Math.random() * 3)],
              size: 2 + Math.random() * 4
            })
            return newParticles
          })
        }
      }

      lastPos.current = newPos
      lastMoveTime.current = Date.now()
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Hide system cursor
    document.body.style.cursor = 'none'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.style.cursor = 'default'
      clearTimeout(movingTimeout.current)
    }
  }, [active])

  // Animate particles
  useEffect(() => {
    if (!active) return

    const animate = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            life: p.life - 0.03,
            y: p.y - 0.5 // Float up slightly
          }))
          .filter(p => p.life > 0)
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationRef.current)
  }, [active])

  if (!active) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Particle trail */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size * p.life,
            height: p.size * p.life,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: p.life * 0.8,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: 'translate(-50%, -50%)',
            transition: 'none'
          }}
        />
      ))}

      {/* Main crosshair */}
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
      >
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: COLORS.cyan,
          boxShadow: `0 0 10px ${COLORS.cyan}, 0 0 20px ${COLORS.cyan}`,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }} />

        {/* Crosshair lines */}
        {/* Top */}
        <div style={{
          position: 'absolute',
          width: 2,
          height: isMoving ? 16 : 12,
          backgroundColor: COLORS.cyan,
          boxShadow: `0 0 8px ${COLORS.cyan}`,
          left: '50%',
          bottom: '50%',
          marginBottom: 8,
          transform: 'translateX(-50%)',
          transition: 'height 0.1s ease-out'
        }} />
        {/* Bottom */}
        <div style={{
          position: 'absolute',
          width: 2,
          height: isMoving ? 16 : 12,
          backgroundColor: COLORS.cyan,
          boxShadow: `0 0 8px ${COLORS.cyan}`,
          left: '50%',
          top: '50%',
          marginTop: 8,
          transform: 'translateX(-50%)',
          transition: 'height 0.1s ease-out'
        }} />
        {/* Left */}
        <div style={{
          position: 'absolute',
          width: isMoving ? 16 : 12,
          height: 2,
          backgroundColor: COLORS.cyan,
          boxShadow: `0 0 8px ${COLORS.cyan}`,
          right: '50%',
          top: '50%',
          marginRight: 8,
          transform: 'translateY(-50%)',
          transition: 'width 0.1s ease-out'
        }} />
        {/* Right */}
        <div style={{
          position: 'absolute',
          width: isMoving ? 16 : 12,
          height: 2,
          backgroundColor: COLORS.cyan,
          boxShadow: `0 0 8px ${COLORS.cyan}`,
          left: '50%',
          top: '50%',
          marginLeft: 8,
          transform: 'translateY(-50%)',
          transition: 'width 0.1s ease-out'
        }} />

        {/* Outer ring - pulses when moving */}
        <div style={{
          position: 'absolute',
          width: isMoving ? 40 : 32,
          height: isMoving ? 40 : 32,
          border: `1px solid ${COLORS.magenta}`,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: isMoving ? 0.8 : 0.3,
          boxShadow: isMoving ? `0 0 15px ${COLORS.magenta}` : 'none',
          transition: 'all 0.15s ease-out'
        }} />

        {/* Corner accents */}
        {[
          { top: -20, left: -20, rotateAngle: 0 },
          { top: -20, right: -20, rotateAngle: 90 },
          { bottom: -20, right: -20, rotateAngle: 180 },
          { bottom: -20, left: -20, rotateAngle: 270 }
        ].map(({ rotateAngle, ...pos }, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 8,
              height: 8,
              borderTop: `2px solid ${COLORS.purple}`,
              borderLeft: `2px solid ${COLORS.purple}`,
              transform: `rotate(${rotateAngle}deg)`,
              opacity: isMoving ? 1 : 0.5,
              boxShadow: isMoving ? `0 0 5px ${COLORS.purple}` : 'none',
              transition: 'opacity 0.1s ease-out'
            }}
          />
        ))}
      </div>
    </div>
  )
}
