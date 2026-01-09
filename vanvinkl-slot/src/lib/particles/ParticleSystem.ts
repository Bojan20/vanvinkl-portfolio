/**
 * WebGPU Particle System
 *
 * High-performance GPU-accelerated particle system for casino effects:
 * - Coin explosions
 * - Sparkle trails
 * - Confetti bursts
 * - Ambient dust/light particles
 */

// Particle data structure (32 bytes aligned for GPU)
export interface Particle {
  position: [number, number, number]; // 12 bytes
  velocity: [number, number, number]; // 12 bytes
  color: [number, number, number, number]; // 16 bytes
  size: number; // 4 bytes
  life: number; // 4 bytes
  maxLife: number; // 4 bytes
  rotation: number; // 4 bytes
  rotationSpeed: number; // 4 bytes
}

export interface ParticleEmitterConfig {
  maxParticles: number;
  emissionRate: number; // particles per second
  lifetime: [number, number]; // min, max in seconds
  speed: [number, number]; // min, max
  size: [number, number]; // min, max
  color: [number, number, number, number]; // RGBA
  colorVariance: [number, number, number, number];
  gravity: [number, number, number];
  spread: number; // cone angle in radians
  rotationSpeed: [number, number];
  fadeIn: number; // 0-1
  fadeOut: number; // 0-1
}

// WGSL Compute Shader for particle simulation
const PARTICLE_COMPUTE_SHADER = `
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  color: vec4<f32>,
  size: f32,
  life: f32,
  maxLife: f32,
  rotation: f32,
  rotationSpeed: f32,
}

struct SimParams {
  deltaTime: f32,
  gravity: vec3<f32>,
  emitterPosition: vec3<f32>,
  time: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimParams;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= arrayLength(&particles)) {
    return;
  }

  var p = particles[index];

  // Skip dead particles
  if (p.life <= 0.0) {
    return;
  }

  // Update life
  p.life -= params.deltaTime;

  // Apply gravity
  p.velocity += params.gravity * params.deltaTime;

  // Update position
  p.position += p.velocity * params.deltaTime;

  // Update rotation
  p.rotation += p.rotationSpeed * params.deltaTime;

  // Fade alpha based on life
  let lifeRatio = p.life / p.maxLife;
  let fadeIn = smoothstep(0.0, 0.1, 1.0 - lifeRatio);
  let fadeOut = smoothstep(0.0, 0.3, lifeRatio);
  p.color.a = fadeIn * fadeOut;

  particles[index] = p;
}
`;

// WGSL Vertex Shader for particle rendering
const PARTICLE_VERTEX_SHADER = `
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  color: vec4<f32>,
  size: f32,
  life: f32,
  maxLife: f32,
  rotation: f32,
  rotationSpeed: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
}

struct Uniforms {
  viewProjection: mat4x4<f32>,
  cameraRight: vec3<f32>,
  cameraUp: vec3<f32>,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// Billboard corners
const corners = array<vec2<f32>, 6>(
  vec2<f32>(-0.5, -0.5),
  vec2<f32>(0.5, -0.5),
  vec2<f32>(0.5, 0.5),
  vec2<f32>(-0.5, -0.5),
  vec2<f32>(0.5, 0.5),
  vec2<f32>(-0.5, 0.5),
);

@vertex
fn main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  var output: VertexOutput;

  let p = particles[instanceIndex];

  // Skip dead particles
  if (p.life <= 0.0) {
    output.position = vec4<f32>(0.0, 0.0, -1000.0, 1.0);
    output.color = vec4<f32>(0.0);
    output.uv = vec2<f32>(0.0);
    return output;
  }

  let corner = corners[vertexIndex];

  // Apply rotation
  let cos_r = cos(p.rotation);
  let sin_r = sin(p.rotation);
  let rotatedCorner = vec2<f32>(
    corner.x * cos_r - corner.y * sin_r,
    corner.x * sin_r + corner.y * cos_r
  );

  // Billboard
  let worldPos = p.position +
    uniforms.cameraRight * rotatedCorner.x * p.size +
    uniforms.cameraUp * rotatedCorner.y * p.size;

  output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
  output.color = p.color;
  output.uv = corner + vec2<f32>(0.5);

  return output;
}
`;

// WGSL Fragment Shader
const PARTICLE_FRAGMENT_SHADER = `
@group(0) @binding(2) var particleTexture: texture_2d<f32>;
@group(0) @binding(3) var particleSampler: sampler;

struct FragmentInput {
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  let texColor = textureSample(particleTexture, particleSampler, input.uv);
  return input.color * texColor;
}
`;

export class GPUParticleSystem {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;

  private particleBuffer: GPUBuffer | null = null;
  private simParamsBuffer: GPUBuffer | null = null;
  private renderUniformsBuffer: GPUBuffer | null = null;

  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;

  private computeBindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;

  private particles: Float32Array;
  private maxParticles: number;
  private activeParticles: number = 0;
  private particleIndex: number = 0;

  private emitterPosition: [number, number, number] = [0, 0, 0];
  private config: ParticleEmitterConfig;

  private lastTime: number = 0;
  private emissionAccumulator: number = 0;

