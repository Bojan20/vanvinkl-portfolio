"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, useAnimation, Variants } from "framer-motion";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  splitBy?: "words" | "chars" | "lines";
  animation?: "fadeUp" | "slideUp" | "wave" | "glitch";
}

export function TextReveal({
  children,
  className = "",
  delay = 0,
  splitBy = "words",
  animation = "fadeUp",
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const controls = useAnimation();

  // Split text
  const splitText = (): React.ReactElement[] => {
    if (splitBy === "chars") {
      return children.split("").map((char, i) => (
        <span key={i} className="char inline-block">
          {char === " " ? "\u00A0" : char}
        </span>
      ));
    }
    // Default to words
    return children.split(" ").map((word, i) => (
      <span key={i} className="word inline-block mr-[0.25em]">
        {word}
      </span>
    ));
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: splitBy === "chars" ? 0.02 : 0.08,
        delayChildren: delay,
      },
    },
  };

  const getItemVariants = (): Variants => {
    const easeValues: [number, number, number, number] = [0.16, 1, 0.3, 1];

    switch (animation) {
      case "fadeUp":
        return {
          hidden: { opacity: 0, y: 50 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: easeValues,
            },
          },
        };
      case "slideUp":
        return {
          hidden: { y: "100%" },
          visible: {
            y: 0,
            transition: {
              duration: 0.6,
              ease: easeValues,
            },
          },
        };
      case "wave":
        return {
          hidden: { opacity: 0, y: 30, rotateX: -90 },
          visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
              duration: 0.6,
              ease: easeValues,
            },
          },
        };
      case "glitch":
        return {
          hidden: { opacity: 0, x: -20, skewX: 10 },
          visible: {
            opacity: 1,
            x: 0,
            skewX: 0,
            transition: {
              duration: 0.4,
              ease: easeValues,
            },
          },
        };
      default:
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const itemVariants = getItemVariants();

  return (
    <motion.div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      {splitBy === "lines" ? (
        <motion.span variants={itemVariants} className="block">
          {children}
        </motion.span>
      ) : (
        splitText().map((element, i) => (
          <motion.span
            key={i}
            variants={itemVariants}
            className="inline-block"
            style={{ perspective: "1000px" }}
          >
            {element}
          </motion.span>
        ))
      )}
    </motion.div>
  );
}
