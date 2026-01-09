/**
 * usePixiRenderer - React hook for PixiJS slot machine rendering
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { PixiSlotRenderer } from "@/lib/rendering";

export function usePixiRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PixiSlotRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PixiSlotRenderer();
    rendererRef.current = renderer;

    renderer.initialize(canvasRef.current).then((success) => {
      setIsReady(success);
    });

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        rendererRef.current.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      rendererRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Start spin
  const startSpin = useCallback((onComplete?: () => void) => {
    rendererRef.current?.startSpin(onComplete);
  }, []);

  // Stop specific reel
  const stopReel = useCallback((reelIndex: number, symbols: string[]) => {
    rendererRef.current?.stopReel(reelIndex, symbols);
  }, []);

  // Show win line
  const showWinLine = useCallback((lineIndex: number, positions: number[]) => {
    rendererRef.current?.showWinLine(lineIndex, positions);
  }, []);

  // Highlight winning symbols
  const highlightSymbols = useCallback((reelIndex: number, rowIndex: number) => {
    rendererRef.current?.highlightSymbols(reelIndex, rowIndex);
  }, []);

  // Clear highlights
  const clearHighlights = useCallback(() => {
    rendererRef.current?.clearHighlights();
  }, []);

  return {
    canvasRef,
    isReady,
    startSpin,
    stopReel,
    showWinLine,
    highlightSymbols,
    clearHighlights,
  };
}
