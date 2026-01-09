/**
 * PixiJS Renderer - High-performance 2D WebGL rendering
 *
 * Features:
 * - Hardware-accelerated slot reels
 * - Symbol animations
 * - Win line effects
 * - Background parallax
 */

import {
  Application,
  Container,
  Sprite,
  Graphics,
  Text,
  TextStyle,
  BlurFilter,
  ColorMatrixFilter,
  Ticker,
  Assets,
} from "pixi.js";

// Symbol configuration
export interface SymbolConfig {
  id: string;
  color: number;
  emoji: string;
  glowColor: number;
}

export const SYMBOL_CONFIGS: Record<string, SymbolConfig> = {
  CHERRY: { id: "cherry", color: 0xff4444, emoji: "🍒", glowColor: 0xff6666 },
  LEMON: { id: "lemon", color: 0xffff44, emoji: "🍋", glowColor: 0xffff88 },
  ORANGE: { id: "orange", color: 0xff8844, emoji: "🍊", glowColor: 0xffaa66 },
  PLUM: { id: "plum", color: 0x8844ff, emoji: "🍇", glowColor: 0xaa66ff },
  BELL: { id: "bell", color: 0xffdd44, emoji: "🔔", glowColor: 0xffee88 },
  BAR: { id: "bar", color: 0x44ff44, emoji: "📊", glowColor: 0x66ff66 },
  SEVEN: { id: "seven", color: 0xff4488, emoji: "7️⃣", glowColor: 0xff66aa },
  DIAMOND: { id: "diamond", color: 0x44ffff, emoji: "💎", glowColor: 0x88ffff },
};

// Reel configuration
const REEL_COUNT = 5;
const VISIBLE_SYMBOLS = 3;
const SYMBOL_SIZE = 100;
const REEL_SPACING = 10;
const SPIN_SPEED = 30;
const STOP_BOUNCE = 15;

export class PixiSlotRenderer {
  private app: Application | null = null;
  private reelContainer: Container | null = null;
  private reels: Container[] = [];
  private symbolTexts: Text[][] = [];
  private winLineGraphics: Graphics | null = null;
  private backgroundContainer: Container | null = null;

  private isSpinning = false;
  private reelPositions: number[] = [];
  private reelTargets: number[] = [];
  private reelSpeeds: number[] = [];
  private stoppingReels: boolean[] = [];

  private onSpinComplete: (() => void) | null = null;

  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      this.app = new Application();

      await this.app.init({
        canvas,
        width: canvas.width || 800,
        height: canvas.height || 600,
        backgroundColor: 0x0a0a12,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      this.createBackground();
      this.createReels();
      this.createWinLineOverlay();

      // Start render loop
      this.app.ticker.add(this.update.bind(this));

      return true;
    } catch (error) {
      console.error("Failed to initialize PixiJS:", error);
      return false;
    }
  }

  private createBackground(): void {
    if (!this.app) return;

    this.backgroundContainer = new Container();
    this.app.stage.addChild(this.backgroundContainer);

    // Gradient background
    const bg = new Graphics();
    bg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.fill({ color: 0x0a0a12 });
    this.backgroundContainer.addChild(bg);

    // Ambient particles
    for (let i = 0; i < 50; i++) {
      const particle = new Graphics();
      particle.circle(0, 0, Math.random() * 2 + 1);
      particle.fill({ color: 0xffd700, alpha: Math.random() * 0.3 });
      particle.x = Math.random() * this.app.screen.width;
      particle.y = Math.random() * this.app.screen.height;
      (particle as any).vy = -Math.random() * 0.5 - 0.1;
      (particle as any).baseAlpha = particle.alpha;
      this.backgroundContainer.addChild(particle);
    }
  }

