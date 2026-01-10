/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { CasinoScene } from './components/CasinoScene'
import { InfoModal } from './components/InfoModal'
import { IntroCamera, IntroOverlay } from './components/IntroSequence'

// Controls HUD - compact bottom-center display
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
  const [modalData, setModalData] = useState<{ id: string; title: string; content: string[] } | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  // Both overlay and camera run SIMULTANEOUSLY for smooth intro
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [cameraComplete, setCameraComplete] = useState(false)

  const handleShowModal = useCallback((id: string, title: string, content: string[]) => {
    setModalData({ id, title, content })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalData(null)
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

  return (
    <>
      <Canvas
        shadows={false}
        dpr={[1, 1.5]} // Cap DPR for performance
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
        flat // Disable tone mapping for raw neon colors
      >
        <Suspense fallback={<LoadingScreen />}>
          {/* Intro camera animation - runs from START, parallel with overlay */}
          {showIntro && (
            <IntroCamera
              onComplete={handleIntroCameraComplete}
              avatarSpawnPosition={[0, 0, 10]}
            />
          )}

          {/* Main scene - always rendered but intro controls camera initially */}
          <CasinoScene onShowModal={handleShowModal} introActive={showIntro} />
        </Suspense>
      </Canvas>

      {/* Controls HUD - always visible at bottom center (unless modal open) */}
      {!showIntro && !modalData && (
        <ControlsHUD />
      )}

      {/* Info Modal Overlay */}
      {modalData && (
        <InfoModal
          title={modalData.title}
          content={modalData.content}
          onClose={handleCloseModal}
        />
      )}

      {/* Intro overlay - glitch text (runs PARALLEL with camera) */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
      />
    </>
  )
}
