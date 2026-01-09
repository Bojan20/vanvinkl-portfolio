"use client";

import { useState, useEffect } from "react";

interface HelpPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["W", "A", "S", "D"], action: "Move around the lounge" },
  { keys: ["↑", "←", "↓", "→"], action: "Alternative movement" },
  { keys: ["E"], action: "Interact with slot machine" },
  { keys: ["Space"], action: "Alternative interact" },
  { keys: ["ESC"], action: "Close section / Go back" },
  { keys: ["?"], action: "Toggle this help panel" },
];

export function HelpPanel({ isVisible, onClose }: HelpPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      onTransitionEnd={() => !isVisible && setIsAnimating(false)}
    >
      <div
        className="relative max-w-md w-full mx-4 p-6 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #0a0a12 0%, #12121a 100%)",
          border: "2px solid rgba(255,122,59,0.4)",
          boxShadow: "0 0 60px rgba(255,122,59,0.2), 0 20px 60px rgba(0,0,0,0.5)",
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold tracking-widest"
            style={{
              color: "#ff7a3b",
              fontFamily: "var(--font-orbitron), monospace",
              textShadow: "0 0 20px rgba(255,122,59,0.5)",
            }}
          >
            CONTROLS
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Keys */}
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 rounded-lg text-sm font-mono font-bold"
                    style={{
                      background: "linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)",
                      border: "1px solid rgba(255,122,59,0.3)",
                      color: "#ff7a3b",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                      minWidth: "32px",
                      textAlign: "center",
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
              {/* Action */}
              <span
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {shortcut.action}
              </span>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div
          className="mt-6 pt-4 text-center text-xs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono mx-1">?</kbd> anytime to toggle this panel
        </div>
      </div>
    </div>
  );
}
