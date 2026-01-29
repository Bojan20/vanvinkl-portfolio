/**
 * LogoWall - Cyberpunk style logo with holographic shader
 */

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NeonStrip } from './NeonStrip'
import { uaGetBassLevel } from '../../audio'

const getBassLevel = (): number => uaGetBassLevel()

interface LogoWallProps {
  position: [number, number, number]
  scale?: number
}

export function LogoWall({ position, scale = 1 }: LogoWallProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [aspectRatio, setAspectRatio] = useState(2)
  const textureRef = useRef<THREE.Texture | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(() => {
    let mounted = true
    const loader = new THREE.TextureLoader()
    loader.load('/logo_van.png', (loadedTex) => {
      if (!mounted) return
      loadedTex.colorSpace = THREE.SRGBColorSpace
      textureRef.current = loadedTex
      if (materialRef.current) {
        materialRef.current.uniforms.map.value = loadedTex
      }
      const img = loadedTex.image
      if (img && img.width && img.height) {
        setAspectRatio(img.width / img.height)
      }
    })
    return () => { mounted = false }
  }, [])

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
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

          vec2 center = vUv - 0.5;
          float vignette = 1.0 - smoothstep(0.2, 0.6, length(center) * 1.2);

          float edgeFade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) *
                           smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);

          float smokeNoise = noise(vUv * 4.0 + time * 0.15) * 0.4;
          float smokeNoise2 = noise(vUv * 8.0 - time * 0.1) * 0.2;
          float smoke = smokeNoise + smokeNoise2;

          float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 desaturated = mix(texColor.rgb, vec3(luminance), 0.4);

          vec3 darkened = desaturated * 0.5;

          vec3 atmosphereTint = vec3(0.7, 0.75, 0.9);
          vec3 tinted = darkened * atmosphereTint;

          float scanline = sin(vUv.y * 80.0 + time * 1.5) * 0.015;

          float hueShift = time * 0.05 + vUv.x * 0.1;
          vec3 shimmer = vec3(
            sin(hueShift) * 0.03,
            sin(hueShift + 2.09) * 0.03,
            sin(hueShift + 4.18) * 0.03
          );

          float glowMask = 1.0 - edgeFade;
          vec3 edgeColor = mix(vec3(0.6, 0.0, 0.4), vec3(0.0, 0.5, 0.6), vUv.x) * glowMask * 0.15;

          float pulse = 1.0 + bass * 0.1;

          vec3 finalColor = tinted * pulse + shimmer + scanline + edgeColor;

          finalColor = finalColor * (1.0 - smoke * 0.3);

          float totalMask = vignette * edgeFade;
          finalColor *= totalMask;

          float finalAlpha = texColor.a * totalMask * 0.85;

          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      toneMapped: false
    })
    materialRef.current = mat
    return mat
  }, [])

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
      <mesh ref={meshRef} material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>

      <NeonStrip color="#660044" position={[0, height/2 + 0.1, 0.05]} size={[width + 0.4, 0.04, 0.04]} pulse />
      <NeonStrip color="#660044" position={[0, -height/2 - 0.1, 0.05]} size={[width + 0.4, 0.04, 0.04]} pulse />
      <NeonStrip color="#004455" position={[-width/2 - 0.1, 0, 0.05]} size={[0.04, height + 0.4, 0.04]} pulse />
      <NeonStrip color="#004455" position={[width/2 + 0.1, 0, 0.05]} size={[0.04, height + 0.4, 0.04]} pulse />

      <pointLight color="#440033" intensity={1} distance={8} />
    </group>
  )
}
