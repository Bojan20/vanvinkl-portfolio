/**
 * CasinoCanvas - Lazy-loadable Canvas + CasinoScene wrapper
 *
 * PERFORMANCE POLICY §4-5:
 * Three.js, R3F, and postprocessing MUST NOT be in the initial bundle.
 * This wrapper enables dynamic import of the entire 3D stack.
 */

import { Canvas } from '@react-three/fiber'
import { Suspense, lazy } from 'react'
import { CasinoScene } from './CasinoScene'
import { LoadingScreen } from './ui'

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
  return (
    <Canvas
      shadows={false}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: !isMobile,
        alpha: false,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
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
      frameloop={tabVisible ? 'always' : 'never'}
      flat
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onContextLost)
      }}
    >
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
