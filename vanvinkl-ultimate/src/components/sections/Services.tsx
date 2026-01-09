"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextReveal } from "@/components/ui/TextReveal";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    id: 1,
    phase: "01",
    title: "Pre-Production",
    description:
      "Planning, idea refinement, budgeting, schedule creation, and logistical organization for your audio project.",
    icon: "🎯",
    features: ["Creative Consultation", "Project Planning", "Budget Management"],
  },
  {
    id: 2,
    phase: "02",
    title: "Production",
    description:
      "Where plans spring to life with professional recording, sound design, and music composition.",
    icon: "🎙️",
    features: ["Sound Recording", "Music Composition", "Foley & SFX"],
  },
  {
    id: 3,
    phase: "03",
    title: "Post-Production",
    description:
      "Raw content transforms into refined state through mixing, mastering, and final audio polish.",
    icon: "🎚️",
    features: ["Mixing & Mastering", "Audio Editing", "Final Delivery"],
  },
];

const categories = [
  "Corporate Videos",
  "Documentaries",
  "Entertainment",
  "Commercials",
  "Shorts & Reels",
  "Event & Live",
  "Animation & VFX",
  "Game Audio",
];

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>(".service-card");

    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        {
          y: 100,
          opacity: 0,
          rotateX: -15,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)] rounded-full blur-[150px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-freq-high)] rounded-full blur-[150px] opacity-10" />
      </motion.div>

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            className="text-sm font-mono text-[var(--color-accent)] mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            What I Do
          </motion.span>
          <h2 className="mb-6">
            <TextReveal animation="fadeUp" splitBy="words">
              From Concept To Completion
            </TextReveal>
          </h2>
          <motion.p
            className="text-lg text-[var(--color-text-secondary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            I&apos;ve got you covered at every stage of your audio journey
          </motion.p>
        </div>

        {/* Service cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
          style={{ perspective: "1000px" }}
        >
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Categories marquee */}
        <div className="relative overflow-hidden py-8">
          <motion.div
            className="flex gap-8"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...categories, ...categories].map((category, i) => (
              <span
                key={i}
                className="text-2xl md:text-4xl font-bold whitespace-nowrap text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-default"
              >
                {category}
                <span className="mx-8 text-[var(--color-accent)]">•</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  service: {
    id: number;
    phase: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
  };
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS custom properties for gradient follow
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      className="service-card group relative"
      onMouseMove={handleMouseMove}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-full p-8 rounded-[var(--radius-xl)] bg-[var(--color-bg-surface)] border border-white/5 overflow-hidden">
        {/* Hover gradient */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--color-accent-glow), transparent 40%)",
          }}
        />

        {/* Phase number */}
        <div className="relative z-10">
          <span className="text-6xl font-bold text-[var(--color-accent)] opacity-20 absolute -top-4 -right-2">
            {service.phase}
          </span>

          {/* Icon */}
          <div className="text-4xl mb-6">{service.icon}</div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-4 group-hover:text-[var(--color-accent)] transition-colors">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-[var(--color-text-secondary)] mb-6">
            {service.description}
          </p>

          {/* Features */}
          <ul className="space-y-2">
            {service.features.map((feature, i) => (
              <motion.li
                key={i}
                className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                {feature}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-[var(--color-accent)]"
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
