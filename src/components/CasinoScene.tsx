/**
 * VanVinkl Casino - Cyberpunk Lounge
 *
 * Clean cyberpunk aesthetic:
 * - Neon accent lighting (magenta/cyan/purple)
 * - VIP lounge areas with modern couches
 * - Sleek architecture
 * - Contact shadows for depth
 * - Holographic shimmer effects
 * - Screen-space reflections on floor
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, MeshReflectorMaterial, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

import { CyberpunkSlotMachine } from './CyberpunkSlotMachine'
import { Avatar } from './Avatar'
import { AvatarEffects } from './AvatarEffects'
import { ProximityIndicator } from './ProximityFeedback'
import { WinCelebrationGPU } from './GPUParticles'
import { DustParticles } from './DustParticles'
import { PostProcessing } from './PostProcessing'
import { ContextHandler } from './WebGLErrorBoundary'
import { useAudio, playReelStop, getBassLevel as getOldBassLevel } from '../audio'
import { dspGetBassLevel } from '../audio/AudioDSP'

// Combined bass level - tries new DSP first, falls back to old system
const getBassLevel = (): number => {
  const dspBass = dspGetBassLevel()
  if (dspBass > 0) return dspBass
  return getOldBassLevel()
}
import { playSynthFootstep } from '../audio/SynthSounds'
import { playSynthSpinMech, stopSynthSpinMech } from '../audio/SynthSounds'
import { COLORS as THEME_COLORS, SLOT_CONFIG, TIMING, DISTANCES } from '../store'
import { achievementStore, type Achievement } from '../store/achievements'

// ============================================
// SHARED MATERIALS - Created ONCE, reused everywhere
// This eliminates per-component material creation
// ============================================
const SHARED_MATERIALS = {
  // Floor
  floor: new THREE.MeshStandardMaterial({ color: '#1a1520', metalness: 0.4, roughness: 0.7 }),
  // Walls
  wall: new THREE.MeshStandardMaterial({ color: '#1a1420', metalness: 0.6, roughness: 0.4 }),
  // Ceiling
  ceiling: new THREE.MeshStandardMaterial({ color: '#151218', metalness: 0.7, roughness: 0.3 }),
  ceilingPanel: new THREE.MeshStandardMaterial({ color: '#201828', metalness: 0.8, roughness: 0.2 }),
  // Furniture
  velvetPurple: new THREE.MeshStandardMaterial({ color: '#6b2d7b', metalness: 0.05, roughness: 0.9 }),
  velvetTeal: new THREE.MeshStandardMaterial({ color: '#1a5c6b', metalness: 0.05, roughness: 0.9 }),
  velvetWine: new THREE.MeshStandardMaterial({ color: '#7b2d4a', metalness: 0.05, roughness: 0.9 }),
  goldChrome: new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 1, roughness: 0.15 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#666', metalness: 1, roughness: 0.1 }),
  glass: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.25 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: '#0a0a12', metalness: 0.7, roughness: 0.3 }),
  // Bar
  barTop: new THREE.MeshStandardMaterial({ color: '#1a1a28', metalness: 0.8, roughness: 0.2 }),
  barBody: new THREE.MeshStandardMaterial({ color: '#080810', metalness: 0.6, roughness: 0.4 }),
  barShelf: new THREE.MeshStandardMaterial({ color: '#0a0a14', metalness: 0.5, roughness: 0.5 }),
  // Rope
  velvetRope: new THREE.MeshStandardMaterial({ color: '#8B0020', metalness: 0.2, roughness: 0.8 })
}

const COLORS = {
  magenta: '#ff00aa',
  cyan: '#00ffff',
  purple: '#8844ff',
  gold: '#ffd700',
  blue: '#4466ff',
  deepPurple: '#2a0040',
  black: '#050508'
}

const MACHINES = [
  { id: 'skills', label: 'SKILLS', x: -15 },
  { id: 'services', label: 'SERVICES', x: -9 },
  { id: 'about', label: 'ABOUT', x: -3 },
  { id: 'projects', label: 'PROJECTS', x: 3 },
  { id: 'experience', label: 'EXPERIENCE', x: 9 },
  { id: 'contact', label: 'CONTACT', x: 15 }
]

const MACHINE_Z = -3

// GPU-animated neon strip - shader does ALL work, zero JS per-frame
// Modes: static, pulse, audioReactive, holographic
function NeonStrip({ color, position, size, pulse = false, audioReactive = false, holographic = false }: {
  color: string, position: [number, number, number], size: [number, number, number], intensity?: number, pulse?: boolean, audioReactive?: boolean, holographic?: boolean
}) {
  const mat = useMemo(() => {
    if (!pulse && !audioReactive && !holographic) {
      return new THREE.MeshBasicMaterial({ color, toneMapped: false })
    }
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 },
        bass: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: holographic ? `
        // HOLOGRAPHIC SHIMMER SHADER - Rainbow scanlines + noise
        uniform vec3 color;
        uniform float time;
        uniform float bass;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        // Simplex-like noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          // Holographic rainbow based on view angle
          float scanline = sin(vWorldPosition.y * 50.0 + time * 3.0) * 0.5 + 0.5;
          float shimmer = noise(vUv * 20.0 + time * 2.0) * 0.3;

          // Rainbow hue shift
          float hueShift = vUv.x * 0.5 + time * 0.2 + bass * 0.3;
          vec3 rainbow = vec3(
            sin(hueShift * 6.28) * 0.5 + 0.5,
            sin(hueShift * 6.28 + 2.09) * 0.5 + 0.5,
            sin(hueShift * 6.28 + 4.18) * 0.5 + 0.5
          );

          // Mix base color with holographic effect
          vec3 holoColor = mix(color, rainbow, 0.3 + shimmer * 0.2);

          // Add scanline effect
          float intensity = 0.8 + scanline * 0.4 + shimmer;

          // Bass boost
          intensity *= 1.0 + bass * 0.5;

          gl_FragColor = vec4(holoColor * intensity * 1.8, 1.0);
        }
      ` : audioReactive ? `
        uniform vec3 color;
        uniform float time;
        uniform float bass;
        varying vec2 vUv;
        void main() {
          // Bass-reactive pulse with wave effect
          float bassPulse = 0.5 + bass * 1.5;
          float wave = sin(time * 2.0 + vUv.x * 8.0) * 0.15;
          float intensity = bassPulse + wave;
          // Color shift on high bass
          vec3 boostedColor = color * (1.0 + bass * 0.5);
          gl_FragColor = vec4(boostedColor * intensity * 2.0, 1.0);
        }
      ` : `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        void main() {
          float pulse = 0.7 + 0.3 * sin(time * 3.0 + vUv.x * 10.0);
          gl_FragColor = vec4(color * pulse * 1.5, 1.0);
        }
      `,
      toneMapped: false
    })
  }, [color, pulse, audioReactive, holographic])

  // Update time and bass uniforms
  useFrame((state) => {
    if ((pulse || audioReactive || holographic) && mat instanceof THREE.ShaderMaterial) {
      mat.uniforms.time.value = state.clock.elapsedTime
      if (audioReactive || holographic) {
        mat.uniforms.bass.value = getBassLevel()
      }
    }
  })

  return (
    <mesh position={position} material={mat}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// God Ray Light Source - Emissive mesh for volumetric lighting
function GodRaySource({ position, color = '#ffffff', intensity = 2 }: {
  position: [number, number, number], color?: string, intensity?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

// Floating hint for VanVinkl Studio logo - appears when near, with logo image
function LogoHint({ active, position }: { active: boolean, position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!)
  const time = useRef(Math.random() * 100)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  // Load logo image
  useEffect(() => {
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = '/logo_van.png'
  }, [])

  // Create canvas texture with logo + text
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 320
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw logo if loaded (left side)
    if (logoImg) {
      const logoSize = 140
      const logoX = 180
      const logoY = (canvas.height - logoSize) / 2
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    }

    // Strong glow for text
    ctx.shadowColor = '#00ffff'
    ctx.shadowBlur = 25

    // Text (right of logo)
    ctx.font = 'bold 64px "Orbitron", system-ui, sans-serif'
    ctx.fillStyle = '#00ffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('VANVINKL', 350, canvas.height / 2 - 35)

    ctx.font = 'bold 48px "Orbitron", system-ui, sans-serif'
    ctx.fillStyle = '#ff00aa'
    ctx.shadowColor = '#ff00aa'
    ctx.fillText('STUDIO', 350, canvas.height / 2 + 40)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [logoImg])

  // Holographic shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      opacity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float time;
      uniform float opacity;
      varying vec2 vUv;

      void main() {
        vec4 texColor = texture2D(map, vUv);
        if (texColor.a < 0.1) discard;

        // Holographic shimmer
        float shimmer = sin(vUv.x * 15.0 + time * 2.0) * 0.08 + 0.92;

        // Subtle rainbow
        float hue = vUv.x * 0.5 + time * 0.15;
        vec3 rainbow = vec3(
          sin(hue * 6.28) * 0.1 + 0.9,
          sin(hue * 6.28 + 2.09) * 0.1 + 0.9,
          sin(hue * 6.28 + 4.18) * 0.1 + 0.9
        );

        vec3 finalColor = texColor.rgb * shimmer * rainbow * 1.3;
        gl_FragColor = vec4(finalColor, texColor.a * opacity);
      }
    `,
    transparent: true,
    toneMapped: false,
    side: THREE.DoubleSide,
    depthWrite: false
  }), [texture])

  // Update texture when it changes
  useEffect(() => {
    material.uniforms.map.value = texture
  }, [texture, material])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    time.current += delta
    material.uniforms.time.value = time.current

    // Fade in/out
    const targetOpacity = active ? 1 : 0
    material.uniforms.opacity.value += (targetOpacity - material.uniforms.opacity.value) * 0.1

    // Float animation
    if (active) {
      groupRef.current.position.y = position[1] + Math.sin(time.current * 2) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh material={material}>
        <planeGeometry args={[8, 2.5]} />
      </mesh>
    </group>
  )
}

// Logo on wall - cyberpunk style with holographic shader and neon frame
function LogoWall({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [aspectRatio, setAspectRatio] = useState(2)

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/logo_van.png', (loadedTex) => {
      const img = loadedTex.image
      if (img && img.width && img.height) {
        setAspectRatio(img.width / img.height)
      }
    })
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  // Holographic shader with atmospheric mask - blends into dark environment
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      bass: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float time;
      uniform float bass;
      varying vec2 vUv;

      // Noise for smoke/fog effect
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec4 texColor = texture2D(map, vUv);
        if (texColor.a < 0.1) discard;

        // === VIGNETTE MASK - strong fade to black on edges ===
        vec2 center = vUv - 0.5;
        float vignette = 1.0 - smoothstep(0.2, 0.6, length(center) * 1.2);

        // Edge fade - stronger on all sides
        float edgeFade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) *
                         smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);

        // === SMOKE/FOG OVERLAY ===
        float smokeNoise = noise(vUv * 4.0 + time * 0.15) * 0.4;
        float smokeNoise2 = noise(vUv * 8.0 - time * 0.1) * 0.2;
        float smoke = smokeNoise + smokeNoise2;

        // === DESATURATE - reduce color intensity ===
        float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 desaturated = mix(texColor.rgb, vec3(luminance), 0.4); // 40% desaturation

        // === DARKEN overall ===
        vec3 darkened = desaturated * 0.5; // 50% darker

        // === SUBTLE color tint towards purple/cyan ===
        vec3 atmosphereTint = vec3(0.7, 0.75, 0.9); // slight cool tint
        vec3 tinted = darkened * atmosphereTint;

        // === SCANLINES - more subtle ===
        float scanline = sin(vUv.y * 80.0 + time * 1.5) * 0.015;

        // === VERY SUBTLE holographic shimmer ===
        float hueShift = time * 0.05 + vUv.x * 0.1;
        vec3 shimmer = vec3(
          sin(hueShift) * 0.03,
          sin(hueShift + 2.09) * 0.03,
          sin(hueShift + 4.18) * 0.03
        );

        // === SUBTLE edge glow - magenta/cyan ===
        float glowMask = 1.0 - edgeFade;
        vec3 edgeColor = mix(vec3(0.6, 0.0, 0.4), vec3(0.0, 0.5, 0.6), vUv.x) * glowMask * 0.15;

        // === BASS PULSE - very subtle ===
        float pulse = 1.0 + bass * 0.1;

        // === COMBINE all effects ===
        vec3 finalColor = tinted * pulse + shimmer + scanline + edgeColor;

        // Apply smoke overlay - darkens randomly
        finalColor = finalColor * (1.0 - smoke * 0.3);

        // Apply vignette and edge fade
        float totalMask = vignette * edgeFade;
        finalColor *= totalMask;

        // Final alpha also affected by mask for soft edges
        float finalAlpha = texColor.a * totalMask * 0.85;

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    toneMapped: false
  }), [texture])

  useFrame((state) => {
    if (material) {
      material.uniforms.time.value = state.clock.elapsedTime
      material.uniforms.bass.value = getBassLevel()
    }
  })

  const height = 4 * scale
  const width = height * aspectRatio

  return (
    <group position={position}>
      {/* Logo with holographic shader */}
      <mesh ref={meshRef} material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* Subtle neon frame - dimmer to blend with atmosphere */}
      <NeonStrip color="#660044" position={[0, height/2 + 0.1, 0.05]} size={[width + 0.4, 0.04, 0.04]} pulse />
      <NeonStrip color="#660044" position={[0, -height/2 - 0.1, 0.05]} size={[width + 0.4, 0.04, 0.04]} pulse />
      <NeonStrip color="#004455" position={[-width/2 - 0.1, 0, 0.05]} size={[0.04, height + 0.4, 0.04]} pulse />
      <NeonStrip color="#004455" position={[width/2 + 0.1, 0, 0.05]} size={[0.04, height + 0.4, 0.04]} pulse />

      {/* Very subtle ambient glow */}
      <pointLight color="#440033" intensity={1} distance={8} />
    </group>
  )
}

