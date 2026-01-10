/**
 * INTRO SEQUENCE - ULTRA WOW Entry Animation
 *
 * SMOOTH flow (no black screens):
 * - Camera starts FAR above the casino
 * - Glitch text appears while camera swoops down
 * - Text transitions to reveal while camera continues
 * - Teleport particles at avatar spawn
 * - Seamless transition to gameplay
 *
 * Total duration: 2.5 seconds (fast but WOW)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700'
}

// GPU-optimized teleport particles
function TeleportParticles({ active, position }: { active: boolean, position: [number, number, number] }) {
  const particlesRef = useRef<THREE.Points>(null!)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const lifetimesRef = useRef<Float32Array | null>(null)

  const particleCount = 150

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

      // Start at avatar position
      positions[i3] = position[0] + (Math.random() - 0.5) * 0.5
      positions[i3 + 1] = position[1] + Math.random() * 2.5
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.5

      // Upward spiral velocity
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      velocities[i3] = Math.cos(angle) * speed * 0.3
      velocities[i3 + 1] = speed
      velocities[i3 + 2] = Math.sin(angle) * speed * 0.3

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
      size: 0.12,
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
    if (!active || !particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const velocities = velocitiesRef.current
    const lifetimes = lifetimesRef.current

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      lifetimes[i] -= delta * 0.8

      if (lifetimes[i] <= 0) {
        // Respawn
        posArray[i3] = position[0] + (Math.random() - 0.5) * 0.5
        posArray[i3 + 1] = position[1] + Math.random() * 0.5
        posArray[i3 + 2] = position[2] + (Math.random() - 0.5) * 0.5
        lifetimes[i] = 1
      } else {
        // Move upward with spiral
        posArray[i3] += velocities[i3] * delta
        posArray[i3 + 1] += velocities[i3 + 1] * delta
        posArray[i3 + 2] += velocities[i3 + 2] * delta

        // Add some rotation
        const angle = delta * 2
        const x = posArray[i3] - position[0]
        const z = posArray[i3 + 2] - position[2]
        posArray[i3] = position[0] + x * Math.cos(angle) - z * Math.sin(angle)
        posArray[i3 + 2] = position[2] + x * Math.sin(angle) + z * Math.cos(angle)
      }
    }

    posAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  )
}

// 3D Scene component for intro camera animation
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
  const completed = useRef(false)

  const INTRO_DURATION = 2.5 // seconds - fast but WOW

  // Camera path: dramatic swoop from sky
  const startPos = useRef(new THREE.Vector3(0, 50, 70)) // Higher and further
  const endPos = useRef(new THREE.Vector3(0, 5, 18)) // Final gameplay position
  const startLookAt = useRef(new THREE.Vector3(0, 0, -5))
  const endLookAt = useRef(new THREE.Vector3(0, 1.5, 7))

  // Set initial camera position immediately
  useEffect(() => {
    camera.position.copy(startPos.current)
    camera.lookAt(startLookAt.current)
  }, [camera])

  useEffect(() => {
    // Trigger particles at 1.5 seconds (near end)
    const particleTimer = setTimeout(() => setShowParticles(true), 1500)

    // End intro
    const endTimer = setTimeout(() => {
      if (!completed.current) {
        completed.current = true
        setShowParticles(false)
        onComplete()
      }
    }, INTRO_DURATION * 1000)

    return () => {
      clearTimeout(particleTimer)
      clearTimeout(endTimer)
    }
  }, [onComplete])

  useFrame(() => {
    if (completed.current) return

    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = Math.min(elapsed / INTRO_DURATION, 1)

    // Custom easing - dramatic swoop with acceleration then smooth landing
    // Fast at start, slow landing
    const eased = 1 - Math.pow(1 - progress, 4)

    // Interpolate camera position - DIRECT SET, no lerp
    camera.position.x = THREE.MathUtils.lerp(startPos.current.x, endPos.current.x, eased)
    camera.position.y = THREE.MathUtils.lerp(startPos.current.y, endPos.current.y, eased)
    camera.position.z = THREE.MathUtils.lerp(startPos.current.z, endPos.current.z, eased)

    // Interpolate look-at
    const lookAtX = THREE.MathUtils.lerp(startLookAt.current.x, endLookAt.current.x, eased)
    const lookAtY = THREE.MathUtils.lerp(startLookAt.current.y, endLookAt.current.y, eased)
    const lookAtZ = THREE.MathUtils.lerp(startLookAt.current.z, endLookAt.current.z, eased)
    camera.lookAt(lookAtX, lookAtY, lookAtZ)
  })

  return <TeleportParticles active={showParticles} position={avatarSpawnPosition} />
}

// HTML Overlay for glitch text - Dark background that fades out smoothly
export function IntroOverlay({
  active,
  onComplete
}: {
  active: boolean
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<'glitch' | 'reveal' | 'fade' | 'done'>('glitch')
  const [glitchText, setGlitchText] = useState('WELCOME TO VANVINKL CASINO')
  const [opacity, setOpacity] = useState(1)
  const [bgOpacity, setBgOpacity] = useState(1) // Background opacity - starts dark, fades out

  useEffect(() => {
    if (!active) return

    // Start immediately with glitch (no black screen delay)
    // Fast timing for 2.5s total intro
    const phases = [
      { time: 800, action: () => setPhase('reveal') },
      { time: 1600, action: () => setPhase('fade') },
      { time: 2200, action: () => setOpacity(0) },
      { time: 2500, action: () => {
        setPhase('done')
        onComplete()
      }}
    ]

    const timers = phases.map(p => setTimeout(p.action, p.time))

    return () => timers.forEach(t => clearTimeout(t))
  }, [active, onComplete])

  // Background fade - starts at 1s, completes by 2s
  useEffect(() => {
    if (!active) return

    const fadeStart = setTimeout(() => {
      let startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 1000, 1)
        setBgOpacity(1 - progress)
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }, 1000)

    return () => clearTimeout(fadeStart)
  }, [active])

  // Glitch effect
  useEffect(() => {
    if (phase !== 'glitch') return

    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`█▓▒░'
    const originalText = 'WELCOME TO VANVINKL CASINO'

    const interval = setInterval(() => {
      let newText = ''
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() < 0.35) {
          newText += glitchChars[Math.floor(Math.random() * glitchChars.length)]
        } else {
          newText += originalText[i]
        }
      }
      setGlitchText(newText)
    }, 40) // Faster glitch

    return () => clearInterval(interval)
  }, [phase])

  // Reset to real text on reveal
  useEffect(() => {
    if (phase === 'reveal') {
      setGlitchText('WELCOME TO VANVINKL CASINO')
    }
  }, [phase])

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
      transition: 'opacity 0.3s ease-out'
    }}>
      {/* Subtle vignette for focus */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center',
        opacity: 1,
        transform: phase === 'reveal' ? 'scale(1)' : phase === 'fade' ? 'scale(0.95)' : 'scale(1.05)',
        transition: 'all 0.3s ease-out'
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
          WebkitTextStroke: phase === 'reveal' ? '1px rgba(0,255,255,0.5)' : 'none'
        }}>
          {glitchText}
        </h1>

        {phase === 'reveal' && (
          <div style={{
            marginTop: '25px',
            fontSize: '20px',
            color: COLORS.gold,
            letterSpacing: '6px',
            textShadow: `0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}`,
            animation: 'fadeInUp 0.4s ease-out'
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
        animation: 'scanLine 1.5s linear infinite',
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
