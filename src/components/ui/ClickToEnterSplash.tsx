/**
 * ClickToEnterSplash - First thing user sees, enables audio before intro starts
 */

import { useState, useEffect, useCallback } from 'react'

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

  // Listen for any key press (only when loaded)
  useEffect(() => {
    if (!isLoaded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleEnter()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleEnter, isLoaded])

  return (
    <div
      onClick={handleEnter}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        cursor: isLoaded ? 'pointer' : 'default'
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
      <div style={{
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '60px'
      }}>
        {/* VANVINKL - main title */}
        <div style={{
          fontSize: 'clamp(2rem, 10vw, 4rem)',
          fontWeight: 900,
          letterSpacing: 'clamp(4px, 2vw, 12px)',
          background: 'linear-gradient(90deg, #00ffff, #ff00aa, #00ffff)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'splashGradient 3s linear infinite',
          textShadow: '0 0 60px rgba(0, 255, 255, 0.5)',
          position: 'relative'
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
        <div style={{
          fontSize: 'clamp(1.2rem, 6vw, 2rem)',
          fontWeight: 700,
          letterSpacing: 'clamp(6px, 3vw, 16px)',
          marginTop: '8px',
          color: '#00ffff',
          textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(136, 68, 255, 0.5)'
        }}>
          STUDIO
        </div>
      </div>

      {/* Click to Enter button area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Hexagon border effect */}
        <div style={{
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
          minWidth: '340px'
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
            <span style={{
              color: '#00ffff',
              fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              letterSpacing: 'clamp(2px, 1vw, 6px)',
              textTransform: 'uppercase',
              textShadow: isHovered ? '0 0 20px #00ffff' : 'none',
              animation: 'splashReady 0.5s ease-out',
              textAlign: 'center',
              display: 'block'
            }}>
              {isMobile ? 'TAP TO ENTER' : 'PRESS ANY KEY TO ENTER'}
            </span>
          )}
        </div>

        {/* Sound hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '12px',
          letterSpacing: '2px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          <span>SOUND ON FOR BEST EXPERIENCE</span>
        </div>

        {/* CASINO LOUNGE - at the very bottom */}
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '6px',
          marginTop: '30px',
          color: '#ffd700',
          textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)',
          opacity: 0.85
        }}>
          CASINO LOUNGE
        </div>
      </div>

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
      `}</style>
    </div>
  )
}
