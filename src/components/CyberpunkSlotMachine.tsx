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
import { uaPlaySynth } from '../audio'

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

// THEMED SYMBOLS - each slot has unique icons matching its content!
const THEMED_SYMBOLS: Record<string, { symbols: string[], colors: string[] }> = {
  skills: {
    symbols: ['⚡', '🔧', '💻', '🎯', '⚙️', '🎨', '🔊', '📐'],
    colors: ['#00ffff', '#ffd700', '#ff00aa', '#00ff88', '#8844ff', '#ff6600', '#00aaff', '#ffaa00']
  },
  services: {
    symbols: ['🎰', '🎮', '🌐', '📱', '🔨', '💡', '🚀', '⭐'],
    colors: ['#ffd700', '#ff00aa', '#00ffff', '#00ff88', '#8844ff', '#ffaa00', '#ff6600', '#00aaff']
  },
  about: {
    symbols: ['👨‍💻', '🏆', '🌍', '💬', '✨', '🎯', '💼', '🔥'],
    colors: ['#00ffff', '#ffd700', '#8844ff', '#ff00aa', '#00ff88', '#ffaa00', '#ff6600', '#00aaff']
  },
  projects: {
    symbols: ['🎰', '🃏', '🎮', '📊', '🔧', '💎', '🎲', '🏆'],
    colors: ['#ff00aa', '#ffd700', '#00ffff', '#8844ff', '#00ff88', '#ffaa00', '#ff6600', '#00aaff']
  },
  experience: {
    symbols: ['🏢', '🎰', '🌐', '🎓', '📜', '⭐', '💼', '🚀'],
    colors: ['#8844ff', '#ffd700', '#00ffff', '#ff00aa', '#00ff88', '#ffaa00', '#ff6600', '#00aaff']
  },
  contact: {
    symbols: ['📧', '💼', '🐙', '🌐', '📱', '💬', '🤝', '✉️'],
    colors: ['#00ffff', '#8844ff', '#ffd700', '#ff00aa', '#00ff88', '#ffaa00', '#ff6600', '#00aaff']
  }
}

// Fallback for unknown machines
const DEFAULT_SYMBOLS = ['7', '★', '♦', '♠', '♥', '♣', 'A', 'K']

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