  constructor(config: Partial<ParticleEmitterConfig> = {}) {
    this.config = {
      maxParticles: 10000,
      emissionRate: 100,
      lifetime: [1, 3],
      speed: [1, 5],
      size: [0.1, 0.3],
      color: [1, 0.8, 0.2, 1], // Gold
      colorVariance: [0.1, 0.1, 0.1, 0],
      gravity: [0, -9.8, 0],
      spread: Math.PI / 4,
      rotationSpeed: [-2, 2],
      fadeIn: 0.1,
      fadeOut: 0.3,
      ...config,
    };

    this.maxParticles = this.config.maxParticles;

    // 14 floats per particle (56 bytes, padded to 64)
    this.particles = new Float32Array(this.maxParticles * 16);
  }

  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    // Check WebGPU support
    if (!navigator.gpu) {
      console.warn("WebGPU not supported, falling back to Canvas2D");
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn("No GPU adapter found");
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = canvas.getContext("webgpu");

      if (!this.context) {
        console.warn("Failed to get WebGPU context");
        return false;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format,
        alphaMode: "premultiplied",
      });

      await this.createBuffers();
      await this.createPipelines(format);

      return true;
    } catch (error) {
      console.error("Failed to initialize WebGPU:", error);
      return false;
    }
  }

  private async createBuffers(): Promise<void> {
    if (!this.device) return;

    // Particle buffer (storage)
    this.particleBuffer = this.device.createBuffer({
      size: this.particles.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    // Simulation parameters uniform buffer
    this.simParamsBuffer = this.device.createBuffer({
      size: 48, // deltaTime + gravity + emitterPos + time (aligned)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Render uniforms buffer
    this.renderUniformsBuffer = this.device.createBuffer({
      size: 128, // mat4 + vec3 + vec3 (aligned)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createPipelines(format: GPUTextureFormat): Promise<void> {
    if (!this.device) return;

    // Compute pipeline
    const computeModule = this.device.createShaderModule({
      code: PARTICLE_COMPUTE_SHADER,
    });

    this.computePipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: computeModule,
        entryPoint: "main",
      },
    });

    // Render pipeline
    const vertexModule = this.device.createShaderModule({
      code: PARTICLE_VERTEX_SHADER,
    });

    const fragmentModule = this.device.createShaderModule({
      code: PARTICLE_FRAGMENT_SHADER,
    });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: vertexModule,
        entryPoint: "main",
      },
      fragment: {
        module: fragmentModule,
        entryPoint: "main",
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // Create bind groups
    if (this.particleBuffer && this.simParamsBuffer && this.computePipeline) {
      this.computeBindGroup = this.device.createBindGroup({
        layout: this.computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.particleBuffer } },
          { binding: 1, resource: { buffer: this.simParamsBuffer } },
        ],
      });
    }
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private randomInCone(
    direction: [number, number, number],
    spread: number
  ): [number, number, number] {
    const theta = Math.random() * spread;
    const phi = Math.random() * Math.PI * 2;

    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    // Random vector in cone around Y axis
    const x = sinTheta * cosPhi;
    const y = cosTheta;
    const z = sinTheta * sinPhi;

    // TODO: Rotate to actual direction
    return [
      x * direction[1] + direction[0],
      y,
      z * direction[1] + direction[2],
    ];
  }

  emit(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const idx = this.particleIndex * 16;

      // Position
      this.particles[idx + 0] = this.emitterPosition[0];
      this.particles[idx + 1] = this.emitterPosition[1];
      this.particles[idx + 2] = this.emitterPosition[2];

      // Velocity
      const speed = this.random(this.config.speed[0], this.config.speed[1]);
      const dir = this.randomInCone([0, 1, 0], this.config.spread);
      this.particles[idx + 3] = dir[0] * speed;
      this.particles[idx + 4] = dir[1] * speed;
      this.particles[idx + 5] = dir[2] * speed;

      // Color with variance
      this.particles[idx + 6] =
        this.config.color[0] +
        this.random(
          -this.config.colorVariance[0],
          this.config.colorVariance[0]
        );
      this.particles[idx + 7] =
        this.config.color[1] +
        this.random(
          -this.config.colorVariance[1],
          this.config.colorVariance[1]
        );
      this.particles[idx + 8] =
        this.config.color[2] +
        this.random(
          -this.config.colorVariance[2],
          this.config.colorVariance[2]
        );
      this.particles[idx + 9] = this.config.color[3];

      // Size
      this.particles[idx + 10] = this.random(
        this.config.size[0],
        this.config.size[1]
      );

      // Life
      const life = this.random(
        this.config.lifetime[0],
        this.config.lifetime[1]
      );
      this.particles[idx + 11] = life;
      this.particles[idx + 12] = life;

      // Rotation
      this.particles[idx + 13] = Math.random() * Math.PI * 2;
      this.particles[idx + 14] = this.random(
        this.config.rotationSpeed[0],
        this.config.rotationSpeed[1]
      );

      this.particleIndex = (this.particleIndex + 1) % this.maxParticles;
      this.activeParticles = Math.min(
        this.activeParticles + 1,
        this.maxParticles
      );
    }
  }

  burst(
    position: [number, number, number],
    count: number,
    config?: Partial<ParticleEmitterConfig>
  ): void {
    const prevPosition = this.emitterPosition;
    const prevConfig = { ...this.config };

    this.emitterPosition = position;
    if (config) {
      Object.assign(this.config, config);
    }

    this.emit(count);

    this.emitterPosition = prevPosition;
    this.config = prevConfig;
  }

  setEmitterPosition(x: number, y: number, z: number): void {
    this.emitterPosition = [x, y, z];
  }

  update(time: number): void {
    const deltaTime = this.lastTime === 0 ? 0.016 : (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (!this.device || !this.particleBuffer || !this.simParamsBuffer) return;

    // Continuous emission
    this.emissionAccumulator += deltaTime * this.config.emissionRate;
    const toEmit = Math.floor(this.emissionAccumulator);
    if (toEmit > 0) {
      this.emit(toEmit);
      this.emissionAccumulator -= toEmit;
    }

    // Update simulation parameters
    const simParams = new Float32Array([
      deltaTime,
      0,
      0,
      0, // padding
      this.config.gravity[0],
      this.config.gravity[1],
      this.config.gravity[2],
      0, // padding
      this.emitterPosition[0],
      this.emitterPosition[1],
      this.emitterPosition[2],
      time / 1000,
    ]);

    this.device.queue.writeBuffer(this.simParamsBuffer, 0, simParams.buffer);
    this.device.queue.writeBuffer(this.particleBuffer, 0, this.particles.buffer);

    // Run compute shader
    if (this.computePipeline && this.computeBindGroup) {
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();

      passEncoder.setPipeline(this.computePipeline);
      passEncoder.setBindGroup(0, this.computeBindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(this.maxParticles / 256));
      passEncoder.end();

      this.device.queue.submit([commandEncoder.finish()]);
    }
  }

  render(viewProjection: Float32Array, cameraRight: Float32Array, cameraUp: Float32Array): void {
    if (
      !this.device ||
      !this.context ||
      !this.renderPipeline ||
      !this.renderUniformsBuffer
    )
      return;

    // Update render uniforms
    const uniforms = new Float32Array(32);
    uniforms.set(viewProjection, 0);
    uniforms.set(cameraRight, 16);
    uniforms.set(cameraUp, 20);

    this.device.queue.writeBuffer(this.renderUniformsBuffer, 0, uniforms);

    // Render
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "load",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(this.renderPipeline);
    // Note: bind group would be set here with proper texture
    renderPass.draw(6, this.activeParticles);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  dispose(): void {
    this.particleBuffer?.destroy();
    this.simParamsBuffer?.destroy();
    this.renderUniformsBuffer?.destroy();
    this.device = null;
    this.context = null;
  }
}

// Preset configurations for different effects
export const PARTICLE_PRESETS = {
  coinExplosion: {
    maxParticles: 500,
    emissionRate: 0,
    lifetime: [1, 2],
    speed: [3, 8],
    size: [0.05, 0.15],
    color: [1, 0.84, 0, 1], // Gold
    colorVariance: [0.1, 0.1, 0, 0],
    gravity: [0, -15, 0],
    spread: Math.PI,
    rotationSpeed: [-10, 10],
  } as ParticleEmitterConfig,

  sparkleTrail: {
    maxParticles: 1000,
    emissionRate: 50,
    lifetime: [0.3, 0.8],
    speed: [0.5, 1.5],
    size: [0.02, 0.08],
    color: [1, 1, 1, 1],
    colorVariance: [0, 0, 0, 0],
    gravity: [0, -2, 0],
    spread: Math.PI / 8,
    rotationSpeed: [0, 0],
  } as ParticleEmitterConfig,

  confetti: {
    maxParticles: 2000,
    emissionRate: 200,
    lifetime: [2, 4],
    speed: [2, 5],
    size: [0.03, 0.08],
    color: [1, 0.2, 0.5, 1],
    colorVariance: [0.5, 0.5, 0.5, 0],
    gravity: [0, -3, 0],
    spread: Math.PI / 3,
    rotationSpeed: [-5, 5],
  } as ParticleEmitterConfig,

  ambientDust: {
    maxParticles: 500,
    emissionRate: 10,
    lifetime: [5, 10],
    speed: [0.1, 0.3],
    size: [0.01, 0.03],
    color: [1, 0.9, 0.7, 0.3],
    colorVariance: [0.1, 0.1, 0.1, 0.1],
    gravity: [0, 0.1, 0],
    spread: Math.PI,
    rotationSpeed: [-0.5, 0.5],
  } as ParticleEmitterConfig,

  jackpotCelebration: {
    maxParticles: 5000,
    emissionRate: 500,
    lifetime: [2, 5],
    speed: [5, 15],
    size: [0.05, 0.2],
    color: [1, 0.8, 0.2, 1],
    colorVariance: [0.3, 0.3, 0.3, 0],
    gravity: [0, -5, 0],
    spread: Math.PI,
    rotationSpeed: [-8, 8],
  } as ParticleEmitterConfig,
};
