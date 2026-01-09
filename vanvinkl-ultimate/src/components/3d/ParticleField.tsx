"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  count?: number;
  color?: string;
}

export function ParticleField({ count = 2000, color = "#ff7a3b" }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Generate particle positions
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(color);
    const cyanColor = new THREE.Color("#40c8ff");
    const greenColor = new THREE.Color("#40ff90");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spread particles in a sphere
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random velocities for animation
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      // Color gradient based on position (spectrum effect)
      const t = (positions[i3 + 1] + 10) / 20; // Normalize Y position
      let particleColor;
      if (t < 0.33) {
        particleColor = cyanColor.clone().lerp(greenColor, t * 3);
      } else if (t < 0.66) {
        particleColor = greenColor.clone().lerp(baseColor, (t - 0.33) * 3);
      } else {
        particleColor = baseColor.clone();
      }

      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;
    }

    return { positions, velocities, colors };
  }, [count, color]);

  // Set up geometry attributes
  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometryRef.current.setAttribute(
        "aVelocity",
        new THREE.BufferAttribute(velocities, 3)
      );
      geometryRef.current.setAttribute(
        "aColor",
        new THREE.BufferAttribute(colors, 3)
      );
    }
  }, [positions, velocities, colors]);

  // Shader material for particles
  const shaderData = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uPixelRatio;

        attribute vec3 aVelocity;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          vec3 pos = position;

          // Oscillate based on time
          pos.x += sin(uTime * 0.5 + position.y * 0.1) * 0.5;
          pos.y += cos(uTime * 0.3 + position.x * 0.1) * 0.5;
          pos.z += sin(uTime * 0.4 + position.z * 0.1) * 0.3;

          // Mouse attraction
          float distToMouse = length(pos.xy - uMouse * 10.0);
          float attraction = smoothstep(5.0, 0.0, distToMouse) * 2.0;
          pos.xy += normalize(uMouse * 10.0 - pos.xy) * attraction;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

          // Size based on distance
          float size = 30.0 * uPixelRatio;
          size *= (1.0 / -mvPosition.z);
          size = clamp(size, 1.0, 10.0);

          // Fade based on distance from center
          float distFromCenter = length(pos) / 20.0;
          vAlpha = 1.0 - smoothstep(0.5, 1.0, distFromCenter);
          vAlpha *= 0.6;

          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft edge
          float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
          alpha *= vAlpha;

          // Glow effect
          vec3 glowColor = vColor * 1.5;

          gl_FragColor = vec4(mix(vColor, glowColor, 1.0 - dist * 2.0), alpha);
        }
      `,
    }),
    []
  );

  // Animation
  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uMouse.value.set(state.pointer.x, state.pointer.y);

      // Slow rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        vertexShader={shaderData.vertexShader}
        fragmentShader={shaderData.fragmentShader}
        uniforms={shaderData.uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
