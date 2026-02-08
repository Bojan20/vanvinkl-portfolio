/**
 * CasinoCanvas - Lazy-loadable Canvas + CasinoScene wrapper
 *
 * PERFORMANCE POLICY §4-5:
 * Three.js, R3F, and postprocessing MUST NOT be in the initial bundle.
 * This wrapper enables dynamic import of the entire 3D stack.
 */

import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, lazy, useRef, useEffect } from 'react'
import { CasinoScene } from './CasinoScene'
import { LoadingScreen } from './ui'

/**
 * Forces R3F to resume rendering when frameloop switches back to 'always'.
 * R3F doesn't always restart the render loop automatically on prop change.
 */
function FrameloopResumer({ active }: { active: boolean }) {
  const { invalidate, gl, setDpr } = useThree()

  useEffect(() => {
    if (active) {
      const restore = () => {
        const dpr = Math.min(window.devicePixelRatio, 2)
        setDpr(dpr)
        gl.setPixelRatio(dpr)
        gl.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight, false)
        invalidate()
      }
      // Immediate restore
      restore()
      // Second restore after performance adaptor settles (it can override setDpr)
      const t = setTimeout(restore, 300)
      return () => clearTimeout(t)
    }
  }, [active, invalidate, gl, setDpr])

  return null
}

const IntroCamera = lazy(() => import('./IntroSequence').then(m => ({ default: m.IntroCamera })))

interface CasinoCanvasProps {
  isMobile: boolean
  tabVisible: boolean
  showIntro: boolean
  spinningSlot: string | null
  audioSettingsOpen: boolean
  mobileMovementRef: React.RefObject<{ x: number; y: number }>
  onSlotSpin: (machineId: string) => void
  onSitChange: (sitting: boolean) => void
  onIntroCameraComplete: () => void
  onContextLost: () => void
}

export function CasinoCanvas({
  isMobile,
  tabVisible,
  showIntro,
  spinningSlot,
  audioSettingsOpen,
  mobileMovementRef,
  onSlotSpin,
  onSitChange,
  onIntroCameraComplete,
  onContextLost
}: CasinoCanvasProps) {
  const glRef = useRef<{ domElement: HTMLCanvasElement } | null>(null)

  // Cleanup WebGL context lost listener on unmount
  useEffect(() => {
    return () => {
      if (glRef.current) {
        glRef.current.domElement.removeEventListener('webglcontextlost', onContextLost)
      }
    }
  }, [onContextLost])

  return (
    <Canvas
      shadows={false}
      dpr={isMobile ? [1, 1.2] : [1, 2]}
      gl={{
        antialias: !isMobile,
        alpha: false,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false,
        precision: isMobile ? 'mediump' : 'highp',
        failIfMajorPerformanceCaveat: false
      }}
      camera={{
        fov: 55,
        near: 0.5,
        far: isMobile ? 50 : 80,
        position: [0, 5, 18]
      }}
      performance={isMobile ? {
        min: 0.8,
        max: 1,
        debounce: 500
      } : undefined}
      frameloop={tabVisible && !spinningSlot ? 'always' : 'never'}
      flat
      onCreated={({ gl }) => {
        glRef.current = gl
        gl.domElement.addEventListener('webglcontextlost', onContextLost)
      }}
    >
      <FrameloopResumer active={tabVisible && !spinningSlot} />
      <Suspense fallback={<LoadingScreen />}>
        {showIntro && (
          <IntroCamera
            onComplete={onIntroCameraComplete}
            avatarSpawnPosition={[0, 0, 10]}
          />
        )}

        <CasinoScene
          onSlotSpin={onSlotSpin}
          onSitChange={onSitChange}
          introActive={showIntro}
          slotOpen={!!spinningSlot}
          audioSettingsOpen={audioSettingsOpen}
          mobileMovementRef={mobileMovementRef}
        />
      </Suspense>
    </Canvas>
  )
}
