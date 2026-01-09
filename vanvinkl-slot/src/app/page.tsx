'use client'

import { useState, useCallback } from 'react'
import { CasinoLoungeRealistic } from '@/components/casino'
import { useSlotAudio } from '@/hooks/useSlotAudio'
import { VolumeControl } from '@/components/VolumeControl'

export default function Home() {
  const [activeMachine, setActiveMachine] = useState<string | null>(null)
  const audio = useSlotAudio()

  const handleMachineInteract = useCallback((machineId: string) => {
    audio.playClick()
    audio.playSpinStart()
    setActiveMachine(machineId)

    // Simulate spin
    setTimeout(() => {
      audio.playReelStop(0)
      audio.playReelStop(1)
      audio.playReelStop(2)

      // Random win
      if (Math.random() > 0.7) {
        audio.playWin()
      }

      setActiveMachine(null)
    }, 2000)
  }, [audio])

  return (
    <main
      className="relative w-full h-screen overflow-hidden bg-black"
      onClick={() => audio.resumeAudio()}
    >
      {/* Realistic 3D Casino Lounge */}
      <CasinoLoungeRealistic onMachineInteract={handleMachineInteract} />

      {/* Volume Control Overlay */}
      <div className="absolute top-6 right-6 z-40">
        <VolumeControl
          volume={audio.masterVolume}
          isMuted={audio.isMuted}
          onVolumeChange={audio.setMasterVolume}
          onToggleMute={audio.toggleMute}
        />
      </div>

      {/* Machine Status Indicator */}
      {activeMachine && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl z-40">
          <p className="text-white font-bold text-center">
            Playing {activeMachine}... 🎰
          </p>
        </div>
      )}
    </main>
  )
}
