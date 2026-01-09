"use client";

interface MiniMapProps {
  playerX: number; // 0-1 percentage
  playerY: number; // 0-1 percentage
  machines: {
    id: string;
    xPct: number;
    yPct: number;
    label: string;
    visited?: boolean;
  }[];
  visitedSections: Set<string>;
}

export function MiniMap({ playerX, playerY, machines, visitedSections }: MiniMapProps) {
  const mapSize = 120;
  const padding = 8;

  return (
    <div
      className="absolute top-4 right-4 z-20"
      style={{
        width: mapSize,
        height: mapSize,
        background: "rgba(0,0,0,0.7)",
        border: "2px solid rgba(255,122,59,0.4)",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Map label */}
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        MAP
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-2 rounded-lg overflow-hidden"
        style={{
          background: `
            linear-gradient(rgba(255,122,59,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,122,59,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Machine markers */}
      {machines.map((machine) => {
        const isVisited = visitedSections.has(machine.id);
        const x = padding + machine.xPct * (mapSize - padding * 2);
        const y = padding + machine.yPct * (mapSize - padding * 2);

        return (
          <div
            key={machine.id}
            className="absolute"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Machine dot */}
            <div
              className="rounded-sm"
              style={{
                width: 10,
                height: 14,
                background: isVisited
                  ? "rgba(64,255,144,0.8)"
                  : "rgba(255,122,59,0.6)",
                border: `1px solid ${isVisited ? "#40ff90" : "#ff7a3b"}`,
                boxShadow: isVisited
                  ? "0 0 8px rgba(64,255,144,0.5)"
                  : "0 0 6px rgba(255,122,59,0.3)",
              }}
            />
            {/* Tooltip on hover would go here */}
          </div>
        );
      })}

      {/* Player marker */}
      <div
        className="absolute transition-all duration-100"
        style={{
          left: padding + playerX * (mapSize - padding * 2),
          top: padding + playerY * (mapSize - padding * 2),
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Player glow */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            width: 12,
            height: 12,
            background: "rgba(255,122,59,0.4)",
            transform: "translate(-3px, -3px)",
          }}
        />
        {/* Player dot */}
        <div
          className="relative rounded-full"
          style={{
            width: 8,
            height: 8,
            background: "#ff7a3b",
            border: "2px solid #fff",
            boxShadow: "0 0 10px rgba(255,122,59,0.8)",
          }}
        />
      </div>

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: "inset 0 0 15px rgba(255,122,59,0.1)",
        }}
      />
    </div>
  );
}