  private createReels(): void {
    if (!this.app) return;

    this.reelContainer = new Container();
    this.reelContainer.x = (this.app.screen.width - (REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING)) / 2;
    this.reelContainer.y = (this.app.screen.height - VISIBLE_SYMBOLS * SYMBOL_SIZE) / 2;
    this.app.stage.addChild(this.reelContainer);

    // Create mask for reels
    const mask = new Graphics();
    mask.rect(
      -10,
      -10,
      REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING + 20,
      VISIBLE_SYMBOLS * SYMBOL_SIZE + 20
    );
    mask.fill({ color: 0xffffff });
    this.reelContainer.addChild(mask);
    this.reelContainer.mask = mask;

    // Create reels
    const symbolIds = Object.keys(SYMBOL_CONFIGS);

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = new Container();
      reel.x = i * (SYMBOL_SIZE + REEL_SPACING);
      this.reelContainer.addChild(reel);
      this.reels.push(reel);
      this.symbolTexts.push([]);
      this.reelPositions.push(0);
      this.reelTargets.push(0);
      this.reelSpeeds.push(0);
      this.stoppingReels.push(false);

      // Create symbols (extra for seamless scrolling)
      for (let j = 0; j < VISIBLE_SYMBOLS + 2; j++) {
        const symbolContainer = new Container();
        symbolContainer.y = j * SYMBOL_SIZE;

        // Background
        const bg = new Graphics();
        bg.roundRect(2, 2, SYMBOL_SIZE - 4, SYMBOL_SIZE - 4, 10);
        bg.fill({ color: 0x1a1a2e });
        bg.stroke({ width: 2, color: 0x2a2a4e });
        symbolContainer.addChild(bg);

        // Symbol text (emoji)
        const randomSymbol = symbolIds[Math.floor(Math.random() * symbolIds.length)];
        const config = SYMBOL_CONFIGS[randomSymbol];

        const style = new TextStyle({
          fontFamily: "Arial",
          fontSize: 48,
          fill: config.color,
        });

        const text = new Text({
          text: config.emoji,
          style,
        });
        text.anchor.set(0.5);
        text.x = SYMBOL_SIZE / 2;
        text.y = SYMBOL_SIZE / 2;
        symbolContainer.addChild(text);

        // Store reference
        (symbolContainer as any).symbolId = randomSymbol;
        this.symbolTexts[i].push(text);

        reel.addChild(symbolContainer);
      }
    }

    // Reel frame
    const frame = new Graphics();
    frame.roundRect(
      -15,
      -15,
      REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING + 30,
      VISIBLE_SYMBOLS * SYMBOL_SIZE + 30,
      15
    );
    frame.stroke({ width: 4, color: 0xff7a3b });

    // Glow effect
    const glowFilter = new BlurFilter();
    glowFilter.blur = 8;

    const glowFrame = new Graphics();
    glowFrame.roundRect(
      -15,
      -15,
      REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING + 30,
      VISIBLE_SYMBOLS * SYMBOL_SIZE + 30,
      15
    );
    glowFrame.stroke({ width: 6, color: 0xff7a3b });
    glowFrame.filters = [glowFilter];
    glowFrame.alpha = 0.5;

