/**
 * useGameState - React hook for game state management
 *
 * Uses XState for predictable state transitions
 */

import { useCallback, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { gameMachine, type Position, type SlotResult } from "@/lib/state";

export function useGameState() {
  const [state, send] = useMachine(gameMachine);

  // Derived state
  const isExploring = state.matches("exploring");
  const isNearSlot = state.matches("nearSlot");
  const isPlaying = state.matches("playing");
  const isSpinning = state.matches({ playing: "spinning" });
  const isWinning = state.matches({ playing: "win" }) || state.matches({ playing: "jackpot" });
  const isJackpot = state.matches({ playing: "jackpot" });
  const isTutorial = state.matches("tutorial");
  const isLoading = state.matches("loading");

  // Context values
  const {
    playerPosition,
    playerRotation,
    balance,
    currentSlotId,
    betAmount,
    lastResult,
    showHelp,
    showSettings,
    tutorialStep,
    tutorialComplete,
    audioEnabled,
    musicVolume,
    sfxVolume,
    totalSpins,
    totalWins,
    biggestWin,
  } = state.context;

  // Actions
  const move = useCallback(
    (direction: Position) => {
      send({ type: "MOVE", direction });
    },
    [send]
  );

  const rotate = useCallback(
    (angle: number) => {
      send({ type: "ROTATE", angle });
    },
    [send]
  );

  const approachSlot = useCallback(
    (slotId: string) => {
      send({ type: "APPROACH_SLOT", slotId });
    },
    [send]
  );

  const leaveSlot = useCallback(() => {
    send({ type: "LEAVE_SLOT" });
  }, [send]);

  const sitDown = useCallback(() => {
    send({ type: "SIT_DOWN" });
  }, [send]);

  const standUp = useCallback(() => {
    send({ type: "STAND_UP" });
  }, [send]);

  const setBet = useCallback(
    (amount: number) => {
      send({ type: "SET_BET", amount });
    },
    [send]
  );

  const spin = useCallback(() => {
    send({ type: "SPIN" });
  }, [send]);

  const spinComplete = useCallback(
    (result: SlotResult) => {
      send({ type: "SPIN_COMPLETE", result });
    },
    [send]
  );

  const collectWin = useCallback(() => {
    send({ type: "COLLECT_WIN" });
  }, [send]);

  const toggleHelp = useCallback(() => {
    send({ type: "TOGGLE_HELP" });
  }, [send]);

  const toggleSettings = useCallback(() => {
    send({ type: "TOGGLE_SETTINGS" });
  }, [send]);

  const closeModal = useCallback(() => {
    send({ type: "CLOSE_MODAL" });
  }, [send]);

  const nextTutorial = useCallback(() => {
    send({ type: "NEXT_TUTORIAL" });
  }, [send]);

  const skipTutorial = useCallback(() => {
    send({ type: "SKIP_TUTORIAL" });
  }, [send]);

  const toggleAudio = useCallback(() => {
    send({ type: "TOGGLE_AUDIO" });
  }, [send]);

  const setMusicVolume = useCallback(
    (volume: number) => {
      send({ type: "SET_MUSIC_VOLUME", volume });
    },
    [send]
  );

  const setSfxVolume = useCallback(
    (volume: number) => {
      send({ type: "SET_SFX_VOLUME", volume });
    },
    [send]
  );

  const reset = useCallback(() => {
    send({ type: "RESET" });
  }, [send]);

  // Can perform actions
  const canSpin = useMemo(
    () => isPlaying && !isSpinning && balance >= betAmount,
    [isPlaying, isSpinning, balance, betAmount]
  );

  const canSitDown = useMemo(() => isNearSlot, [isNearSlot]);

  const canStandUp = useMemo(
    () => isPlaying && !isSpinning,
    [isPlaying, isSpinning]
  );

  return {
    // State
    state: state.value,
    isExploring,
    isNearSlot,
    isPlaying,
    isSpinning,
    isWinning,
    isJackpot,
    isTutorial,
    isLoading,

    // Context
    playerPosition,
    playerRotation,
    balance,
    currentSlotId,
    betAmount,
    lastResult,
    showHelp,
    showSettings,
    tutorialStep,
    tutorialComplete,
    audioEnabled,
    musicVolume,
    sfxVolume,
    totalSpins,
    totalWins,
    biggestWin,

    // Actions
    move,
    rotate,
    approachSlot,
    leaveSlot,
    sitDown,
    standUp,
    setBet,
    spin,
    spinComplete,
    collectWin,
    toggleHelp,
    toggleSettings,
    closeModal,
    nextTutorial,
    skipTutorial,
    toggleAudio,
    setMusicVolume,
    setSfxVolume,
    reset,

    // Can actions
    canSpin,
    canSitDown,
    canStandUp,
  };
}
