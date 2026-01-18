/**
 * Slot Transition - JACKPOT CAMERA RUSH
 *
 * Ultimate WOW entry animation:
 * 1. Camera RUSH through slot glass (0.4s)
 * 2. Impact shake + chromatic aberration (0.2s)
 * 3. Reel spin with sequential stops (1.2s)
 * 4. JACKPOT burst + particle explosion (0.5s)
 * 5. Geometric metamorphosis - pieces float and orbit (0.2s)
 * 6. Full screen takeover - content reveal
 *
 * Total: 2.5s of pure WOW
 */

import { useState, useEffect, useRef, useMemo } from 'react'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700',
  white: '#ffffff'
}

// THEMED SYMBOLS for each slot machine
export const SLOT_SYMBOLS: Record<string, { symbols: string[], colors: string[], icon: string }> = {
  skills: {
    symbols: ['⚡', '🔧', '💻', '🎯', '⚙️'],
    colors: ['#00ffff', '#ffd700', '#ff00aa', '#00ff88', '#8844ff'],
    icon: '⚡'
  },
  services: {
    symbols: ['🎰', '🎮', '🌐', '📱', '🔨'],
    colors: ['#ffd700', '#ff00aa', '#00ffff', '#00ff88', '#8844ff'],
    icon: '🎰'
  },
  about: {
    symbols: ['👨‍💻', '🏆', '🌍', '💬', '✨'],
    colors: ['#00ffff', '#ffd700', '#8844ff', '#ff00aa', '#00ff88'],
    icon: '👨‍💻'
  },
  projects: {
    symbols: ['🎰', '🃏', '🎮', '📊', '🔧'],
    colors: ['#ff00aa', '#ffd700', '#00ffff', '#8844ff', '#00ff88'],
    icon: '🎰'
  },
  experience: {
    symbols: ['🏢', '🎰', '🌐', '🎓', '📜'],
    colors: ['#8844ff', '#ffd700', '#00ffff', '#ff00aa', '#00ff88'],
    icon: '🏢'
  },
  contact: {
    symbols: ['📧', '💼', '🐙', '🌐', '📱'],
    colors: ['#00ffff', '#8844ff', '#ffd700', '#ff00aa', '#00ff88'],
    icon: '📧'
  }
}

// ============================================
// PARTICLE BURST - Explosive celebration
// ============================================
function ParticleBurst({ color, count = 40, active }: { color: string; count?: number; active: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360 + Math.random() * 20,
      distance: 200 + Math.random() * 300,
      size: 4 + Math.random() * 12,
      delay: Math.random() * 0.15,
      duration: 0.6 + Math.random() * 0.4
    })),
    [count]
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${p.size * 3}px ${color}`,
            animation: `particleExplode ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            '--angle': `${p.angle}deg`,
            '--distance': `${p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ============================================
// GLITCH LINES - Cyberpunk effect
// ============================================
function GlitchLines({ active, color, intensity = 1 }: { active: boolean; color: string; intensity?: number }) {
  const lines = useMemo(() =>
    Array.from({ length: Math.floor(12 * intensity) }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      width: `${40 + Math.random() * 60}%`,
      height: `${1 + Math.random() * 4}px`,
      left: `${Math.random() * 20}%`,
      delay: Math.random() * 0.2,
      speed: 0.08 + Math.random() * 0.08
    })),
    [intensity]
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
      pointerEvents: 'none',
      zIndex: 950
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
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 15px ${color}`,
            animation: `glitchSweep ${l.speed}s linear ${l.delay}s infinite`,
            opacity: 0.8
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// CHROMATIC ABERRATION - RGB split effect
// ============================================
function ChromaticPulse({ active, intensity = 1 }: { active: boolean; intensity?: number }) {
  if (!active) return null

  return (
    <>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 0, 100, 0.15)',
        transform: `translateX(${-4 * intensity}px)`,
        mixBlendMode: 'screen',
        animation: 'chromaticPulse 0.15s ease-out forwards',
        pointerEvents: 'none',
        zIndex: 940
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 255, 255, 0.15)',
        transform: `translateX(${4 * intensity}px)`,
        mixBlendMode: 'screen',
        animation: 'chromaticPulse 0.15s ease-out forwards',
        pointerEvents: 'none',
        zIndex: 940
      }} />
    </>
  )
}

