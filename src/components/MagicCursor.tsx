/**
 * Magic Cursor - Premium cursor effects
 *
 * ZERO LATENCY APPROACH:
 * - RAF-based animation
 * - GPU-accelerated transforms
 * - No React state updates
 * - Direct DOM manipulation
 *
 * Features:
 * - Particle trail following cursor
 * - Magnetic effect on interactive elements
 * - Glow effect on hover
 */

import { useEffect, useRef, useCallback } from 'react'

// ============================================
// PARTICLE TRAIL CURSOR
// ============================================
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export function ParticleTrailCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 })
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas to full screen
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x
      mouseRef.current.prevY = mouseRef.current.y
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY

      // Calculate velocity
      const vx = (mouseRef.current.x - mouseRef.current.prevX) * 0.3
      const vy = (mouseRef.current.y - mouseRef.current.prevY) * 0.3
      const speed = Math.sqrt(vx * vx + vy * vy)

      // Spawn particles based on movement speed
      if (speed > 1) {
        const count = Math.min(3, Math.floor(speed / 3))
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: mouseRef.current.x,
            y: mouseRef.current.y,
            vx: (Math.random() - 0.5) * 2 - vx * 0.5,
            vy: (Math.random() - 0.5) * 2 - vy * 0.5,
            life: 1,
            maxLife: 0.6 + Math.random() * 0.4,
            size: 3 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#00ffff' : '#ff00aa'
          })
        }
      }

      // Limit particles
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    let lastTime = 0
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= delta / p.maxLife
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.98
        p.vy *= 0.98
        p.vy += 0.1 // Slight gravity

        if (p.life <= 0) return false

        // Draw particle
        const alpha = p.life
        const size = p.size * p.life

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`)
          .replace('rgb', 'rgba')
          .replace('#00ffff', `rgba(0, 255, 255, ${alpha})`)
          .replace('#ff00aa', `rgba(255, 0, 170, ${alpha})`)
        ctx.fill()

        // Glow effect
        ctx.shadowColor = p.color
        ctx.shadowBlur = size * 2
        ctx.fill()
        ctx.shadowBlur = 0

        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  )
}

// ============================================
// MAGNETIC CURSOR - Attracts to interactive elements
// ============================================
export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const scaleRef = useRef({ current: 1, target: 1 })
  const animationRef = useRef<number>()

  useEffect(() => {
    const cursor = cursorRef.current
    const glow = glowRef.current
    if (!cursor || !glow) return

    // Elements that attract cursor
    const magneticSelectors = [
      'button',
      'a',
      '[data-magnetic]',
      '.magnetic'
    ].join(', ')

    let currentMagnetic: Element | null = null

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current.targetX = e.clientX
      posRef.current.targetY = e.clientY

      // Check for magnetic elements
      const target = document.elementFromPoint(e.clientX, e.clientY)
      const magnetic = target?.closest(magneticSelectors)

      if (magnetic && magnetic !== currentMagnetic) {
        currentMagnetic = magnetic
        scaleRef.current.target = 1.5
        cursor.style.borderColor = '#ff00aa'
        glow.style.background = 'radial-gradient(circle, rgba(255,0,170,0.3) 0%, transparent 70%)'
      } else if (!magnetic && currentMagnetic) {
        currentMagnetic = null
        scaleRef.current.target = 1
        cursor.style.borderColor = '#00ffff'
        glow.style.background = 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)'
      }

      // Magnetic pull effect
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const distX = e.clientX - centerX
        const distY = e.clientY - centerY
        const dist = Math.sqrt(distX * distX + distY * distY)
        const maxDist = 100

        if (dist < maxDist) {
          const pull = 1 - dist / maxDist
          posRef.current.targetX = e.clientX - distX * pull * 0.3
          posRef.current.targetY = e.clientY - distY * pull * 0.3
        }
      }
    }

    const handleMouseDown = () => {
      scaleRef.current.target = 0.8
    }

    const handleMouseUp = () => {
      scaleRef.current.target = currentMagnetic ? 1.5 : 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    // Animation loop - ZERO LATENCY with lerp
    const animate = () => {
      // Smooth position - fast lerp for responsiveness
      const lerpFactor = 0.2
      posRef.current.x += (posRef.current.targetX - posRef.current.x) * lerpFactor
      posRef.current.y += (posRef.current.targetY - posRef.current.y) * lerpFactor

      // Smooth scale
      scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15

      // Apply transforms - GPU accelerated
      const transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scaleRef.current.current})`
      cursor.style.transform = transform
      glow.style.transform = transform

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Glow layer */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 99997,
          willChange: 'transform'
        }}
      />
      {/* Main cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '2px solid #00ffff',
          background: 'rgba(0, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
        }}
      />
    </>
  )
}

// ============================================
// COMBINED CURSOR - Both effects
// ============================================
export function MagicCursorFull() {
  return (
    <>
      <ParticleTrailCursor />
      <MagneticCursor />
    </>
  )
}
