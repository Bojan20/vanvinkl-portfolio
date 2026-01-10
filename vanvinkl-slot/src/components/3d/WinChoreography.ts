import gsap from 'gsap'
import * as THREE from 'three'

/**
 * AAA Win Choreography System
 *
 * Orchestrates:
 * - Machine animation (anticipation → impact → celebration)
 * - Camera shake
 * - Light bursts
 * - Particle emission trigger
 */

export interface WinChoreographyOptions {
  machineRef: React.RefObject<THREE.Group>
  cameraRef: React.RefObject<THREE.PerspectiveCamera>
  lightRef: React.RefObject<THREE.PointLight>
  onParticleEmit?: (position: THREE.Vector3) => void
  onSoundTrigger?: (soundId: 'jackpot_anticipation' | 'jackpot_impact' | 'jackpot_celebration') => void
}

export function playJackpotWinSequence({
  machineRef,
  cameraRef,
  lightRef,
  onParticleEmit,
  onSoundTrigger
}: WinChoreographyOptions): gsap.core.Timeline {
  const timeline = gsap.timeline()

  const machine = machineRef.current
  const camera = cameraRef.current
  const light = lightRef.current

  if (!machine || !camera || !light) {
    console.warn('Win choreography: Missing refs')
    return timeline
  }

  const originalMachinePos = machine.position.clone()
  const originalCameraPos = camera.position.clone()

  // BEAT 1: ANTICIPATION (0-0.4s)
  timeline.add(() => {
    onSoundTrigger?.('jackpot_anticipation')
  }, 0)

  timeline.to(
    machine.position,
    {
      z: originalMachinePos.z + 0.3, // Pull back
      duration: 0.4,
      ease: 'power2.in'
    },
    0
  )

  timeline.to(
    machine.rotation,
    {
      z: -0.05, // Lean back slightly
      duration: 0.4,
      ease: 'power2.in'
    },
    0
  )

  // BEAT 2: IMPACT (0.4-0.6s)
  timeline.add(() => {
    onSoundTrigger?.('jackpot_impact')
    // Trigger particle explosion
    onParticleEmit?.(machine.position.clone())
  }, 0.4)

  timeline.to(
    machine.position,
    {
      z: originalMachinePos.z - 0.2, // Slam forward
      y: originalMachinePos.y + 0.15, // Bounce up
      duration: 0.2,
      ease: 'back.out(4)'
    },
    0.4
  )

  timeline.to(
    machine.rotation,
    {
      z: 0.03, // Overshoot forward
      duration: 0.2,
      ease: 'back.out(4)'
    },
    0.4
  )

  // BEAT 3: CAMERA SHAKE (0.4-0.8s)
  for (let i = 0; i < 6; i++) {
    timeline.to(
      camera.position,
      {
        x: originalCameraPos.x + (Math.random() - 0.5) * 0.4,
        y: originalCameraPos.y + (Math.random() - 0.5) * 0.4,
        duration: 0.05,
        ease: 'none'
      },
      0.4 + i * 0.05
    )
  }

  // Restore camera
  timeline.to(
    camera.position,
    {
      x: originalCameraPos.x,
      y: originalCameraPos.y,
      z: originalCameraPos.z,
      duration: 0.1,
      ease: 'power2.out'
    },
    0.7
  )

  // BEAT 4: LIGHT BURST (0.4-2.0s)
  timeline.to(
    light,
    {
      intensity: 20, // Explosive burst
      duration: 0.15,
      ease: 'power2.out'
    },
    0.4
  )

  timeline.to(
    light,
    {
      intensity: 2, // Fade back
      duration: 1.5,
      ease: 'power2.inOut'
    },
    0.55
  )

  // BEAT 5: CELEBRATION BOUNCE (0.6-2.5s)
  timeline.add(() => {
    onSoundTrigger?.('jackpot_celebration')
  }, 0.6)

  // Bounce machine up/down
  timeline.to(
    machine.position,
    {
      y: originalMachinePos.y + 0.2,
      duration: 0.3,
      ease: 'power2.out',
      repeat: 3,
      yoyo: true
    },
    0.6
  )

  // Spinning light ring acceleration
  // (handled in SlotMachineIGT component)

  // BEAT 6: SETTLE (2.5-3.5s)
  timeline.to(
    machine.position,
    {
      x: originalMachinePos.x,
      y: originalMachinePos.y,
      z: originalMachinePos.z,
      duration: 1.0,
      ease: 'elastic.out(1, 0.5)'
    },
    2.5
  )

  timeline.to(
    machine.rotation,
    {
      z: 0,
      duration: 1.0,
      ease: 'elastic.out(1, 0.5)'
    },
    2.5
  )

  return timeline
}

/**
 * Machine approach rack focus effect
 */
export function playMachineApproachSequence(
  cameraRef: React.RefObject<THREE.PerspectiveCamera>,
  machinePosition: THREE.Vector3
): gsap.core.Timeline {
  const timeline = gsap.timeline()
  const camera = cameraRef.current

  if (!camera) return timeline

  // FOV rack focus (zoom in slightly)
  timeline.to(
    camera,
    {
      fov: 65, // Narrow FOV (zoom in)
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.updateProjectionMatrix()
      }
    },
    0
  )

  return timeline
}

/**
 * Reset camera FOV on exit
 */
export function resetCameraFOV(
  cameraRef: React.RefObject<THREE.PerspectiveCamera>
): gsap.core.Timeline {
  const timeline = gsap.timeline()
  const camera = cameraRef.current

  if (!camera) return timeline

  timeline.to(
    camera,
    {
      fov: 70, // Default FOV
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        camera.updateProjectionMatrix()
      }
    },
    0
  )

  return timeline
}
