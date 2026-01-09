"use client";

/**
 * PixiSlotMachine - WebGL-accelerated slot machine component
 */

import { useEffect, useRef, useCallback } from "react";
import { usePixiRenderer } from "@/hooks/usePixiRenderer";
import { useSlotMachine } from "@/hooks/useSlotMachine";

interface PixiSlotMachineProps {
  width?: number;
  height?: number;
  onWin?: (amount: number) => void;
  onJackpot?: () => void;
  disabled?: boolean;
}

export function PixiSlotMachine({
  width = 800,
  height = 600,
  onWin,
  onJackpot,
  disabled = false,
}: PixiSlotMachineProps) {
  const {
    canvasRef,
    isReady,
    startSpin,
    stopReel,
    showWinLine,
    clearHighlights,
  } = usePixiRenderer();

  const {
    isIdle,
    isSpinning,
    isWinning,
    isJackpot,
    visibleSymbols,
    winAmount,
    winningLines,
    betPerLine,
    totalBet,
    activePaylines,
    startSpin: triggerSpin,
    setBet,
    setPaylines,
    PAYLINES,
  } = useSlotMachine();

  const spinCompleteRef = useRef<(() => void) | null>(null);

  // Handle spin complete
  const handleSpinComplete = useCallback(() => {
    // Stop reels sequentially with final symbols
    const stopSequence = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const symbols = visibleSymbols[i] || ["CHERRY", "LEMON", "ORANGE"];
        stopReel(i, symbols);
      }
    };

    stopSequence();
  }, [stopReel, visibleSymbols]);

  // Handle spin button click
  const handleSpin = useCallback(() => {
    if (!isReady || !isIdle || disabled) return;

    clearHighlights();
    triggerSpin();

    startSpin(() => {
      // Animation complete callback
    });
  }, [isReady, isIdle, disabled, clearHighlights, triggerSpin, startSpin]);

  // Show win effects
  useEffect(() => {
    if (isWinning && winningLines.length > 0) {
      // Show win lines
      for (const lineIndex of winningLines) {
        const positions = PAYLINES[lineIndex];
        if (positions) {
          showWinLine(lineIndex, positions);
        }
      }

      onWin?.(winAmount);
    }
  }, [isWinning, winningLines, winAmount, showWinLine, onWin, PAYLINES]);

  // Jackpot effect
  useEffect(() => {
    if (isJackpot) {
      onJackpot?.();
    }
  }, [isJackpot, onJackpot]);

  // Trigger spin complete when XState changes
  useEffect(() => {
    if (!isSpinning && spinCompleteRef.current) {
      spinCompleteRef.current();
      spinCompleteRef.current = null;
    }
  }, [isSpinning]);

  return (
    <div
      className="relative"
      style={{
        width,
        height,
      }}
    >
      {/* PixiJS Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "16px",
        }}
      />

      {/* UI Overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        {/* Bet controls */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            onClick={() => setBet(Math.max(1, betPerLine - 1))}
            disabled={!isIdle || disabled}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            -
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-white/60">BET</div>
            <div className="text-lg font-bold text-yellow-400">${totalBet}</div>
          </div>
          <button
            onClick={() => setBet(betPerLine + 1)}
            disabled={!isIdle || disabled}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={!isReady || !isIdle || disabled}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
          style={{
            background: isIdle
              ? "linear-gradient(180deg, #ff7a3b 0%, #ff5722 100%)"
              : "rgba(255,255,255,0.1)",
            color: isIdle ? "white" : "rgba(255,255,255,0.4)",
            boxShadow: isIdle ? "0 4px 20px rgba(255,122,59,0.4)" : "none",
            transform: isIdle ? "scale(1)" : "scale(0.95)",
          }}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>

        {/* Lines control */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            onClick={() => setPaylines(Math.max(1, activePaylines - 1))}
            disabled={!isIdle || disabled}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            -
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-white/60">LINES</div>
            <div className="text-lg font-bold text-cyan-400">{activePaylines}</div>
          </div>
          <button
            onClick={() => setPaylines(activePaylines + 1)}
            disabled={!isIdle || disabled}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Win display */}
      {isWinning && winAmount > 0 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce"
          style={{
            textShadow: "0 0 20px rgba(255,215,0,0.8)",
          }}
        >
          <div
            className="text-6xl font-bold"
            style={{
              color: isJackpot ? "#ff4444" : "#ffd700",
              fontFamily: "var(--font-orbitron), monospace",
            }}
          >
            {isJackpot ? "JACKPOT!" : "WIN!"}
          </div>
          <div
            className="text-4xl font-bold mt-2"
            style={{ color: "#ffd700" }}
          >
            ${winAmount}
          </div>
        </div>
      )}
    </div>
  );
}
