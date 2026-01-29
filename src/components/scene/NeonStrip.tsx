/**
 * NeonStrip - GPU-animated neon strip with pre-compiled shaders
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { uaGetBassLevel } from '../../audio'

const getBassLevel = (): number => uaGetBassLevel()

// Shared vertex shader
const NEON_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Pre-compiled shader materials
export const NEON_SHADERS = {
  pulse: new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#ffffff') }, time: { value: 0 } },
    vertexShader: NEON_VERTEX_SHADER,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec2 vUv;
      void main() {
        float pulse = 0.7 + 0.3 * sin(time * 3.0 + vUv.x * 10.0);
        gl_FragColor = vec4(color * pulse * 1.5, 1.0);
      }
    `,
    toneMapped: false
  }),
  audioReactive: new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#ffffff') }, time: { value: 0 }, bass: { value: 0 } },
    vertexShader: NEON_VERTEX_SHADER,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float bass;
      varying vec2 vUv;
      void main() {
        float bassPulse = 0.5 + bass * 1.5;
        float wave = sin(time * 2.0 + vUv.x * 8.0) * 0.15;
        float intensity = bassPulse + wave;
        vec3 boostedColor = color * (1.0 + bass * 0.5);
        gl_FragColor = vec4(boostedColor * intensity * 2.0, 1.0);
      }
    `,
    toneMapped: false
  }),
  holographic: new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#ffffff') }, time: { value: 0 }, bass: { value: 0 } },
    vertexShader: NEON_VERTEX_SHADER,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float bass;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      void main() {
        float scanline = sin(vWorldPosition.y * 50.0 + time * 3.0) * 0.5 + 0.5;
        float shimmer = noise(vUv * 20.0 + time * 2.0) * 0.3;
        float hueShift = vUv.x * 0.5 + time * 0.2 + bass * 0.3;
        vec3 rainbow = vec3(
          sin(hueShift * 6.28) * 0.5 + 0.5,
          sin(hueShift * 6.28 + 2.09) * 0.5 + 0.5,
          sin(hueShift * 6.28 + 4.18) * 0.5 + 0.5
        );
        vec3 holoColor = mix(color, rainbow, 0.3 + shimmer * 0.2);
        float intensity = (0.8 + scanline * 0.4 + shimmer) * (1.0 + bass * 0.5);
        gl_FragColor = vec4(holoColor * intensity * 1.8, 1.0);
      }
    `,
    toneMapped: false
  })
}

// Cache for static MeshBasicMaterial by color
const staticNeonMaterials = new Map<string, THREE.MeshBasicMaterial>()

interface NeonStripProps {
  color: string
  position: [number, number, number]
  size: [number, number, number]
  intensity?: number
  pulse?: boolean
  audioReactive?: boolean
  holographic?: boolean
}

export function NeonStrip({ color, position, size, pulse = false, audioReactive = false, holographic = false }: NeonStripProps) {
  const isClonedShader = pulse || audioReactive || holographic

  const mat = useMemo(() => {
    if (!isClonedShader) {
      let cached = staticNeonMaterials.get(color)
      if (!cached) {
        cached = new THREE.MeshBasicMaterial({ color, toneMapped: false })
        staticNeonMaterials.set(color, cached)
      }
      return cached
    }
    const shaderType = holographic ? 'holographic' : audioReactive ? 'audioReactive' : 'pulse'
    const cloned = NEON_SHADERS[shaderType].clone()
    cloned.uniforms.color.value = new THREE.Color(color)
    return cloned
  }, [color, isClonedShader, audioReactive, holographic])

  useEffect(() => {
    return () => {
      if (isClonedShader && mat instanceof THREE.ShaderMaterial) {
        mat.dispose()
      }
    }
  }, [mat, isClonedShader])

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
