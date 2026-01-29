/**
 * FloatingSitSign - Floating sit sign above lounge areas
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FloatingSitSignProps {
  position: [number, number, number]
  color?: string
}

export function FloatingSitSign({ position, color = '#8844ff' }: FloatingSitSignProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const time = useRef(Math.random() * 100)

  const texture = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    const text = isMobile ? 'TAP TO SIT' : 'PRESS SPACE TO SIT'

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 96
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.font = 'bold 36px "Orbitron", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    ctx.shadowBlur = 8
    ctx.shadowColor = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }, [color])

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

        float hue = time * 0.5 + vUv.x * 2.0;
        vec3 rainbow = vec3(
          sin(hue) * 0.3 + 0.7,
          sin(hue + 2.09) * 0.3 + 0.7,
          sin(hue + 4.18) * 0.3 + 0.7
        );

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

  // Cleanup texture and material on unmount
  useEffect(() => {
    return () => {
      texture.dispose()
      material.dispose()
    }
  }, [texture, material])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    time.current += delta
    material.uniforms.time.value = time.current

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
