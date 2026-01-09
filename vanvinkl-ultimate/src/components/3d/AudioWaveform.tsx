"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AudioWaveformProps {
  color?: string;
  amplitude?: number;
  frequency?: number;
  segments?: number;
}

export function AudioWaveform({
  color = "#ff7a3b",
  amplitude = 0.5,
  frequency = 2,
  segments = 128,
}: AudioWaveformProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Custom shader for audio-reactive waveform
  const shaderData = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uFrequency: { value: frequency },
        uColor: { value: new THREE.Color(color) },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uFrequency;
        uniform vec2 uMouse;

        varying vec2 vUv;
        varying float vElevation;

        // Simplex noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vUv = uv;

          vec3 pos = position;

          // Multi-layered wave effect (like audio frequencies)
          float lowFreq = sin(pos.x * 1.0 + uTime * 0.5) * 0.3;
          float midFreq = sin(pos.x * 3.0 + uTime * 1.0) * 0.2;
          float highFreq = sin(pos.x * 8.0 + uTime * 2.0) * 0.1;

          // Noise for organic movement
          float noise = snoise(vec2(pos.x * 0.5 + uTime * 0.2, pos.y * 0.5)) * 0.2;

          // Mouse interaction
          float distToMouse = distance(vec2(pos.x, pos.y), uMouse * 2.0);
          float mouseInfluence = smoothstep(2.0, 0.0, distToMouse) * 0.5;

          // Combine all frequencies
          float elevation = (lowFreq + midFreq + highFreq + noise) * uAmplitude;
          elevation += mouseInfluence;

          pos.z += elevation;
          vElevation = elevation;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;

        varying vec2 vUv;
        varying float vElevation;

        void main() {
          // Color based on elevation (like audio spectrum)
          vec3 lowColor = vec3(0.25, 0.78, 1.0);   // Cyan - low frequencies
          vec3 midColor = uColor;                   // Orange - mid frequencies
          vec3 highColor = vec3(1.0, 0.25, 0.38);  // Red - high frequencies

          float normalizedElevation = (vElevation + 0.5) / 1.0;

          vec3 finalColor;
          if (normalizedElevation < 0.5) {
            finalColor = mix(lowColor, midColor, normalizedElevation * 2.0);
          } else {
            finalColor = mix(midColor, highColor, (normalizedElevation - 0.5) * 2.0);
          }

          // Add glow effect
          float glow = pow(abs(vElevation), 2.0) * 2.0;
          finalColor += glow * 0.3;

          // Wireframe-like effect at edges
          float edgeFactor = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x);
          edgeFactor *= smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);

          float alpha = 0.6 + glow * 0.4;
          alpha *= edgeFactor;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    }),
    [color, amplitude, frequency]
  );

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // Update mouse position
      const mouseX = state.pointer.x;
      const mouseY = state.pointer.y;
      materialRef.current.uniforms.uMouse.value.set(mouseX, mouseY);
    }

    // Subtle mesh rotation
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 - 0.5;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <planeGeometry args={[8, 4, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shaderData.vertexShader}
        fragmentShader={shaderData.fragmentShader}
        uniforms={shaderData.uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
