/**
 * ClickToEnterSplash - First thing user sees, enables audio before intro starts
 *
 * Orientation changes use pure CSS media queries (zero JS re-renders).
 * This eliminates the black-screen flash that React state changes cause
 * when elements are conditionally mounted/unmounted during rotation.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { FullscreenToggle } from './FullscreenToggle'

// Inline mobile detection
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

interface ClickToEnterSplashProps {
  onEnter: () => void
}

export function ClickToEnterSplash({ onEnter }: ClickToEnterSplashProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const isMobile = isMobileDevice()

  // Preload critical assets before allowing entry
  useEffect(() => {
    let mounted = true
    const preloadAssets = async () => {
      const stages = [
        // Stage 1: Preload fonts (10%)
        async () => {
          await document.fonts.ready
          if (mounted) setLoadProgress(10)
        },
        // Stage 2: Preload lounge music (40%)
        async () => {
          try {
            const response = await fetch('/audio/ambient/lounge.mp3')
            await response.arrayBuffer()
          } catch {}
          if (mounted) setLoadProgress(40)
        },
        // Stage 3: Preload Three.js core (60%)
        async () => {
          await import('three')
          if (mounted) setLoadProgress(60)
        },
        // Stage 4: Preload React Three Fiber (80%)
        async () => {
          await import('@react-three/fiber')
          if (mounted) setLoadProgress(80)
        },
        // Stage 5: Final preparations (100%)
        async () => {
          await new Promise(r => setTimeout(r, 200))
          if (mounted) {
            setLoadProgress(100)
            setTimeout(() => {
              if (mounted) setIsLoaded(true)
            }, 300)
          }
        }
      ]

      for (const stage of stages) {
        await stage()
        if (!mounted) break
      }
    }

    preloadAssets()
    return () => { mounted = false }
  }, [])

  const handleEnter = useCallback(() => {
    if (isClicking || !isLoaded) return
    setIsClicking(true)
    onEnter()
  }, [isClicking, isLoaded, onEnter])

  // Listen for SPACE key only (desktop)
  useEffect(() => {
    if (!isLoaded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        e.stopPropagation()
        handleEnter()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleEnter, isLoaded])

  // Mobile swipe left/right → navigate back (leave site)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const pushedStateRef = useRef(false)
  useEffect(() => {
    if (!isMobile) return

    if (!pushedStateRef.current) {
      history.pushState({ vanvinklSplash: true }, '')
      pushedStateRef.current = true
    }

    const onTouchStart = (e: TouchEvent) => {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeStartRef.current) return
      const dx = e.changedTouches[0].clientX - swipeStartRef.current.x
      const dy = e.changedTouches[0].clientY - swipeStartRef.current.y
      swipeStartRef.current = null
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        history.back()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile])

  return (
    <div className="splash-root"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0a0a14 0%, #050508 50%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50000,
        opacity: isClicking ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      {/* Glowing orb behind text */}
      <div className="splash-orb" style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(255,0,170,0.1) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'splashPulse 3s ease-in-out infinite',
        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.5s ease'
      }} />

      {/* VanVinkl logo text */}
      <div className="splash-logo" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '60px',
        flexShrink: 0,
        transition: 'margin 0.3s ease'
      }}>
        {/* VANVINKL - main title */}
        <div className="splash-title" style={{
          fontWeight: 900,
          background: 'linear-gradient(90deg, #00ffff, #ff00aa, #00ffff)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'splashGradient 3s linear infinite',
          textShadow: '0 0 60px rgba(0, 255, 255, 0.5)',
          position: 'relative',
          transition: 'font-size 0.3s ease, letter-spacing 0.3s ease'
        }}>
          VANVINKL
          {/* Glitch layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'inherit',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'splashGlitch 2s infinite',
            opacity: 0.8
          }}>
            VANVINKL
          </div>
        </div>

        {/* STUDIO - below main title */}
        <div className="splash-subtitle" style={{
          fontWeight: 700,
          marginTop: '8px',
          color: '#00ffff',
          textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(136, 68, 255, 0.5)',
          transition: 'font-size 0.3s ease, letter-spacing 0.3s ease, margin 0.3s ease'
        }}>
          STUDIO
        </div>

        {/* CASINO LOUNGE — visible in landscape under logo */}
        <div className="splash-lounge-landscape" style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '4px',
          marginTop: '12px',
          color: '#ffd700',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)',
          opacity: 0.85
        }}>
          CASINO LOUNGE
        </div>
      </div>

      {/* Click to Enter button area */}
      <div className="splash-actions" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        flexShrink: 0,
        transition: 'gap 0.3s ease'
      }}>
        {/* Hexagon border effect — ONLY this is tappable */}
        <div
          onClick={isLoaded ? handleEnter : undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="splash-button"
          style={{
          padding: '24px 64px',
          background: isLoaded && isHovered
            ? 'rgba(0, 255, 255, 0.15)'
            : 'rgba(0, 255, 255, 0.05)',
          border: `2px solid ${isLoaded && isHovered ? '#00ffff' : 'rgba(0, 255, 255, 0.4)'}`,
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: isLoaded && isHovered
            ? '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 40px rgba(0, 255, 255, 0.1)'
            : '0 0 20px rgba(0, 255, 255, 0.2)',
          transform: isLoaded && isHovered ? 'scale(1.05)' : 'scale(1)',
          minWidth: 'clamp(280px, 80vw, 340px)',
          cursor: isLoaded ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent'
        }}>
          {/* Corner accents */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderColor: isLoaded ? '#ff00aa' : '#8844ff',
              borderStyle: 'solid',
              borderWidth: pos.includes('top') ? '2px 0 0 0' : '0 0 2px 0',
              ...(pos.includes('left') ? { left: '-1px', borderLeftWidth: '2px' } : { right: '-1px', borderRightWidth: '2px' }),
              ...(pos.includes('top') ? { top: '-1px' } : { bottom: '-1px' }),
              transition: 'border-color 0.3s ease'
            }} />
          ))}

          {/* Loading state */}
          {!isLoaded && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                color: '#8844ff',
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '4px',
                textTransform: 'uppercase'
              }}>
                LOADING
              </span>
              {/* Progress bar */}
              <div style={{
                width: '200px',
                height: '4px',
                background: 'rgba(136, 68, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${loadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8844ff, #00ffff)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(136, 68, 255, 0.5)'
                }} />
              </div>
              <span style={{
                color: 'rgba(136, 68, 255, 0.7)',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {loadProgress}%
              </span>
            </div>
          )}

          {/* Ready state */}
          {isLoaded && (
            <span className="splash-enter-text" style={{
              color: '#00ffff',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              textShadow: isHovered ? '0 0 20px #00ffff' : 'none',
              animation: 'splashReady 0.5s ease-out',
              textAlign: 'center',
              display: 'block',
              transition: 'font-size 0.3s ease, letter-spacing 0.3s ease'
            }}>
              {isMobile ? 'TAP TO ENTER' : 'PRESS SPACE TO ENTER'}
            </span>
          )}
        </div>

        {/* Sound hint */}
        <div className="splash-sound-hint" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255, 255, 255, 0.4)',
          transition: 'font-size 0.3s ease'
        }}>
          <svg className="splash-sound-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          <span className="splash-sound-full">SOUND ON FOR BEST EXPERIENCE</span>
          <span className="splash-sound-short">SOUND ON</span>
        </div>

        {/* CASINO LOUNGE — visible in portrait */}
        <div className="splash-lounge-portrait" style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '6px',
          marginTop: '30px',
          color: '#ffd700',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)',
          opacity: 0.85,
          transition: 'margin 0.3s ease, opacity 0.3s ease'
        }}>
          CASINO LOUNGE
        </div>

      </div>

      {/* Ownership notice — outside flex containers, pinned to bottom */}
      <div className="splash-copyright" style={{
        position: 'absolute',
        bottom: '24px',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        transition: 'bottom 0.3s ease, gap 0.3s ease'
      }}>
        <div className="splash-copyright-line1" style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '2px',
          color: 'rgba(255, 255, 255, 0.45)',
          transition: 'font-size 0.3s ease'
        }}>
          © 2026 VanVinkl Studio. All rights reserved.
        </div>
        <div className="splash-copyright-line2" style={{
          fontSize: '10px',
          letterSpacing: '1px',
          color: 'rgba(255, 255, 255, 0.25)',
          textAlign: 'center',
          maxWidth: '340px',
          lineHeight: 1.4,
          transition: 'font-size 0.3s ease'
        }}>
          All content is the exclusive intellectual property of VanVinkl Studio.
        </div>
      </div>

      {/* Fullscreen toggle - available on splash screen */}
      <FullscreenToggle />

      {/* Floating particles */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: i % 2 === 0 ? '#00ffff' : '#ff00aa',
            borderRadius: '50%',
            opacity: 0.3 + Math.random() * 0.4,
            animation: `splashFloat ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }} />
        ))}
      </div>

      <style>{`
        /* ===== ANIMATIONS ===== */
        @keyframes splashPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes splashGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes splashGlitch {
          0%, 90%, 100% { clip-path: inset(0); transform: translate(0); }
          92% { clip-path: inset(40% 0 30% 0); transform: translate(-3px, 0); }
          94% { clip-path: inset(10% 0 60% 0); transform: translate(3px, 0); }
          96% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 0); }
          98% { clip-path: inset(20% 0 50% 0); transform: translate(2px, 0); }
        }
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        @keyframes splashReady {
          0% { opacity: 0; transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ===== PORTRAIT (default) ===== */
        .splash-title {
          font-size: clamp(2rem, 10vw, 4rem);
          letter-spacing: clamp(4px, 2vw, 12px);
        }
        .splash-subtitle {
          font-size: clamp(1.2rem, 6vw, 2rem);
          letter-spacing: clamp(6px, 3vw, 16px);
        }
        .splash-enter-text {
          font-size: clamp(1rem, 4vw, 1.5rem);
          letter-spacing: clamp(2px, 1vw, 6px);
        }
        .splash-sound-hint {
          font-size: 12px;
          letter-spacing: 2px;
        }
        .splash-sound-full { display: inline; }
        .splash-sound-short { display: none; }
        .splash-lounge-landscape { display: none; }
        .splash-lounge-portrait { display: block; }

        /* ===== MOBILE LANDSCAPE ===== */
        @media (max-height: 500px) and (orientation: landscape) {
          .splash-root {
            flex-direction: row !important;
            gap: 40px;
          }
          .splash-orb {
            width: 250px !important;
            height: 250px !important;
          }
          .splash-logo {
            margin-bottom: 0 !important;
          }
          .splash-title {
            font-size: clamp(1.8rem, 5vw, 3rem) !important;
            letter-spacing: clamp(3px, 1vw, 8px) !important;
          }
          .splash-subtitle {
            font-size: clamp(0.9rem, 3vw, 1.4rem) !important;
            letter-spacing: clamp(4px, 2vw, 10px) !important;
            margin-top: 4px !important;
          }
          .splash-lounge-landscape { display: block; }
          .splash-lounge-portrait { display: none; }
          .splash-actions {
            gap: 10px !important;
          }
          .splash-button {
            padding: 14px 40px !important;
            min-width: 220px !important;
          }
          .splash-enter-text {
            font-size: clamp(0.85rem, 2.5vw, 1.1rem) !important;
            letter-spacing: clamp(2px, 0.5vw, 4px) !important;
          }
          .splash-sound-hint {
            font-size: 10px !important;
            letter-spacing: 1px !important;
          }
          .splash-sound-icon {
            width: 12px !important;
            height: 12px !important;
          }
          .splash-sound-full { display: none !important; }
          .splash-sound-short { display: inline !important; }
          .splash-copyright {
            bottom: 10px !important;
            gap: 2px !important;
          }
          .splash-copyright-line1 {
            font-size: 10px !important;
          }
          .splash-copyright-line2 {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  )
}
