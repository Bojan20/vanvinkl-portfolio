/**
 * Cyberpunk Slot Machine - ULTRA WOW Design
 *
 * Large, impressive slot machines with:
 * - Billboard labels that follow avatar
 * - WOW animations when active
 * - Holographic scan lines
 * - Pulsing energy waves
 * - 5-reel spinning animation
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface CyberpunkSlotMachineProps {
  position: [number, number, number]
  label: string
  machineId: string
  nearMachineRef: React.MutableRefObject<string | null>
  spinningMachineRef: React.MutableRefObject<string | null>
}

const COLORS = {
  body: '#12121a',
  frame: '#222230',
  chrome: '#aaaabc',
  magenta: '#ff00aa',
  cyan: '#00ffff',
  purple: '#8844ff',
  gold: '#ffd700',
  screen: '#101820'
}

const SYMBOLS = ['7', '★', '♦', '♠', '♥', '♣', 'A', 'K']

// GPU-animated neon material - shader does work, minimal JS
function useNeonMaterial(color: string) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      time: { value: 0 },
      intensity: { value: 0.4 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float intensity;
      varying vec2 vUv;
      void main() {
        float wave = 0.6 + 0.4 * sin(time * 4.0 + vUv.y * 15.0);
        gl_FragColor = vec4(color * wave * intensity * 2.5, 1.0);
      }
    `,
    toneMapped: false
  }), [color])
  return mat
}

export function CyberpunkSlotMachine({ position, label, machineId, nearMachineRef, spinningMachineRef }: CyberpunkSlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const reelsRef = useRef<THREE.Group>(null!)
  const labelRef = useRef<THREE.Group>(null!)
  const leftNeonRef = useRef<THREE.Mesh>(null!)
  const rightNeonRef = useRef<THREE.Mesh>(null!)
  const labelGlowRef = useRef<THREE.Mesh>(null!)
  const labelOuterGlowRef = useRef<THREE.Mesh>(null!)
  const labelBorderRef = useRef<THREE.Mesh>(null!)

  const timeRef = useRef(Math.random() * 100)

  // Smooth activation level (0 = idle, 1 = fully active)
  const activationLevel = useRef(0)

  // Pre-cached Color objects to avoid GC pressure in useFrame
  const cachedColors = useRef({
    labelIdle: new THREE.Color(COLORS.magenta),
    labelActive: new THREE.Color(COLORS.cyan)
  })

  // Attraction state removed for performance

  // Spin state
  const spinState = useRef({
    spinning: false,
    spinTime: 0,
    reelOffsets: [0, 0, 0, 0, 0],
    reelSpeeds: [0, 0, 0, 0, 0]
  })

  // Track previous states for change detection
  const wasActive = useRef(false)
  const wasSpinning = useRef(false)

  // GPU-animated neon materials
  const leftNeonMat = useNeonMaterial(COLORS.magenta)
  const rightNeonMat = useNeonMaterial(COLORS.cyan)

  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // Read from refs - ZERO OVERHEAD
    const isActive = nearMachineRef.current === machineId
    const isSpinning = spinningMachineRef.current === machineId

    // Detect state changes
    if (!isActive && wasActive.current) {
      // Reset reels when walking away
      spinState.current.reelOffsets = [0, 0, 0, 0, 0]
      spinState.current.spinning = false
      spinState.current.spinTime = 0
    }
    wasActive.current = isActive

    if (isSpinning && !wasSpinning.current && !spinState.current.spinning) {
      // Start spin
      spinState.current.spinning = true
      spinState.current.spinTime = 0
      spinState.current.reelSpeeds = [22, 24, 26, 28, 30]
    }
    wasSpinning.current = isSpinning

    // FAST activation transition - near instant
    const targetActivation = isActive ? 1 : 0
    const lerpSpeed = 15 // Much faster for instant feel
    activationLevel.current += (targetActivation - activationLevel.current) * Math.min(delta * lerpSpeed, 1)
    const act = activationLevel.current // shorthand

    // Update shader uniforms - minimal overhead (just 4 floats)
    const elapsedTime = state.clock.elapsedTime
    leftNeonMat.uniforms.time.value = elapsedTime
    rightNeonMat.uniforms.time.value = elapsedTime
    leftNeonMat.uniforms.intensity.value = THREE.MathUtils.lerp(0.4, 1.0, act)
    rightNeonMat.uniforms.intensity.value = THREE.MathUtils.lerp(0.4, 1.0, act)

    // Label color transitions (using cached colors)
    const colors = cachedColors.current
    if (labelOuterGlowRef.current) {
      const matOuter = labelOuterGlowRef.current.material as THREE.MeshBasicMaterial
      matOuter.color.copy(colors.labelIdle).lerp(colors.labelActive, act)
    }
    if (labelBorderRef.current) {
      const matBorder = labelBorderRef.current.material as THREE.MeshBasicMaterial
      matBorder.color.copy(colors.labelIdle).lerp(colors.labelActive, act)
    }

    // Reel spinning (only triggered by SPACE key now)
    const spin = spinState.current

    if (spin.spinning) {
      spin.spinTime += delta
      const durations = [1.6, 1.9, 2.2, 2.5, 2.8]

      for (let i = 0; i < 5; i++) {
        if (spin.spinTime < durations[i]) {
          const progress = spin.spinTime / durations[i]
          const easeOut = 1 - Math.pow(1 - progress, 3)
          spin.reelOffsets[i] += spin.reelSpeeds[i] * (1 - easeOut * 0.96) * delta
        }
      }

      if (spin.spinTime > durations[4] + 0.4) {
        spin.spinning = false
      }
    }

    if (reelsRef.current) {
      reelsRef.current.children.forEach((reel, i) => {
        if (reel instanceof THREE.Group) {
          reel.rotation.x = spin.reelOffsets[i]
        }
      })
    }

    // Machine body animations - smooth breathing
    if (groupRef.current) {
      // Smooth breathing effect based on activation level
      const breatheAmount = Math.sin(t * 2) * 0.008 * act
      const scale = 1 + breatheAmount
      groupRef.current.scale.set(scale, scale, scale)
    }

    // Label billboard - follows camera with smooth animations
    if (labelRef.current) {
      labelRef.current.lookAt(state.camera.position)

      // Smooth interpolation between idle and active states
      const bounce = Math.sin(t * 4) * 0.12 * act
      const baseY = THREE.MathUtils.lerp(5.5, 6.0, act)
      labelRef.current.position.y = baseY + bounce

      const baseScale = THREE.MathUtils.lerp(1.0, 1.3, act)
      const scalePulse = baseScale + Math.sin(t * 6) * 0.1 * act
      labelRef.current.scale.setScalar(scalePulse)
    }

    // Label glow animation - smooth transition
    if (labelGlowRef.current) {
      const mat = labelGlowRef.current.material as THREE.MeshBasicMaterial
      const basePulse = 0.6 + Math.sin(t * 8) * 0.4
      // Interpolate from idle (0.4) to active pulsing
      mat.opacity = THREE.MathUtils.lerp(0.4, basePulse, act)
    }

    // IDLE attraction effects REMOVED for performance
  })

  // Compute isActive for JSX (refs are read synchronously during render)
  const isActive = nearMachineRef.current === machineId

  return (
    <group ref={groupRef} position={position}>

      {/* ===== MAIN CABINET - LARGER ===== */}
      <RoundedBox args={[3.0, 5.0, 1.3]} radius={0.1} position={[0, 2.5, 0]}>
        <meshStandardMaterial color={COLORS.body} metalness={0.85} roughness={0.2} />
      </RoundedBox>

      {/* Front panel */}
      <RoundedBox args={[2.9, 4.8, 0.12]} radius={0.06} position={[0, 2.5, 0.62]}>
        <meshStandardMaterial color={COLORS.frame} metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* ===== CHROME FRAME ===== */}
      {/* Top */}
      <mesh position={[0, 5.05, 0.65]}>
        <boxGeometry args={[3.1, 0.08, 0.15]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0.05, 0.65]}>
        <boxGeometry args={[3.1, 0.08, 0.15]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* ===== NEON EDGE STRIPS ===== */}
      <mesh ref={leftNeonRef} position={[-1.48, 2.5, 0.65]} material={leftNeonMat}>
        <boxGeometry args={[0.06, 4.6, 0.06]} />
      </mesh>
      <mesh ref={rightNeonRef} position={[1.48, 2.5, 0.65]} material={rightNeonMat}>
        <boxGeometry args={[0.06, 4.6, 0.06]} />
      </mesh>

      {/* ===== TOP DISPLAY ===== */}
      <RoundedBox args={[2.6, 0.8, 0.1]} radius={0.04} position={[0, 4.4, 0.64]}>
        <meshStandardMaterial color="#101018" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 4.4, 0.7]}>
        <planeGeometry args={[2.5, 0.7]} />
        <meshBasicMaterial color={isActive ? '#0a2030' : '#080814'} />
      </mesh>

      {/* Top display accent line */}
      <mesh position={[0, 4.78, 0.68]}>
        <boxGeometry args={[2.4, 0.025, 0.015]} />
        <meshBasicMaterial color={isActive ? COLORS.cyan : '#335577'} toneMapped={false} />
      </mesh>

      {/* ===== REEL WINDOW - LARGER ===== */}
      <RoundedBox args={[2.7, 1.8, 0.14]} radius={0.05} position={[0, 2.9, 0.62]}>
        <meshStandardMaterial color="#080810" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Chrome frame around reels */}
      <RoundedBox args={[2.75, 1.85, 0.05]} radius={0.04} position={[0, 2.9, 0.66]}>
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </RoundedBox>

      {/* Reel background */}
      <mesh position={[0, 2.9, 0.69]}>
        <planeGeometry args={[2.6, 1.7]} />
        <meshBasicMaterial color={COLORS.screen} />
      </mesh>

      {/* Reel dividers */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={`div-${i}`} position={[-1.04 + i * 0.52, 2.9, 0.7]}>
          <boxGeometry args={[0.02, 1.65, 0.025]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.15} />
        </mesh>
      ))}

      {/* ===== 5 SPINNING REELS ===== */}
      <group ref={reelsRef} position={[0, 2.9, 0.73]}>
        {[0, 1, 2, 3, 4].map(reelIdx => (
          <group key={`reel-${reelIdx}`} position={[-1.04 + reelIdx * 0.52, 0, 0]}>
            {SYMBOLS.map((symbol, symIdx) => {
              const angle = (symIdx / SYMBOLS.length) * Math.PI * 2
              return (
                <Text
                  key={`sym-${symIdx}`}
                  position={[0, Math.sin(angle) * 0.58, Math.cos(angle) * 0.22]}
                  rotation={[-angle, 0, 0]}
                  fontSize={0.3}
                  color={symbol === '7' ? COLORS.gold : '#ffffff'}
                  anchorX="center"
                  anchorY="middle"
                >
                  {symbol}
                </Text>
              )
            })}
          </group>
        ))}
      </group>

      {/* ===== INFO DISPLAY ===== */}
      <mesh position={[0, 1.7, 0.69]}>
        <planeGeometry args={[2.3, 0.45]} />
        <meshBasicMaterial
          color={isActive ? COLORS.cyan : COLORS.purple}
          toneMapped={false}
          transparent
          opacity={isActive ? 0.9 : 0.55}
        />
      </mesh>
      <Text
        position={[0, 1.7, 0.7]}
        fontSize={0.16}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? 'PRESS SPACE TO PLAY' : 'WALK CLOSER'}
      </Text>

      {/* ===== BUTTON PANEL ===== */}
      <RoundedBox args={[2.4, 0.45, 0.28]} radius={0.04} position={[0, 1.0, 0.68]}>
        <meshStandardMaterial color={COLORS.frame} metalness={0.6} roughness={0.4} />
      </RoundedBox>

      {/* Buttons - larger */}
      {[-0.65, -0.25, 0.15, 0.55].map((x, i) => (
        <group key={`btn-${i}`}>
          <mesh position={[x, 1.02, 0.85]}>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 16]} />
            <meshStandardMaterial
              color={i === 3 ? '#dd2222' : '#2a2a32'}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          {/* Button glow ring */}
          {i === 3 && (
            <mesh position={[x, 1.02, 0.83]}>
              <torusGeometry args={[0.1, 0.012, 8, 24]} />
              <meshBasicMaterial
                color={isActive ? '#ff5555' : '#772222'}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* ===== COIN TRAY ===== */}
      <mesh position={[0, 0.3, 0.7]}>
        <boxGeometry args={[2.0, 0.35, 0.3]} />
        <meshStandardMaterial color="#101016" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.32, 0.8]}>
        <boxGeometry args={[1.8, 0.25, 0.1]} />
        <meshStandardMaterial color="#0a0a0e" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* ===== BASE ===== */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[3.1, 0.12, 1.4]} />
        <meshStandardMaterial color="#101016" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Base neon strip */}
      <mesh position={[0, 0.03, 0.65]}>
        <boxGeometry args={[2.9, 0.02, 0.02]} />
        <meshBasicMaterial
          color={isActive ? COLORS.cyan : '#335577'}
          toneMapped={false}
        />
      </mesh>

      {/* Single machine light - animated intensity */}
      <pointLight
        position={[0, 3, 1.2]}
        color={isActive ? COLORS.cyan : COLORS.purple}
        intensity={isActive ? 3 : 1}
        distance={6}
      />

      {/* ===== FLOATING LABEL - ULTRA LARGE ===== */}
      <group ref={labelRef} position={[0, 5.5, 0]}>
        {/* Outer glow - color animated in useFrame */}
        <mesh ref={labelOuterGlowRef} position={[0, 0, -0.08]}>
          <planeGeometry args={[label.length * 0.32 + 1.2, 0.9]} />
          <meshBasicMaterial
            color={COLORS.magenta}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Background */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.28 + 0.9, 0.7]} />
          <meshBasicMaterial color="#080812" transparent opacity={0.95} />
        </mesh>

        {/* Neon border - color animated in useFrame */}
        <mesh ref={labelBorderRef} position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.28 + 1.05, 0.8]} />
          <meshBasicMaterial
            color={COLORS.magenta}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Text - LARGE */}
        <Text
          fontSize={0.42}
          color={isActive ? '#ffffff' : COLORS.magenta}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor={isActive ? COLORS.cyan : '#000000'}
        >
          {label}
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </group>

    </group>
  )
}
