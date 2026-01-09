"use client";

import { useCallback } from "react";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(parseFloat(e.target.value));
    },
    [onVolumeChange]
  );

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(10,10,18,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
        style={{ color: isMuted ? "#ff4060" : "#fff" }}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          // Muted icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          // Volume icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={isMuted ? 0 : volume}
        onChange={handleSliderChange}
        className="w-24 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #ff7a3b ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
        }}
        aria-label="Volume"
      />

      {/* Volume percentage */}
      <span
        className="text-xs font-mono w-8 text-right"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {isMuted ? "0" : Math.round(volume * 100)}%
      </span>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff7a3b;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 122, 59, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff7a3b;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 122, 59, 0.5);
        }
      `}</style>
    </div>
  );
}
