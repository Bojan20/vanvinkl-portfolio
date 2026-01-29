/**
 * LogoHint - Floating hint for VanVinkl Studio logo
 */

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LogoHintProps {
  active: boolean
  position: [number, number, number]
}

export function LogoHint({ active, position }: LogoHintProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const time = useRef(Math.random() * 100)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const LOGO_PATH = '/logo_van.png'
    if (!LOGO_PATH.startsWith('/') || LOGO_PATH.includes('://')) return

    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.onerror = () => setLogoImg(null)
    img.src = LOGO_PATH
  }, [])

  const { canvas, texture } = useMemo(() => {
    const cvs = document.createElement('canvas')
    cvs.width = 1024
    cvs.height = 400
    const tex = new THREE.CanvasTexture(cvs)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.anisotropy = 4
    return { canvas: cvs, texture: tex }
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
      console.log('[LogoHint] CanvasTexture disposed')
    }
  }, [texture])

  useEffect(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (logoImg) {
      const logoSize = 130
      const logoX = 140
      const logoY = (canvas.height - logoSize) / 2 - 20
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    }

    ctx.shadowColor = '#00ffff'
    ctx.shadowBlur = 25

    ctx.font = 'bold 72px "Orbitron", system-ui, sans-serif'
    ctx.fillStyle = '#00ffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('VANVINKL', 300, canvas.height / 2 - 40)

    ctx.font = 'bold 72px "Orbitron", system-ui, sans-serif'
    ctx.fillStyle = '#ff00aa'
    ctx.shadowColor = '#ff00aa'
    ctx.fillText('STUDIO', 680, canvas.height / 2 - 40)

    ctx.font = 'bold 48px "Orbitron", system-ui, sans-serif'
    ctx.fillStyle = '#ffd700'
    ctx.shadowColor = '#ffd700'
    ctx.shadowBlur = 20
    ctx.textAlign = 'center'
    ctx.fillText('CASINO LOUNGE', canvas.width / 2 + 80, canvas.height / 2 + 50)

    texture.needsUpdate = true
  }, [logoImg, canvas, texture])

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

        float shimmer = sin(vUv.x * 15.0 + time * 2.0) * 0.08 + 0.92;

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

  useFrame((_, delta) => {
    if (!groupRef.current) return

    time.current += delta
    material.uniforms.time.value = time.current

    const targetOpacity = active ? 1 : 0
    material.uniforms.opacity.value += (targetOpacity - material.uniforms.opacity.value) * 0.1

    if (active) {
      groupRef.current.position.y = position[1] + Math.sin(time.current * 2) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh material={material}>
        <planeGeometry args={[8, 3.2]} />
      </mesh>
    </group>
  )
}
