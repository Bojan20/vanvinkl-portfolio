"use client";

import { useState, useCallback } from "react";
import { CasinoLounge, FirstPersonSlot, SlotContentScreen } from "@/components/game";
import { ParticleEffect } from "@/components/ParticleEffect";
import { VolumeControl } from "@/components/VolumeControl";
import { useSlotAudio } from "@/hooks/useSlotAudio";

type GameState = "lounge" | "playing" | "section";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("lounge");
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState<"spin" | "win" | null>(null);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());

  const audio = useSlotAudio();

  // When player approaches a machine and presses E
  const handleMachineActivate = useCallback((machineId: string) => {
    audio.playClick();
    setActiveMachine(machineId);
    setGameState("playing");
  }, [audio]);

  // When slot spin starts
  const handleSpinStart = useCallback(() => {
    audio.playSpinStart();
    audio.playSpinLoop(2000);
    setParticleTrigger("spin");
    setTimeout(() => setParticleTrigger(null), 100);
  }, [audio]);

  // When slot spin completes
  const handleResult = useCallback((section: string, win: boolean) => {
    audio.playReelStop(0);
    audio.playReelStop(1);
    audio.playReelStop(2);

    if (win) {
      audio.playWin();
      setParticleTrigger("win");
    }

    // Track visited section
    setVisitedSections((prev) => new Set([...prev, section]));

    setIsWin(win);
    setActiveSection(section);
    setGameState("section");

    setTimeout(() => setParticleTrigger(null), 100);
  }, [audio]);

  // Return to lounge
  const handleBackToLounge = useCallback(() => {
    audio.playClick();
    setGameState("lounge");
    setActiveMachine(null);
    setActiveSection(null);
    setIsWin(false);
  }, [audio]);

  // Close section and go back to lounge
  const handleCloseSection = useCallback(() => {
    audio.playClick();
    setActiveSection(null);
    setIsWin(false);
    setGameState("lounge");
    setActiveMachine(null);
  }, [audio]);

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg-void)" }}
      onClick={() => audio.resumeAudio()}
    >
      {/* Particle effects layer */}
      <ParticleEffect trigger={particleTrigger} />

      {/* LOUNGE VIEW - Third person, walk around */}
      {gameState === "lounge" && (
        <div className="min-h-screen flex items-center justify-center">
          <CasinoLounge
            onMachineActivate={handleMachineActivate}
            visitedSections={visitedSections}
          />
        </div>
      )}

      {/* FIRST PERSON SLOT VIEW - Avatar head visible, looking at machine screen */}
      {gameState === "playing" && activeMachine && (
        <FirstPersonSlot
          machineId={activeMachine}
          onResult={handleResult}
          onSpinStart={handleSpinStart}
          onBack={handleBackToLounge}
        />
      )}

      {/* FULL SCREEN SLOT CONTENT - After spin reveals content */}
      {gameState === "section" && activeSection && (
        <SlotContentScreen
          section={activeSection}
          isWin={isWin}
          onClose={handleCloseSection}
        />
      )}

      {/* Volume Control */}
      <VolumeControl
        volume={audio.masterVolume}
        isMuted={audio.isMuted}
        onVolumeChange={audio.setMasterVolume}
        onToggleMute={audio.toggleMute}
      />
    </main>
  );
}