// ============================================
// SPEED LINES - Camera rush effect
// ============================================
function SpeedLines({ active, color }: { active: boolean; color: string }) {
  const lines = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      angle: (i / 30) * 360,
      length: 150 + Math.random() * 200,
      delay: Math.random() * 0.1,
      width: 1 + Math.random() * 2
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      pointerEvents: 'none',
      zIndex: 960
    }}>
      {lines.map(l => (
        <div
          key={l.id}
          style={{
            position: 'absolute',
            width: `${l.length}px`,
            height: `${l.width}px`,
            background: `linear-gradient(90deg, transparent, ${color}, ${color})`,
            transformOrigin: '0 50%',
            transform: `rotate(${l.angle}deg)`,
            animation: `speedLineIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${l.delay}s forwards`,
            opacity: 0
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// GEOMETRIC PIECES - Metamorphosis effect
// ============================================
function GeometricPieces({ active, color }: { active: boolean; color: string }) {
  const pieces = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => {
      const row = Math.floor(i / 4)
      const col = i % 4
      return {
        id: i,
        startX: (col - 1.5) * 120,
        startY: (row - 1.5) * 100,
        endX: (col - 1.5) * 280 + (Math.random() - 0.5) * 100,
        endY: (row - 1.5) * 220 + (Math.random() - 0.5) * 100,
        rotation: Math.random() * 720 - 360,
        scale: 0.3 + Math.random() * 0.4,
        delay: i * 0.02
      }
    }),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      pointerEvents: 'none',
      zIndex: 970
    }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: '100px',
            height: '80px',
            background: `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`,
            border: `1px solid ${color}60`,
            backdropFilter: 'blur(4px)',
            transform: `translate(${p.startX}px, ${p.startY}px) rotate(0deg) scale(1)`,
            animation: `pieceFloat 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            '--endX': `${p.endX}px`,
            '--endY': `${p.endY}px`,
            '--rotation': `${p.rotation}deg`,
            '--scale': p.scale
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ============================================
// REEL COMPONENT - Individual spinning reel
// ============================================
function SpinningReel({
  symbols,
  colors,
  stopped,
  matchSymbol,
  index,
  isMatch
}: {
  symbols: string[]
  colors: string[]
  stopped: boolean
  matchSymbol: string
  index: number
  isMatch: boolean
}) {
  const [currentSymbol, setCurrentSymbol] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stopped) {
      // Fast spinning
      intervalRef.current = window.setInterval(() => {
        setCurrentSymbol(Math.floor(Math.random() * symbols.length))
      }, 50)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [stopped, symbols.length])

  const displaySymbol = stopped ? matchSymbol : symbols[currentSymbol]
  const displayColor = stopped ? COLORS.gold : colors[currentSymbol]

  return (
    <div
      style={{
        width: '120px',
        height: '140px',
        background: stopped
          ? 'linear-gradient(180deg, #1a1a40 0%, #2a2a60 50%, #1a1a40 100%)'
          : 'linear-gradient(180deg, #101025 0%, #1a1a35 50%, #101025 100%)',
        border: `3px solid ${isMatch ? COLORS.gold : stopped ? '#00ff88' : COLORS.cyan}`,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '64px',
        boxShadow: isMatch
          ? `0 0 60px ${COLORS.gold}, 0 0 120px ${COLORS.gold}50, inset 0 0 40px ${COLORS.gold}20`
          : stopped
            ? `0 0 40px #00ff8860, inset 0 0 25px #00ff8815`
            : `0 0 30px ${COLORS.cyan}50, inset 0 0 20px ${COLORS.cyan}10`,
        animation: !stopped
          ? `reelSpin 0.06s infinite`
          : `reelLand 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)`,
        transform: isMatch ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, box-shadow 0.3s'
      }}
    >
      <span style={{
        filter: stopped ? 'none' : 'blur(2px)',
        textShadow: isMatch ? `0 0 30px ${COLORS.gold}` : 'none'
      }}>
        {displaySymbol}
      </span>
    </div>
  )
}

