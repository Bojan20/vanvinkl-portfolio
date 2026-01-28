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
import { uaPlaySynth } from '../audio'

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

  const particleCount = 80 // Reduced for performance (was 200)

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

  const INTRO_DURATION = 5.5 // 5.5 seconds - gives user time to read

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

    // Start fading particles at 3.5s
    const fadeTimer = setTimeout(() => setFadeOutParticles(true), 3500)

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
// ESC/ENTER anytime to skip and never show intro again (localStorage flag)
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
  const [showBurst, setShowBurst] = useState(false) // WOW burst effect when text complete
  const [showSkipHint, setShowSkipHint] = useState(false) // Show skip hint after 2s

  const originalText = 'WELCOME TO VANVINKL CASINO'
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`█▓▒░'

  // Show skip hint after 2 seconds
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setShowSkipHint(true), 2000)
    return () => clearTimeout(timer)
  }, [active])

  // Keyboard skip: ESC or ENTER - ALWAYS available, sets permanent skip flag
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        console.log('[Intro] User skipped intro - completing immediately')
        // Skip intro for this session only (no localStorage persistence)
        setPhase('done')
        onComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, onComplete])

  useEffect(() => {
    if (!active) return

    // Play single clean enter confirmation sound
    uaPlaySynth('select',0.4)

    // Timing for 5.5s total intro - user has time to read
    const phases = [
      { time: 1000, action: () => setPhase('reveal') },
      { time: 3200, action: () => setPhase('hold') },       // Reveal for 2.2s (letter by letter)
      { time: 4500, action: () => setPhase('fade') },       // Hold for 1.3s (read time)
      { time: 5000, action: () => setOpacity(0) },          // Start fading text
      { time: 5500, action: () => {
        setPhase('done')
        onComplete()
      }}
    ]

    const timers = phases.map(p => setTimeout(p.action, p.time))

    return () => timers.forEach(t => clearTimeout(t))
  }, [active, onComplete])

  // Background fade - starts at 2.5s, completes by 4.5s
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
    }, 2500)

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

    return () => {
      clearInterval(interval)
    }
  }, [phase])

  // GRADUAL REVEAL - letters transform one by one from glitch to real
  // Play magic reveal sound when transitioning to hold phase (all letters revealed)
  useEffect(() => {
    if (phase === 'hold') {
      console.log('[Intro] Phase changed to HOLD - playing MagicReveal!')
      uaPlaySynth('magicReveal',0.5)
      setShowBurst(true)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'reveal') {
      if (phase === 'hold' || phase === 'fade') {
        setRevealedChars(originalText.length) // All revealed
      }
      return
    }

    // Reset at start of reveal
    setRevealedChars(0)

    const revealDuration = 2000 // 2 seconds to reveal all letters - slow enough to read
    const intervalMs = 70 // 70ms per letter for visible effect
    let currentChar = 0

    const interval = setInterval(() => {
      currentChar++
      // Play cyber reveal sound for each letter (not for spaces)
      if (originalText[currentChar - 1] !== ' ') {
        uaPlaySynth('cyberReveal',0.25)
      }
      if (currentChar >= originalText.length) {
        setRevealedChars(originalText.length)
        clearInterval(interval)
        // WOW sound is now triggered by phase change to 'hold'
      } else {
        setRevealedChars(currentChar)
      }
    }, intervalMs)

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
          whiteSpace: 'nowrap',
          animation: phase === 'glitch' ? 'glitchShake 0.08s infinite' : 'none',
          filter: phase === 'glitch' ? 'none' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
        }}>
          {phase === 'glitch' ? (
            // Glitch phase - all text glitches
            <span style={{
              color: COLORS.magenta,
              textShadow: `0 0 30px ${COLORS.magenta}, 0 0 60px ${COLORS.magenta}, -4px 0 ${COLORS.cyan}, 4px 0 ${COLORS.purple}, 0 0 100px ${COLORS.magenta}`
            }}>
              {glitchText}
            </span>
          ) : (
            // Reveal phase - letter by letter with individual animations
            <span>
              {originalText.split('').map((char, i) => {
                const isRevealed = i < revealedChars
                const isCurrentlyRevealing = i === revealedChars - 1

                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      color: isRevealed ? 'transparent' : COLORS.magenta,
                      background: isRevealed
                        ? 'linear-gradient(180deg, #ffffff 0%, #c0c0c0 20%, #ffffff 40%, #a0a0a0 60%, #ffffff 80%, #d0d0d0 100%)'
                        : 'none',
                      WebkitBackgroundClip: isRevealed ? 'text' : 'unset',
                      backgroundClip: isRevealed ? 'text' : 'unset',
                      textShadow: isRevealed
                        ? `0 0 40px ${COLORS.cyan}, 0 0 80px ${COLORS.cyan}`
                        : `0 0 20px ${COLORS.magenta}`,
                      transform: isCurrentlyRevealing ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s ease-out',
                      animation: isCurrentlyRevealing ? 'letterPop 0.2s ease-out' : 'none',
                      minWidth: char === ' ' ? '0.4em' : 'auto'
                    }}
                  >
                    {isRevealed ? char : (glitchText[i] || char)}
                  </span>
                )
              })}
            </span>
          )}
        </h1>

        {(phase === 'hold' || phase === 'fade') && (
          <div style={{
            marginTop: '25px',
            fontSize: '20px',
            color: COLORS.gold,
            letterSpacing: '6px',
            textShadow: `0 0 20px ${COLORS.gold}, 0 0 40px ${COLORS.gold}`,
            animation: 'fadeInUp 0.6s ease-out',
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

      {/* Skip hint - visible after 2s delay */}
      {showSkipHint && phase !== 'done' && (
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
          pointerEvents: 'none',
          animation: 'skipHintFadeIn 0.5s ease-out'
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
          to skip (never show again)
        </div>
      )}

      {/* WOW Burst Effect - particle explosion when text completes */}
      {showBurst && (
        <>
          {/* Central flash */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200vw',
            height: '200vh',
            background: 'radial-gradient(circle, rgba(0,255,255,0.4) 0%, rgba(255,0,170,0.2) 30%, transparent 60%)',
            animation: 'burstFlash 0.8s ease-out forwards',
            pointerEvents: 'none'
          }} />

          {/* Ring explosion */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '3px solid #00ffff',
            boxShadow: '0 0 30px #00ffff, 0 0 60px #ff00aa',
            animation: 'burstRing 0.6s ease-out forwards',
            pointerEvents: 'none'
          }} />

          {/* Second ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '2px solid #ff00aa',
            boxShadow: '0 0 20px #ff00aa',
            animation: 'burstRing 0.8s ease-out 0.1s forwards',
            pointerEvents: 'none'
          }} />

          {/* Sparkle particles */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2
            const distance = 150 + Math.random() * 100
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance
            const delay = Math.random() * 0.2
            const size = 4 + Math.random() * 6

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? '#00ffff' : '#ff00aa',
                  boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? '#00ffff' : '#ff00aa'}`,
                  animation: `burstParticle 0.8s ease-out ${delay}s forwards`,
                  '--tx': `${x}px`,
                  '--ty': `${y}px`
                } as React.CSSProperties}
              />
            )
          })}

          {/* Horizontal light streaks */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00ffff, #ff00aa, #00ffff, transparent)',
            animation: 'burstStreak 0.5s ease-out forwards',
            pointerEvents: 'none'
          }} />
        </>
      )}

      <style>{`
        @keyframes burstFlash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes burstRing {
          0% { width: 10px; height: 10px; opacity: 1; }
          100% { width: 800px; height: 800px; opacity: 0; border-width: 1px; }
        }
        @keyframes burstParticle {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
        @keyframes burstStreak {
          0% { transform: scaleX(0); opacity: 1; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
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
        @keyframes letterPop {
          0% { transform: scale(0.5); opacity: 0; filter: blur(4px); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes scanLine {
          0% { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes skipHintFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes liquidMetalShimmer {
          0% {
            background-position: 0% 50%;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) brightness(1);
          }
          25% {
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) brightness(1.1);
          }
          50% {
            background-position: 100% 50%;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) brightness(1.15);
          }
          75% {
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) brightness(1.05);
          }
          100% {
            background-position: 0% 50%;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) brightness(1);
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
      `}</style>
    </div>
  )
}
