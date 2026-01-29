/**
 * FloatingLetters - Collection of floating 3D letters
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { uaGetBassLevel } from '../../audio'

const getBassLevel = (): number => uaGetBassLevel()

interface FloatingLetterProps {
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
}

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
}: FloatingLetterProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const basePos = useMemo(() => new THREE.Vector3(...position), [position])

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.shadowColor = color
    ctx.shadowBlur = 40
    ctx.font = 'bold 180px "Orbitron", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2)

    ctx.shadowBlur = 15
    ctx.shadowColor = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }, [letter, color])

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

        float hue = time * 0.3 + vUv.x * 0.5 + vUv.y * 0.3;
        vec3 rainbow = vec3(
          sin(hue * 6.28) * 0.5 + 0.5,
          sin(hue * 6.28 + 2.09) * 0.5 + 0.5,
          sin(hue * 6.28 + 4.18) * 0.5 + 0.5
        );

        vec3 holoColor = mix(baseColor, rainbow, 0.4 + bass * 0.3);

        float pulse = 1.0 + bass * 0.5;

        gl_FragColor = vec4(holoColor * texColor.rgb * pulse * 1.5, texColor.a);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  }), [texture, color])

  // Cleanup texture and material on unmount
  useEffect(() => {
    return () => {
      texture.dispose()
      material.dispose()
    }
  }, [texture, material])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime + phaseOffset

    material.uniforms.time.value = t
    material.uniforms.bass.value = getBassLevel()

    if (orbitRadius > 0) {
      meshRef.current.position.x = basePos.x + Math.sin(t * orbitSpeed) * orbitRadius
      meshRef.current.position.z = basePos.z + Math.cos(t * orbitSpeed) * orbitRadius
    }

    meshRef.current.position.y = basePos.y + Math.sin(t * floatSpeed) * floatAmplitude

    meshRef.current.rotation.y = t * rotateSpeed
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

export function FloatingLetters() {
  const vanvinklLetters = [
    { letter: 'V', position: [20, 4, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.2, rotateSpeed: 0.2, scale: 2.8, phaseOffset: 0 },
    { letter: 'A', position: [15, 4.7, 30] as [number, number, number], color: '#00ffff', floatSpeed: 0.9, rotateSpeed: -0.15, scale: 2.8, phaseOffset: 0.5 },
    { letter: 'N', position: [10, 4.3, 30] as [number, number, number], color: '#8844ff', floatSpeed: 1.1, rotateSpeed: 0.18, scale: 2.8, phaseOffset: 1 },
    { letter: 'V', position: [4, 4.5, 30] as [number, number, number], color: '#ffd700', floatSpeed: 0.8, rotateSpeed: -0.2, scale: 2.8, phaseOffset: 1.5 },
    { letter: 'I', position: [-1, 4, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.3, rotateSpeed: 0.22, scale: 2.8, phaseOffset: 2 },
    { letter: 'N', position: [-6, 4.8, 30] as [number, number, number], color: '#00ffff', floatSpeed: 1.0, rotateSpeed: -0.18, scale: 2.8, phaseOffset: 2.5 },
    { letter: 'K', position: [-11, 4.2, 30] as [number, number, number], color: '#8844ff', floatSpeed: 0.7, rotateSpeed: 0.15, scale: 2.8, phaseOffset: 3 },
    { letter: 'L', position: [-16, 4.5, 30] as [number, number, number], color: '#ff00aa', floatSpeed: 1.4, rotateSpeed: -0.2, scale: 2.8, phaseOffset: 3.5 },
  ]

  return (
    <group>
      {vanvinklLetters.map((props, i) => (
        <FloatingLetter key={i} {...props} />
      ))}
    </group>
  )
}