// Single floating 3D letter with holographic animation
function FloatingLetter({
  letter,
  position,
  color = '#ff00aa',
  orbitRadius = 0,
  orbitSpeed = 0.5,
  floatAmplitude = 0.3,
  floatSpeed = 1,
  rotateSpeed = 0.3,
  scale = 1,
  phaseOffset = 0
}: {
  letter: string
  position: [number, number, number]
  color?: string
  orbitRadius?: number
  orbitSpeed?: number
  floatAmplitude?: number
  floatSpeed?: number
  rotateSpeed?: number
  scale?: number
  phaseOffset?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const basePos = useMemo(() => new THREE.Vector3(...position), [position])

  // Create canvas texture for single letter
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Outer glow
    ctx.shadowColor = color
    ctx.shadowBlur = 40
    ctx.font = 'bold 180px "Orbitron", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2)

    // Inner bright
    ctx.shadowBlur = 15
    ctx.shadowColor = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [letter, color])

  // Holographic shader material
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      bass: { value: 0 },
      baseColor: { value: new THREE.Color(color) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float time;
      uniform float bass;
      uniform vec3 baseColor;
      varying vec2 vUv;

      void main() {
        vec4 texColor = texture2D(map, vUv);
        if (texColor.a < 0.1) discard;

        // Rainbow hue shift based on time
        float hue = time * 0.3 + vUv.x * 0.5 + vUv.y * 0.3;
        vec3 rainbow = vec3(
          sin(hue * 6.28) * 0.5 + 0.5,
          sin(hue * 6.28 + 2.09) * 0.5 + 0.5,
          sin(hue * 6.28 + 4.18) * 0.5 + 0.5
        );

        // Mix base color with holographic rainbow
        vec3 holoColor = mix(baseColor, rainbow, 0.4 + bass * 0.3);

        // Pulse with bass
        float pulse = 1.0 + bass * 0.5;

        gl_FragColor = vec4(holoColor * texColor.rgb * pulse * 1.5, texColor.a);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  }), [texture, color])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime + phaseOffset

    // Update shader uniforms
    material.uniforms.time.value = t
    material.uniforms.bass.value = getBassLevel()

    // Orbital movement
    if (orbitRadius > 0) {
      meshRef.current.position.x = basePos.x + Math.sin(t * orbitSpeed) * orbitRadius
      meshRef.current.position.z = basePos.z + Math.cos(t * orbitSpeed) * orbitRadius
    }

    // Floating up/down
    meshRef.current.position.y = basePos.y + Math.sin(t * floatSpeed) * floatAmplitude

    // Rotation
    meshRef.current.rotation.y = t * rotateSpeed
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1
  })

  return (
    <group>
      <mesh ref={meshRef} position={position} scale={scale} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <pointLight position={position} color={color} intensity={2} distance={8} />
    </group>
  )
}

