'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sphere, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

interface ThirdPersonAvatarProps {
  position?: [number, number, number]
  speed?: number
  onProximityChange?: (machineId: string | null) => void
  machinePositions?: Array<{ id: string; pos: [number, number, number] }>
}

export function ThirdPersonAvatar({
  position = [0, 0.5, 8],
  speed = 4,
  onProximityChange,
  machinePositions = []
}: ThirdPersonAvatarProps) {
  const { camera } = useThree()
  const avatarRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const targetRotation = useRef(0)

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp': keys.current.forward = true; break
        case 'ArrowDown': keys.current.backward = true; break
        case 'ArrowLeft': keys.current.left = true; break
        case 'ArrowRight': keys.current.right = true; break
        case 'ShiftLeft': keys.current.sprint = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp': keys.current.forward = false; break
        case 'ArrowDown': keys.current.backward = false; break
        case 'ArrowLeft': keys.current.left = false; break
        case 'ArrowRight': keys.current.right = false; break
        case 'ShiftLeft': keys.current.sprint = false; break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Mouse look
  useEffect(() => {
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        mouseX -= e.movementX * 0.002
        mouseY -= e.movementY * 0.002
        mouseY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, mouseY))
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    if (!avatarRef.current) return

    const currentSpeed = keys.current.sprint ? speed * 1.8 : speed

    // Movement direction based on camera
    const direction = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()

    velocity.current.set(0, 0, 0)

    if (keys.current.forward) velocity.current.add(direction)
    if (keys.current.backward) velocity.current.sub(direction)
    if (keys.current.right) velocity.current.add(right)
    if (keys.current.left) velocity.current.sub(right)

    if (velocity.current.length() > 0) {
      velocity.current.normalize().multiplyScalar(currentSpeed * delta)
      avatarRef.current.position.add(velocity.current)

      // Rotate avatar towards movement
      const angle = Math.atan2(velocity.current.x, velocity.current.z)
      targetRotation.current = angle
    }

    // Smooth rotation
    if (avatarRef.current.rotation.y !== targetRotation.current) {
      const diff = targetRotation.current - avatarRef.current.rotation.y
      avatarRef.current.rotation.y += diff * 0.1
    }

    // Wall boundaries
    avatarRef.current.position.x = Math.max(-13, Math.min(13, avatarRef.current.position.x))
    avatarRef.current.position.z = Math.max(-13, Math.min(8, avatarRef.current.position.z))
    avatarRef.current.position.y = 0.5

    // Collision detection with machines
    if (machinePositions.length > 0) {
      const avatarPos = avatarRef.current.position
      const collisionRadius = 1.5 // Machine collision radius

      machinePositions.forEach(machine => {
        const dx = avatarPos.x - machine.pos[0]
        const dz = avatarPos.z - machine.pos[2]
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < collisionRadius) {
          // Push avatar away from machine
          const angle = Math.atan2(dz, dx)
          avatarPos.x = machine.pos[0] + Math.cos(angle) * collisionRadius
          avatarPos.z = machine.pos[2] + Math.sin(angle) * collisionRadius
        }
      })
    }

    // Camera follows avatar - third person
    const idealOffset = new THREE.Vector3(0, 3, 6)
    const idealLookat = new THREE.Vector3(
      avatarRef.current.position.x,
      avatarRef.current.position.y + 1.5,
      avatarRef.current.position.z
    )

    // Smooth camera
    camera.position.lerp(
      idealLookat.clone().add(idealOffset),
      0.05
    )
    camera.lookAt(idealLookat)

    // Check proximity to machines
    if (onProximityChange && machinePositions.length > 0) {
      const avatarPos = avatarRef.current.position
      let closestMachine: string | null = null
      let closestDistance = Infinity

      machinePositions.forEach(machine => {
        const distance = Math.sqrt(
          Math.pow(avatarPos.x - machine.pos[0], 2) +
          Math.pow(avatarPos.z - machine.pos[2], 2)
        )

        if (distance < 2.5 && distance < closestDistance) {
          closestDistance = distance
          closestMachine = machine.id
        }
      })

      onProximityChange(closestMachine)
    }
  })

  return (
    <group ref={avatarRef} position={position}>
      {/* Body */}
      <Cylinder args={[0.25, 0.3, 1, 16]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#2a4a7f" metalness={0.3} roughness={0.7} />
      </Cylinder>

      {/* Head */}
      <Sphere args={[0.3, 16, 16]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#ffdbac" metalness={0.1} roughness={0.9} />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.05, 8, 8]} position={[-0.1, 1.25, 0.25]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[0.1, 1.25, 0.25]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>

      {/* Arms */}
      <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[-0.35, 0.6, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#2a4a7f" metalness={0.3} roughness={0.7} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.6, 8]} position={[0.35, 0.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color="#2a4a7f" metalness={0.3} roughness={0.7} />
      </Cylinder>

      {/* Legs */}
      <Cylinder args={[0.1, 0.09, 0.6, 8]} position={[-0.12, -0.3, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.8} />
      </Cylinder>
      <Cylinder args={[0.1, 0.09, 0.6, 8]} position={[0.12, -0.3, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.8} />
      </Cylinder>

      {/* Shadow indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export function ThirdPersonInstructions({ nearMachine }: { nearMachine: string | null }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3">
        <div className="flex gap-6 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">↑ ↓ ← →</span>
            <span>Move</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">MOUSE</span>
            <span>Look</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">SHIFT</span>
            <span>Sprint</span>
          </div>
          {nearMachine && (
            <div className="flex items-center gap-2 animate-pulse">
              <span className="font-mono text-green-400 font-bold">SPACE</span>
              <span className="text-green-400 font-bold">Interact</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
