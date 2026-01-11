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
        <Suspense fallback={
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              color: '#00ffff',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 0 20px #00ffff',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              LOADING...
            </div>
          </div>
        }>
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
