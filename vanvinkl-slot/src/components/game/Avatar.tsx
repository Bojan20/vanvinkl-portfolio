"use client";

import { useEffect, useState } from "react";

interface AvatarProps {
  x: number;
  y: number;
  direction: "left" | "right" | "up" | "down";
  isMoving: boolean;
  scale?: number;
}

export function Avatar({ x, y, direction, isMoving, scale = 1 }: AvatarProps) {
  const [frame, setFrame] = useState(0);

  // Scaled dimensions
  const avatarWidth = 60 * scale;
  const avatarHeight = 80 * scale;

  // Animation frames for walking
  useEffect(() => {
    if (!isMoving) {
      setFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 150);

    return () => clearInterval(interval);
  }, [isMoving]);

  // Direction to rotation mapping
  const getRotation = () => {
    switch (direction) {
      case "up": return 0;
      case "right": return 90;
      case "down": return 180;
      case "left": return 270;
      default: return 180;
    }
  };

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        transition: "left 0.05s linear, top 0.05s linear",
      }}
    >
      {/* Avatar placeholder - will be replaced with 3D model/sprite */}
      <div
        className="relative"
        style={{
          width: `${avatarWidth}px`,
          height: `${avatarHeight}px`,
        }}
      >
        {/* Shadow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: `${40 * scale}px`,
            height: `${12 * scale}px`,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Body placeholder - Wizard silhouette */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: `${8 * scale}px`,
            width: `${40 * scale}px`,
            height: `${60 * scale}px`,
            background: "linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)",
            borderRadius: `${20 * scale}px ${20 * scale}px ${10 * scale}px ${10 * scale}px`,
            boxShadow: `
              0 0 20px rgba(255,122,59,0.3),
              inset 0 0 10px rgba(255,255,255,0.1)
            `,
            border: "2px solid rgba(255,122,59,0.5)",
            transform: `rotate(${getRotation()}deg)`,
            transition: "transform 0.1s ease",
          }}
        >
          {/* Face indicator (shows direction) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: `${12 * scale}px`,
              width: `${12 * scale}px`,
              height: `${12 * scale}px`,
              background: "#ff7a3b",
              boxShadow: "0 0 10px rgba(255,122,59,0.8)",
            }}
          />
        </div>

        {/* Wizard hat placeholder */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: `${-8 * scale}px`,
            width: "0",
            height: "0",
            borderLeft: `${15 * scale}px solid transparent`,
            borderRight: `${15 * scale}px solid transparent`,
            borderBottom: `${25 * scale}px solid #1a1a2a`,
            filter: "drop-shadow(0 0 5px rgba(255,122,59,0.5))",
          }}
        />

        {/* Walking animation indicator */}
        {isMoving && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${-8 * scale}px`,
              width: `${30 * scale}px`,
              height: `${6 * scale}px`,
              background: `rgba(255,122,59,${0.3 + frame * 0.1})`,
              borderRadius: `${3 * scale}px`,
              animation: "pulse 0.3s ease-in-out infinite",
            }}
          />
        )}

        {/* Glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,122,59,0.2) 0%, transparent 70%)",
            transform: "scale(2)",
          }}
        />
      </div>

      {/* PLACEHOLDER label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono"
        style={{
          bottom: `${-24 * scale}px`,
          fontSize: `${12 * scale}px`,
          color: "rgba(255,255,255,0.3)",
          background: "rgba(0,0,0,0.5)",
          padding: `${2 * scale}px ${6 * scale}px`,
          borderRadius: `${4 * scale}px`,
        }}
      >
        [AVATAR PLACEHOLDER]
      </div>
    </div>
  );
}