// Collection of floating letters spelling "VAN VINKL" - reads right to left (V starts on right)
function FloatingLetters() {
  // "VAN VINKL" reading from right to left: V-A-N (space) V-I-N-K-L
  // Positions go from right (20) to left (-16)
  const letters = [
    // "VAN" - starts on right
    { letter: 'V', position: [20, 5.5, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.2, rotateSpeed: 0.2, scale: 2.8, phaseOffset: 0 },
    { letter: 'A', position: [15, 6.2, 30] as [number, number, number], color: '#00ffff', floatSpeed: 0.9, rotateSpeed: -0.15, scale: 2.8, phaseOffset: 0.5 },
    { letter: 'N', position: [10, 5.8, 30] as [number, number, number], color: '#8844ff', floatSpeed: 1.1, rotateSpeed: 0.18, scale: 2.8, phaseOffset: 1 },

    // "VINKL" - continues to the left (with space)
    { letter: 'V', position: [4, 6, 30] as [number, number, number], color: '#ffd700', floatSpeed: 0.8, rotateSpeed: -0.2, scale: 2.8, phaseOffset: 1.5 },
    { letter: 'I', position: [-1, 5.5, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.3, rotateSpeed: 0.22, scale: 2.8, phaseOffset: 2 },
    { letter: 'N', position: [-6, 6.3, 30] as [number, number, number], color: '#00ffff', floatSpeed: 1.0, rotateSpeed: -0.18, scale: 2.8, phaseOffset: 2.5 },
    { letter: 'K', position: [-11, 5.7, 30] as [number, number, number], color: '#8844ff', floatSpeed: 0.7, rotateSpeed: 0.15, scale: 2.8, phaseOffset: 3 },
    { letter: 'L', position: [-16, 6, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.4, rotateSpeed: -0.2, scale: 2.8, phaseOffset: 3.5 },
  ]

  return (
    <group>
      {letters.map((props, i) => (
        <FloatingLetter key={i} {...props} />
      ))}
    </group>
  )
}


// Floating "PRESS SPACE TO SIT" sign above lounge areas
function FloatingSitSign({ position, color = '#8844ff' }: { position: [number, number, number], color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const time = useRef(Math.random() * 100)

  // Create canvas texture for text
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 96
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Glow
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.font = 'bold 36px "Orbitron", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText('PRESS SPACE TO SIT', canvas.width / 2, canvas.height / 2)

    // Brighter core
    ctx.shadowBlur = 8
    ctx.shadowColor = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('PRESS SPACE TO SIT', canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [color])

  // Holographic shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      baseColor: { value: new THREE.Color(color) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float time;
      uniform vec3 baseColor;
      varying vec2 vUv;

      void main() {
        vec4 texColor = texture2D(map, vUv);
        if (texColor.a < 0.1) discard;

        // Rainbow shimmer
        float hue = time * 0.5 + vUv.x * 2.0;
        vec3 rainbow = vec3(
          sin(hue) * 0.3 + 0.7,
          sin(hue + 2.09) * 0.3 + 0.7,
          sin(hue + 4.18) * 0.3 + 0.7
        );

        // Pulse
        float pulse = 0.8 + sin(time * 3.0) * 0.2;

        vec3 finalColor = texColor.rgb * rainbow * pulse;
        gl_FragColor = vec4(finalColor, texColor.a * 0.9);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  }), [texture, color])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    time.current += delta
    material.uniforms.time.value = time.current

    // Floating animation
    meshRef.current.position.y = position[1] + Math.sin(time.current * 2) * 0.1
  })

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[2.5, 0.5]} />
        <primitive object={material} attach="material" />
      </mesh>
      <pointLight position={position} color={color} intensity={1} distance={5} />
    </group>
  )
}

