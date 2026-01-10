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

// Controls hint overlay
function ControlsHint({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) {
        onDismiss()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 999,
        cursor: 'pointer',
        animation: 'fadeIn 0.5s ease-out'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '40px 60px',
          background: 'linear-gradient(135deg, #0a0a14 0%, #1a1028 50%, #0a0814 100%)',
          border: '2px solid #00ffff',
          borderRadius: '20px',
          boxShadow: '0 0 60px rgba(0, 255, 255, 0.3), 0 0 120px rgba(255, 0, 170, 0.2)',
          animation: 'slideUp 0.6s ease-out'
        }}
      >
        <h1
          style={{
            margin: '0 0 30px 0',
            fontSize: '36px',
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '3px'
          }}
        >
          CONTROLS
        </h1>

        <div style={{ display: 'flex', gap: '50px', justifyContent: 'center', marginBottom: '30px' }}>
          {/* Arrow keys */}
          <div>
            <div style={{ marginBottom: '15px' }}>
              <span style={{
                display: 'inline-block',
                padding: '12px 18px',
                background: 'rgba(0, 255, 255, 0.2)',
                border: '2px solid #00ffff',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '20px',
                fontFamily: 'monospace',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              }}>
                ↑
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {['←', '↓', '→'].map(key => (
                <span key={key} style={{
                  display: 'inline-block',
                  padding: '12px 18px',
                  background: 'rgba(0, 255, 255, 0.2)',
                  border: '2px solid #00ffff',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
                }}>
                  {key}
                </span>
              ))}
            </div>
            <p style={{
              margin: '15px 0 0 0',
              color: '#aaaacc',
              fontSize: '16px',
              fontFamily: 'system-ui'
            }}>
              MOVE
            </p>
          </div>

          {/* Space key */}
          <div>
            <span style={{
              display: 'inline-block',
              padding: '15px 50px',
              background: 'rgba(255, 0, 170, 0.2)',
              border: '2px solid #ff00aa',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '18px',
              fontFamily: 'monospace',
              boxShadow: '0 0 15px rgba(255, 0, 170, 0.3)'
            }}>
              SPACE
            </span>
            <p style={{
              margin: '15px 0 0 0',
              color: '#aaaacc',
              fontSize: '16px',
              fontFamily: 'system-ui'
            }}>
              INTERACT
            </p>
          </div>
        </div>

        <p style={{
          margin: 0,
          color: '#8844ff',
          fontSize: '14px',
          fontFamily: 'system-ui'
        }}>
          Press any key or click to start
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

// Mini HUD - persistent controls reminder in corner
function ControlsHUD() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '15px',
        padding: '12px 18px',
        background: 'rgba(10, 10, 20, 0.7)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '10px',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Arrow keys mini */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{
            padding: '3px 6px',
            background: 'rgba(0, 255, 255, 0.2)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            color: '#00ffff',
            fontSize: '10px',
            fontFamily: 'monospace'
          }}>
            ↑
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {['←', '↓', '→'].map(k => (
              <span key={k} style={{
                padding: '3px 6px',
                background: 'rgba(0, 255, 255, 0.2)',
                border: '1px solid #00ffff',
                borderRadius: '4px',
                color: '#00ffff',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}>
                {k}
              </span>
            ))}
          </div>
        </div>
        <span style={{ color: '#888899', fontSize: '11px' }}>MOVE</span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: 'rgba(136, 68, 255, 0.4)' }} />

      {/* Space key mini */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          padding: '6px 16px',
          background: 'rgba(255, 0, 170, 0.2)',
          border: '1px solid #ff00aa',
          borderRadius: '4px',
          color: '#ff00aa',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}>
          SPACE
        </span>
        <span style={{ color: '#888899', fontSize: '11px' }}>INTERACT</span>
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
  const [showControls, setShowControls] = useState(true)
  const [showIntro, setShowIntro] = useState(true)
  const [introPhase, setIntroPhase] = useState<'overlay' | 'camera' | 'done'>('overlay')

  const handleShowModal = useCallback((id: string, title: string, content: string[]) => {
    setModalData({ id, title, content })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalData(null)
  }, [])

  const handleDismissControls = useCallback(() => {
    setShowControls(false)
  }, [])

  const handleIntroOverlayComplete = useCallback(() => {
    setIntroPhase('camera')
  }, [])

  const handleIntroCameraComplete = useCallback(() => {
    setIntroPhase('done')
    setShowIntro(false)
  }, [])

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
          {/* Intro camera animation */}
          {showIntro && introPhase === 'camera' && (
            <IntroCamera
              onComplete={handleIntroCameraComplete}
              avatarSpawnPosition={[0, 0, 10]}
            />
          )}

          {/* Main scene - always rendered but intro controls camera initially */}
          <CasinoScene onShowModal={handleShowModal} introActive={showIntro} />
        </Suspense>
      </Canvas>

      {/* Controls hint on start */}
      {showControls && (
        <ControlsHint onDismiss={handleDismissControls} />
      )}

      {/* Persistent mini HUD (shows after initial controls dismissed) */}
      {!showControls && !modalData && (
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

      {/* Intro overlay - glitch text */}
      <IntroOverlay
        active={showIntro && introPhase === 'overlay'}
        onComplete={handleIntroOverlayComplete}
      />
    </>
  )
}
