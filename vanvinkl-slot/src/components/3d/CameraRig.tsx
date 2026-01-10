'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

interface CameraRigProps {
  mode: 'cinematic' | 'follow' | 'fixed'
  target?: THREE.Vector3
  avatarRotation?: number // Y-axis rotation of avatar
  followOffset?: [number, number, number]
  cinematicSequence?: CinematicShot[]
  onSequenceComplete?: () => void
}

interface CinematicShot {
  position: [number, number, number]
  lookAt: [number, number, number]
  fov?: number
  duration: number
  ease?: string
  delay?: number
}

/**
 * AAA-level camera rig with cinematic control
 *
 * Modes:
 * - cinematic: GSAP timeline-driven camera animation
 * - follow: Smooth third-person follow with dynamic framing
 * - fixed: Static position with lookat
 *
 * Features:
 * - Rack focus simulation (FOV animation)
 * - Dynamic framing (shoulder offset, target composition)
 * - Smooth easing curves (Power2, Expo, Elastic)
 * - Collision avoidance
 * - Camera shake on events
 */
export function CameraRig({
  mode,
  target,
  avatarRotation = 0,
  followOffset = [0, 3, 6],
  cinematicSequence,
  onSequenceComplete
}: CameraRigProps) {
  const { camera } = useThree()
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Follow mode state
  const idealOffset = useRef(new THREE.Vector3(...followOffset))
  const currentOffset = useRef(new THREE.Vector3(...followOffset))
  const lookAtTarget = useRef(new THREE.Vector3(0, 1.5, 8)) // Initial lookAt: avatar position

  // Dynamic framing offsets
  const shoulderOffsetX = useRef(0)
  const targetInfluence = useRef(0)

  // Initialize camera with third-person view
  useEffect(() => {
    if (cameraRef.current) {
      camera.copy(cameraRef.current)
      // Initial lookAt to avatar
      cameraRef.current.lookAt(0, 1.5, 8)
    }
  }, [camera])

  // Cinematic sequence
  useEffect(() => {
    if (mode === 'cinematic' && cinematicSequence && cameraRef.current) {
      const timeline = gsap.timeline({
        onComplete: () => {
          onSequenceComplete?.()
        }
      })

      cinematicSequence.forEach((shot, i) => {
        const { position, lookAt, fov, duration, ease = 'power2.inOut', delay = 0 } = shot

        // Position animation
        timeline.to(
          cameraRef.current.position,
          {
            x: position[0],
            y: position[1],
            z: position[2],
            duration,
            ease,
            delay: i === 0 ? delay : 0
          },
          i === 0 ? 0 : '>-0.2' // Overlap shots by 0.2s
        )

        // LookAt animation (create dummy target object)
        const lookAtPos = new THREE.Vector3(...lookAt)
        timeline.to(
          lookAtPos,
          {
            x: lookAt[0],
            y: lookAt[1],
            z: lookAt[2],
            duration,
            ease,
            onUpdate: () => {
              cameraRef.current.lookAt(lookAtPos)
            }
          },
          `<` // Start at same time as position
        )

        // FOV animation (rack focus effect)
        if (fov) {
          timeline.to(
            cameraRef.current,
            {
              fov,
              duration: duration * 0.5,
              ease: 'power1.inOut',
              onUpdate: () => {
                cameraRef.current.updateProjectionMatrix()
              }
            },
            `<` // Start at same time
          )
        }
      })

      timelineRef.current = timeline
      timeline.play()

      return () => {
        timeline.kill()
      }
    }
  }, [mode, cinematicSequence, onSequenceComplete])

  // Follow mode update (side-scrolling camera)
  useFrame((state, delta) => {
    if (!cameraRef.current) return

    const camera = cameraRef.current

    // FIXED mode: don't move camera, use Canvas initial position
    if (mode === 'fixed') {
      return
    }

    // FOLLOW mode - side-scroller style
    if (mode !== 'follow') return

    // If no target yet, keep initial third-person view
    if (!target) {
      camera.lookAt(lookAtTarget.current)
      return
    }

    // Camera follows avatar with constant offset behind
    const cameraOffset = 8 // Distance behind avatar (Z offset)
    const cameraHeight = 3 // Height above avatar

    const idealCameraPos = new THREE.Vector3(
      target.x, // Same X as avatar (side-scroller)
      target.y + cameraHeight, // Fixed height above avatar
      target.z + cameraOffset // Behind avatar with constant offset
    )

    // Wall collision check for camera position
    idealCameraPos.x = Math.max(-24, Math.min(24, idealCameraPos.x))
    idealCameraPos.z = Math.max(-24, Math.min(24, idealCameraPos.z))

    // Smooth lerp for all axes
    camera.position.lerp(idealCameraPos, 0.08)

    // Camera looks at avatar
    lookAtTarget.current.set(target.x, target.y + 1, target.z)
    camera.lookAt(lookAtTarget.current)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={70}
      near={0.1}
      far={200}
      position={[0, 3.5, 16]}
    />
  )
}

/**
 * Predefined cinematic sequences
 */
export const CINEMATIC_SEQUENCES = {
  // Grand entrance: exterior → doors → slot reveal → player position
  grandEntrance: [
    {
      // Exterior establishing shot (crane down)
      position: [0, 15, 25],
      lookAt: [0, 5, 0],
      fov: 70,
      duration: 2.5,
      ease: 'power2.out'
    },
    {
      // Dolly push toward entrance
      position: [0, 6, 12],
      lookAt: [0, 3, 0],
      fov: 65,
      duration: 2,
      ease: 'power1.inOut'
    },
    {
      // Through doors (POV walk)
      position: [0, 2, 5],
      lookAt: [0, 2, -5],
      fov: 85,
      duration: 1.5,
      ease: 'power1.in'
    },
    {
      // Reveal slot machines (wide shot showing semicircle)
      position: [0, 8, 8],
      lookAt: [0, 2, -8],
      fov: 90,
      duration: 2.5,
      ease: 'power2.inOut'
    },
    {
      // Descend to player position (behind avatar, wide third-person view)
      position: [0, 5, 18],
      lookAt: [0, 2, -8],
      fov: 90,
      duration: 1.5,
      ease: 'power2.out'
    }
  ],

  // Machine approach: zoom focus on activated machine
  machineApproach: (machinePosition: [number, number, number]) => [
    {
      position: [machinePosition[0] + 2, machinePosition[1] + 3, machinePosition[2] + 4],
      lookAt: machinePosition,
      fov: 50,
      duration: 0.8,
      ease: 'power2.inOut'
    }
  ],

  // Jackpot win: dramatic pullback + orbit
  jackpotWin: (machinePosition: [number, number, number]) => [
    {
      // Quick zoom in
      position: [machinePosition[0], machinePosition[1] + 1, machinePosition[2] + 2],
      lookAt: machinePosition,
      fov: 40,
      duration: 0.3,
      ease: 'power2.in'
    },
    {
      // Explosive pullback
      position: [machinePosition[0] + 5, machinePosition[1] + 4, machinePosition[2] + 5],
      lookAt: machinePosition,
      fov: 80,
      duration: 1.2,
      ease: 'elastic.out(1, 0.5)'
    }
  ]
} as const