// VIP Lounge Couch - Using SHARED materials
function VIPCouch({ position, rotation = 0, material }: {
  position: [number, number, number], rotation?: number, material: THREE.Material
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main seat - plush velvet */}
      <mesh position={[0, 0.35, 0]} material={material}>
        <boxGeometry args={[2.8, 0.45, 1.0]} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, 0.75, -0.4]} material={material}>
        <boxGeometry args={[2.8, 0.65, 0.25]} />
      </mesh>

      {/* Arm rests */}
      <mesh position={[-1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>
      <mesh position={[1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>

      {/* Gold chrome legs - SHARED material */}
      {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.35], [1.2, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} material={SHARED_MATERIALS.goldChrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
        </mesh>
      ))}

      {/* Neon accent under couch */}
      <NeonStrip
        color={COLORS.magenta}
        position={[0, 0.08, 0.4]}
        size={[2.4, 0.02, 0.02]}
        intensity={1.2}
      />
    </group>
  )
}

// Modern coffee table with PREMIUM glass top - MeshTransmissionMaterial
function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Premium Glass top - real refraction */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.03, 0.7]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.1}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.05}
          iridescence={0.3}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 400]}
          transmission={1}
          roughness={0.05}
          color="#88ccff"
        />
      </mesh>

      {/* Chrome frame */}
      <mesh position={[0, 0.38, 0]} material={SHARED_MATERIALS.chrome}>
        <boxGeometry args={[1.25, 0.015, 0.75]} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.2, 0]} material={SHARED_MATERIALS.darkMetal}>
        <boxGeometry args={[0.8, 0.38, 0.5]} />
      </mesh>

      {/* Neon ring */}
      <NeonStrip
        color={COLORS.cyan}
        position={[0, 0.01, 0]}
        size={[0.9, 0.01, 0.6]}
        intensity={0.8}
      />
    </group>
  )
}

// Trophy Display - Individual 3D trophy
function Trophy({ achievement, index }: { achievement: Achievement, index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isUnlocked = achievement.unlocked

  // Gentle floating animation for unlocked trophies
  useFrame((state) => {
    if (meshRef.current && isUnlocked) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + index * 0.5
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05
    }
  })

  const color = isUnlocked ? COLORS.gold : '#333333'
  const emissive = isUnlocked ? COLORS.gold : '#000000'

  return (
    <group>
      {/* Trophy pedestal */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
        <meshStandardMaterial
          color={isUnlocked ? '#1a1a2a' : '#0a0a0f'}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Trophy body */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          metalness={isUnlocked ? 0.9 : 0.2}
          roughness={isUnlocked ? 0.1 : 0.8}
          emissive={emissive}
          emissiveIntensity={isUnlocked ? 0.3 : 0}
        />
      </mesh>

      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <pointLight
          position={[0, 0.5, 0]}
          color={COLORS.gold}
          intensity={0.5}
          distance={1.5}
        />
      )}
    </group>
  )
}

