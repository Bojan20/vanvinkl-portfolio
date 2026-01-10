'use client'

import { useRef, useEffect, useState } from 'react'
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
  nearMachine?: string | null
  mobileInput?: { x: number; y: number } | null // Mobile joystick input
}

export function ThirdPersonAvatar({
  position = [0, 0.5, 8],
  speed = 5,
  onProximityChange,
  machinePositions = [],
  positionRef,
  rotationRef,
  onMove,
  nearMachine,
  mobileInput
}: ThirdPersonAvatarProps) {
  const { camera } = useThree()
  const avatarRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const targetVelocity = useRef(new THREE.Vector3())
  const targetRotation = useRef(Math.PI)

  const isMoving = useRef(false)
  const moveDirection = useRef(new THREE.Vector3())
  const currentSpeed = useRef(0)
  const wasMovingLastFrame = useRef(false)

  const ACCELERATION = 80
  const DECELERATION = 60
  const MAX_SPEED = speed
  const ROTATION_SPEED = 0.5
  const INSTANT_START_SPEED = 3.5

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  })

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': keys.current.forward = true; break
        case 'KeyS':
        case 'ArrowDown': keys.current.backward = true; break
        case 'KeyA':
        case 'ArrowLeft': keys.current.left = true; break
        case 'KeyD':
        case 'ArrowRight': keys.current.right = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': keys.current.forward = false; break
        case 'KeyS':
        case 'ArrowDown': keys.current.backward = false; break
        case 'KeyA':
        case 'ArrowLeft': keys.current.left = false; break
        case 'KeyD':
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

  useFrame((state, delta) => {
    if (!avatarRef.current) return

    // Movement direction based on camera
    const direction = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize()

    // Calculate target velocity from keyboard OR mobile joystick
    targetVelocity.current.set(0, 0, 0)

    // Keyboard input
    if (keys.current.forward) targetVelocity.current.add(direction)
    if (keys.current.backward) targetVelocity.current.sub(direction)
    if (keys.current.right) targetVelocity.current.add(right)
    if (keys.current.left) targetVelocity.current.sub(right)

    // Mobile joystick input (override or combine)
    if (mobileInput && (Math.abs(mobileInput.x) > 0.1 || Math.abs(mobileInput.y) > 0.1)) {
      // Forward/backward (Y axis)
      targetVelocity.current.add(direction.clone().multiplyScalar(mobileInput.y))
      // Left/right (X axis)
      targetVelocity.current.add(right.clone().multiplyScalar(mobileInput.x))
    }

    const isInputActive = targetVelocity.current.length() > 0.1

    if (isInputActive) {
      targetVelocity.current.normalize().multiplyScalar(MAX_SPEED)
      const angle = Math.atan2(targetVelocity.current.x, targetVelocity.current.z)

      const justStartedMoving = !wasMovingLastFrame.current
      if (justStartedMoving) {
        velocity.current.copy(targetVelocity.current).multiplyScalar(INSTANT_START_SPEED / MAX_SPEED)
        avatarRef.current.rotation.y = angle
        wasMovingLastFrame.current = true
      } else {
        const accelAlpha = Math.min(ACCELERATION * delta, 1)
        velocity.current.lerp(targetVelocity.current, accelAlpha)
      }

      if (velocity.current.length() < MAX_SPEED * 0.4) {
        velocity.current.add(
          targetVelocity.current.clone().multiplyScalar(delta * 30)
        ).clampLength(0, MAX_SPEED)
      }

      const movement = velocity.current.clone().multiplyScalar(delta)
      avatarRef.current.position.add(movement)

      onMove?.()

      isMoving.current = true
      moveDirection.current.copy(velocity.current).normalize()
      currentSpeed.current = velocity.current.length()

      targetRotation.current = angle
    } else {
      wasMovingLastFrame.current = false
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), Math.min(DECELERATION * delta, 1))

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

    // Smooth rotation
    let rotationDiff = targetRotation.current - avatarRef.current.rotation.y

    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

    if (Math.abs(rotationDiff) < 0.05) {
      avatarRef.current.rotation.y = targetRotation.current
    } else {
      avatarRef.current.rotation.y += rotationDiff * ROTATION_SPEED
    }

    // Wall boundaries
    const wallPadding = 1.5
    avatarRef.current.position.x = Math.max(-40 + wallPadding, Math.min(40 - wallPadding, avatarRef.current.position.x))
    avatarRef.current.position.z = Math.max(-15 + wallPadding, Math.min(8, avatarRef.current.position.z))
    avatarRef.current.position.y = 0.5

    // Machine collision
    if (machinePositions.length > 0) {
      const avatarPos = avatarRef.current.position
      const collisionRadius = 3.2

      machinePositions.forEach(machine => {
        const dx = avatarPos.x - machine.pos[0]
        const dz = avatarPos.z - machine.pos[2]
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < collisionRadius) {
          const angle = Math.atan2(dz, dx)
          avatarPos.x = machine.pos[0] + Math.cos(angle) * collisionRadius
          avatarPos.z = machine.pos[2] + Math.sin(angle) * collisionRadius
        }
      })
    }

    // Update refs
    if (positionRef) positionRef.current.copy(avatarRef.current.position)
    if (rotationRef) rotationRef.current = avatarRef.current.rotation.y

    // Proximity check
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

export function ThirdPersonInstructions({ nearMachine, isMobile = false }: { nearMachine: string | null; isMobile?: boolean }) {
  // Hide instructions on mobile (joystick is self-explanatory)
  if (isMobile) return null

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3">
        <div className="flex gap-6 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">WASD / ↑↓←→</span>
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
