/**
 * ParticleEffects - GPU-accelerated particle systems
 *
 * Extracted from SlotFullScreen.tsx for better organization.
 * All effects use GPU compositing (will-change, transform3d) for 60fps performance.
 */

import React, { useMemo, memo } from 'react'

// GPU-ACCELERATED COLOR CONSTANTS
const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff',
  gold: '#ffd700',
  green: '#00ff88'
}

// ============================================
// COIN RAIN EFFECT
// ============================================
export const CoinRain = memo(function CoinRain({ active }: { active: boolean }) {
  // Pre-computed coins array - stable reference
  const coins = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1,
      size: 20 + Math.random() * 15,
      rotation: Math.random() * 360
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 200,
      contain: 'strict' // Full CSS containment
    }}>
      {coins.map(coin => (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            left: `${coin.x}%`,
            top: '-50px',
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${COLORS.gold}, #b8860b, #8b6914)`,
            boxShadow: `0 0 10px ${COLORS.gold}, inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.3)`,
            animation: `coinFall ${coin.duration}s ease-in ${coin.delay}s infinite`,
            willChange: 'transform',
            transform: 'translateZ(0)',
            '--rotation': `${coin.rotation}deg`
          } as React.CSSProperties}
        >
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${coin.size * 0.5}px`,
            color: '#8b6914',
            fontWeight: 'bold',
            textShadow: '1px 1px 0 #ffd700'
          }}>$</div>
        </div>
      ))}
    </div>
  )
})

// ============================================
// PARTICLE BURST EFFECT
// ============================================
export const ParticleBurst = memo(function ParticleBurst({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      angle: (i / 50) * 360 + Math.random() * 10,
      distance: 200 + Math.random() * 400,
      size: 4 + Math.random() * 10,
      delay: Math.random() * 0.2
    })),
    []
  )

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      pointerEvents: 'none',
      zIndex: 100,
      contain: 'strict'
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
            animation: `particleFly 0.8s ease-out ${p.delay}s forwards`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            '--angle': `${p.angle}deg`,
            '--distance': `${p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
})

// ============================================
// WIN SPARKLES EFFECT
// ============================================
export const WinSparkles = memo(function WinSparkles({ active, color = '#00ffff' }: { active: boolean, color?: string }) {
  const sparkles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 1.5
    })),
    []
  )

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 150
    }}>
      {sparkles.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${s.size * 3}px ${color}, 0 0 ${s.size * 6}px ${color}50`,
            animation: `sparkleFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: 0.8
          }}
        />
      ))}
      <style>{`
        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) scale(1.5);
            opacity: 0.8;
          }
          80% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
})
