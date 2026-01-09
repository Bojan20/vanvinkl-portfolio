/**
 * Particle System - Unified API with automatic WebGPU/Canvas2D fallback
 */

export {
  GPUParticleSystem,
  PARTICLE_PRESETS,
  type Particle,
  type ParticleEmitterConfig,
} from "./ParticleSystem";

export {
  Canvas2DParticleSystem,
  PARTICLE_2D_PRESETS,
  type Particle2D,
  type Emitter2DConfig,
} from "./Canvas2DParticles";
