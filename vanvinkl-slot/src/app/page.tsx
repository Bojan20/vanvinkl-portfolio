'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CinematicIntro } from '@/components/effects'
import CasinoLounge3D from '@/components/3d/CasinoLounge3D'
import { AttractorParticles } from '@/components/3d/AttractorParticles'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { GlassCard, GlassButton } from '@/components/ui'
import { useHaptic } from '@/hooks/useHaptic'
import { VolumeControl } from '@/components/VolumeControl'
import { useSlotAudio } from '@/hooks/useSlotAudio'

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const { haptic } = useHaptic()
  const audio = useSlotAudio()

  useEffect(() => {
    // Preload complete
    setIsLoaded(true)
  }, [])

  const handleIntroComplete = useCallback(() => {
    haptic('heavy')
    setShowIntro(false)
  }, [haptic])

  return (
    <main
      className="relative w-full h-screen overflow-hidden bg-black"
      onClick={() => audio.resumeAudio()}
    >
      {/* Cinematic Intro */}
      <AnimatePresence>
        {showIntro && (
          <CinematicIntro
            onComplete={handleIntroComplete}
            skipEnabled={true}
          />
        )}
      </AnimatePresence>

      {/* Main 3D Casino Lounge Scene */}
      {!showIntro && isLoaded && (
        <div className="absolute inset-0 w-full h-full">
          {/* Three.js Canvas with full scene */}
          <Canvas
            shadows
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true
            }}
            dpr={[1, 2]}
            camera={{
              position: [0, 5, 15],
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
          >
            <Suspense fallback={null}>
              {/* Main casino scene */}
              <group>
                <CasinoLounge3D />
              </group>

              {/* Attractor particles overlay */}
              <AttractorParticles
                count={3000}
                attractors={[
                  { x: -5, y: 3, z: -5 },
                  { x: 5, y: 3, z: -5 },
                  { x: 0, y: 6, z: 0 }
                ]}
                attractorStrength={1.2}
              />
            </Suspense>
          </Canvas>

          {/* UI Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8">
            {/* Top navigation bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-auto">
              <GlassCard intensity="medium" glow glowColor="orange" className="px-6 py-3">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500">
                  VANVINKL
                </h1>
                <p className="text-xs text-orange-400/80 tracking-[0.2em]">CASINO LOUNGE</p>
              </GlassCard>

              <div className="flex items-center gap-4">
                <VolumeControl
                  volume={audio.masterVolume}
                  isMuted={audio.isMuted}
                  onVolumeChange={audio.setMasterVolume}
                  onToggleMute={audio.toggleMute}
                />
              </div>
            </div>

            {/* Center info card */}
            <div className="pointer-events-auto">
              <GlassCard
                intensity="heavy"
                glow
                glowColor="cyan"
                className="max-w-2xl p-8 space-y-6"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-white">
                    Welcome to the Lounge
                  </h2>
                  <p className="text-lg text-white/70">
                    Immersive 3D casino experience with spatial audio & particle effects
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <GlassButton
                    variant="primary"
                    hapticFeedback
                    onClick={() => {
                      audio.playClick()
                      // Navigate to slot machines
                    }}
                    className="py-4 text-sm font-bold"
                  >
                    🎰 SLOTS
                  </GlassButton>

                  <GlassButton
                    variant="secondary"
                    hapticFeedback
                    onClick={() => {
                      audio.playClick()
                      // Navigate to roulette
                    }}
                    className="py-4 text-sm font-bold"
                  >
                    🎡 ROULETTE
                  </GlassButton>

                  <GlassButton
                    variant="secondary"
                    hapticFeedback
                    onClick={() => {
                      audio.playClick()
                      // Navigate to poker
                    }}
                    className="py-4 text-sm font-bold"
                  >
                    🃏 POKER
                  </GlassButton>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-white/50">
                    <span>Use mouse to orbit • Scroll to zoom</span>
                    <span className="text-orange-400">◉ LIVE</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Bottom stats bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 pointer-events-auto">
              <GlassCard intensity="light" className="px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-cyan-400">2,847</div>
                  <div className="text-xs text-white/50">Online Players</div>
                </div>
              </GlassCard>

              <GlassCard intensity="light" className="px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400">$1.2M</div>
                  <div className="text-xs text-white/50">Jackpot Pool</div>
                </div>
              </GlassCard>

              <GlassCard intensity="light" className="px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-400">127</div>
                  <div className="text-xs text-white/50">Active Tables</div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* Loading screen */}
      {!isLoaded && !showIntro && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center space-y-4">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="text-orange-400 font-bold text-xl">Loading Experience...</p>
          </div>
        </div>
      )}
    </main>
  )
}