    this.reelContainer.addChild(glowFrame);
    this.reelContainer.addChild(frame);
  }

  private createWinLineOverlay(): void {
    if (!this.app || !this.reelContainer) return;

    this.winLineGraphics = new Graphics();
    this.reelContainer.addChild(this.winLineGraphics);
  }

  startSpin(onComplete?: () => void): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    this.onSpinComplete = onComplete || null;

    // Clear win lines
    this.winLineGraphics?.clear();

    // Start all reels
    for (let i = 0; i < REEL_COUNT; i++) {
      this.reelSpeeds[i] = SPIN_SPEED;
      this.stoppingReels[i] = false;
    }
  }

  stopReel(reelIndex: number, targetSymbols: string[]): void {
    if (reelIndex >= REEL_COUNT) return;

    // Set target position and start stopping
    this.stoppingReels[reelIndex] = true;

    // Update symbols
    const reel = this.reels[reelIndex];
    const symbolIds = Object.keys(SYMBOL_CONFIGS);

    for (let j = 0; j < reel.children.length; j++) {
      const container = reel.children[j] as Container;
      const text = this.symbolTexts[reelIndex][j];

      const targetSymbol = targetSymbols[j % targetSymbols.length] || symbolIds[Math.floor(Math.random() * symbolIds.length)];
      const config = SYMBOL_CONFIGS[targetSymbol] || SYMBOL_CONFIGS.CHERRY;

      text.text = config.emoji;
      text.style.fill = config.color;
      (container as any).symbolId = targetSymbol;
    }
  }

  showWinLine(lineIndex: number, positions: number[]): void {
    if (!this.winLineGraphics) return;

    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8844, 0x88ff44, 0x4488ff];
    const color = colors[lineIndex % colors.length];

    this.winLineGraphics.moveTo(
      SYMBOL_SIZE / 2,
      positions[0] * SYMBOL_SIZE + SYMBOL_SIZE / 2
    );

    for (let i = 1; i < positions.length; i++) {
      this.winLineGraphics.lineTo(
        i * (SYMBOL_SIZE + REEL_SPACING) + SYMBOL_SIZE / 2,
        positions[i] * SYMBOL_SIZE + SYMBOL_SIZE / 2
      );
    }

    this.winLineGraphics.stroke({ width: 4, color, alpha: 0.8 });
  }

  highlightSymbols(reelIndex: number, rowIndex: number): void {
    const reel = this.reels[reelIndex];
    if (!reel) return;

    const container = reel.children[rowIndex + 1] as Container; // +1 for offset
    if (!container) return;

    // Add glow effect
    const colorFilter = new ColorMatrixFilter();
    colorFilter.brightness(1.3, false);
    container.filters = [colorFilter];
  }

  clearHighlights(): void {
    for (const reel of this.reels) {
      for (const child of reel.children) {
        (child as Container).filters = [];
      }
    }
    this.winLineGraphics?.clear();
  }

  private update(ticker: Ticker): void {
    const delta = ticker.deltaTime;

    // Update background particles
    if (this.backgroundContainer) {
      for (const child of this.backgroundContainer.children) {
        if ((child as any).vy !== undefined) {
          child.y += (child as any).vy * delta;
          if (child.y < -10) {
            child.y = (this.app?.screen.height || 600) + 10;
            child.x = Math.random() * (this.app?.screen.width || 800);
          }
          // Twinkle
          child.alpha = (child as any).baseAlpha * (0.5 + Math.sin(Date.now() / 1000 + child.x) * 0.5);
        }
      }
    }

    // Update reels
    if (this.isSpinning) {
      let allStopped = true;

      for (let i = 0; i < REEL_COUNT; i++) {
        if (this.reelSpeeds[i] > 0) {
          allStopped = false;

          // Move reel
          this.reelPositions[i] += this.reelSpeeds[i] * delta;

          // Wrap symbols
          const reel = this.reels[i];
          for (const child of reel.children) {
            (child as Container).y =
              ((child as Container).y + this.reelSpeeds[i] * delta) %
              ((VISIBLE_SYMBOLS + 2) * SYMBOL_SIZE);

            if ((child as Container).y < 0) {
              (child as Container).y += (VISIBLE_SYMBOLS + 2) * SYMBOL_SIZE;
            }
          }

          // Slow down if stopping
          if (this.stoppingReels[i]) {
            this.reelSpeeds[i] *= 0.92;

            if (this.reelSpeeds[i] < 1) {
              this.reelSpeeds[i] = 0;

              // Snap to position with bounce
              this.snapReel(i);
            }
          }
        }
      }

      if (allStopped) {
        this.isSpinning = false;
        this.onSpinComplete?.();
        this.onSpinComplete = null;
      }
    }
  }

  private snapReel(reelIndex: number): void {
    const reel = this.reels[reelIndex];

    // Align symbols to grid
    for (let j = 0; j < reel.children.length; j++) {
      const container = reel.children[j] as Container;
      const targetY = (j - 1) * SYMBOL_SIZE;

      // Animate snap
      const startY = container.y;
      const bounceY = targetY - STOP_BOUNCE;

      let progress = 0;
      const animate = () => {
        progress += 0.1;
        if (progress >= 1) {
          container.y = targetY;
          return;
        }

        // Bounce easing
        const t = progress;
        const bounce = t < 0.5
          ? bounceY + (targetY - bounceY) * (t * 2)
          : targetY + STOP_BOUNCE * Math.sin((t - 0.5) * Math.PI * 2) * (1 - t);

        container.y = bounce;
        requestAnimationFrame(animate);
      };

      animate();
    }
  }

  resize(width: number, height: number): void {
    if (!this.app) return;

    this.app.renderer.resize(width, height);

    // Recenter reels
    if (this.reelContainer) {
      this.reelContainer.x = (width - (REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING)) / 2;
      this.reelContainer.y = (height - VISIBLE_SYMBOLS * SYMBOL_SIZE) / 2;
    }
  }

  dispose(): void {
    this.app?.destroy(true, { children: true, texture: true });
    this.app = null;
    this.reelContainer = null;
    this.reels = [];
    this.symbolTexts = [];
  }
}
