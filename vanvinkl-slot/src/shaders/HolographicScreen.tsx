'use client'

import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AAA Holographic Screen Material
 *
 * Features:
 * - Iridescent color shifting
 * - Fresnel rim glow
 * - Scan line animation
 * - Depth-based color variation
 */
export const HolographicScreenMaterial = shaderMaterial(
  {
    baseColor: new THREE.Color('#4a9eff'),
    time: 0.0,
    iridescence: 1.0,
    glowIntensity: 1.2,
    scanlineSpeed: 2.0,
    isActive: 0.0
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment Shader
  `
  uniform vec3 baseColor;
  uniform float time;
  uniform float iridescence;
  uniform float glowIntensity;
  uniform float scanlineSpeed;
  uniform float isActive;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Iridescent color shift
  vec3 getIridescence(vec3 normal, float shift) {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

    float hue = fresnel * shift + time * 0.15;
    vec3 iridColor = vec3(
      sin(hue) * 0.5 + 0.5,
      sin(hue + 2.094) * 0.5 + 0.5,
      sin(hue + 4.189) * 0.5 + 0.5
    );

    return mix(baseColor, iridColor, iridescence * 0.6);
  }

  void main() {
    // Iridescent base
    vec3 color = getIridescence(vNormal, 3.0);

    // Fresnel rim glow
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    vec3 rim = baseColor * fresnel * glowIntensity;

    // Scan lines (horizontal moving)
    float scanline = sin(vUv.y * 60.0 - time * scanlineSpeed) * 0.5 + 0.5;
    scanline = smoothstep(0.4, 0.6, scanline) * 0.2;

    // Active boost
    float boost = mix(1.0, 1.5, isActive);

    // Combine
    color += rim;
    color += scanline * baseColor;
    color *= boost;

    // Emissive glow
    gl_FragColor = vec4(color, 1.0);
  }
  `
)

extend({ HolographicScreenMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      holographicScreenMaterial: any
    }
  }
}
