"use client";

interface ProgressIndicatorProps {
  totalSections: number;
  visitedCount: number;
  sectionNames: string[];
  visitedSections: Set<string>;
}

export function ProgressIndicator({
  totalSections,
  visitedCount,
  sectionNames,
  visitedSections,
}: ProgressIndicatorProps) {
  const percentage = Math.round((visitedCount / totalSections) * 100);

  return (
    <div
      className="absolute bottom-4 left-4 z-20"
      style={{
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "12px 16px",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Progress text */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Explored
        </span>
        <span
          className="text-sm font-bold font-mono"
          style={{
            color: visitedCount === totalSections ? "#40ff90" : "#ff7a3b",
          }}
        >
          {visitedCount}/{totalSections}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {sectionNames.map((name) => {
          const isVisited = visitedSections.has(name);
          return (
            <div
              key={name}
              className="relative group"
              style={{
                width: 24,
                height: 6,
                borderRadius: 3,
                background: isVisited
                  ? "linear-gradient(90deg, #40ff90 0%, #40c8ff 100%)"
                  : "rgba(255,255,255,0.15)",
                boxShadow: isVisited
                  ? "0 0 8px rgba(64,255,144,0.5)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            >
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-mono uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: "rgba(0,0,0,0.9)",
                  color: isVisited ? "#40ff90" : "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {name}
                {isVisited && " ✓"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {visitedCount === totalSections && (
        <div
          className="mt-2 text-xs font-mono text-center"
          style={{ color: "#40ff90" }}
        >
          ✨ All sections explored!
        </div>
      )}
    </div>
  );
}
