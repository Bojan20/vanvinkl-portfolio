'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { PointerLockControls } from '@react-three/drei'

interface FirstPersonControllerProps {
  position?: [number, number, number]
  speed?: number
  sprintMultiplier?: number
  jumpForce?: number
  onPositionChange?: (position: THREE.Vector3) => void
}

export function FirstPersonController({
  position = [0, 1.7, 5],
  speed = 5,
  sprintMultiplier = 1.5,
  jumpForce = 5,
  onPositionChange
}: FirstPersonControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const pointerLockRef = useRef<any>(null)
  const { camera } = useThree()

  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  })

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys(k => ({ ...k, forward: true })); break
        case 'KeyS': setKeys(k => ({ ...k, backward: true })); break
        case 'KeyA': setKeys(k => ({ ...k, left: true })); break
        case 'KeyD': setKeys(k => ({ ...k, right: true })); break
        case 'ShiftLeft': setKeys(k => ({ ...k, sprint: true })); break
        case 'Space': setKeys(k => ({ ...k, jump: true })); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys(k => ({ ...k, forward: false })); break
        case 'KeyS': setKeys(k => ({ ...k, backward: false })); break
        case 'KeyA': setKeys(k => ({ ...k, left: false })); break
        case 'KeyD': setKeys(k => ({ ...k, right: false })); break
        case 'ShiftLeft': setKeys(k => ({ ...k, sprint: false })); break
        case 'Space': setKeys(k => ({ ...k, jump: false })); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Movement logic
  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return

    const rb = rigidBodyRef.current
    const currentVelocity = rb.linvel()
    const currentPosition = rb.translation()

    // Calculate movement direction based on camera orientation
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()

    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement horizontal
    forward.normalize()

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    const moveDirection = new THREE.Vector3()

    if (keys.forward) moveDirection.add(forward)
    if (keys.backward) moveDirection.sub(forward)
    if (keys.right) moveDirection.add(right)
    if (keys.left) moveDirection.sub(right)

    moveDirection.normalize()

    // Apply speed
    const currentSpeed = keys.sprint ? speed * sprintMultiplier : speed
    moveDirection.multiplyScalar(currentSpeed)

    // Update velocity (preserve y for gravity)
    rb.setLinvel({
      x: moveDirection.x,
      y: currentVelocity.y,
      z: moveDirection.z
    }, true)

    // Jump
    if (keys.jump && Math.abs(currentVelocity.y) < 0.1) {
      rb.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true)
      setKeys(k => ({ ...k, jump: false })) // Prevent continuous jumping
    }

    // Update camera position to follow rigidbody
    camera.position.set(
      currentPosition.x,
      currentPosition.y + 0.6, // Eye level offset
      currentPosition.z
    )

    // Notify parent of position change
    onPositionChange?.(new THREE.Vector3(currentPosition.x, currentPosition.y, currentPosition.z))
  })

  return (
    <>
      {/* Pointer Lock Controls for mouse look */}
      <PointerLockControls ref={pointerLockRef} />

      {/* Physics capsule for player */}
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        type="dynamic"
        enabledRotations={[false, false, false]} // Prevent rotation
        lockRotations
        linearDamping={0.5}
        angularDamping={1}
      >
        <CapsuleCollider args={[0.5, 0.5]} />
      </RigidBody>

      {/* Instructions overlay (only when pointer not locked) */}
      {typeof window !== 'undefined' && !document.pointerLockElement && (
        <group position={[0, 0, -5]}>
          {/* This is handled by HTML overlay instead */}
        </group>
      )}
    </>
  )
}

// HTML overlay component for instructions
export function FirstPersonInstructions() {
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(!!document.pointerLockElement)
    }

    document.addEventListener('pointerlockchange', handleLockChange)
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  if (isLocked) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-2xl font-black text-white mb-4">
          🎰 Casino Lounge
        </h2>
        <p className="text-white/70 mb-6">
          Click anywhere to start exploring
        </p>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex justify-between">
            <span>Move</span>
            <span className="font-mono">W A S D</span>
          </div>
          <div className="flex justify-between">
            <span>Look Around</span>
            <span className="font-mono">MOUSE</span>
          </div>
          <div className="flex justify-between">
            <span>Sprint</span>
            <span className="font-mono">SHIFT</span>
          </div>
          <div className="flex justify-between">
            <span>Jump</span>
            <span className="font-mono">SPACE</span>
          </div>
          <div className="flex justify-between">
            <span>Interact</span>
            <span className="font-mono">E</span>
          </div>
        </div>
      </div>
    </div>
  )
}
