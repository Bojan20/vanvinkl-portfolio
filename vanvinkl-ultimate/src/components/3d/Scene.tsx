"use client";

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Suspense } from "react";
import { AudioWaveform } from "./AudioWaveform";
import { ParticleField } from "./ParticleField";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function Scene() {
  return (
    <div className="webgl-canvas">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ff7a3b" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#40c8ff" />

          {/* 3D Elements */}
          <AudioWaveform />
          <ParticleField count={1500} />

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
              intensity={0.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.0005, 0.0005]}
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
