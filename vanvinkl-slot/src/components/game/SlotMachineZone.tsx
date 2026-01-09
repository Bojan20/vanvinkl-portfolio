"use client";

interface SlotMachineZoneProps {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  isNear: boolean;
  scale?: number;
}

export function SlotMachineZone({ x, y, label, icon, isNear, scale = 1 }: SlotMachineZoneProps) {
  // Scale dimensions
  const baseWidth = 120 * scale;
  const baseHeight = 160 * scale;
  return (
    <div
      className="absolute"
      role="button"
      aria-label={`${label} section - ${isNear ? 'Press E or Space to interact' : 'Walk closer to interact'}`}
      aria-pressed={isNear}
      tabIndex={isNear ? 0 : -1}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Slot Machine Placeholder */}
      <div
        className="relative transition-all duration-300"
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: isNear ? "scale(1.1)" : "scale(1)",
        }}
      >
        {/* Machine body */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: isNear
              ? "linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 50%, #1a1a2a 100%)"
              : "linear-gradient(145deg, #2a2a3a 0%, #1a1a2a 50%, #0a0a1a 100%)",
            boxShadow: isNear
              ? `
                0 0 40px rgba(255,122,59,0.5),
                0 20px 40px rgba(0,0,0,0.8),
                inset 0 1px 0 rgba(255,255,255,0.2)
              `
              : `
                0 10px 30px rgba(0,0,0,0.6),
                inset 0 1px 0 rgba(255,255,255,0.1)
              `,
            border: isNear
              ? "2px solid rgba(255,122,59,0.6)"
              : "2px solid rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          {/* Screen area */}
          <div
            className="absolute rounded-lg flex items-center justify-center"
            style={{
              left: `${8 * scale}px`,
              right: `${8 * scale}px`,
              top: `${16 * scale}px`,
              height: `${64 * scale}px`,
              background: "#050508",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            <span style={{ fontSize: `${36 * scale}px` }}>{icon}</span>
          </div>

          {/* Label */}
          <div
            className="absolute text-center"
            style={{
              left: `${8 * scale}px`,
              right: `${8 * scale}px`,
              top: `${96 * scale}px`,
              fontFamily: "var(--font-orbitron), monospace",
              fontSize: `${10 * scale}px`,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              color: isNear ? "#ff7a3b" : "#666",
              textShadow: isNear ? "0 0 10px rgba(255,122,59,0.8)" : "none",
              transition: "all 0.3s ease",
            }}
          >
            {label}
          </div>

          {/* Lever placeholder */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              right: `${-12 * scale}px`,
              width: `${12 * scale}px`,
              height: `${40 * scale}px`,
              background: "linear-gradient(90deg, #666 0%, #888 50%, #666 100%)",
              borderRadius: `${6 * scale}px`,
              boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: `${-8 * scale}px`,
                width: `${20 * scale}px`,
                height: `${20 * scale}px`,
                background: isNear
                  ? "radial-gradient(circle at 40% 30%, #ff6060 0%, #cc0000 100%)"
                  : "radial-gradient(circle at 40% 30%, #aa4040 0%, #880000 100%)",
                boxShadow: isNear ? "0 0 10px rgba(255,0,0,0.5)" : "none",
              }}
            />
          </div>

          {/* Bottom panel */}
          <div
            className="absolute rounded-lg"
            style={{
              left: `${8 * scale}px`,
              right: `${8 * scale}px`,
              bottom: `${12 * scale}px`,
              height: `${32 * scale}px`,
              background: "linear-gradient(180deg, #1a1a2a 0%, #0a0a1a 100%)",
              boxShadow: "inset 0 2px 5px rgba(0,0,0,0.5)",
            }}
          />

          {/* Glow indicator when near */}
          {isNear && (
            <div
              className="absolute rounded-2xl pointer-events-none"
              style={{
                inset: `${-16 * scale}px`,
                background: "radial-gradient(ellipse, rgba(255,122,59,0.2) 0%, transparent 70%)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Floor shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: `${-16 * scale}px`,
            width: `${100 * scale}px`,
            height: `${20 * scale}px`,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* PLACEHOLDER label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono"
          style={{
            bottom: `${-32 * scale}px`,
            fontSize: `${12 * scale}px`,
            color: "rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.3)",
            padding: `${1 * scale}px ${4 * scale}px`,
            borderRadius: `${2 * scale}px`,
          }}
        >
          [3D MODEL]
        </div>
      </div>
    </div>
  );
}
