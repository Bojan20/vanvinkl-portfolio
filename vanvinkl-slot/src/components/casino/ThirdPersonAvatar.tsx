'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AnimatedAvatar } from '../3d/AnimatedAvatar'
import * as THREE from 'three'

interface ThirdPersonAvatarProps {
  position?: [number, number, number]
  speed?: number
  onProximityChange?: (machineId: string | null) => void
  machinePositions?: Array<{ id: string; pos: [number, number, number] }>
  positionRef?: React.MutableRefObject<THREE.Vector3>
  rotationRef?: React.MutableRefObject<number>
  onMove?: () => void
  nearMachine?: string | null // For facial expressions
}

export function ThirdPersonAvatar({
  position = [0, 0.5, 8],
  speed = 5, // Slower movement (was 8)
  onProximityChange,
  machinePositions = [],
  positionRef,
  rotationRef,
  onMove,
  nearMachine
}: ThirdPersonAvatarProps) {
  const { camera } = useThree()
  const avatarRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const targetVelocity = useRef(new THREE.Vector3()) // For smooth acceleration
  const targetRotation = useRef(Math.PI) // Start facing forward (toward slots)

  // Animation state for AnimatedAvatar
  const isMoving = useRef(false)
  const moveDirection = useRef(new THREE.Vector3())
  const currentSpeed = useRef(0)
  const wasMovingLastFrame = useRef(false) // Track if we just started moving

  // Acceleration constants (ULTRA RESPONSIVE - instant input, butter smooth)
  const ACCELERATION = 80 // Units/s² — near-instant acceleration
  const DECELERATION = 60 // Units/s² — instant stop
  const MAX_SPEED = speed
  const ROTATION_SPEED = 0.5 // Much faster rotation for instant direction change
  const INSTANT_START_SPEED = 3.5 // Instant velocity on first frame of input (higher = more instant feel)

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp': keys.current.forward = true; break
        case 'ArrowDown': keys.current.backward = true; break
        case 'ArrowLeft': keys.current.left = true; break
        case 'ArrowRight': keys.current.right = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp': keys.current.forward = false; break
        case 'ArrowDown': keys.current.backward = false; break
        case 'ArrowLeft': keys.current.left = false; break
        case 'ArrowRight': keys.current.right = false; break
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

    // Movement direction based on camera
    const direction = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()

    // Calculate desired movement direction (target velocity)
    targetVelocity.current.set(0, 0, 0)

    if (keys.current.forward) targetVelocity.current.add(direction)
    if (keys.current.backward) targetVelocity.current.sub(direction)
    if (keys.current.right) targetVelocity.current.add(right)
    if (keys.current.left) targetVelocity.current.sub(right)

    const isInputActive = targetVelocity.current.length() > 0

    if (isInputActive) {
      // Normalize and scale to max speed
      targetVelocity.current.normalize().multiplyScalar(MAX_SPEED)

      // Calculate rotation angle first (before setting flags)
      const angle = Math.atan2(targetVelocity.current.x, targetVelocity.current.z)

      // INSTANT START - if we just started moving, set velocity AND rotation immediately (NO LERP!)
      const justStartedMoving = !wasMovingLastFrame.current
      if (justStartedMoving) {
        velocity.current.copy(targetVelocity.current).multiplyScalar(INSTANT_START_SPEED / MAX_SPEED)
        avatarRef.current.rotation.y = angle // Instant rotation, no lerp delay
        wasMovingLastFrame.current = true
      } else {
        // Already moving - use smooth acceleration
        const accelAlpha = Math.min(ACCELERATION * delta, 1)
        velocity.current.lerp(targetVelocity.current, accelAlpha)
      }

      // Additional boost for very low speeds (helps with direction changes and instant feel)
      if (velocity.current.length() < MAX_SPEED * 0.4) {
        velocity.current.add(
          targetVelocity.current.clone().multiplyScalar(delta * 30)
        ).clampLength(0, MAX_SPEED)
      }

      // Apply movement
      const movement = velocity.current.clone().multiplyScalar(delta)
      avatarRef.current.position.add(movement)

      // Notify parent that avatar moved
      onMove?.()

      // Update animation state
      isMoving.current = true
      moveDirection.current.copy(velocity.current).normalize()
      currentSpeed.current = velocity.current.length()

      // Set target rotation for smooth lerp (when already moving)
      targetRotation.current = angle
    } else {
      // Reset "was moving" flag so next input will be instant
      wasMovingLastFrame.current = false

      // Smooth deceleration when no input
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), Math.min(DECELERATION * delta, 1))

      // Apply residual movement
      if (velocity.current.length() > 0.01) {
        const movement = velocity.current.clone().multiplyScalar(delta)
        avatarRef.current.position.add(movement)
        currentSpeed.current = velocity.current.length()
      } else {
        velocity.current.set(0, 0, 0)
        isMoving.current = false
        currentSpeed.current = 0
      }
    }

    // Smooth rotation (lerp toward target) - ULTRA FAST for instant feel
    let rotationDiff = targetRotation.current - avatarRef.current.rotation.y

    // Normalize to shortest path (-PI to PI)
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

    // If rotation difference is small, snap instantly to avoid micro-delays
    if (Math.abs(rotationDiff) < 0.05) {
      avatarRef.current.rotation.y = targetRotation.current
    } else {
      avatarRef.current.rotation.y += rotationDiff * ROTATION_SPEED
    }

    // Wall boundaries - TIGHT collision (avatar cannot pass through walls)
    // Left wall at x=-40, right wall at x=40, back wall at z=-15, front open at z=8
    // Avatar size ~0.5 radius, so boundaries are wall position ± 0.5
    const wallPadding = 1.5 // Avatar collision radius
    avatarRef.current.position.x = Math.max(-40 + wallPadding, Math.min(40 - wallPadding, avatarRef.current.position.x))
    avatarRef.current.position.z = Math.max(-15 + wallPadding, Math.min(8, avatarRef.current.position.z))
    avatarRef.current.position.y = 0.5

    // Collision detection with machines
    if (machinePositions.length > 0) {
      const avatarPos = avatarRef.current.position
      const collisionRadius = 3.2 // Collision radius for 2.0x scale machines

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

    // Update position & rotation refs for CameraRig
    if (positionRef) {
      positionRef.current.copy(avatarRef.current.position)
    }
    if (rotationRef) {
      rotationRef.current = avatarRef.current.rotation.y
    }

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

        if (distance < 4.5 && distance < closestDistance) {
          closestDistance = distance
          closestMachine = machine.id
        }
      })

      onProximityChange(closestMachine)
    }
  })

  return (
    <group ref={avatarRef} position={position} rotation={[0, Math.PI, 0]}>
      <AnimatedAvatar
        isMovingRef={isMoving}
        moveDirectionRef={moveDirection}
        currentSpeedRef={currentSpeed}
        isNearMachine={!!nearMachine}
      />
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
