/**
 * useSlotMachine - React hook for slot machine state
 */

import { useCallback, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { slotMachine, SYMBOLS, PAYLINES, type SymbolId } from "@/lib/state";

export function useSlotMachine() {
  const [state, send] = useMachine(slotMachine);

  // Derived state
  const isIdle = state.matches("idle");
  const isSpinning = state.matches("spinning");
  const isEvaluating = state.matches("evaluating");
  const isWinning = state.matches("winning");
  const isLosing = state.matches("losing");
  const isJackpot = state.matches("jackpot");
  const isBonus = state.matches("bonus");

  // Context
  const {
    reels,
    visibleSymbols,
    activePaylines,
    betPerLine,
    totalBet,
    winAmount,
    winningLines,
    isJackpot: hasJackpot,
    freeSpinsRemaining,
    multiplier,
  } = state.context;

  // Actions
  const startSpin = useCallback(() => {
    send({ type: "START_SPIN" });
  }, [send]);

  const stopReel = useCallback(
    (reelIndex: number) => {
      send({ type: "STOP_REEL", reelIndex });
    },
    [send]
  );

  const setBet = useCallback(
    (betPerLine: number) => {
      send({ type: "SET_BET", betPerLine });
    },
    [send]
  );

  const setPaylines = useCallback(
    (count: number) => {
      send({ type: "SET_PAYLINES", count });
    },
    [send]
  );

  const triggerBonus = useCallback(() => {
    send({ type: "TRIGGER_BONUS" });
  }, [send]);

  const completeBonus = useCallback(() => {
    send({ type: "BONUS_COMPLETE" });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: "RESET" });
  }, [send]);

  // Get symbol info
  const getSymbolInfo = useCallback((id: SymbolId) => SYMBOLS[id], []);

  // Get active payline patterns
  const activePaylinePatterns = useMemo(
    () => PAYLINES.slice(0, activePaylines),
    [activePaylines]
  );

  // Can spin
  const canSpin = useMemo(() => isIdle || isBonus, [isIdle, isBonus]);

  return {
    // State
    state: state.value,
    isIdle,
    isSpinning,
    isEvaluating,
    isWinning,
    isLosing,
    isJackpot,
    isBonus,

    // Context
    reels,
    visibleSymbols,
    activePaylines,
    betPerLine,
    totalBet,
    winAmount,
    winningLines,
    hasJackpot,
    freeSpinsRemaining,
    multiplier,

    // Actions
    startSpin,
    stopReel,
    setBet,
    setPaylines,
    triggerBonus,
    completeBonus,
    reset,

    // Utilities
    getSymbolInfo,
    activePaylinePatterns,
    canSpin,
    SYMBOLS,
    PAYLINES,
  };
}
