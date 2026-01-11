/**
 * INTRO SEQUENCE - ULTRA WOW Entry Animation
 *
 * SMOOTH flow:
 * - Camera starts FAR above the casino
 * - Glitch text appears while camera swoops down
 * - Text transitions to reveal while camera continues
 * - Teleport particles throughout
 * - Ultra smooth fade out - never interrupts
 *
 * Total duration: 5 seconds (cinematic WOW)
 * Movement does NOT interrupt the animation
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700'
}

// GPU-optimized teleport particles - GRADUAL DECREASE (no fade)
// When fadeOut=true, particles stop spawning and existing ones fly away naturally
function TeleportParticles({
  active,
  position,
  fadeOut = false
}: {
  active: boolean
  position: [number, number, number]
  fadeOut?: boolean
}) {
  const particlesRef = useRef<THREE.Points>(null!)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const lifetimesRef = useRef<Float32Array | null>(null)
  const sizesRef = useRef<Float32Array | null>(null) // Individual particle sizes
  const hasStartedRef = useRef(false)
  const allGoneRef = useRef(false)
  const spawnRateRef = useRef(1.0) // 1.0 = full spawn, 0 = no spawn

  const particleCount = 200 // More particles for WOW

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)
    const sizes = new Float32Array(particleCount)

    const cyanColor = new THREE.Color(COLORS.cyan)
    const magentaColor = new THREE.Color(COLORS.magenta)
    const purpleColor = new THREE.Color(COLORS.purple)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Start off-screen (will spawn when active)
      positions[i3] = position[0]
      positions[i3 + 1] = -1000 // Hidden below
      positions[i3 + 2] = position[2]

      // Upward spiral velocity - faster
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 4
      velocities[i3] = Math.cos(angle) * speed * 0.4
      velocities[i3 + 1] = speed
      velocities[i3 + 2] = Math.sin(angle) * speed * 0.4

      // Random cyberpunk color
      const colorChoice = Math.random()
      let color: THREE.Color
      if (colorChoice < 0.4) color = cyanColor
      else if (colorChoice < 0.7) color = magentaColor
      else color = purpleColor

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      lifetimes[i] = 0 // Start dead, will spawn gradually
      sizes[i] = 0.12 + Math.random() * 0.08 // Random size variation
    }

    velocitiesRef.current = velocities
    lifetimesRef.current = lifetimes
    sizesRef.current = sizes

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })

    return { geometry: geo, material: mat }
  }, [position])

  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return
    if (allGoneRef.current) return

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const velocities = velocitiesRef.current
    const lifetimes = lifetimesRef.current

    // Handle spawn rate - gradual decrease when fading out
    if (active && !fadeOut) {
      hasStartedRef.current = true
      // Ramp up spawn rate
      spawnRateRef.current = Math.min(1.0, spawnRateRef.current + delta * 2.0)
    }

    if (fadeOut) {
      // Gradually reduce spawn rate to zero
      spawnRateRef.current = Math.max(0, spawnRateRef.current - delta * 0.8) // ~1.25s to stop spawning
    }

    if (!hasStartedRef.current) return

    let aliveCount = 0

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      lifetimes[i] -= delta * 0.5 // Slower decay = particles live longer

      if (lifetimes[i] <= 0) {
        // Particle is dead
        if (spawnRateRef.current > 0 && Math.random() < spawnRateRef.current * delta * 3) {
          // Respawn with probability based on spawn rate
          posArray[i3] = position[0] + (Math.random() - 0.5) * 0.8
          posArray[i3 + 1] = position[1] + Math.random() * 0.3
          posArray[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.8
          lifetimes[i] = 0.8 + Math.random() * 0.6 // Random lifetime

          // New random velocity
          const angle = Math.random() * Math.PI * 2
          const speed = 3 + Math.random() * 4
          velocities[i3] = Math.cos(angle) * speed * 0.4
          velocities[i3 + 1] = speed
          velocities[i3 + 2] = Math.sin(angle) * speed * 0.4

          aliveCount++
        } else {
          // Move off-screen when dead
          posArray[i3 + 1] = -1000
        }
      } else {
        // Particle is alive - animate it
        aliveCount++

        // Move upward with spiral
        posArray[i3] += velocities[i3] * delta
        posArray[i3 + 1] += velocities[i3 + 1] * delta
        posArray[i3 + 2] += velocities[i3 + 2] * delta

        // Add some rotation
        const rotAngle = delta * 2.5
        const x = posArray[i3] - position[0]
        const z = posArray[i3 + 2] - position[2]
        posArray[i3] = position[0] + x * Math.cos(rotAngle) - z * Math.sin(rotAngle)
        posArray[i3 + 2] = position[2] + x * Math.sin(rotAngle) + z * Math.cos(rotAngle)

        // Slow down slightly as particle ages
        const ageFactor = Math.max(0.3, lifetimes[i])
        velocities[i3 + 1] *= 1 - delta * 0.3 * (1 - ageFactor)
      }
    }

    // Check if all particles are gone during fadeout
    if (fadeOut && spawnRateRef.current <= 0 && aliveCount === 0) {
      allGoneRef.current = true
    }

    posAttr.needsUpdate = true
  })

  // Only render if active or still has particles
  if (!active && !hasStartedRef.current) return null
  if (allGoneRef.current) return null

  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  )
}

// 3D Scene component for intro camera animation
// IMPORTANT: Camera animation runs INDEPENDENTLY - player movement does NOT interrupt
export function IntroCamera({
  onComplete,
  avatarSpawnPosition = [0, 0, 10] as [number, number, number]
}: {
  onComplete: () => void
  avatarSpawnPosition?: [number, number, number]
}) {
  const { camera } = useThree()
  const startTime = useRef(Date.now())
  const [showParticles, setShowParticles] = useState(false)
  const [fadeOutParticles, setFadeOutParticles] = useState(false)
  const completed = useRef(false)

  const INTRO_DURATION = 3.5 // 3.5 seconds - snappy but impressive

  // Camera path: dramatic swoop from sky
  // END POSITION MUST MATCH GAMEPLAY CAMERA EXACTLY:
  // Gameplay camera: (avatarX, avatarY+4, avatarZ+10) = (0, 4, 20)
  // Gameplay lookAt: (avatarX, 1.5, avatarZ-3) = (0, 1.5, 7)
  const startPos = useRef(new THREE.Vector3(0, 60, 80)) // Even higher and further
  const endPos = useRef(new THREE.Vector3(0, 4, 20)) // EXACT gameplay camera position
  const startLookAt = useRef(new THREE.Vector3(0, 0, -10))
  const endLookAt = useRef(new THREE.Vector3(0, 1.5, 7)) // Matches gameplay lookAt

  // Set initial camera position immediately
  useEffect(() => {
    camera.position.copy(startPos.current)
    camera.lookAt(startLookAt.current)
  }, [camera])

  useEffect(() => {
    // Trigger particles early (at 0.5s)
    const particleTimer = setTimeout(() => setShowParticles(true), 500)

    // Start fading particles at 1.8s
    const fadeTimer = setTimeout(() => setFadeOutParticles(true), 1800)

    // End intro - smooth completion
    const endTimer = setTimeout(() => {
      if (!completed.current) {
        completed.current = true
        onComplete()
      }
    }, INTRO_DURATION * 1000)

    return () => {
      clearTimeout(particleTimer)
      clearTimeout(fadeTimer)
      clearTimeout(endTimer)
    }
  }, [onComplete])

  useFrame(() => {
    if (completed.current) return

    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = Math.min(elapsed / INTRO_DURATION, 1)

    // Custom easing - dramatic swoop with smooth landing
    // Uses quintic ease-out for ultra smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 5)

    // Interpolate camera position
    camera.position.x = THREE.MathUtils.lerp(startPos.current.x, endPos.current.x, eased)
    camera.position.y = THREE.MathUtils.lerp(startPos.current.y, endPos.current.y, eased)
    camera.position.z = THREE.MathUtils.lerp(startPos.current.z, endPos.current.z, eased)

    // Interpolate look-at
    const lookAtX = THREE.MathUtils.lerp(startLookAt.current.x, endLookAt.current.x, eased)
    const lookAtY = THREE.MathUtils.lerp(startLookAt.current.y, endLookAt.current.y, eased)
    const lookAtZ = THREE.MathUtils.lerp(startLookAt.current.z, endLookAt.current.z, eased)
    camera.lookAt(lookAtX, lookAtY, lookAtZ)
  })

  return (
    <TeleportParticles
      active={showParticles}
      position={avatarSpawnPosition}
      fadeOut={fadeOutParticles}
    />
  )
}

// HTML Overlay for glitch text - Dark background that fades out smoothly
// IMPORTANT: Runs on timer - player movement does NOT interrupt
export function IntroOverlay({
  active,
  onComplete,
  canSkip = false
}: {
  active: boolean
  onComplete: () => void
  canSkip?: boolean
}) {
  const [phase, setPhase] = useState<'glitch' | 'reveal' | 'hold' | 'fade' | 'done'>('glitch')
  const [glitchText, setGlitchText] = useState('WELCOME TO VANVINKL CASINO')
  const [revealedChars, setRevealedChars] = useState(0) // For gradual reveal
  const [opacity, setOpacity] = useState(1)
  const [bgOpacity, setBgOpacity] = useState(1) // Background opacity - starts dark, fades out

  const originalText = 'WELCOME TO VANVINKL CASINO'
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`█▓▒░'

  // Keyboard skip: ESC or ENTER (only if canSkip)
  useEffect(() => {
    if (!active || !canSkip) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        setPhase('done')
        onComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, canSkip, onComplete])

  useEffect(() => {
    if (!active) return

    // Faster timing for 3.5s total intro
    const phases = [
      { time: 700, action: () => setPhase('reveal') },      // Glitch for 0.7s
      { time: 1800, action: () => setPhase('hold') },       // Reveal for 1.1s (gradual)
      { time: 2600, action: () => setPhase('fade') },       // Hold for 0.8s
      { time: 3000, action: () => setOpacity(0) },          // Start fading text
      { time: 3500, action: () => {
        setPhase('done')
        onComplete()
      }}
    ]

    const timers = phases.map(p => setTimeout(p.action, p.time))

    return () => timers.forEach(t => clearTimeout(t))
  }, [active, onComplete])

  // Background fade - starts at 1.2s, completes by 2.7s
  useEffect(() => {
    if (!active) return

    const fadeStart = setTimeout(() => {
      let startTime = Date.now()
      const duration = 1500 // 1.5 seconds to fade
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Smooth ease-out
        const eased = 1 - Math.pow(1 - progress, 3)
        setBgOpacity(1 - eased)
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }, 1200)

    return () => clearTimeout(fadeStart)
  }, [active])

  // Glitch effect during glitch phase
  useEffect(() => {
    if (phase !== 'glitch') return

    const interval = setInterval(() => {
      let newText = ''
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() < 0.4) {
          newText += glitchChars[Math.floor(Math.random() * glitchChars.length)]
        } else {
          newText += originalText[i]
        }
      }
      setGlitchText(newText)
    }, 50)

    return () => clearInterval(interval)
  }, [phase])

  // GRADUAL REVEAL - letters transform one by one from glitch to real
  useEffect(() => {
    if (phase !== 'reveal') {
      if (phase === 'hold' || phase === 'fade') {
        setRevealedChars(originalText.length) // All revealed
      }
      return
    }

    // Reset at start of reveal
    setRevealedChars(0)

    const revealDuration = 900 // 0.9 seconds to reveal all letters
    const charsPerInterval = originalText.length / (revealDuration / 40) // ~40ms per step
    let currentRevealed = 0

    const interval = setInterval(() => {
      currentRevealed += charsPerInterval
      if (currentRevealed >= originalText.length) {
        setRevealedChars(originalText.length)
        clearInterval(interval)
      } else {
        setRevealedChars(Math.floor(currentRevealed))
      }
    }, 40)

    return () => clearInterval(interval)
  }, [phase])

  // Update display text based on phase and revealed chars
  useEffect(() => {
    if (phase === 'glitch') return // Handled by glitch effect

    if (phase === 'reveal') {
      // Mix of revealed letters and glitch for unrevealed
      const interval = setInterval(() => {
        let newText = ''
        for (let i = 0; i < originalText.length; i++) {
          if (i < revealedChars) {
            // This letter is revealed
            newText += originalText[i]
          } else {
            // Still glitching
            newText += glitchChars[Math.floor(Math.random() * glitchChars.length)]
          }
        }
        setGlitchText(newText)
      }, 40)

      return () => clearInterval(interval)
    }

    if (phase === 'hold' || phase === 'fade') {
      setGlitchText(originalText)
    }
  }, [phase, revealedChars])

  if (!active || phase === 'done') return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Dark background that fades out during intro
      backgroundColor: `rgba(5, 3, 10, ${bgOpacity})`,
      zIndex: 10000, // Above preloader (9999)
      pointerEvents: 'none',
      opacity: opacity,
      transition: 'opacity 0.7s ease-out' // Slower fade
    }}>
      {/* Subtle vignette for focus */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center',
        opacity: 1,
        transform: phase === 'reveal' || phase === 'hold'
          ? 'scale(1)'
          : phase === 'fade'
            ? 'scale(0.98)'
            : 'scale(1.02)',
        transition: 'all 0.5s ease-out'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(32px, 7vw, 80px)',
          fontFamily: '"Orbitron", "Rajdhani", system-ui, sans-serif',
          fontWeight: 900,
          letterSpacing: '10px',
          color: phase === 'glitch' ? COLORS.magenta : '#ffffff',
          textShadow: phase === 'glitch'
            ? `0 0 30px ${COLORS.magenta}, 0 0 60px ${COLORS.magenta}, -4px 0 ${COLORS.cyan}, 4px 0 ${COLORS.purple}, 0 0 100px ${COLORS.magenta}`
            : `0 0 40px ${COLORS.cyan}, 0 0 80px ${COLORS.cyan}, 0 0 120px ${COLORS.cyan}, 0 0 160px ${COLORS.purple}`,
          animation: phase === 'glitch' ? 'glitchShake 0.08s infinite' : 'none',
          whiteSpace: 'nowrap',
          // Text stroke for better visibility
          WebkitTextStroke: (phase === 'reveal' || phase === 'hold') ? '1px rgba(0,255,255,0.5)' : 'none'
        }}>
          {glitchText}
        </h1>

        {(phase === 'reveal' || phase === 'hold' || phase === 'fade') && (
          <div style={{
            marginTop: '25px',
            fontSize: '20px',
            color: COLORS.gold,
            letterSpacing: '6px',
            textShadow: `0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}`,
            animation: 'fadeInUp 0.5s ease-out',
            opacity: phase === 'fade' ? 0.7 : 1,
            transition: 'opacity 0.5s ease-out'
          }}>
            PORTFOLIO EXPERIENCE
          </div>
        )}
      </div>

      {/* Scanlines effect - subtle */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)',
        pointerEvents: 'none',
        opacity: 0.4
      }} />

      {/* Horizontal scan line moving down */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${COLORS.cyan}40, ${COLORS.magenta}60, ${COLORS.cyan}40, transparent)`,
        animation: 'scanLine 2s linear infinite',
        pointerEvents: 'none'
      }} />

      {/* Skip hint for returning visitors - keyboard only */}
      {canSkip && phase !== 'done' && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          background: 'rgba(10, 10, 20, 0.8)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          color: 'rgba(255,255,255,0.7)',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          pointerEvents: 'none'
        }}>
          <kbd style={{
            background: 'rgba(0,255,255,0.2)',
            padding: '4px 10px',
            borderRadius: '4px',
            marginRight: '8px',
            color: '#00ffff',
            fontFamily: 'monospace'
          }}>ESC</kbd>
          or
          <kbd style={{
            background: 'rgba(0,255,255,0.2)',
            padding: '4px 10px',
            borderRadius: '4px',
            marginLeft: '8px',
            marginRight: '8px',
            color: '#00ffff',
            fontFamily: 'monospace'
          }}>ENTER</kbd>
          to skip
        </div>
      )}

      <style>{`
        @keyframes glitchShake {
          0% { transform: translate(0) skewX(0deg); }
          20% { transform: translate(-3px, 2px) skewX(-1deg); }
          40% { transform: translate(-2px, -2px) skewX(1deg); }
          60% { transform: translate(3px, 2px) skewX(-0.5deg); }
          80% { transform: translate(2px, -2px) skewX(0.5deg); }
          100% { transform: translate(0) skewX(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0% { top: -4px; }
          100% { top: 100%; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
      `}</style>
    </div>
  )
}
