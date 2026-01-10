/**
 * INTRO SEQUENCE - WOW Entry Animation
 *
 * - Camera fly-in from far away
 * - Glitch text "WELCOME TO VANVINKL CASINO"
 * - Avatar teleport particle effect
 * - Full cyberpunk experience
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700'
}

// Teleport particles around avatar spawn point
function TeleportParticles({ active, position }: { active: boolean, position: [number, number, number] }) {
  const particlesRef = useRef<THREE.Points>(null!)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const lifetimesRef = useRef<Float32Array | null>(null)

  const particleCount = 200

  const { positions, colors } = React.useMemo(() => {
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

    return { positions, colors }
  }, [position])

  useFrame((_, delta) => {
    if (!active || !particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return

    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
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
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
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

  const INTRO_DURATION = 3.5 // seconds

  // Camera path: start far above and behind, sweep down to final position
  const startPos = useRef(new THREE.Vector3(0, 40, 60))
  const endPos = useRef(new THREE.Vector3(0, 5, 18))
  const startLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const endLookAt = useRef(new THREE.Vector3(0, 1.5, 7))

  useEffect(() => {
    // Trigger particles at 2 seconds
    const particleTimer = setTimeout(() => setShowParticles(true), 2000)

    // End intro
    const endTimer = setTimeout(() => {
      setShowParticles(false)
      onComplete()
    }, INTRO_DURATION * 1000)

    return () => {
      clearTimeout(particleTimer)
      clearTimeout(endTimer)
    }
  }, [onComplete])

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = Math.min(elapsed / INTRO_DURATION, 1)

    // Easing - dramatic ease out
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate camera position
    camera.position.lerpVectors(startPos.current, endPos.current, eased)

    // Interpolate look-at
    const lookAt = new THREE.Vector3().lerpVectors(startLookAt.current, endLookAt.current, eased)
    camera.lookAt(lookAt)
  })

  return <TeleportParticles active={showParticles} position={avatarSpawnPosition} />
}

// HTML Overlay for glitch text
export function IntroOverlay({
  active,
  onComplete
}: {
  active: boolean
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<'black' | 'glitch' | 'reveal' | 'fade'>('black')
  const [glitchText, setGlitchText] = useState('WELCOME TO VANVINKL CASINO')

  useEffect(() => {
    if (!active) return

    // Phase timing
    const phases = [
      { time: 300, phase: 'glitch' as const },
      { time: 1500, phase: 'reveal' as const },
      { time: 2800, phase: 'fade' as const },
      { time: 3500, phase: 'done' as const }
    ]

    const timers = phases.map(p =>
      setTimeout(() => {
        if (p.phase === 'done') {
          onComplete()
        } else {
          setPhase(p.phase)
        }
      }, p.time)
    )

    return () => timers.forEach(t => clearTimeout(t))
  }, [active, onComplete])

  // Glitch effect
  useEffect(() => {
    if (phase !== 'glitch') return

    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`█▓▒░'
    const originalText = 'WELCOME TO VANVINKL CASINO'

    const interval = setInterval(() => {
      let newText = ''
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() < 0.3) {
          newText += glitchChars[Math.floor(Math.random() * glitchChars.length)]
        } else {
          newText += originalText[i]
        }
      }
      setGlitchText(newText)
    }, 50)

    return () => clearInterval(interval)
  }, [phase])

  // Reset to real text on reveal
  useEffect(() => {
    if (phase === 'reveal') {
      setGlitchText('WELCOME TO VANVINKL CASINO')
    }
  }, [phase])

  if (!active) return null

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
      backgroundColor: phase === 'fade' ? 'transparent' : 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      transition: 'background-color 0.7s ease-out',
      pointerEvents: 'none'
    }}>
      <div style={{
        textAlign: 'center',
        opacity: phase === 'black' ? 0 : phase === 'fade' ? 0 : 1,
        transform: phase === 'reveal' ? 'scale(1)' : 'scale(1.1)',
        transition: 'all 0.3s ease-out'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(28px, 6vw, 72px)',
          fontFamily: '"Orbitron", "Rajdhani", system-ui, sans-serif',
          fontWeight: 900,
          letterSpacing: '8px',
          color: phase === 'glitch' ? COLORS.magenta : COLORS.cyan,
          textShadow: phase === 'glitch'
            ? `0 0 20px ${COLORS.magenta}, 0 0 40px ${COLORS.magenta}, -3px 0 ${COLORS.cyan}, 3px 0 ${COLORS.purple}`
            : `0 0 30px ${COLORS.cyan}, 0 0 60px ${COLORS.cyan}, 0 0 100px ${COLORS.cyan}`,
          animation: phase === 'glitch' ? 'glitchShake 0.1s infinite' : 'none',
          whiteSpace: 'nowrap'
        }}>
          {glitchText}
        </h1>

        {phase === 'reveal' && (
          <div style={{
            marginTop: '20px',
            fontSize: '18px',
            color: COLORS.purple,
            letterSpacing: '4px',
            opacity: 0.8,
            animation: 'fadeIn 0.5s ease-out'
          }}>
            PORTFOLIO EXPERIENCE
          </div>
        )}
      </div>

      {/* Scanlines effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      <style>{`
        @keyframes glitchShake {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 0.8; transform: translateY(0); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
      `}</style>
    </div>
  )
}

// Need React import for useMemo
import React from 'react'
