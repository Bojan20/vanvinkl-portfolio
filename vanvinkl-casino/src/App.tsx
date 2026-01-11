/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback, useEffect, useRef, lazy } from 'react'
import { CasinoScene } from './components/CasinoScene'
import { IntroCamera, IntroOverlay } from './components/IntroSequence'
import { MobileControls, isMobileDevice } from './components/MobileControls'

// Lazy load SlotFullScreen for better initial bundle size
const SlotFullScreen = lazy(() => import('./components/SlotFullScreen').then(m => ({ default: m.SlotFullScreen })))
import {
  WebGLErrorBoundary,
  ContextLostOverlay,
  WebGLNotSupported,
  isWebGLSupported
} from './components/WebGLErrorBoundary'
import { gameRefs } from './store'

// Slot Loading Skeleton - premium cyberpunk loading animation
function SlotLoadingSkeleton() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      overflow: 'hidden'
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'skeletonGridMove 20s linear infinite'
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'skeletonOrbPulse 3s ease-in-out infinite',
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255, 0, 170, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'skeletonOrbPulse 3s ease-in-out infinite 1.5s',
        filter: 'blur(30px)',
        transform: 'translate(100px, 50px)'
      }} />

      {/* Slot machine frame skeleton */}
      <div style={{
        position: 'relative',
        width: '90%',
        maxWidth: '800px',
        padding: '40px',
        background: 'rgba(20, 20, 30, 0.8)',
        borderRadius: '24px',
        border: '2px solid rgba(0, 255, 255, 0.2)',
        boxShadow: `
          0 0 60px rgba(0, 255, 255, 0.1),
          inset 0 0 60px rgba(0, 0, 0, 0.5)
        `
      }}>
        {/* Header skeleton */}
        <div style={{
          height: '40px',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1))',
          backgroundSize: '200% 100%',
          animation: 'skeletonShimmer 1.5s ease-in-out infinite',
          borderRadius: '8px',
          marginBottom: '30px'
        }} />

        {/* Reels skeleton */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '180px',
              height: '300px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 255, 0.15)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Scrolling symbols skeleton */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(180deg,
                    rgba(0, 255, 255, 0.05) 0%,
                    rgba(255, 0, 170, 0.05) 33%,
                    rgba(136, 68, 255, 0.05) 66%,
                    rgba(0, 255, 255, 0.05) 100%
                  )
                `,
                backgroundSize: '100% 400%',
                animation: `skeletonReelSpin 1s linear infinite`,
                animationDelay: `${i * 0.15}s`
              }} />
              {/* Symbol placeholders */}
              {[0, 1, 2, 3].map(j => (
                <div key={j} style={{
                  width: '60%',
                  height: '50px',
                  margin: '20px auto',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  backgroundSize: '200% 100%',
                  animation: 'skeletonShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${j * 0.1}s`,
                  borderRadius: '8px'
                }} />
              ))}
            </div>
          ))}
        </div>

        {/* Loading text */}
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            color: '#00ffff',
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff40',
            letterSpacing: '8px',
            animation: 'skeletonTextPulse 1s ease-in-out infinite'
          }}>
            LOADING
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px'
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                background: '#00ffff',
                borderRadius: '50%',
                boxShadow: '0 0 10px #00ffff',
                animation: 'skeletonDotBounce 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton animations */}
      <style>{`
        @keyframes skeletonGridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes skeletonOrbPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes skeletonReelSpin {
          0% { background-position: 0 0; }
          100% { background-position: 0 400%; }
        }
        @keyframes skeletonTextPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeletonDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-12px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Controls HUD - compact bottom-center display (desktop only)
function ControlsHUD() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        padding: '10px 24px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: '1px solid rgba(0, 255, 255, 0.25)',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Arrow keys */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {['←', '↑', '↓', '→'].map(k => (
          <span key={k} style={{
            padding: '4px 8px',
            background: 'rgba(0, 255, 255, 0.15)',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            borderRadius: '4px',
            color: '#00ffff',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {k}
          </span>
        ))}
        <span style={{ color: '#888899', fontSize: '12px', marginLeft: '4px' }}>MOVE</span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: 'rgba(136, 68, 255, 0.4)' }} />

      {/* Space key */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          padding: '4px 14px',
          background: 'rgba(255, 0, 170, 0.15)',
          border: '1px solid rgba(255, 0, 170, 0.5)',
          borderRadius: '4px',
          color: '#ff00aa',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          SPACE
        </span>
        <span style={{ color: '#888899', fontSize: '12px' }}>INTERACT</span>
      </div>
    </div>
  )
}

// Loading screen component
function LoadingScreen() {
  return (
    <mesh>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial color="#0a0812" />
    </mesh>
  )
}

export function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [cameraComplete, setCameraComplete] = useState(false)
  const [spinningSlot, setSpinningSlot] = useState<string | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile movement ref - updated by joystick
  const mobileMovementRef = useRef({ x: 0, y: 0 })

  // Check for mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Check WebGL support
  if (!isWebGLSupported()) {
    return <WebGLNotSupported />
  }

  const handleSlotSpin = useCallback((machineId: string) => {
    setSpinningSlot(machineId)
  }, [])

  const handleIntroOverlayComplete = useCallback(() => {
    setOverlayComplete(true)
  }, [])

  const handleIntroCameraComplete = useCallback(() => {
    setCameraComplete(true)
  }, [])

  // End intro when BOTH camera and overlay are complete
  useEffect(() => {
    if (overlayComplete && cameraComplete) {
      setShowIntro(false)
    }
  }, [overlayComplete, cameraComplete])

  // Mobile joystick handler - directly updates gameRefs for zero latency
  const handleMobileMove = useCallback((x: number, y: number) => {
    mobileMovementRef.current.x = x
    mobileMovementRef.current.y = y
    // Update game refs directly - Avatar component reads these
    gameRefs.isMoving = x !== 0 || y !== 0
  }, [])

  // Mobile action button - simulates SPACE key
  const handleMobileAction = useCallback(() => {
    // Dispatch a synthetic keydown event for SPACE
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })
    window.dispatchEvent(event)
  }, [])

  // Context lost handler
  const handleContextLost = useCallback(() => {
    setContextLost(true)
  }, [])

  // Show context lost overlay
  if (contextLost) {
    return <ContextLostOverlay />
  }

  return (
    <WebGLErrorBoundary>
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          precision: 'highp',
          failIfMajorPerformanceCaveat: false
        }}
        camera={{
          fov: 55,
          near: 0.5,
          far: 80,
          position: [0, 5, 18]
        }}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 200
        }}
        frameloop="always"
        flat
        onCreated={({ gl }) => {
          // Listen for context loss
          gl.domElement.addEventListener('webglcontextlost', handleContextLost)
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          {showIntro && (
            <IntroCamera
              onComplete={handleIntroCameraComplete}
              avatarSpawnPosition={[0, 0, 10]}
            />
          )}

          <CasinoScene
            onSlotSpin={handleSlotSpin}
            introActive={showIntro}
            slotOpen={!!spinningSlot}
          />
        </Suspense>
      </Canvas>

      {/* Desktop Controls HUD - hidden on mobile */}
      {!showIntro && !spinningSlot && !isMobile && (
        <ControlsHUD />
      )}

      {/* Mobile Controls - only on mobile devices */}
      {!showIntro && !spinningSlot && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          visible={isMobile}
        />
      )}

      {/* Intro overlay - glitch text */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
      />

      {/* Full screen slot experience - includes content after spin */}
      {spinningSlot && (
        <Suspense fallback={<SlotLoadingSkeleton />}>
          <SlotFullScreen
            machineId={spinningSlot}
            onClose={() => setSpinningSlot(null)}
            onNavigate={setSpinningSlot}
          />
        </Suspense>
      )}
    </WebGLErrorBoundary>
  )
}
