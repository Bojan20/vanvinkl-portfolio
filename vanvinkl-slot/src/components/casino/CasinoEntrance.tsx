'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface CasinoEntranceProps {
  onComplete: () => void
}

/**
 * Vegas Casino Grand Entrance
 *
 * Cinematic "doors opening" reveal with:
 * - Split-screen golden doors sliding apart
 * - Dramatic light burst from center
 * - Bold title reveal with neon glow
 * - Smooth fade to casino floor
 *
 * PERFORMANCE: GPU-only (transform + opacity)
 * Total duration: ~3.5s
 */
export function CasinoEntrance({ onComplete }: CasinoEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!containerRef.current) return

    gsap.config({ force3D: true })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => onCompleteRef.current(),
        defaults: { force3D: true, overwrite: 'auto' }
      })

      tl
        // Initial state - doors closed, everything hidden
        .set('[data-door="left"]', { x: '0%' })
        .set('[data-door="right"]', { x: '0%' })
        .set('[data-anim="burst"]', { scale: 0, opacity: 0 })
        .set('[data-anim="title"]', { scale: 0.8, opacity: 0, y: 30 })
        .set('[data-anim="tagline"]', { opacity: 0, y: 20 })
        .set('[data-anim="ornament-left"], [data-anim="ornament-right"]', { opacity: 0, scale: 0.5 })

        // Brief pause for anticipation
        .to({}, { duration: 0.3 })

        // Light burst begins (center crack of light)
        .to('[data-anim="burst"]', {
          scale: 0.3,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out'
        })

        // Doors begin to open + burst expands
        .to('[data-door="left"]', {
          x: '-100%',
          duration: 1.2,
          ease: 'power3.inOut'
        }, '-=0.1')
        .to('[data-door="right"]', {
          x: '100%',
          duration: 1.2,
          ease: 'power3.inOut'
        }, '<')
        .to('[data-anim="burst"]', {
          scale: 3,
          opacity: 0.8,
          duration: 1.0,
          ease: 'power2.out'
        }, '<')

        // Title dramatic entrance
        .to('[data-anim="title"]', {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'back.out(1.4)'
        }, '-=0.6')

        // Ornaments fly in from sides
        .to('[data-anim="ornament-left"]', {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(2)'
        }, '-=0.4')
        .to('[data-anim="ornament-right"]', {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(2)'
        }, '<')

        // Tagline fades in
        .to('[data-anim="tagline"]', {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.3')

        // Hold for impact
        .to({}, { duration: 0.8 })

        // Everything fades out elegantly
        .to('[data-anim="title"], [data-anim="tagline"], [data-anim="ornament-left"], [data-anim="ornament-right"]', {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: 'power2.in'
        })
        .to('[data-anim="burst"]', {
          scale: 5,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in'
        }, '<')
        .to(containerRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.inOut'
        }, '-=0.2')

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: '#000' }}
    >
      {/* Left Door - Rich burgundy with gold trim pattern */}
      <div
        data-door="left"
        className="absolute top-0 left-0 w-1/2 h-full"
        style={{
          background: 'linear-gradient(135deg, #2a0a0a 0%, #1a0505 50%, #0d0202 100%)',
          borderRight: '3px solid #D4AF37',
          willChange: 'transform'
        }}
      >
        {/* Gold art deco pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(212,175,55,0.1) 20px,
              rgba(212,175,55,0.1) 40px
            )`
          }}
        />
        {/* Door handle accent */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-24 rounded-full"
          style={{ background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 100%)' }}
        />
      </div>

      {/* Right Door */}
      <div
        data-door="right"
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{
          background: 'linear-gradient(225deg, #2a0a0a 0%, #1a0505 50%, #0d0202 100%)',
          borderLeft: '3px solid #D4AF37',
          willChange: 'transform'
        }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(212,175,55,0.1) 20px,
              rgba(212,175,55,0.1) 40px
            )`
          }}
        />
        <div className="absolute left-8 top-1/2 -translate-y-1/2 w-2 h-24 rounded-full"
          style={{ background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 100%)' }}
        />
      </div>

      {/* Center light burst */}
      <div
        data-anim="burst"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,165,0,0.3) 30%, rgba(255,140,0,0.1) 50%, transparent 70%)',
          willChange: 'transform, opacity'
        }}
      />

      {/* Content layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Left ornament - spade */}
        <div
          data-anim="ornament-left"
          className="absolute left-[15%] top-1/2 -translate-y-1/2 text-6xl md:text-8xl"
          style={{
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,215,0,0.5)',
            willChange: 'transform, opacity'
          }}
        >
          ♠
        </div>

        {/* Right ornament - diamond */}
        <div
          data-anim="ornament-right"
          className="absolute right-[15%] top-1/2 -translate-y-1/2 text-6xl md:text-8xl"
          style={{
            color: '#FF4444',
            textShadow: '0 0 30px rgba(255,68,68,0.5)',
            willChange: 'transform, opacity'
          }}
        >
          ♦
        </div>

        {/* Main title */}
        <h1
          data-anim="title"
          className="text-5xl sm:text-7xl md:text-9xl font-black tracking-widest"
          style={{
            color: '#FFD700',
            textShadow: `
              0 0 20px rgba(255,215,0,0.8),
              0 0 40px rgba(255,215,0,0.6),
              0 0 60px rgba(255,165,0,0.4),
              0 4px 0 #B8860B,
              0 8px 0 #8B6914
            `,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            willChange: 'transform, opacity'
          }}
        >
          VANVINKL
        </h1>

        {/* Tagline */}
        <p
          data-anim="tagline"
          className="mt-6 text-xl md:text-3xl tracking-[0.3em] uppercase font-light"
          style={{
            color: '#FFF8DC',
            textShadow: '0 0 20px rgba(255,248,220,0.3)',
            willChange: 'transform, opacity'
          }}
        >
          Creative Portfolio
        </p>
      </div>
    </div>
  )
}