// HOLOGRAPHIC OVERLAY - Scanlines + shimmer for premium feel
function useHoloOverlayMaterial() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      intensity: { value: 0 },
      spinning: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float intensity;
      uniform float spinning;
      varying vec2 vUv;

      void main() {
        // Scanlines
        float scanline = sin(vUv.y * 120.0 + time * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 8.0) * 0.15;

        // Horizontal sweep
        float sweep = smoothstep(0.0, 0.1, fract(vUv.y - time * 0.3));
        sweep *= smoothstep(0.2, 0.1, fract(vUv.y - time * 0.3));
        sweep *= 0.2;

        // Edge glow
        float edgeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        float edgeY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
        float edge = 1.0 - edgeX * edgeY;

        // Chromatic aberration hint
        float chromaR = sin(time * 3.0 + vUv.x * 10.0) * 0.02;
        float chromaB = sin(time * 3.0 + vUv.x * 10.0 + 2.0) * 0.02;

        // Spin blur effect
        float blur = spinning * sin(vUv.y * 50.0 + time * 20.0) * 0.1;

        vec3 color = vec3(0.0, 1.0, 1.0); // Cyan base
        color.r += chromaR + edge * 0.3;
        color.b += chromaB;

        float alpha = (scanline + sweep + edge * 0.15 + blur) * intensity;

        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }), [])
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
  const holoOverlayRef = useRef<THREE.Mesh>(null!)
  const ctaRef = useRef<THREE.Group>(null!)
  const leverRef = useRef<THREE.Group>(null!)

  const timeRef = useRef(Math.random() * 100)
  const leverPullRef = useRef(0) // 0 = up, 1 = pulled down
  const leverSoundPlayed = useRef({ pull: false, release: false })

  // Smooth activation level (0 = idle, 1 = fully active)
  const activationLevel = useRef(0)

  // Pre-cached Color objects to avoid GC pressure in useFrame
  const cachedColors = useRef({
    labelIdle: new THREE.Color(COLORS.magenta),
    labelActive: new THREE.Color(COLORS.cyan)
  })

  // Spin state with elastic bounce
  const spinState = useRef({
    spinning: false,
    spinTime: 0,
    reelOffsets: [0, 0, 0, 0, 0],
    reelSpeeds: [0, 0, 0, 0, 0],
    targetOffsets: [0, 0, 0, 0, 0],
    bouncePhase: [0, 0, 0, 0, 0] // For elastic overshoot
  })

  // Track previous states for change detection
  const wasActive = useRef(false)
  const wasSpinning = useRef(false)

  // GPU-animated neon materials
  const leftNeonMat = useNeonMaterial(COLORS.magenta)
  const rightNeonMat = useNeonMaterial(COLORS.cyan)
  const holoOverlayMat = useHoloOverlayMaterial()

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
      // Pull the lever!
      leverPullRef.current = 1
      // Play lever pull sound (loud)
      uaPlaySynth('leverPull',0.7)
      leverSoundPlayed.current.pull = true
      leverSoundPlayed.current.release = false
    }
    wasSpinning.current = isSpinning

    // Lever animation - pull down then spring back
    if (leverRef.current) {
      const targetLever = spinState.current.spinning && spinState.current.spinTime < 0.3 ? 1 : 0
      const prevLeverPos = leverPullRef.current
      leverPullRef.current += (targetLever - leverPullRef.current) * delta * (targetLever === 1 ? 15 : 4)

      // Play release sound when lever starts returning (crosses 0.7 threshold going down)
      if (prevLeverPos > 0.7 && leverPullRef.current <= 0.7 && leverSoundPlayed.current.pull && !leverSoundPlayed.current.release) {
        uaPlaySynth('leverRelease',0.6)
        leverSoundPlayed.current.release = true
      }

      // Reset sound flags when lever is back up
      if (leverPullRef.current < 0.05) {
        leverSoundPlayed.current.pull = false
        leverSoundPlayed.current.release = false
      }

      // Rotate lever around X axis (pull down motion)
      leverRef.current.rotation.x = leverPullRef.current * 0.6 // ~35 degrees pull
    }

    // FAST activation transition - near instant
    const targetActivation = isActive ? 1 : 0
    const lerpSpeed = 15 // Much faster for instant feel
    activationLevel.current += (targetActivation - activationLevel.current) * Math.min(delta * lerpSpeed, 1)
    const act = activationLevel.current // shorthand

    // Update shader uniforms - minimal overhead
    const elapsedTime = state.clock.elapsedTime
    leftNeonMat.uniforms.time.value = elapsedTime
    rightNeonMat.uniforms.time.value = elapsedTime
    leftNeonMat.uniforms.intensity.value = THREE.MathUtils.lerp(0.4, 1.0, act)
    rightNeonMat.uniforms.intensity.value = THREE.MathUtils.lerp(0.4, 1.0, act)

    // Get spin state reference
    const spin = spinState.current

    // Holographic overlay shader
    holoOverlayMat.uniforms.time.value = elapsedTime
    holoOverlayMat.uniforms.intensity.value = act
    holoOverlayMat.uniforms.spinning.value = spin.spinning ? 1 : 0

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

    // CTA pulsing animation
    if (ctaRef.current) {
      const pulse = 1 + Math.sin(t * 4) * 0.08 * act
      ctaRef.current.scale.setScalar(pulse)
      // Also animate Y position for "bouncy" feel
      ctaRef.current.position.y = 1.7 + Math.sin(t * 3) * 0.02 * act
    }

    // Reel spinning with ELASTIC BOUNCE

    if (spin.spinning) {
      spin.spinTime += delta
      // Staggered durations for dramatic effect
      const durations = [0.7, 0.95, 1.2, 1.45, 1.7]
      const bounceStart = [0.5, 0.75, 1.0, 1.25, 1.5]

      for (let i = 0; i < 5; i++) {
        if (spin.spinTime < durations[i]) {
          // Main spin phase
          const progress = spin.spinTime / durations[i]
          const easeOut = 1 - Math.pow(1 - progress, 3)
          spin.reelOffsets[i] += spin.reelSpeeds[i] * (1 - easeOut * 0.96) * delta

          // Calculate target for bounce
          if (spin.spinTime > bounceStart[i] && spin.targetOffsets[i] === 0) {
            // Snap to nearest symbol position
            const symbolAngle = (Math.PI * 2) / 8 // 8 symbols
            spin.targetOffsets[i] = Math.round(spin.reelOffsets[i] / symbolAngle) * symbolAngle
          }
        } else {
          // ELASTIC BOUNCE phase
          spin.bouncePhase[i] += delta * 12
          const bounce = spin.bouncePhase[i]
          // Damped spring oscillation
          const elasticOffset = Math.sin(bounce * 3) * Math.exp(-bounce * 2) * 0.15
          spin.reelOffsets[i] = spin.targetOffsets[i] + elasticOffset
        }
      }

      if (spin.spinTime > durations[4] + 0.5) {
        spin.spinning = false
        // Reset bounce state
        spin.bouncePhase = [0, 0, 0, 0, 0]
        spin.targetOffsets = [0, 0, 0, 0, 0]
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

    // IDLE attraction effects - beckoning animation when far away
    if (!isActive && groupRef.current) {
      // Gentle idle sway to catch attention
      const sway = Math.sin(t * 0.8) * 0.015
      groupRef.current.rotation.y = sway
    }

    // WOW effects when approaching
    if (isActive && groupRef.current) {
      // Excitement wobble
      const wobble = Math.sin(t * 8) * 0.01
      groupRef.current.rotation.z = wobble
    }
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

      {/* ===== 5 SPINNING REELS with THEMED SYMBOLS ===== */}
      <group ref={reelsRef} position={[0, 2.9, 0.73]}>
        {[0, 1, 2, 3, 4].map(reelIdx => {
          const themed = THEMED_SYMBOLS[machineId] || { symbols: DEFAULT_SYMBOLS, colors: Array(8).fill('#ffffff') }
          return (
            <group key={`reel-${reelIdx}`} position={[-1.04 + reelIdx * 0.52, 0, 0]}>
              {themed.symbols.map((symbol, symIdx) => {
                const angle = (symIdx / themed.symbols.length) * Math.PI * 2
                const symbolColor = themed.colors[symIdx] || '#ffffff'
                return (
                  <Text
                    key={`sym-${symIdx}`}
                    position={[0, Math.sin(angle) * 0.58, Math.cos(angle) * 0.22]}
                    rotation={[-angle, 0, 0]}
                    fontSize={0.28}
                    color={symbolColor}
                    anchorX="center"
                    anchorY="middle"
                  >
                    {symbol}
                  </Text>
                )
              })}
            </group>
          )
        })}
      </group>

      {/* ===== HOLOGRAPHIC OVERLAY - Premium scanline effect ===== */}
      <mesh ref={holoOverlayRef} position={[0, 2.9, 0.75]} material={holoOverlayMat}>
        <planeGeometry args={[2.6, 1.7]} />
      </mesh>

      {/* ===== INFO DISPLAY with PULSING CTA ===== */}
      <group ref={ctaRef} position={[0, 1.7, 0]}>
        <mesh position={[0, 0, 0.69]}>
          <planeGeometry args={[2.3, 0.45]} />
          <meshBasicMaterial
            color={isActive ? COLORS.cyan : COLORS.purple}
            toneMapped={false}
            transparent
            opacity={isActive ? 0.9 : 0.55}
          />
        </mesh>
        <Text
          position={[0, 0, 0.7]}
          fontSize={0.16}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {isActive ? 'PRESS SPACE TO PLAY' : 'WALK CLOSER'}
        </Text>
      </group>

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

      {/* ===== LEVER (PULL HANDLE) ===== */}
      <group ref={leverRef} position={[1.7, 2.8, 0.3]}>
        {/* Lever mount bracket */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.25, 0.2]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Lever arm - pivots from top */}
        <group position={[0, 0.1, 0.15]}>
          {/* Main rod */}
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
            <meshStandardMaterial color={COLORS.chrome} metalness={0.95} roughness={0.05} />
          </mesh>

          {/* Handle ball (top) */}
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshStandardMaterial
              color={isActive ? '#ff3333' : '#aa2222'}
              metalness={0.3}
              roughness={0.4}
              emissive={isActive ? '#ff0000' : '#000000'}
              emissiveIntensity={isActive ? 0.3 : 0}
            />
          </mesh>

          {/* Chrome ring on handle */}
          <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.015, 8, 16]} />
            <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.05} />
          </mesh>
        </group>

        {/* Lever slot/guide */}
        <mesh position={[0, 0.4, 0.25]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.04]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

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
