"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Stagger animation for decorative elements
  useGSAP(() => {
    gsap.fromTo(
      ".hero-line",
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.5,
        ease: "power4.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
        },
      }
    );
  }, []);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-deepest)] to-[var(--color-bg-deepest)] opacity-60 z-10" />

      {/* Decorative lines */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="hero-line absolute h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-20"
            style={{
              top: `${20 + i * 15}%`,
              left: 0,
              right: 0,
              transformOrigin: "left",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        ref={textRef}
        className="container relative z-20 text-center"
        style={{ y, opacity, scale }}
      >
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-2 text-sm font-mono text-[var(--color-accent)] border border-[var(--color-accent)] rounded-full opacity-80">
            Sound Wizard
          </span>
        </motion.div>

        {/* Main headline */}
        <h1 className="mb-8">
          <TextReveal
            className="block"
            animation="wave"
            splitBy="chars"
            delay={0.4}
          >
            Turning Sounds
          </TextReveal>
          <TextReveal
            className="block"
            animation="wave"
            splitBy="chars"
            delay={0.6}
          >
            into Vibrant
          </TextReveal>
          <TextReveal
            className="block gradient-text"
            animation="wave"
            splitBy="chars"
            delay={0.8}
          >
            Conversations
          </TextReveal>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--color-text-secondary)] mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          I&apos;m your friendly sound wizard. Let me elevate your project to new heights
          with professional audio production and sound design.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <MagneticButton href="#projects" className="btn btn-primary">
            <span>See Projects</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </MagneticButton>

          <MagneticButton href="#contact" className="btn btn-outline">
            <span>Let&apos;s Talk</span>
          </MagneticButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 cursor-pointer"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
              Scroll
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="1"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Audio visualizer decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10">
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#40c8ff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ff7a3b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#40ff90" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 Q360,0 720,50 T1440,50 V100 H0 Z"
            fill="url(#waveGradient)"
            initial={{ d: "M0,80 Q360,80 720,80 T1440,80 V100 H0 Z" }}
            animate={{
              d: [
                "M0,50 Q360,20 720,50 T1440,50 V100 H0 Z",
                "M0,50 Q360,80 720,50 T1440,50 V100 H0 Z",
                "M0,50 Q360,20 720,50 T1440,50 V100 H0 Z",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </section>
  );
}
