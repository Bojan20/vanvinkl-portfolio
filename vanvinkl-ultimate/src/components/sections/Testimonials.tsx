"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";

const testimonials = [
  {
    id: 1,
    name: "Sarah Adams",
    role: "Creative Director",
    company: "HorizonTech Solutions",
    quote:
      "The team was calm, patient, and fostered a pleasant atmosphere throughout the entire production process. The final audio exceeded our expectations.",
    avatar: "👩‍💼",
  },
  {
    id: 2,
    name: "Michael Lee",
    role: "Producer",
    company: "EcoGrowth Media",
    quote:
      "Outstanding experience from start to finish. The attention to detail in the sound design really brought our documentary to life.",
    avatar: "👨‍💻",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Game Director",
    company: "BrightSights Gaming",
    quote:
      "Consistently amazed by the professionalism and knowledge. The game audio elevated our project to AAA quality standards.",
    avatar: "👩‍🎨",
  },
  {
    id: 4,
    name: "David Chen",
    role: "Marketing Lead",
    company: "Nexus Brands",
    quote:
      "The commercial soundscape was exactly what we needed. It captured our brand essence perfectly and resonated with our audience.",
    avatar: "👨‍💼",
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextTestimonial = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <section className="relative py-32 overflow-hidden bg-[var(--color-bg-surface)]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            className="text-sm font-mono text-[var(--color-accent)] mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Testimonials
          </motion.span>
          <h2>
            <TextReveal animation="fadeUp" splitBy="words">
              What Clients Say
            </TextReveal>
          </h2>
        </div>

        {/* Testimonial carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative h-[400px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                }}
                className="absolute w-full"
              >
                <div className="text-center px-8">
                  {/* Avatar */}
                  <motion.div
                    className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] flex items-center justify-center text-4xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {testimonials[activeIndex].avatar}
                  </motion.div>

                  {/* Quote */}
                  <motion.blockquote
                    className="text-xl md:text-2xl text-[var(--color-text-primary)] mb-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    &ldquo;{testimonials[activeIndex].quote}&rdquo;
                  </motion.blockquote>

                  {/* Author */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="font-bold text-lg">
                      {testimonials[activeIndex].name}
                    </div>
                    <div className="text-[var(--color-text-muted)]">
                      {testimonials[activeIndex].role} at{" "}
                      <span className="text-[var(--color-accent)]">
                        {testimonials[activeIndex].company}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {/* Prev button */}
            <motion.button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full border border-[var(--color-text-muted)] flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setDirection(i > activeIndex ? 1 : -1);
                    setActiveIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeIndex
                      ? "w-8 bg-[var(--color-accent)]"
                      : "bg-[var(--color-text-muted)]"
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            {/* Next button */}
            <motion.button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full border border-[var(--color-text-muted)] flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
