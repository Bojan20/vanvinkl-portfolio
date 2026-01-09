"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextReveal } from "@/components/ui/TextReveal";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    id: 1,
    title: "WW2 Game Music",
    category: "Game Audio",
    image: "/images/project-1.jpg",
    color: "#ff7a3b",
  },
  {
    id: 2,
    title: "Mystic Horizons",
    category: "Film Score",
    image: "/images/project-2.jpg",
    color: "#40c8ff",
  },
  {
    id: 3,
    title: "Pixel Fusion",
    category: "Sound Design",
    image: "/images/project-3.jpg",
    color: "#40ff90",
  },
  {
    id: 4,
    title: "Techno Pulse",
    category: "Music Production",
    image: "/images/project-4.jpg",
    color: "#ff4060",
  },
  {
    id: 5,
    title: "EcoExplorer",
    category: "Documentary",
    image: "/images/project-5.jpg",
    color: "#40ff90",
  },
  {
    id: 6,
    title: "Urban Uplift",
    category: "Commercial",
    image: "/images/project-6.jpg",
    color: "#ff9040",
  },
];

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current || !scrollRef.current) return;

    const scrollWidth = scrollRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;

    const tween = gsap.to(scrollRef.current, {
      x: -(scrollWidth - viewportWidth),
      ease: "none",
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top top",
        end: () => `+=${scrollWidth - viewportWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative">
      {/* Section header */}
      <div className="container py-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.span
              className="text-sm font-mono text-[var(--color-accent)] mb-4 block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Featured Work
            </motion.span>
            <h2>
              <TextReveal animation="slideUp" splitBy="words">
                Selected Projects
              </TextReveal>
            </h2>
          </div>
          <motion.p
            className="max-w-md text-[var(--color-text-secondary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            A curated collection of audio work spanning game soundtracks, film scores,
            and commercial productions.
          </motion.p>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div ref={triggerRef} className="h-screen">
        <div
          ref={scrollRef}
          className="flex items-center h-full gap-8 pl-[10vw]"
        >
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}

          {/* End card */}
          <div className="flex-shrink-0 w-[40vw] h-[60vh] flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl mb-4">Want to see more?</h3>
              <a
                href="#contact"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                Let&apos;s Talk
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
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    category: string;
    image: string;
    color: string;
  };
  index: number;
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  };

  return (
    <motion.div
      ref={cardRef}
      className="project-card flex-shrink-0 w-[50vw] md:w-[35vw] h-[60vh] relative group cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.3s ease-out" }}
    >
      {/* Card background */}
      <div
        className="absolute inset-0 rounded-[var(--radius-xl)] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${project.color}20, var(--color-bg-surface))`,
        }}
      >
        {/* Placeholder for project image */}
        <div
          className="absolute inset-0 opacity-50 transition-opacity duration-500 group-hover:opacity-70"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${project.color}40, transparent 70%)`,
          }}
        />

        {/* Animated waveform decoration */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-32 opacity-30"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 50 Q100 20 200 50 T400 50"
            fill="none"
            stroke={project.color}
            strokeWidth="2"
            animate={{
              d: [
                "M0 50 Q100 20 200 50 T400 50",
                "M0 50 Q100 80 200 50 T400 50",
                "M0 50 Q100 20 200 50 T400 50",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
        <motion.span
          className="text-sm font-mono mb-2 opacity-60"
          style={{ color: project.color }}
        >
          {project.category}
        </motion.span>
        <h3 className="text-2xl md:text-3xl font-bold">{project.title}</h3>

        {/* Hover arrow */}
        <motion.div
          className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: project.color }}
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bg-deepest)"
            strokeWidth="2"
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </motion.div>
      </div>

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-[var(--radius-xl)] pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px ${project.color}40`,
        }}
        whileHover={{
          boxShadow: `inset 0 0 0 2px ${project.color}, 0 0 40px ${project.color}30`,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
