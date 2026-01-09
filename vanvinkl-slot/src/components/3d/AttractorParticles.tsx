'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AttractorParticlesProps {
  count?: number
  attractors?: Array<{ x: number; y: number; z: number }>
  attractorStrength?: number
}

export function AttractorParticles({
  count = 2000,
  attractors = [
    { x: -3, y: 2, z: 0 },
    { x: 3, y: 2, z: 0 },
    { x: 0, y: 4, z: -2 }
  ],
  attractorStrength = 1.0
}: AttractorParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // Generate particle attributes
  const { positions, sizes, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Random position in sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = Math.random() * 10

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Random size
      sizes[i] = Math.random() * 3 + 1

      // Random velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02

      // Random phase offset
      phases[i] = Math.random() * 100
    }

    return { positions, sizes, velocities, phases }
  }, [count])

  // Custom shader material
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAttractor1: { value: new THREE.Vector3(attractors[0].x, attractors[0].y, attractors[0].z) },
          uAttractor2: { value: new THREE.Vector3(attractors[1].x, attractors[1].y, attractors[1].z) },
          uAttractor3: { value: new THREE.Vector3(attractors[2].x, attractors[2].y, attractors[2].z) },
          uAttractorStrength: { value: attractorStrength },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
          uniform float uTime;
          uniform vec3 uAttractor1;
          uniform vec3 uAttractor2;
          uniform vec3 uAttractor3;
          uniform float uAttractorStrength;

          attribute float aSize;
          attribute vec3 aVelocity;
          attribute float aPhase;

          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec3 pos = position;

            // Calculate distances
            float dist1 = distance(pos, uAttractor1);
            float dist2 = distance(pos, uAttractor2);
            float dist3 = distance(pos, uAttractor3);

            // Attraction forces
            float epsilon = 0.5;
            vec3 force1 = normalize(uAttractor1 - pos) / max(dist1 * dist1, epsilon);
            vec3 force2 = normalize(uAttractor2 - pos) / max(dist2 * dist2, epsilon);
            vec3 force3 = normalize(uAttractor3 - pos) / max(dist3 * dist3, epsilon);

            pos += (force1 + force2 + force3) * uAttractorStrength * 0.02;

            // Organic movement
            pos.x += sin(uTime * 0.5 + aPhase) * 0.1;
            pos.y += cos(uTime * 0.5 + aPhase + 1.0) * 0.1;

            // Boundary wrapping
            float boundary = 15.0;
            if (abs(pos.x) > boundary) pos.x = -sign(pos.x) * boundary;
            if (abs(pos.y) > boundary) pos.y = -sign(pos.y) * boundary;
            if (abs(pos.z) > boundary) pos.z = -sign(pos.z) * boundary;

            // Color based on nearest attractor
            float minDist = min(dist1, min(dist2, dist3));

            if (dist1 == minDist) {
              vColor = vec3(1.0, 0.5, 0.2);  // Orange
            } else if (dist2 == minDist) {
              vColor = vec3(0.2, 0.8, 1.0);  // Cyan
            } else {
              vColor = vec3(0.2, 1.0, 0.6);  // Green
            }

            vAlpha = smoothstep(10.0, 2.0, minDist);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
            alpha *= vAlpha;
            float glow = exp(-dist * 8.0) * 0.5;
            gl_FragColor = vec4(vColor + glow, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
    [attractors, attractorStrength]
  )

  // Animation loop
  useFrame((state) => {
    if (!pointsRef.current) return

    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime

    // Update attractor positions if needed
    shaderMaterial.uniforms.uAttractor1.value.set(attractors[0].x, attractors[0].y, attractors[0].z)
    shaderMaterial.uniforms.uAttractor2.value.set(attractors[1].x, attractors[1].y, attractors[1].z)
    shaderMaterial.uniforms.uAttractor3.value.set(attractors[2].x, attractors[2].y, attractors[2].z)
  })

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geom.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3))
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geom
  }, [positions, sizes, velocities, phases])

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />
  )
}
