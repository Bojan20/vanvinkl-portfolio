'use client'

import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AAA Volumetric Light Material
 *
 * Features:
 * - Raymarching volumetric fog
 * - God rays effect
 * - Exponential decay
 * - Performance-optimized (low sample count)
 */
export const VolumetricLightMaterial = shaderMaterial(
  {
    lightPos: new THREE.Vector3(0, 12, -8),
    lightColor: new THREE.Color('#FFD700'),
    density: 0.05,
    decay: 0.95,
    exposure: 0.3,
    samples: 50.0,
    time: 0.0
  },
  // Vertex Shader
  `
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewPosition = (viewMatrix * worldPosition).xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
  `,
  // Fragment Shader (Raymarching)
  `
  uniform vec3 lightPos;
  uniform vec3 lightColor;
  uniform float density;
  uniform float decay;
  uniform float exposure;
  uniform float samples;
  uniform float time;

  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;

  void main() {
    // Ray direction from camera to fragment
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);

    // Distance to light
    float distToLight = length(vWorldPosition - lightPos);

    // Volumetric scattering accumulation
    float volumetric = 0.0;
    float stepSize = distToLight / samples;

    // Raymarch toward light
    for (float i = 0.0; i < samples; i += 1.0) {
      vec3 samplePos = cameraPosition + rayDir * (i * stepSize);
      float distSampleToLight = length(samplePos - lightPos);

      // Exponential falloff
      float attenuation = exp(-distSampleToLight * density);
      volumetric += attenuation * stepSize;
    }

    // Apply decay and exposure
    volumetric *= decay * exposure;

    // Animated noise (subtle drift)
    float noise = sin(vWorldPosition.x * 0.1 + time) * cos(vWorldPosition.z * 0.1 + time) * 0.1;
    volumetric += noise * 0.05;

    // Final color with alpha
    vec3 finalColor = lightColor * volumetric;
    float alpha = clamp(volumetric, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
  `
)

extend({ VolumetricLightMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      volumetricLightMaterial: any
    }
  }
}
