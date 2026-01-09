"use client";

import { useRef, useState, useMemo, forwardRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

// Slot symbols configuration
const SYMBOLS = [
  { id: "sound", emoji: "🎵", label: "Sound Design", section: "#services" },
  { id: "game", emoji: "🎮", label: "Game Audio", section: "#projects" },
  { id: "film", emoji: "🎬", label: "Film Scoring", section: "#about" },
  { id: "star", emoji: "⭐", label: "Portfolio", section: "#projects" },
  { id: "music", emoji: "🎹", label: "Music", section: "#services" },
  { id: "mic", emoji: "🎙️", label: "Voice Over", section: "#services" },
  { id: "contact", emoji: "📧", label: "Contact", section: "#contact" },
  { id: "wizard", emoji: "🧙", label: "About Me", section: "#about" },
];

const REEL_SYMBOLS = 12; // Number of symbols per reel
const SYMBOL_HEIGHT = 1.2;

interface SlotMachineProps {
  onResult?: (result: { symbols: string[]; isWin: boolean; section: string }) => void;
  onSpin?: () => void;
}

export function SlotMachine({ onResult, onSpin }: SlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelPositions, setReelPositions] = useState([0, 0, 0]);
  const [canSpin, setCanSpin] = useState(true);
  const leverRef = useRef<THREE.Group>(null);
  const reelRefs = useRef<(THREE.Group | null)[]>([null, null, null]);

  // Generate reel symbols
  const reelSymbols = useMemo(() => {
    return [0, 1, 2].map(() => {
      const symbols = [];
      for (let i = 0; i < REEL_SYMBOLS; i++) {
        symbols.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      return symbols;
    });
  }, []);

  // Spin function
  const spin = () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setCanSpin(false);
    onSpin?.();

    // Animate lever
    if (leverRef.current) {
      gsap.to(leverRef.current.rotation, {
        z: -Math.PI / 3,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }

    // Target positions (random)
    const targets = [
      Math.floor(Math.random() * REEL_SYMBOLS),
      Math.floor(Math.random() * REEL_SYMBOLS),
      Math.floor(Math.random() * REEL_SYMBOLS),
    ];

    // Animate each reel with stagger
    reelRefs.current.forEach((reel, index) => {
      if (!reel) return;

      const spins = 3 + index; // More spins for later reels
      const targetRotation = (spins * REEL_SYMBOLS + targets[index]) * (Math.PI * 2 / REEL_SYMBOLS);

      gsap.to(reel.rotation, {
        x: -targetRotation,
        duration: 2 + index * 0.5,
        ease: "power2.out",
        onComplete: () => {
          if (index === 2) {
            // All reels stopped
            setIsSpinning(false);
            setCanSpin(true);
            setReelPositions(targets);

            // Check result
            const resultSymbols = targets.map((pos, i) => reelSymbols[i][pos % REEL_SYMBOLS]);
            const isWin = resultSymbols[0].id === resultSymbols[1].id && resultSymbols[1].id === resultSymbols[2].id;

            onResult?.({
              symbols: resultSymbols.map(s => s.id),
              isWin,
              section: resultSymbols[1].section,
            });
          }
        },
      });
    });
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Machine body */}
      <MachineBody />

      {/* Reels */}
      <group position={[0, 0.5, 0.5]}>
        {[0, 1, 2].map((reelIndex) => (
          <Reel
            key={reelIndex}
            ref={(el: THREE.Group | null) => {
              reelRefs.current[reelIndex] = el;
            }}
            position={[(reelIndex - 1) * 1.5, 0, 0]}
            symbols={reelSymbols[reelIndex]}
          />
        ))}
      </group>

      {/* Lever */}
      <Lever ref={leverRef} position={[3, 0, 0]} onPull={spin} isSpinning={isSpinning} />

      {/* Spin button */}
      <SpinButton position={[0, -1.5, 1]} onClick={spin} disabled={isSpinning} />

      {/* Display panel */}
      <DisplayPanel position={[0, 2.5, 0.5]} isSpinning={isSpinning} />
    </group>
  );
}

// Machine body component
function MachineBody() {
  return (
    <group>
      {/* Main cabinet */}
      <RoundedBox args={[6, 5, 2]} radius={0.1} position={[0, 0.5, 0]}>
        <meshStandardMaterial
          color="#1a1a20"
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Glass panel */}
      <RoundedBox args={[5, 2.5, 0.1]} radius={0.05} position={[0, 0.5, 1]}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
        />
      </RoundedBox>

      {/* Neon trim */}
      <NeonTrim />

      {/* Base */}
      <RoundedBox args={[6.5, 0.5, 2.5]} radius={0.1} position={[0, -2.5, 0]}>
        <meshStandardMaterial color="#0d0d0d" metalness={0.9} roughness={0.1} />
      </RoundedBox>
    </group>
  );
}

