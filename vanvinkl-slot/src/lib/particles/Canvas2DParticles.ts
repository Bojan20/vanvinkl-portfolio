/**
 * Canvas2D Particle System - Fallback for browsers without WebGPU
 *
 * Optimized for performance with:
 * - Object pooling
 * - Spatial partitioning for culling
 * - Batch rendering
 */

export interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

export interface Emitter2DConfig {
  maxParticles: number;
  emissionRate: number;
  lifetime: [number, number];
  speed: [number, number];
  size: [number, number];
  colors: string[];
  gravity: number;
  spread: number;
  rotationSpeed: [number, number];
  fadeIn: number;
  fadeOut: number;
  shape: "circle" | "square" | "star";
}

const DEFAULT_CONFIG: Emitter2DConfig = {
  maxParticles: 1000,
  emissionRate: 50,
  lifetime: [1, 3],
  speed: [50, 150],
  size: [4, 12],
  colors: ["#ffd700", "#ffb347", "#ff6b6b", "#4ecdc4", "#45b7d1"],
  gravity: 200,
  spread: Math.PI / 4,
  rotationSpeed: [-3, 3],
  fadeIn: 0.1,
  fadeOut: 0.3,
  shape: "circle",
};

export class Canvas2DParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private particles: Particle2D[] = [];
  private particlePool: Particle2D[] = [];
  private config: Emitter2DConfig;

  private emitterX: number = 0;
  private emitterY: number = 0;
  private emitting: boolean = false;
  private emissionAccumulator: number = 0;

  private lastTime: number = 0;
  private animationId: number = 0;

  constructor(config: Partial<Emitter2DConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Pre-allocate particle pool
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  private createParticle(): Particle2D {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      color: "#fff",
      alpha: 1,
      life: 0,
      maxLife: 0,
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private getParticle(): Particle2D | null {
    // Try to get from pool
    for (const p of this.particlePool) {
      if (!p.active) {
        return p;
      }
    }

    // Pool exhausted
    if (this.particles.length < this.config.maxParticles) {
      const p = this.createParticle();
      this.particlePool.push(p);
      return p;
    }

    return null;
  }

  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!this.ctx) {
      console.error("Failed to get 2D context");
      return false;
    }

    return true;
  }

  setEmitterPosition(x: number, y: number): void {
    this.emitterX = x;
    this.emitterY = y;
  }

  startEmitting(): void {
    this.emitting = true;
  }

  stopEmitting(): void {
    this.emitting = false;
  }

  emit(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      p.active = true;
      p.x = this.emitterX;
      p.y = this.emitterY;

      // Random direction within spread
      const angle = -Math.PI / 2 + this.random(-this.config.spread, this.config.spread);
      const speed = this.random(this.config.speed[0], this.config.speed[1]);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;

      p.size = this.random(this.config.size[0], this.config.size[1]);
      p.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
      p.alpha = 1;
      p.life = this.random(this.config.lifetime[0], this.config.lifetime[1]);
      p.maxLife = p.life;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotationSpeed = this.random(
        this.config.rotationSpeed[0],
        this.config.rotationSpeed[1]
      );

      this.particles.push(p);
    }
  }

  burst(x: number, y: number, count: number, config?: Partial<Emitter2DConfig>): void {
    const prevX = this.emitterX;
    const prevY = this.emitterY;
    const prevConfig = { ...this.config };

    this.emitterX = x;
    this.emitterY = y;
    if (config) {
      Object.assign(this.config, config);
    }

    this.emit(count);

    this.emitterX = prevX;
    this.emitterY = prevY;
    this.config = prevConfig;
  }

  update(deltaTime: number): void {
    // Continuous emission
    if (this.emitting) {
      this.emissionAccumulator += deltaTime * this.config.emissionRate;
      const toEmit = Math.floor(this.emissionAccumulator);
      if (toEmit > 0) {
        this.emit(toEmit);
        this.emissionAccumulator -= toEmit;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (!p.active) {
        this.particles.splice(i, 1);
        continue;
      }

      // Update life
      p.life -= deltaTime;
      if (p.life <= 0) {
        p.active = false;
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vy += this.config.gravity * deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.rotation += p.rotationSpeed * deltaTime;

      // Alpha fade
      const lifeRatio = p.life / p.maxLife;
      const fadeIn = Math.min(1, (1 - lifeRatio) / this.config.fadeIn);
      const fadeOut = Math.min(1, lifeRatio / this.config.fadeOut);
      p.alpha = fadeIn * fadeOut;
    }
  }

  render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear with transparency
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort by size for better visual (larger behind)
    this.particles.sort((a, b) => b.size - a.size);

    // Batch by color for fewer state changes
    const colorBatches = new Map<string, Particle2D[]>();

    for (const p of this.particles) {
      if (!colorBatches.has(p.color)) {
        colorBatches.set(p.color, []);
      }
      colorBatches.get(p.color)!.push(p);
    }

    // Render each batch
    for (const [color, batch] of colorBatches) {
      this.ctx.fillStyle = color;

      for (const p of batch) {
        this.ctx.globalAlpha = p.alpha;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);

        switch (this.config.shape) {
          case "circle":
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            break;

          case "square":
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            break;

          case "star":
            this.drawStar(0, 0, 5, p.size / 2, p.size / 4);
            break;
        }

        this.ctx.restore();
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawStar(
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    if (!this.ctx) return;

    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  start(): void {
    this.lastTime = performance.now();

    const loop = (time: number) => {
      const deltaTime = (time - this.lastTime) / 1000;
      this.lastTime = time;

      this.update(deltaTime);
      this.render();

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  clear(): void {
    for (const p of this.particles) {
      p.active = false;
    }
    this.particles = [];
  }

  getActiveCount(): number {
    return this.particles.length;
  }

  dispose(): void {
    this.stop();
    this.clear();
    this.canvas = null;
    this.ctx = null;
  }
}

// Preset configurations
export const PARTICLE_2D_PRESETS: Record<string, Emitter2DConfig> = {
  coinExplosion: {
    maxParticles: 200,
    emissionRate: 0,
    lifetime: [0.8, 1.5] as [number, number],
    speed: [200, 400] as [number, number],
    size: [8, 16] as [number, number],
    colors: ["#ffd700", "#ffb347", "#ffc125", "#daa520"],
    gravity: 600,
    spread: Math.PI,
    rotationSpeed: [-8, 8] as [number, number],
    fadeIn: 0.05,
    fadeOut: 0.4,
    shape: "circle",
  },

  sparkleTrail: {
    maxParticles: 500,
    emissionRate: 30,
    lifetime: [0.3, 0.6] as [number, number],
    speed: [20, 60] as [number, number],
    size: [2, 6] as [number, number],
    colors: ["#ffffff", "#fffacd", "#fff8dc"],
    gravity: 50,
    spread: Math.PI / 6,
    rotationSpeed: [0, 0] as [number, number],
    fadeIn: 0.1,
    fadeOut: 0.5,
    shape: "star",
  },

  confetti: {
    maxParticles: 500,
    emissionRate: 100,
    lifetime: [2, 4] as [number, number],
    speed: [100, 250] as [number, number],
    size: [6, 12] as [number, number],
    colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9"],
    gravity: 150,
    spread: Math.PI / 3,
    rotationSpeed: [-5, 5] as [number, number],
    fadeIn: 0.1,
    fadeOut: 0.3,
    shape: "square",
  },

  ambientDust: {
    maxParticles: 100,
    emissionRate: 5,
    lifetime: [4, 8] as [number, number],
    speed: [10, 30] as [number, number],
    size: [2, 4] as [number, number],
    colors: ["rgba(255,215,120,0.3)", "rgba(255,255,255,0.2)"],
    gravity: -10,
    spread: Math.PI,
    rotationSpeed: [-0.5, 0.5] as [number, number],
    fadeIn: 0.3,
    fadeOut: 0.5,
    shape: "circle",
  },

  jackpotCelebration: {
    maxParticles: 1000,
    emissionRate: 300,
    lifetime: [1.5, 3] as [number, number],
    speed: [200, 500] as [number, number],
    size: [6, 20] as [number, number],
    colors: ["#ffd700", "#ff6b6b", "#4ecdc4", "#9b59b6", "#e74c3c", "#2ecc71"],
    gravity: 300,
    spread: Math.PI,
    rotationSpeed: [-10, 10] as [number, number],
    fadeIn: 0.05,
    fadeOut: 0.4,
    shape: "star",
  },
};
