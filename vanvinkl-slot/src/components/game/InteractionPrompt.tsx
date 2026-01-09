"use client";

interface InteractionPromptProps {
  machineName: string;
}

export function InteractionPrompt({ machineName }: InteractionPromptProps) {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
      style={{
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="px-6 py-3 rounded-xl text-center"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,122,59,0.5)",
          boxShadow: "0 0 30px rgba(255,122,59,0.3)",
        }}
      >
        <div
          className="text-lg font-bold mb-1"
          style={{
            color: "#ff7a3b",
            fontFamily: "var(--font-orbitron), monospace",
          }}
        >
          {machineName}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
          <span>Press</span>
          <kbd
            className="px-2 py-1 rounded font-mono font-bold"
            style={{
              background: "rgba(255,122,59,0.3)",
              border: "1px solid rgba(255,122,59,0.5)",
              color: "#ff7a3b",
            }}
          >
            E
          </kbd>
          <span>to play</span>
        </div>
      </div>
    </div>
  );
}
