/**
 * Slot Transition - Immersive slot machine entry animation
 *
 * When player spins:
 * 1. Camera zooms into the reels (0.8s)
 * 2. Themed symbols spin and land (1.2s)
 * 3. Screen fills with glow, opens modal
 *
 * Each slot has unique themed symbols!
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

// THEMED SYMBOLS for each slot machine - makes each unique!
export const SLOT_SYMBOLS: Record<string, { symbols: string[], colors: string[] }> = {
  skills: {
    symbols: ['⚡', '🔧', '💻', '🎯', '⚙️'],
    colors: ['#00ffff', '#ffd700', '#ff00aa', '#00ff88', '#8844ff']
  },
  services: {
    symbols: ['🎰', '🎮', '🌐', '📱', '🔨'],
    colors: ['#ffd700', '#ff00aa', '#00ffff', '#00ff88', '#8844ff']
  },
  about: {
    symbols: ['👨‍💻', '🏆', '🌍', '💬', '✨'],
    colors: ['#00ffff', '#ffd700', '#8844ff', '#ff00aa', '#00ff88']
  },
  projects: {
    symbols: ['🎰', '🃏', '🎮', '📊', '🔧'],
    colors: ['#ff00aa', '#ffd700', '#00ffff', '#8844ff', '#00ff88']
  },
  experience: {
    symbols: ['🏢', '🎰', '🌐', '🎓', '📜'],
    colors: ['#8844ff', '#ffd700', '#00ffff', '#ff00aa', '#00ff88']
  },
  contact: {
    symbols: ['📧', '💼', '🐙', '🌐', '📱'],
    colors: ['#00ffff', '#8844ff', '#ffd700', '#ff00aa', '#00ff88']
  }
}

interface SlotTransitionProps {
  active: boolean
  machineId: string
  machinePosition: [number, number, number]
  onComplete: () => void
}

// 3D Transition component that renders in the scene
export function SlotTransition3D({
  active,
  machineId,
  machinePosition,
  onComplete
}: SlotTransitionProps) {
  const { camera } = useThree()
  const startTime = useRef(0)
  const phase = useRef<'zoom' | 'spin' | 'glow' | 'done'>('zoom')
  const completed = useRef(false)

  // Store original camera position to restore later
  const originalCamPos = useRef(new THREE.Vector3())
  const originalCamLookAt = useRef(new THREE.Vector3())

  // Reel animation state
  const reelOffsets = useRef([0, 0, 0])
  const reelStopped = useRef([false, false, false])

  // Get themed symbols for this machine
  const themedSymbols = SLOT_SYMBOLS[machineId] || SLOT_SYMBOLS.skills

  useEffect(() => {
    if (active && !completed.current) {
      startTime.current = Date.now()
      phase.current = 'zoom'
      reelOffsets.current = [0, 0, 0]
      reelStopped.current = [false, false, false]

      // Store current camera position
      originalCamPos.current.copy(camera.position)
      originalCamLookAt.current.set(
        machinePosition[0],
        1.5,
        machinePosition[2] - 3
      )
    }
  }, [active, camera, machinePosition])

  useFrame(() => {
    if (!active || completed.current) return

    const elapsed = (Date.now() - startTime.current) / 1000

    // Target: center of the reel window (y=2.9, z slightly in front)
    const targetPos = new THREE.Vector3(
      machinePosition[0],
      2.9,
      machinePosition[2] + 3 // In front of machine
    )
    const reelCenter = new THREE.Vector3(
      machinePosition[0],
      2.9,
      machinePosition[2] + 0.7 // Reel window position
    )

    // PHASE 1: Zoom into reels (0-0.8s)
    if (elapsed < 0.8) {
      phase.current = 'zoom'
      const progress = elapsed / 0.8
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out

      // Zoom camera from current position to just in front of reels
      camera.position.lerpVectors(originalCamPos.current, targetPos, eased)
      camera.lookAt(reelCenter)
    }
    // PHASE 2: Spin reels (0.8s - 2.0s)
    else if (elapsed < 2.0) {
      phase.current = 'spin'
      const spinElapsed = elapsed - 0.8

      // Spin each reel, stop sequentially
      const stopTimes = [0.5, 0.8, 1.1] // When each reel stops

      for (let i = 0; i < 3; i++) {
        if (spinElapsed < stopTimes[i]) {
          // Still spinning - fast rotation
          const speed = 15 - (spinElapsed / stopTimes[i]) * 10 // Slow down
          reelOffsets.current[i] += speed * 0.016 // ~60fps
        } else if (!reelStopped.current[i]) {
          // Snap to final position (matching symbol)
          reelOffsets.current[i] = Math.round(reelOffsets.current[i] / (Math.PI * 2 / 5)) * (Math.PI * 2 / 5)
          reelStopped.current[i] = true
        }
      }

      // Keep camera at target
      camera.position.copy(targetPos)
      camera.lookAt(reelCenter)
    }
    // PHASE 3: Glow and complete (2.0s - 2.3s)
    else if (elapsed < 2.3) {
      phase.current = 'glow'
      // Camera holds position
      camera.position.copy(targetPos)
      camera.lookAt(reelCenter)
    }
    // DONE
    else if (!completed.current) {
      completed.current = true
      phase.current = 'done'
      onComplete()
    }
  })

  if (!active || phase.current === 'done') return null

  return (
    <group position={[machinePosition[0], 2.9, machinePosition[2] + 0.73]}>
      {/* 3 Large spinning reels with themed symbols */}
      {[0, 1, 2].map(reelIdx => (
        <group
          key={`reel-${reelIdx}`}
          position={[(reelIdx - 1) * 0.8, 0, 0]}
          rotation={[reelOffsets.current[reelIdx], 0, 0]}
        >
          {themedSymbols.symbols.map((symbol, symIdx) => {
            const angle = (symIdx / themedSymbols.symbols.length) * Math.PI * 2
            const color = themedSymbols.colors[symIdx]
            return (
              <mesh
                key={`sym-${symIdx}`}
                position={[0, Math.sin(angle) * 0.6, Math.cos(angle) * 0.3]}
                rotation={[-angle, 0, 0]}
              >
                <planeGeometry args={[0.5, 0.5]} />
                <meshBasicMaterial transparent opacity={0.9}>
                  {/* Symbol rendered as text in overlay */}
                </meshBasicMaterial>
              </mesh>
            )
          })}
        </group>
      ))}

      {/* Glow effect during final phase */}
      {phase.current === 'glow' && (
        <mesh position={[0, 0, 0.5]}>
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial
            color={themedSymbols.colors[0]}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}

// Particle burst component
function ParticleBurst({ color, count = 20 }: { color: string; count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360 + Math.random() * 30,
      distance: 150 + Math.random() * 200,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 0.2
    })),
    [count]
  )

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      pointerEvents: 'none'
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            animation: `particleBurst 0.8s ease-out ${p.delay}s forwards`,
            '--angle': `${p.angle}deg`,
            '--distance': `${p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Glitch line component
function GlitchLines({ active, color }: { active: boolean; color: string }) {
  const lines = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      width: `${30 + Math.random() * 70}%`,
      height: `${1 + Math.random() * 3}px`,
      left: `${Math.random() * 30}%`,
      delay: Math.random() * 0.3
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {lines.map(l => (
        <div
          key={l.id}
          style={{
            position: 'absolute',
            top: l.top,
            left: l.left,
            width: l.width,
            height: l.height,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            animation: `glitchLine 0.15s linear ${l.delay}s infinite`,
            opacity: 0.7
          }}
        />
      ))}
    </div>
  )
}

// HTML Overlay for the transition effect
export function SlotTransitionOverlay({
  active,
  machineId,
  onPhaseChange
}: {
  active: boolean
  machineId: string
  onPhaseChange?: (phase: string) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'zoom' | 'spin' | 'match' | 'glow' | 'burst'>('idle')
  const [reels, setReels] = useState([0, 0, 0])
  const [matchedSymbol, setMatchedSymbol] = useState('')
  const [opacity, setOpacity] = useState(0)
  const [shake, setShake] = useState(false)
  const [stoppedReels, setStoppedReels] = useState([false, false, false])

  const themedSymbols = SLOT_SYMBOLS[machineId] || SLOT_SYMBOLS.skills

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      setOpacity(0)
      setShake(false)
      setStoppedReels([false, false, false])
      return
    }

    // Phase timeline - more dramatic
    const timeline = [
      { time: 0, action: () => { setPhase('zoom'); setOpacity(0.4) } },
      { time: 600, action: () => { setPhase('spin'); setOpacity(0.6) } },
      // Sequential reel stops with shake
      { time: 1200, action: () => { setStoppedReels([true, false, false]); setShake(true) } },
      { time: 1250, action: () => setShake(false) },
      { time: 1500, action: () => { setStoppedReels([true, true, false]); setShake(true) } },
      { time: 1550, action: () => setShake(false) },
      { time: 1800, action: () => {
        setStoppedReels([true, true, true])
        setShake(true)
        setPhase('match')
        const mainSymbol = themedSymbols.symbols[0]
        setMatchedSymbol(mainSymbol)
        setReels([0, 0, 0])
      }},
      { time: 1900, action: () => setShake(false) },
      { time: 2000, action: () => { setPhase('burst'); setOpacity(0.85) } },
      { time: 2200, action: () => { setPhase('glow'); setOpacity(0.9) } },
      { time: 2400, action: () => { setOpacity(0) } }
    ]

    const timers = timeline.map(t => setTimeout(t.action, t.time))

    // Spin animation
    let spinInterval: number | undefined
    if (active) {
      spinInterval = window.setInterval(() => {
        setReels(prev => prev.map((_, i) =>
          stoppedReels[i] ? 0 : Math.floor(Math.random() * themedSymbols.symbols.length)
        ))
      }, 60) // Faster spin

      // Stop spinning after 1.8s
      setTimeout(() => {
        if (spinInterval) clearInterval(spinInterval)
      }, 1800)
    }

    return () => {
      timers.forEach(t => clearTimeout(t))
      if (spinInterval) clearInterval(spinInterval)
    }
  }, [active, machineId, themedSymbols.symbols])

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  if (!active || phase === 'idle') return null

  const primaryColor = themedSymbols.colors[0]

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
      backgroundColor: `rgba(5, 3, 15, ${opacity})`,
      zIndex: 900,
      pointerEvents: 'none',
      transition: 'background-color 0.15s ease',
      animation: shake ? 'screenShake 0.1s ease-in-out' : 'none'
    }}>
      {/* Glitch lines during spin */}
      <GlitchLines active={phase === 'spin'} color={primaryColor} />

      {/* Vignette effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Spinning reels display */}
      {(phase === 'spin' || phase === 'match' || phase === 'burst') && (
        <div style={{
          display: 'flex',
          gap: '20px',
          transform: phase === 'match' || phase === 'burst' ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {reels.map((symbolIdx, i) => {
            const isThisReelStopped = stoppedReels[i]
            const isAllMatch = phase === 'match' || phase === 'burst'

            return (
              <div
                key={i}
                style={{
                  width: '110px',
                  height: '130px',
                  background: `linear-gradient(180deg,
                    ${isThisReelStopped ? '#1a1a35' : '#101020'} 0%,
                    ${isThisReelStopped ? '#252545' : '#1a1a30'} 50%,
                    ${isThisReelStopped ? '#1a1a35' : '#101020'} 100%)`,
                  border: `3px solid ${isAllMatch ? COLORS.gold : isThisReelStopped ? '#00ff88' : COLORS.cyan}`,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px',
                  boxShadow: isAllMatch
                    ? `0 0 50px ${COLORS.gold}, 0 0 100px ${COLORS.gold}50, inset 0 0 30px ${COLORS.gold}20`
                    : isThisReelStopped
                      ? `0 0 30px #00ff8860, inset 0 0 20px #00ff8810`
                      : `0 0 25px ${COLORS.cyan}50`,
                  animation: !isThisReelStopped ? 'reelSpin 0.08s infinite' : 'reelStop 0.15s ease-out',
                  animationDelay: `${i * 0.02}s`,
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
              >
                {isAllMatch ? matchedSymbol : themedSymbols.symbols[symbolIdx]}
              </div>
            )
          })}
        </div>
      )}

      {/* Match text with enhanced effect */}
      {(phase === 'match' || phase === 'burst') && (
        <div style={{
          position: 'absolute',
          bottom: '22%',
          fontSize: '38px',
          fontWeight: 900,
          color: COLORS.gold,
          textShadow: `
            0 0 20px ${COLORS.gold},
            0 0 40px ${COLORS.gold},
            0 0 80px ${COLORS.gold}80,
            0 2px 0 #cc9900
          `,
          letterSpacing: '12px',
          animation: 'matchPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          JACKPOT!
        </div>
      )}

      {/* Particle burst on match */}
      {phase === 'burst' && (
        <ParticleBurst color={COLORS.gold} count={30} />
      )}

      {/* Glow flash - enhanced */}
      {phase === 'glow' && (
        <>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle, ${primaryColor}80 0%, ${primaryColor}40 30%, transparent 70%)`,
            animation: 'glowFlash 0.25s ease-out'
          }} />
          {/* Scan lines */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
            animation: 'scanLines 0.5s linear'
          }} />
        </>
      )}

      <style>{`
        @keyframes reelSpin {
          0% { transform: translateY(-8px) rotateX(-10deg); }
          50% { transform: translateY(8px) rotateX(10deg); }
          100% { transform: translateY(-8px) rotateX(-10deg); }
        }
        @keyframes reelStop {
          0% { transform: translateY(10px) scale(1.05); }
          60% { transform: translateY(-5px) scale(0.98); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes matchPulse {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes glowFlash {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-5px, 2px); }
          50% { transform: translate(5px, -2px); }
          75% { transform: translate(-3px, -3px); }
        }
        @keyframes particleBurst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0);
            opacity: 0;
          }
        }
        @keyframes glitchLine {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 0.8; transform: translateX(100%); }
        }
        @keyframes scanLines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  )
}
