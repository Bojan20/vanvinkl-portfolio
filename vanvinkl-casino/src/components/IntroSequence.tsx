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

// GPU-optimized teleport particles with fade out
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
  const opacityRef = useRef(0.9)

  const particleCount = 200 // More particles for WOW

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    const cyanColor = new THREE.Color(COLORS.cyan)
    const magentaColor = new THREE.Color(COLORS.magenta)
    const purpleColor = new THREE.Color(COLORS.purple)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Start at avatar position with wider spread
      positions[i3] = position[0] + (Math.random() - 0.5) * 1.0
      positions[i3 + 1] = position[1] + Math.random() * 3
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 1.0

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

      lifetimes[i] = Math.random()
    }

    velocitiesRef.current = velocities
    lifetimesRef.current = lifetimes

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

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

    // Fade out smoothly
    if (fadeOut) {
      opacityRef.current = Math.max(0, opacityRef.current - delta * 0.5)
      material.opacity = opacityRef.current
    }

    if (!active && !fadeOut) return

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const velocities = velocitiesRef.current
    const lifetimes = lifetimesRef.current

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      lifetimes[i] -= delta * 0.6 // Slower decay

      if (lifetimes[i] <= 0) {
        // Respawn
        posArray[i3] = position[0] + (Math.random() - 0.5) * 0.8
        posArray[i3 + 1] = position[1] + Math.random() * 0.5
        posArray[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.8
        lifetimes[i] = 1
      } else {
        // Move upward with spiral
        posArray[i3] += velocities[i3] * delta
        posArray[i3 + 1] += velocities[i3 + 1] * delta
        posArray[i3 + 2] += velocities[i3 + 2] * delta

        // Add some rotation
        const angle = delta * 2.5
        const x = posArray[i3] - position[0]
        const z = posArray[i3 + 2] - position[2]
        posArray[i3] = position[0] + x * Math.cos(angle) - z * Math.sin(angle)
        posArray[i3 + 2] = position[2] + x * Math.sin(angle) + z * Math.cos(angle)
      }
    }

    posAttr.needsUpdate = true
  })

  if (!active && !fadeOut) return null

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

  const INTRO_DURATION = 5.0 // 5 seconds - cinematic WOW

  // Camera path: dramatic swoop from sky
  const startPos = useRef(new THREE.Vector3(0, 60, 80)) // Even higher and further
  const endPos = useRef(new THREE.Vector3(0, 5, 18)) // Final gameplay position
  const startLookAt = useRef(new THREE.Vector3(0, 0, -10))
  const endLookAt = useRef(new THREE.Vector3(0, 1.5, 7))

  // Set initial camera position immediately
  useEffect(() => {
    camera.position.copy(startPos.current)
    camera.lookAt(startLookAt.current)
  }, [camera])

  useEffect(() => {
    // Trigger particles early (at 1s) for longer WOW effect
    const particleTimer = setTimeout(() => setShowParticles(true), 1000)

    // Start fading particles at 4s
    const fadeTimer = setTimeout(() => setFadeOutParticles(true), 4000)

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
  onComplete
}: {
  active: boolean
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<'glitch' | 'reveal' | 'hold' | 'fade' | 'done'>('glitch')
  const [glitchText, setGlitchText] = useState('WELCOME TO VANVINKL CASINO')
  const [revealedChars, setRevealedChars] = useState(0) // For gradual reveal
  const [opacity, setOpacity] = useState(1)
  const [bgOpacity, setBgOpacity] = useState(1) // Background opacity - starts dark, fades out

  const originalText = 'WELCOME TO VANVINKL CASINO'
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`█▓▒░'

  useEffect(() => {
    if (!active) return

    // Longer timing for 5s total intro - more WOW time
    const phases = [
      { time: 1200, action: () => setPhase('reveal') },     // Glitch for 1.2s
      { time: 2800, action: () => setPhase('hold') },       // Reveal for 1.6s (gradual)
      { time: 3800, action: () => setPhase('fade') },       // Hold for 1s
      { time: 4300, action: () => setOpacity(0) },          // Start fading text
      { time: 5000, action: () => {
        setPhase('done')
        onComplete()
      }}
    ]

    const timers = phases.map(p => setTimeout(p.action, p.time))

    return () => timers.forEach(t => clearTimeout(t))
  }, [active, onComplete])

  // Background fade - starts at 2s, completes by 4s (slower, smoother)
  useEffect(() => {
    if (!active) return

    const fadeStart = setTimeout(() => {
      let startTime = Date.now()
      const duration = 2000 // 2 seconds to fade
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
    }, 2000)

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

    const revealDuration = 1400 // 1.4 seconds to reveal all letters
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
      zIndex: 1000,
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