// Neon trim component (static, no animation)
function NeonTrim() {
  return (
    <>
      {/* Top trim */}
      <mesh position={[0, 3.1, 0.5]}>
        <boxGeometry args={[5.5, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#ff7a3b"
          emissive="#ff7a3b"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Side trims */}
      {[-2.8, 2.8].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0.5]}>
          <boxGeometry args={[0.1, 5, 0.1]} />
          <meshStandardMaterial
            color="#ff7a3b"
            emissive="#ff7a3b"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </>
  );
}

// Single reel component
interface ReelProps {
  position: [number, number, number];
  symbols: typeof SYMBOLS;
}

const Reel = forwardRef<THREE.Group, ReelProps>(({ position, symbols }, ref) => {
  const radius = (REEL_SYMBOLS * SYMBOL_HEIGHT) / (2 * Math.PI);

  return (
    <group ref={ref} position={position}>
      {/* Reel cylinder */}
      <mesh>
        <cylinderGeometry args={[radius, radius, 1, 32]} />
        <meshStandardMaterial
          color="#242430"
          metalness={0.5}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Symbols arranged in a circle */}
      {symbols.map((symbol, index) => {
        const angle = (index / REEL_SYMBOLS) * Math.PI * 2;
        const y = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <group
            key={index}
            position={[0, y, z]}
            rotation={[angle - Math.PI / 2, 0, 0]}
          >
            <Text
              fontSize={0.6}
              anchorX="center"
              anchorY="middle"
            >
              {symbol.emoji}
            </Text>
          </group>
        );
      })}
    </group>
  );
});

// Lever component
interface LeverProps {
  position: [number, number, number];
  onPull: () => void;
  isSpinning: boolean;
}

const Lever = forwardRef<THREE.Group, LeverProps>(({ position, onPull, isSpinning }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <group ref={ref} position={position}>
      {/* Lever base */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.5, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lever arm */}
      <group rotation={[0, 0, 0]}>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5, 16]} />
          <meshStandardMaterial color="#666" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Lever handle (ball) */}
        <mesh
          position={[0, 1.6, 0]}
          onClick={!isSpinning ? onPull : undefined}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color={isHovered ? "#ff9a6b" : "#ff7a3b"}
            emissive={isHovered ? "#ff7a3b" : "#000"}
            emissiveIntensity={isHovered ? 0.5 : 0}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  );
});

// Spin button component
interface SpinButtonProps {
  position: [number, number, number];
  onClick: () => void;
  disabled: boolean;
}

function SpinButton({ position, onClick, disabled }: SpinButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        onClick={!disabled ? onClick : undefined}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        scale={isHovered && !disabled ? 1.1 : 1}
      >
        <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
        <meshStandardMaterial
          color={disabled ? "#333" : isHovered ? "#ff9a6b" : "#ff7a3b"}
          emissive={disabled ? "#000" : "#ff7a3b"}
          emissiveIntensity={disabled ? 0 : isHovered ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      <Text
        position={[0, 0.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color={disabled ? "#666" : "#000"}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {disabled ? "SPINNING..." : "SPIN"}
      </Text>
    </group>
  );
}

// Display panel component
interface DisplayPanelProps {
  position: [number, number, number];
  isSpinning: boolean;
}

function DisplayPanel({ position, isSpinning }: DisplayPanelProps) {
  return (
    <group position={position}>
      {/* Panel background */}
      <RoundedBox args={[4, 0.8, 0.1]} radius={0.05}>
        <meshStandardMaterial color="#0a0a0c" metalness={0.9} roughness={0.1} />
      </RoundedBox>

      {/* Text */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.3}
        color={isSpinning ? "#40c8ff" : "#ff7a3b"}
        anchorX="center"
        anchorY="middle"
      >
        {isSpinning ? "SPINNING..." : "PULL TO EXPLORE"}
      </Text>
    </group>
  );
}

// Display names for debugging
Reel.displayName = "Reel";
Lever.displayName = "Lever";