// Trophy Room - Displays achievements as 3D trophies
function TrophyRoom({ position }: { position: [number, number, number] }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    // Load achievements
    const loadAchievements = () => {
      const all = achievementStore.getVisible()
      setAchievements(all.slice(0, 10)) // Show first 10 achievements
    }
    loadAchievements()

    // Poll for updates
    const interval = setInterval(loadAchievements, 2000)
    return () => clearInterval(interval)
  }, [])

  // Grid layout: 5x2
  const cols = 5
  const spacing = 0.7

  return (
    <group position={position}>
      {/* Display case back */}
      <mesh position={[0, 1.2, -0.3]}>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial
          color="#0a0a14"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Glass shelves */}
      {[0.6, 1.5].map((y, shelfIdx) => (
        <mesh key={shelfIdx} position={[0, y, 0]}>
          <boxGeometry args={[3.8, 0.03, 0.5]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.15}
            metalness={1}
            roughness={0}
          />
        </mesh>
      ))}

      {/* Trophies */}
      {achievements.map((ach, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = (col - (cols - 1) / 2) * spacing
        const y = row === 0 ? 0.6 : 1.5

        return (
          <group key={ach.id} position={[x, y, 0]}>
            <Trophy achievement={ach} index={i} />
          </group>
        )
      })}

      {/* Neon frame */}
      <NeonStrip color={COLORS.gold} position={[0, 0.1, 0.2]} size={[3.6, 0.02, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[0, 2.3, 0.2]} size={[3.6, 0.02, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[-1.85, 1.2, 0.2]} size={[0.02, 2.2, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[1.85, 1.2, 0.2]} size={[0.02, 2.2, 0.02]} audioReactive />

      {/* Title */}
      <mesh position={[0, 2.6, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

// Machine positions for collision
const MACHINE_POSITIONS = MACHINES.map(m => ({ x: m.x, z: MACHINE_Z }))

// Couch positions for sitting (detection area + seat position + stand up position)
// VIPCouch je 2.8 sirine, seat je na sredini kauča
// standX/standZ = pozicija ISPRED kauča gde avatar stoji kada ustane
const COUCH_POSITIONS = [
  // Left lounge - couches face right (player sits facing right = rotation PI/2)
  { id: 'left-1', x: -26, z: 8, rotation: Math.PI / 2, seatX: -26, seatZ: 8, standX: -24, standZ: 8 },
  { id: 'left-2', x: -26, z: 12, rotation: Math.PI / 2, seatX: -26, seatZ: 12, standX: -24, standZ: 12 },
  // Right lounge - couches face left (player sits facing left = rotation -PI/2)
  { id: 'right-1', x: 26, z: 8, rotation: -Math.PI / 2, seatX: 26, seatZ: 8, standX: 24, standZ: 8 },
  { id: 'right-2', x: 26, z: 12, rotation: -Math.PI / 2, seatX: 26, seatZ: 12, standX: 24, standZ: 12 },
  // Center back lounge - couches face forward (player sits facing camera = rotation 0)
  { id: 'center-1', x: -4, z: -8, rotation: 0, seatX: -4, seatZ: -8, standX: -4, standZ: -6 },
  { id: 'center-2', x: 4, z: -8, rotation: 0, seatX: 4, seatZ: -8, standX: 4, standZ: -6 }
]

// Collision boxes for furniture (couches, tables, bar)
// VIPCouch is 2.8 wide x 1.0 deep - when rotated 90deg, width/depth swap
const COLLISION_BOXES = [
  // Left lounge couches - rotated 90deg, so 1.0 wide x 2.8 deep
  { x: -26, z: 8, width: 1.2, depth: 3.0 },
  { x: -26, z: 12, width: 1.2, depth: 3.0 },
  // Left lounge coffee table (at group [-26,0,8] + offset [1.5,0,2] = [-24.5, 0, 10])
  { x: -24.5, z: 10, width: 1.2, depth: 0.7 },

  // Right lounge couches - rotated -90deg, so 1.0 wide x 2.8 deep
  { x: 26, z: 8, width: 1.2, depth: 3.0 },
  { x: 26, z: 12, width: 1.2, depth: 3.0 },
  // Right lounge coffee table (at group [26,0,8] + offset [-1.5,0,2] = [24.5, 0, 10])
  { x: 24.5, z: 10, width: 1.2, depth: 0.7 },

  // Center back lounge couches - NOT rotated, so 2.8 wide x 1.0 deep
  // (at group [0,0,-8] + offset [-4,0,0] = [-4, 0, -8])
  { x: -4, z: -8, width: 3.0, depth: 1.2 },
  { x: 4, z: -8, width: 3.0, depth: 1.2 },
  // Center coffee table (at group [0,0,-8] + offset [0,0,1.5] = [0, 0, -6.5])
  { x: 0, z: -6.5, width: 1.2, depth: 0.7 },

  // Bar counter
  { x: 0, z: -10, width: 20, depth: 1.5 }
]

// Info modal content for each slot
const SLOT_INFO: Record<string, { title: string; content: string[] }> = {
  skills: {
    title: 'SKILLS',
    content: [
      '🎮 Game Development - Unity, Unreal, Godot',
      '🌐 Web Dev - React, Three.js, TypeScript',
      '🎨 3D Art - Blender, Maya, Substance',
      '🔊 Audio - FMOD, Wwise, Sound Design',
      '💻 Programming - C#, C++, Rust, Python'
    ]
  },
  services: {
    title: 'SERVICES',
    content: [
      '🎰 Casino Game Development',
      '🎮 Slot Machine Design & Animation',
      '🌐 Interactive Web Experiences',
      '🔧 Custom Software Solutions',
      '📱 Cross-platform Development'
    ]
  },
  about: {
    title: 'ABOUT ME',
    content: [
      '👨‍💻 10+ Years Game Development',
      '🎯 Specializing in Casino & iGaming',
      '🏆 AAA Quality Standards',
      '🌍 Remote Work Available',
      '💬 English & Serbian Speaker'
    ]
  },
  projects: {
    title: 'PROJECTS',
    content: [
      '🎰 50+ Slot Machines Developed',
      '🃏 Casino Table Games',
      '🎮 Interactive 3D Experiences',
      '📊 Real-time Data Visualizations',
      '🔧 Custom Game Engines'
    ]
  },
  experience: {
    title: 'EXPERIENCE',
    content: [
      '🏢 Senior Game Developer @ Major Studios',
      '🎰 Lead Slot Developer @ iGaming Company',
      '🌐 Freelance Interactive Developer',
      '🎓 Computer Science Background',
      '📜 Multiple Certifications'
    ]
  },
  contact: {
    title: 'CONTACT',
    content: [
      '📧 email@vanvinkl.com',
      '💼 LinkedIn: /in/vanvinkl',
      '🐙 GitHub: /vanvinkl',
      '🌐 vanvinkl.com',
      '📱 Available for projects!'
    ]
  }
}

interface CasinoSceneProps {
  onShowModal?: (machineId: string) => void
  onSlotSpin?: (machineId: string) => void
  onSitChange?: (isSitting: boolean) => void
  introActive?: boolean
  slotOpen?: boolean // When true, avatar input is disabled
  audioSettingsOpen?: boolean // When true, avatar input is disabled
}

export function CasinoScene({ onShowModal, onSlotSpin, onSitChange, introActive = false, slotOpen = false, audioSettingsOpen = false }: CasinoSceneProps) {
  const { camera } = useThree()
  const avatarPos = useRef(new THREE.Vector3(0, 0, 10))
  const avatarRotation = useRef(0)
  const isMovingRef = useRef(false)

  // Audio system
  const audio = useAudio()
  const lastFootstepTime = useRef(0)
  const audioInitialized = useRef(false)

  // ALL state as refs to avoid re-renders - ZERO LAG
  const nearMachineRef = useRef<string | null>(null)
  const spinningMachineRef = useRef<string | null>(null)
  const winMachineRef = useRef<string | null>(null)
  const isJackpotRef = useRef(false)
  const nearCouchRef = useRef<typeof COUCH_POSITIONS[0] | null>(null)
  const [nearLogo, setNearLogo] = useState(false)
  const isSittingRef = useRef(false)
  const sittingRotationRef = useRef(0)
  const currentCouch = useRef<typeof COUCH_POSITIONS[0] | null>(null)

  // Force update for UI only when needed (modal, etc)
  const [, forceUpdate] = useState(0)

  // Orbital camera state for sitting
  const orbitAngle = useRef(0) // Horizontal angle around avatar
  const orbitPitch = useRef(0.3) // Vertical angle (0 = level, positive = looking down)
  const orbitDistance = useRef(6) // Distance from avatar

  // Arrow key state for orbital camera
  const orbitKeys = useRef({ left: false, right: false, up: false, down: false })

  // Keyboard handlers for orbital camera when sitting
  useEffect(() => {
    // Note: Using refs now, this effect just sets up listeners

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle orbit keys when sitting
      if (!isSittingRef.current) return

      switch (e.code) {
        case 'ArrowLeft':
          orbitKeys.current.left = true
          e.preventDefault()
          break
        case 'ArrowRight':
          orbitKeys.current.right = true
          e.preventDefault()
          break
        case 'ArrowUp':
          orbitKeys.current.up = true
          e.preventDefault()
          break
        case 'ArrowDown':
          orbitKeys.current.down = true
          e.preventDefault()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
          orbitKeys.current.left = false
          break
        case 'ArrowRight':
          orbitKeys.current.right = false
          break
        case 'ArrowUp':
          orbitKeys.current.up = false
          break
        case 'ArrowDown':
          orbitKeys.current.down = false
          break
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isSittingRef.current) return
      // Zoom in/out
      orbitDistance.current = Math.max(3, Math.min(12, orbitDistance.current + e.deltaY * 0.01))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('wheel', handleWheel)
    }
  }, []) // Empty deps - never re-create listeners

  // Initialize spatial audio when intro ends
  useEffect(() => {
    if (!introActive && !audioInitialized.current) {
      audioInitialized.current = true

      // Background ambient sounds DISABLED per user request
      // audio.playSpatial('casino-ambient', 'casinoHum', [0, 3, 0], {
      //   volume: 0.3,
      //   loop: true,
      //   refDistance: 20,
      //   maxDistance: 100,
      //   rolloffFactor: 0.5
      // })

      // Neon buzzes DISABLED per user request
      // const neonPositions: [number, number, number][] = [
      //   [-15, 4, -10],  // Back left
      //   [15, 4, -10],   // Back right
      //   [-25, 3, 8],    // Left lounge
      //   [25, 3, 8],     // Right lounge
      //   [0, 4, -10]     // Bar
      // ]
      //
      // neonPositions.forEach((pos, i) => {
      //   audio.playSpatial(`neon-${i}`, 'neonBuzz', pos, {
      //     volume: 0.15,
      //     loop: true,
      //     refDistance: 3,
      //     maxDistance: 15,
      //     rolloffFactor: 1.5
      //   })
      // })
    }
  }, [introActive, audio])

  // Handle SPACE key for spinning OR sitting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()

        // If sitting, stand up - move avatar to stand position (in front of couch)
        if (isSittingRef.current && currentCouch.current) {
          avatarPos.current.x = currentCouch.current.standX
          avatarPos.current.z = currentCouch.current.standZ
          // Reset orbit
          orbitAngle.current = 0
          orbitPitch.current = 0.3
          orbitDistance.current = 6
          orbitKeys.current = { left: false, right: false, up: false, down: false }
          currentCouch.current = null
          isSittingRef.current = false
          // Notify App
          onSitChange?.(false)
          return
        }

        // Slot machine interaction - FAST animation (2.5s total)
        if (nearMachineRef.current && !spinningMachineRef.current) {
          spinningMachineRef.current = nearMachineRef.current
          forceUpdate(n => n + 1) // Update slot machines

          const machineId = nearMachineRef.current

          // Play mechanical spin sound (lower volume)
          playSynthSpinMech(0.15)

          // Trigger slot transition overlay
          onSlotSpin?.(machineId)

          // Play reel stop sounds staggered
          setTimeout(() => playReelStop(0), 600)
          setTimeout(() => playReelStop(1), 800)
          setTimeout(() => playReelStop(2), 1000)
          setTimeout(() => playReelStop(3), 1200)
          setTimeout(() => { playReelStop(4); stopSynthSpinMech() }, 1400) // Stop spin sound on last reel

          // After spin completes (1.5s), trigger WIN CELEBRATION
          setTimeout(() => {
            // Random jackpot chance (20%)
            isJackpotRef.current = Math.random() < 0.2
            winMachineRef.current = machineId
            forceUpdate(n => n + 1)

            // Play win sound
            if (isJackpotRef.current) {
              audio.play('jackpot', { volume: 0.8 })
            } else {
              audio.play('winBig', { volume: 0.7 })
            }

            // Win celebration is SHORTER (1.0s), then show modal
            setTimeout(() => {
              if (onShowModal) {
                audio.play('modalOpen', { volume: 0.5 })
                onShowModal(machineId)
              }
              winMachineRef.current = null
              spinningMachineRef.current = null
              isJackpotRef.current = false
              forceUpdate(n => n + 1)
            }, 1000)
          }, 1500)
          return
        }

        // Couch sitting interaction
        if (nearCouchRef.current && !isSittingRef.current) {
          audio.play('sit', { volume: 0.5 })
          isSittingRef.current = true
          sittingRotationRef.current = nearCouchRef.current.rotation
          currentCouch.current = nearCouchRef.current
          // Move avatar to seat position
          avatarPos.current.x = nearCouchRef.current.seatX
          avatarPos.current.z = nearCouchRef.current.seatZ
          // Notify App
          onSitChange?.(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onShowModal, onSlotSpin, audio]) // Include audio

  useFrame((state) => {
    // Skip camera control during intro
    if (introActive) return

    // Update audio listener position (follows camera)
    const camPos = camera.position
    const camDir = new THREE.Vector3()
    camera.getWorldDirection(camDir)
    audio.updateListener(
      [camPos.x, camPos.y, camPos.z],
      [camDir.x, camDir.y, camDir.z]
    )

    // Footstep sounds when moving (not during intro)
    if (isMovingRef.current && !isSittingRef.current && !introActive) {
      const now = state.clock.elapsedTime
      if (now - lastFootstepTime.current > 0.35) { // ~2.8 steps per second
        playSynthFootstep(0.25)
        lastFootstepTime.current = now
      }
    }

    if (isSittingRef.current) {
      // ZERO LAG orbit - direct set, no lerp
      const rotSpeed = 5.0
      const pitchSpeed = 3.0
      const dt = 1/60 // Fixed step for consistent speed
      if (orbitKeys.current.left) orbitAngle.current += rotSpeed * dt
      if (orbitKeys.current.right) orbitAngle.current -= rotSpeed * dt
      if (orbitKeys.current.up) orbitPitch.current = Math.min(0.8, orbitPitch.current + pitchSpeed * dt)
      if (orbitKeys.current.down) orbitPitch.current = Math.max(0.1, orbitPitch.current - pitchSpeed * dt)

      const avatarX = avatarPos.current.x
      const avatarZ = avatarPos.current.z
      const avatarY = 1.0

      const dist = orbitDistance.current
      const pitch = orbitPitch.current
      const angle = orbitAngle.current

      // DIRECT SET - ZERO lerp
      camera.position.x = avatarX + Math.sin(angle) * Math.cos(pitch) * dist
      camera.position.y = avatarY + Math.sin(pitch) * dist + 1.5
      camera.position.z = avatarZ + Math.cos(angle) * Math.cos(pitch) * dist
      camera.lookAt(avatarX, avatarY + 0.5, avatarZ)
    } else {
      // FOLLOW CAMERA - DIRECT SET, ZERO lerp
      camera.position.x = avatarPos.current.x
      camera.position.y = avatarPos.current.y + 4
      camera.position.z = avatarPos.current.z + 10
      camera.lookAt(avatarPos.current.x, 1.5, avatarPos.current.z - 3)
    }

    // Proximity check - EVERY FRAME, NO setState (uses refs)
    // Using distance² to avoid sqrt - compare with threshold²
    if (!isSittingRef.current) {
      // Check slot machines (threshold: 4, so 4² = 16)
      let closestMachine: string | null = null
      let minDistSqMachine = 16 // 4²
      for (const m of MACHINES) {
        const dx = avatarPos.current.x - m.x
        const dz = avatarPos.current.z - MACHINE_Z
        const distSq = dx * dx + dz * dz
        if (distSq < minDistSqMachine) {
          minDistSqMachine = distSq
          closestMachine = m.id
        }
      }
      nearMachineRef.current = closestMachine

      // Check couches (threshold: 3, so 3² = 9)
      let closestCouch: typeof COUCH_POSITIONS[0] | null = null
      let minDistSqCouch = 9 // 3²
      for (const couch of COUCH_POSITIONS) {
        const dx = avatarPos.current.x - couch.x
        const dz = avatarPos.current.z - couch.z
        const distSq = dx * dx + dz * dz
        if (distSq < minDistSqCouch) {
          minDistSqCouch = distSq
          closestCouch = couch
        }
      }
      nearCouchRef.current = closestCouch

      // Check logo proximity (position: [25, 5, -11.5], threshold: 8)
      const logoX = 25, logoZ = -11.5
      const dxLogo = avatarPos.current.x - logoX
      const dzLogo = avatarPos.current.z - logoZ
      const distSqLogo = dxLogo * dxLogo + dzLogo * dzLogo
      const isNearLogo = distSqLogo < 64 // 8²
      if (isNearLogo !== nearLogo) setNearLogo(isNearLogo)
    }
  })

  return (
    <>
      {/* ===== LIGHTING - MINIMAL ===== */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={0.6} color="#ffffff" />

      {/* Only 2 accent lights */}
      <pointLight position={[0, 6, 0]} color={COLORS.purple} intensity={4} distance={40} />
      <pointLight position={[0, 4, 10]} color={COLORS.cyan} intensity={2} distance={30} />

      {/* Environment removed for performance */}

      {/* ===== FLOOR - Reflective with SSR (optimized) ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <planeGeometry args={[70, 55]} />
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={256}
          mixBlur={1}
          mixStrength={0.4}
          roughness={0.85}
          depthScale={1.0}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
          color="#1a1520"
          metalness={0.4}
          mirror={0.2}
        />
      </mesh>

      {/* ===== CONTACT SHADOWS - Subtle depth (optimized) ===== */}
      <ContactShadows
        position={[0, 0.01, 5]}
        opacity={0.3}
        scale={80}
        blur={2}
        far={15}
        resolution={128}
        color="#000000"
      />

      {/* Floor neon grid lines */}
      {[-20, -10, 0, 10, 20].map(x => (
        <NeonStrip key={`fx${x}`} color={COLORS.purple} position={[x, 0.01, 5]} size={[0.02, 0.01, 50]} intensity={0.4} />
      ))}
      {[-10, 0, 10, 20].map(z => (
        <NeonStrip key={`fz${z}`} color={COLORS.cyan} position={[0, 0.01, z]} size={[60, 0.01, 0.02]} intensity={0.3} />
      ))}

      {/* ===== WALLS - SHARED material ===== */}
      {/* Back wall */}
      <mesh position={[0, 4.5, -12]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[70, 11, 0.3]} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 4.5, 32]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[70, 11, 0.3]} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-34, 4.5, 10]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[0.3, 11, 60]} />
      </mesh>
      <mesh position={[34, 4.5, 10]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[0.3, 11, 60]} />
      </mesh>

      {/* Wall neon accents - HOLOGRAPHIC SHIMMER for premium look */}
      <NeonStrip color={COLORS.magenta} position={[0, 1, -11.7]} size={[65, 0.06, 0.06]} holographic />
      <NeonStrip color={COLORS.cyan} position={[0, 8.5, -11.7]} size={[65, 0.06, 0.06]} holographic />
      <NeonStrip color={COLORS.purple} position={[-33.7, 4.5, 10]} size={[0.06, 8, 0.06]} audioReactive />
      <NeonStrip color={COLORS.purple} position={[33.7, 4.5, 10]} size={[0.06, 8, 0.06]} audioReactive />

      {/* God Ray light sources - creates volumetric light effect */}
      <GodRaySource position={[0, 9, -10]} color={COLORS.purple} intensity={3} />
      <GodRaySource position={[-15, 9, 0]} color={COLORS.magenta} intensity={2} />
      <GodRaySource position={[15, 9, 0]} color={COLORS.cyan} intensity={2} />

      {/* ===== CEILING - SHARED material ===== */}
      <mesh position={[0, 9.5, 10]} material={SHARED_MATERIALS.ceiling}>
        <boxGeometry args={[70, 0.2, 60]} />
      </mesh>

      {/* Ceiling neon grid - HOLOGRAPHIC for AAA quality */}
      <NeonStrip color={COLORS.magenta} position={[-15, 9.3, 10]} size={[0.04, 0.04, 55]} holographic />
      <NeonStrip color={COLORS.cyan} position={[15, 9.3, 10]} size={[0.04, 0.04, 55]} holographic />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, -5]} size={[65, 0.04, 0.04]} audioReactive />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, 15]} size={[65, 0.04, 0.04]} audioReactive />

      {/* Ceiling panels - SHARED material */}
      {[-22, -11, 0, 11, 22].map(x => (
        [-4, 6, 16].map(z => (
          <mesh key={`cp-${x}-${z}`} position={[x, 9.35, z]} material={SHARED_MATERIALS.ceilingPanel}>
            <boxGeometry args={[9, 0.08, 8]} />
          </mesh>
        ))
      ))}

      {/* ===== VIP LOUNGE AREAS - SHARED materials ===== */}

      {/* Left lounge - Royal Purple velvet */}
      <group position={[-26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <VIPCouch position={[0, 0, 4]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <CoffeeTable position={[1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.magenta} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 2]} color={COLORS.magenta} />
      </group>

      {/* Right lounge - Deep Teal velvet */}
      <group position={[26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <VIPCouch position={[0, 0, 4]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <CoffeeTable position={[-1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.cyan} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 2]} color={COLORS.cyan} />
      </group>

      {/* Center back lounge - Wine Red velvet */}
      <group position={[0, 0, -8]}>
        <VIPCouch position={[-4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <VIPCouch position={[4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <CoffeeTable position={[0, 0, 1.5]} />
        <pointLight position={[0, 2.5, 0]} color={COLORS.purple} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 0]} color={COLORS.purple} />
      </group>

      {/* ===== BAR AREA - SHARED materials ===== */}
      <group position={[0, 0, -10]}>
        {/* Bar counter */}
        <mesh position={[0, 0.95, 0]} material={SHARED_MATERIALS.barTop}>
          <boxGeometry args={[20, 0.08, 1.2]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} material={SHARED_MATERIALS.barBody}>
          <boxGeometry args={[19.5, 0.9, 1.0]} />
        </mesh>

        {/* Bar back shelves */}
        <mesh position={[0, 2.5, -1]} material={SHARED_MATERIALS.barShelf}>
          <boxGeometry args={[18, 4, 0.3]} />
        </mesh>

        {/* Bar neon accents */}
        <NeonStrip color={COLORS.gold} position={[0, 1.5, -0.8]} size={[17, 0.03, 0.03]} intensity={1.3} />
        <NeonStrip color={COLORS.cyan} position={[0, 0.05, 0.5]} size={[18, 0.02, 0.02]} intensity={1.0} />

      </group>

      {/* ===== TROPHY ROOM - Achievement display ===== */}
      <TrophyRoom position={[-28, 0, -8]} />

      {/* ===== LOGO - Right side of back wall (right of slots) ===== */}
      <LogoWall position={[25, 5, -11.5]} scale={1.5} />
      <LogoHint active={nearLogo} position={[25, 1.5, -10]} />

      {/* ===== FLOATING LETTERS - "VAN VINKL" on front wall ===== */}
      <FloatingLetters />

      {/* ===== VIP ROPE BARRIERS - SHARED materials ===== */}
      {[-20, 20].map((x, i) => (
        <group key={`rope-${i}`}>
          {/* Pole 1 */}
          <mesh position={[x, 0.5, 2]} material={SHARED_MATERIALS.goldChrome}>
            <cylinderGeometry args={[0.04, 0.05, 1, 8]} />
          </mesh>
          <mesh position={[x, 1.02, 2]} material={SHARED_MATERIALS.goldChrome}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>

          {/* Pole 2 */}
          <mesh position={[x, 0.5, 5]} material={SHARED_MATERIALS.goldChrome}>
            <cylinderGeometry args={[0.04, 0.05, 1, 8]} />
          </mesh>
          <mesh position={[x, 1.02, 5]} material={SHARED_MATERIALS.goldChrome}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>

          {/* Velvet rope */}
          <mesh position={[x, 0.9, 3.5]} material={SHARED_MATERIALS.velvetRope}>
            <cylinderGeometry args={[0.025, 0.025, 3, 8]} />
          </mesh>
        </group>
      ))}

      {/* ===== AVATAR ===== */}
      <Avatar
        positionRef={avatarPos}
        rotationRef={avatarRotation}
        isMovingRef={isMovingRef}
        machinePositions={MACHINE_POSITIONS}
        collisionBoxes={COLLISION_BOXES}
        isSittingRef={isSittingRef}
        sittingRotationRef={sittingRotationRef}
        inputDisabled={slotOpen || audioSettingsOpen}
      />

      {/* ===== AVATAR PARTICLE TRAIL ===== */}
      <AvatarEffects
        positionRef={avatarPos}
        isMovingRef={isMovingRef}
      />

      {/* ===== PROXIMITY FEEDBACK ===== */}
      {!introActive && (
        <ProximityIndicator
          avatarPosition={avatarPos.current}
          nearMachine={nearMachineRef.current}
          nearCouch={nearCouchRef.current}
          machinePositions={MACHINES.map(m => ({ id: m.id, x: m.x, z: MACHINE_Z }))}
          couchPositions={COUCH_POSITIONS.map(c => ({ id: c.id, x: c.x, z: c.z }))}
        />
      )}

      {/* ===== SLOT MACHINES with GPU WIN CELEBRATION ===== */}
      {MACHINES.map((m) => (
        <group key={m.id}>
          <CyberpunkSlotMachine
            position={[m.x, 0, MACHINE_Z]}
            label={m.label}
            nearMachineRef={nearMachineRef}
            spinningMachineRef={spinningMachineRef}
            machineId={m.id}
          />
          {/* GPU Win Celebration - shader-driven particles */}
          <WinCelebrationGPU
            position={[m.x, 3, MACHINE_Z + 1]}
            active={winMachineRef.current === m.id}
            isJackpot={isJackpotRef.current && winMachineRef.current === m.id}
          />
        </group>
      ))}

      {/* ===== AMBIENT DUST PARTICLES ===== */}
      <DustParticles
        count={150}
        area={[60, 9, 50]}
        color="#8866ff"
        opacity={0.2}
        size={0.03}
      />

      {/* ===== FOG ===== */}
      <fog attach="fog" args={['#080412', 18, 55]} />

      {/* ===== POST-PROCESSING - GPU-driven effects (optimized) ===== */}
      <PostProcessing
        quality="low"
        enableSSAO={false}
        enableBloom={true}
        enableChromatic={false}  // Disabled for performance
        enableVignette={true}
        enableNoise={false}
      />

      {/* WebGL context loss handler */}
      <ContextHandler />
    </>
  )
}
