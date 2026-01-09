"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ParticleEffectProps {
  trigger: "spin" | "win" | null;
}

const MAX_PARTICLES = 200;

export function ParticleEffect({ trigger }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const colors = {
    spin: ["#ff7a3b", "#ff9a5b", "#ffdd40"],
    win: ["#40ff90", "#40c8ff", "#ffdd40", "#ff7a3b"],
  };

  const createParticles = useCallback((type: "spin" | "win") => {
    // Skip particles if user prefers reduced motion
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const count = type === "win" ? 80 : 20; // Reduced for performance
    const colorSet = colors[type];

    // Limit total particles
    const availableSlots = MAX_PARTICLES - particlesRef.current.length;
    const actualCount = Math.min(count, availableSlots);

    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.PI * 2 * i) / actualCount;
      const speed = type === "win" ? 8 + Math.random() * 8 : 3 + Math.random() * 3;

      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()) - (type === "win" ? 5 : 0),
        size: type === "win" ? 4 + Math.random() * 6 : 2 + Math.random() * 3,
        color: colorSet[Math.floor(Math.random() * colorSet.length)],
        life: 1,
        maxLife: type === "win" ? 2 : 1,
      });
    }
  }, [prefersReducedMotion]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.vx *= 0.99; // friction
      p.life -= 0.02;

      if (p.life <= 0) return false;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1;

      return true;
    });

    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (trigger) {
      createParticles(trigger);
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [trigger, createParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="particles"
    />
  );
}
