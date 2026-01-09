'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, RoundedBox, Cylinder, Sphere, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

interface SlotMachine3DRealisticProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  machineId: string
  isActive?: boolean
  onInteract?: (machineId: string) => void
}

export function SlotMachine3DRealistic({
  position,
  rotation = [0, 0, 0],
  machineId,
  isActive = false,
  onInteract
}: SlotMachine3DRealisticProps) {
  const groupRef = useRef<THREE.Group>(null)
  const reelGroupRef = useRef<THREE.Group>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Spinning animation
  useFrame((state) => {
    if (groupRef.current && isActive) {
      // Gentle idle pulse
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02
    }

    if (reelGroupRef.current && isSpinning) {
      // Fast spin
      reelGroupRef.current.rotation.x += 0.5
    }
  })

  // PBR Materials
  const cabinetMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#8B0000"
      metalness={0.9}
      roughness={0.2}
      envMapIntensity={1.5}
    />
  ), [])

  const screenMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#000000"
      emissive={isActive ? "#4a9eff" : "#1a1a2e"}
      emissiveIntensity={isActive ? 0.8 : 0.2}
      metalness={0.1}
      roughness={0.1}
    />
  ), [isActive])

  const goldMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#FFD700"
      metalness={1}
      roughness={0.1}
      emissive="#FFD700"
      emissiveIntensity={0.3}
    />
  ), [])

  const handleClick = () => {
    setIsSpinning(true)
    onInteract?.(machineId)
    setTimeout(() => setIsSpinning(false), 2000)
  }

  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* Main Cabinet */}
        <RoundedBox
          args={[1.8, 3.2, 1.2]}
          radius={0.1}
          smoothness={4}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          {cabinetMaterial}
        </RoundedBox>

        {/* Cabinet glow trim */}
        <RoundedBox
          args={[1.85, 3.25, 1.25]}
          radius={0.1}
          smoothness={4}
          position={[0, 0, 0]}
        >
          <meshBasicMaterial
            color={isActive ? "#ff0000" : "#400000"}
            transparent
            opacity={0.2}
          />
        </RoundedBox>

        {/* Screen */}
        <RoundedBox
          args={[1.4, 1.8, 0.15]}
          radius={0.05}
          position={[0, 0.5, 0.61]}
          castShadow
        >
          {screenMaterial}
        </RoundedBox>

        {/* Screen glass reflection */}
        <RoundedBox
          args={[1.4, 1.8, 0.1]}
          radius={0.05}
          position={[0, 0.5, 0.68]}
        >
          <MeshTransmissionMaterial
            transmission={0.95}
            thickness={0.2}
            roughness={0.05}
            chromaticAberration={0.02}
            anisotropicBlur={0.1}
          />
        </RoundedBox>

        {/* Reels (3 cylinders) */}
        <group ref={reelGroupRef} position={[0, 0.5, 0.62]}>
          {[-0.4, 0, 0.4].map((x, i) => (
            <Cylinder
              key={i}
              args={[0.15, 0.15, 1.5, 32]}
              position={[x, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.3}
                roughness={0.4}
              />
            </Cylinder>
          ))}
        </group>

        {/* Reel symbols (emojis floating on screen) */}
        {!isSpinning && (
          <group position={[0, 0.5, 0.75]}>
            {[-0.4, 0, 0.4].map((x, i) => (
              <Text
                key={i}
                position={[x, 0, 0]}
                fontSize={0.3}
                color="#FFD700"
                anchorX="center"
                anchorY="middle"
              >
                {['🍒', '💎', '⭐'][i]}
              </Text>
            ))}
          </group>
        )}

        {/* Control Panel */}
        <RoundedBox
          args={[1.6, 0.8, 0.4]}
          radius={0.05}
          position={[0, -0.9, 0.5]}
          rotation={[-Math.PI / 6, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>

        {/* Spin Button (large red button) */}
        <Float
          speed={isHovered ? 4 : 2}
          rotationIntensity={0.3}
          floatIntensity={0.3}
        >
          <Cylinder
            args={[0.25, 0.25, 0.15, 32]}
            position={[0, -0.9, 0.7]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={handleClick}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            castShadow
          >
            <meshStandardMaterial
              color={isHovered ? "#ff6666" : "#ff0000"}
              metalness={0.5}
              roughness={0.2}
              emissive="#ff0000"
              emissiveIntensity={isHovered ? 0.5 : 0.2}
            />
          </Cylinder>
        </Float>

        {/* Coin slot */}
        <RoundedBox
          args={[0.6, 0.1, 0.3]}
          radius={0.02}
          position={[0.5, -0.8, 0.6]}
          rotation={[-Math.PI / 6, 0, 0]}
        >
          <meshStandardMaterial color="#000000" metalness={1} roughness={0.3} />
        </RoundedBox>

        {/* Payout tray */}
        <RoundedBox
          args={[0.8, 0.15, 0.3]}
          radius={0.02}
          position={[0, -1.5, 0.6]}
          castShadow
        >
          <meshStandardMaterial color="#8B4513" metalness={0.5} roughness={0.5} />
        </RoundedBox>

        {/* Top Topper (golden sign) */}
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
          <group position={[0, 2, 0]}>
            {/* Topper structure */}
            <RoundedBox
              args={[1.6, 0.8, 0.2]}
              radius={0.05}
              castShadow
            >
              {goldMaterial}
            </RoundedBox>

            {/* Machine name */}
            <Text
              position={[0, 0, 0.15]}
              fontSize={0.2}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              font="/fonts/Orbitron-Bold.ttf"
            >
              MEGA JACKPOT
            </Text>

            {/* Topper lights (4 corner bulbs) */}
            {[
              [-0.7, 0.3, 0.1],
              [0.7, 0.3, 0.1],
              [-0.7, -0.3, 0.1],
              [0.7, -0.3, 0.1]
            ].map((pos, i) => (
              <Sphere
                key={i}
                args={[0.08, 16, 16]}
                position={pos as [number, number, number]}
              >
                <meshBasicMaterial
                  color={isActive ? "#FFD700" : "#664400"}
                />
              </Sphere>
            ))}

            {/* Topper point lights */}
            <pointLight
              position={[0, 0, 0.3]}
              color="#FFD700"
              intensity={isActive ? 3 : 0.5}
              distance={5}
              decay={2}
            />
          </group>
        </Float>

        {/* Side decorative panels */}
        {[-0.95, 0.95].map((x, i) => (
          <RoundedBox
            key={i}
            args={[0.1, 2.8, 1]}
            radius={0.02}
            position={[x, 0.2, 0]}
          >
            <meshStandardMaterial
              color="#FFD700"
              metalness={0.9}
              roughness={0.2}
              emissive="#FFD700"
              emissiveIntensity={0.2}
            />
          </RoundedBox>
        ))}

        {/* Bottom base */}
        <RoundedBox
          args={[2, 0.3, 1.4]}
          radius={0.05}
          position={[0, -1.75, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.9}
            roughness={0.4}
          />
        </RoundedBox>

        {/* Interaction prompt (when hovered) */}
        {isHovered && (
          <Float speed={3} floatIntensity={0.2}>
            <Text
              position={[0, 2.8, 0]}
              fontSize={0.15}
              color="#40ff90"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              [E] PLAY
            </Text>
          </Float>
        )}

        {/* Main lights */}
        <pointLight
          position={[0, 0.5, 1]}
          color="#4a9eff"
          intensity={isActive ? 2 : 0.5}
          distance={3}
          decay={2}
        />

        <pointLight
          position={[0, -1, 1]}
          color="#ff0000"
          intensity={isHovered ? 1.5 : 0.5}
          distance={2}
          decay={2}
        />

        {/* Collision box for physics */}
        <CuboidCollider args={[0.9, 1.6, 0.6]} position={[0, 0, 0]} />
      </group>
    </RigidBody>
  )
}
