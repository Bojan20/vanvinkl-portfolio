"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "11+", label: "Years Experience", suffix: "" },
  { value: "478", label: "Projects Completed", suffix: "+" },
  { value: "350", label: "Happy Clients", suffix: "+" },
  { value: "200", label: "Repeated Clients", suffix: "+" },
];

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const textY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  useGSAP(() => {
    // Animate stats on scroll
    gsap.utils.toArray<HTMLElement>(".stat-item").forEach((stat, i) => {
      gsap.fromTo(
        stat,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: stat,
            start: "top 85%",
          },
          delay: i * 0.1,
        }
      );
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-32 overflow-hidden"
      style={{ position: "relative" }}
    >
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image/Visual side */}
          <motion.div
            ref={imageRef}
            className="relative"
            style={{ y: imageY }}
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Animated background circles */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-[var(--color-accent)] rounded-full opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-[var(--color-freq-high)] rounded-full opacity-30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border border-[var(--color-freq-peak)] rounded-full opacity-40" />
              </motion.div>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-64 h-64 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-8xl">🧙‍♂️</span>
                </motion.div>
              </div>

              {/* Audio waveform decoration */}
              <svg
                className="about-waveform absolute -bottom-8 left-0 right-0 h-16"
                viewBox="0 0 400 50"
              >
                <path
                  d="M0 25 Q50 5 100 25 T200 25 T300 25 T400 25"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  opacity="0.5"
                />
              </svg>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div style={{ y: textY }}>
            <motion.span
              className="text-sm font-mono text-[var(--color-accent)] mb-4 block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              About Me
            </motion.span>

            <h2 className="mb-8">
              <TextReveal animation="fadeUp" splitBy="words">
                Your Creative Sound Partner
              </TextReveal>
            </h2>

            <div className="space-y-6 text-[var(--color-text-secondary)]">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Since 2015, I&apos;ve been transforming ideas into compelling audio
                experiences. My approach combines technical expertise with creative
                vision to deliver sound that truly resonates.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                Whether it&apos;s crafting immersive game soundscapes, scoring
                emotional film sequences, or producing punchy commercial audio —
                I approach each project with creativity, enthusiasm, and an
                unwavering commitment to exceeding expectations.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-[var(--color-accent)] font-medium"
              >
                I&apos;m your friendly sound wizard, ready to elevate your project.
              </motion.p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, i) => (
                <div key={i} className="stat-item text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[var(--color-accent)] mb-1">
                    {stat.value}
                    <span className="text-[var(--color-freq-peak)]">{stat.suffix}</span>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