// ============================================
// MAIN OVERLAY COMPONENT
// ============================================
export function SlotTransitionOverlay({
  active,
  machineId,
  onPhaseChange
}: {
  active: boolean
  machineId: string
  onPhaseChange?: (phase: string) => void
}) {
  const [phase, setPhase] = useState<
    'idle' | 'rush' | 'impact' | 'spin' | 'stop1' | 'stop2' | 'stop3' | 'match' | 'burst' | 'metamorphosis' | 'fade'
  >('idle')
  const [shake, setShake] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [opacity, setOpacity] = useState(0)

  const themedSymbols = SLOT_SYMBOLS[machineId] || SLOT_SYMBOLS.skills
  const primaryColor = themedSymbols.colors[0]
  const matchSymbol = themedSymbols.icon

  // Phase timeline - optimized for WOW factor
  useEffect(() => {
    if (!active) {
      setPhase('idle')
      setShake(false)
      setZoom(1)
      setOpacity(0)
      return
    }

    // PHASE TIMELINE - Total 2.5s
    const timeline = [
      // 0-400ms: CAMERA RUSH
      { time: 0, action: () => { setPhase('rush'); setOpacity(0.3); setZoom(0.5) } },
      { time: 150, action: () => setZoom(0.8) },
      { time: 300, action: () => setZoom(1.1) },

      // 400-600ms: IMPACT
      { time: 400, action: () => { setPhase('impact'); setShake(true); setZoom(1); setOpacity(0.7) } },
      { time: 550, action: () => setShake(false) },

      // 600-1800ms: REEL SPIN + SEQUENTIAL STOPS
      { time: 600, action: () => { setPhase('spin'); setOpacity(0.85) } },
      { time: 1000, action: () => { setPhase('stop1'); setShake(true) } },
      { time: 1050, action: () => setShake(false) },
      { time: 1200, action: () => { setPhase('stop2'); setShake(true) } },
      { time: 1250, action: () => setShake(false) },
      { time: 1400, action: () => { setPhase('stop3'); setShake(true) } },
      { time: 1500, action: () => setShake(false) },

      // 1800-2000ms: MATCH + BURST
      { time: 1800, action: () => { setPhase('match'); setZoom(1.05) } },
      { time: 1900, action: () => { setPhase('burst'); setShake(true) } },
      { time: 2000, action: () => { setShake(false); setZoom(1) } },

      // 2000-2300ms: METAMORPHOSIS
      { time: 2100, action: () => { setPhase('metamorphosis'); setOpacity(0.9) } },

      // 2300-2500ms: FADE OUT
      { time: 2300, action: () => { setPhase('fade'); setOpacity(0) } }
    ]

    const timers = timeline.map(t => setTimeout(t.action, t.time))
    return () => timers.forEach(t => clearTimeout(t))
  }, [active])

  // Notify parent of phase changes
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  if (!active && phase === 'idle') return null

  const isSpinning = ['spin', 'stop1', 'stop2', 'stop3'].includes(phase)
  const showReels = ['spin', 'stop1', 'stop2', 'stop3', 'match', 'burst'].includes(phase)
  const isMatch = ['match', 'burst'].includes(phase)

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
      animation: shake ? 'screenShake 0.08s ease-in-out infinite' : 'none',
      transform: `scale(${zoom})`,
      transformOrigin: 'center center'
    }}>

      {/* SPEED LINES - Camera rush */}
      <SpeedLines active={phase === 'rush'} color={primaryColor} />

      {/* CHROMATIC ABERRATION - Impact */}
      <ChromaticPulse active={phase === 'impact'} intensity={1.5} />

      {/* GLITCH LINES - During spin */}
      <GlitchLines active={isSpinning} color={primaryColor} intensity={0.8} />

      {/* VIGNETTE - Always visible when active */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.9) 100%)',
        pointerEvents: 'none',
        zIndex: 910
      }} />

      {/* SPINNING REELS */}
      {showReels && (
        <div style={{
          display: 'flex',
          gap: '24px',
          transform: isMatch ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 980
        }}>
          {[0, 1, 2].map(i => (
            <SpinningReel
              key={i}
              symbols={themedSymbols.symbols}
              colors={themedSymbols.colors}
              stopped={
                phase === 'stop1' ? i === 0 :
                phase === 'stop2' ? i <= 1 :
                phase === 'stop3' || isMatch ? true : false
              }
              matchSymbol={matchSymbol}
              index={i}
              isMatch={isMatch}
            />
          ))}
        </div>
      )}

      {/* JACKPOT TEXT */}
      {isMatch && (
        <div style={{
          position: 'absolute',
          bottom: '20%',
          fontSize: '48px',
          fontWeight: 900,
          color: COLORS.gold,
          textShadow: `
            0 0 30px ${COLORS.gold},
            0 0 60px ${COLORS.gold},
            0 0 120px ${COLORS.gold}60,
            0 4px 0 #cc9900
          `,
          letterSpacing: '16px',
          animation: 'jackpotReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 990
        }}>
          JACKPOT!
        </div>
      )}

      {/* PARTICLE BURST - On match */}
      <ParticleBurst color={COLORS.gold} count={50} active={phase === 'burst'} />

      {/* GEOMETRIC METAMORPHOSIS */}
      <GeometricPieces active={phase === 'metamorphosis'} color={primaryColor} />

      {/* FINAL GLOW FLASH */}
      {phase === 'fade' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle, ${primaryColor}60 0%, transparent 70%)`,
          animation: 'glowFlashOut 0.3s ease-out forwards',
          zIndex: 999
        }} />
      )}

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) scale(${zoom}); }
          20% { transform: translate(-6px, 3px) scale(${zoom}); }
          40% { transform: translate(6px, -3px) scale(${zoom}); }
          60% { transform: translate(-4px, -4px) scale(${zoom}); }
          80% { transform: translate(4px, 4px) scale(${zoom}); }
        }

        @keyframes reelSpin {
          0% { transform: translateY(-10px) rotateX(-15deg); }
          50% { transform: translateY(10px) rotateX(15deg); }
          100% { transform: translateY(-10px) rotateX(-15deg); }
        }

        @keyframes reelLand {
          0% { transform: translateY(15px) scale(1.08); }
          50% { transform: translateY(-8px) scale(0.96); }
          75% { transform: translateY(4px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }

        @keyframes jackpotReveal {
          0% { transform: scale(0.3) translateY(30px); opacity: 0; }
          50% { transform: scale(1.15) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes particleExplode {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0);
            opacity: 0;
          }
        }

        @keyframes glitchSweep {
          0%, 100% { opacity: 0; transform: translateX(-120%); }
          50% { opacity: 0.9; transform: translateX(120%); }
        }

        @keyframes speedLineIn {
          0% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(1); }
        }

        @keyframes pieceFloat {
          0% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--endX), var(--endY)) rotate(var(--rotation)) scale(var(--scale));
            opacity: 0;
          }
        }

        @keyframes chromaticPulse {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes glowFlashOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

// Legacy exports for compatibility
export function SlotTransition3D() {
  return null // Deprecated - using overlay only
}
