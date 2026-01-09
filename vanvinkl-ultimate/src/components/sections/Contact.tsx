"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

const socialLinks = [
  { name: "Twitter", href: "#", icon: "𝕏" },
  { name: "LinkedIn", href: "#", icon: "in" },
  { name: "YouTube", href: "#", icon: "▶" },
  { name: "Instagram", href: "#", icon: "📷" },
];

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative py-32 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)] via-transparent to-transparent opacity-10" />
      </div>

      <motion.div className="container relative z-10" style={{ scale, opacity }}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Label */}
          <motion.span
            className="text-sm font-mono text-[var(--color-accent)] mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Get In Touch
          </motion.span>

          {/* Main headline */}
          <h2 className="mb-6">
            <TextReveal animation="wave" splitBy="chars">
              I&apos;m your creative
            </TextReveal>
            <TextReveal animation="wave" splitBy="chars" delay={0.3}>
              comrade!
            </TextReveal>
          </h2>

          {/* Description */}
          <motion.p
            className="text-lg text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            Ready to bring your audio vision to life? Let&apos;s collaborate and create
            something extraordinary together.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <MagneticButton
              href="mailto:hello@vanvinkl.com"
              className="btn btn-primary text-lg px-10 py-5"
              strength={0.4}
            >
              <span>Let&apos;s Collaborate</span>
              <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </motion.svg>
            </MagneticButton>
          </motion.div>

          {/* Audio visualizer decoration */}
          <motion.div
            className="flex justify-center items-end gap-1 h-16 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-[var(--color-accent)] rounded-full"
                animate={{
                  height: [
                    Math.random() * 20 + 10,
                    Math.random() * 50 + 20,
                    Math.random() * 20 + 10,
                  ],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }}
                style={{ opacity: 0.3 + (i / 20) * 0.7 }}
              />
            ))}
          </motion.div>

          {/* Social links */}
          <motion.div
            className="flex justify-center gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            {socialLinks.map((social, i) => (
              <MagneticButton
                key={social.name}
                href={social.href}
                className="w-12 h-12 rounded-full border border-[var(--color-text-muted)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all"
                strength={0.3}
              >
                <span className="text-sm font-bold">{social.icon}</span>
              </MagneticButton>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
