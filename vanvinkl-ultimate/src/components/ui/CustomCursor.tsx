"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = "none";

    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!dot || !ring) return;

    // Mouse position
    let mouseX = 0;
    let mouseY = 0;

    // Cursor position (for smooth follow)
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
    };

    // Animation loop
    const animate = () => {
      // Smooth follow with different speeds
      dotX += (mouseX - dotX) * 0.2;
      dotY += (mouseY - dotY) * 0.2;
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;

      // Apply transforms
      dot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

      requestAnimationFrame(animate);
    };

    // Hover detection for interactive elements
    const handleElementHover = (e: Event) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("magnetic") ||
        target.closest(".magnetic");

      setIsHovering(!!isInteractive);

      if (isInteractive) {
        ring.classList.add("hover");
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
      } else {
        ring.classList.remove("hover");
        gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    };

    // Event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleElementHover);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Start animation
    animate();

    // Pulse effect on click
    const handleClick = () => {
      gsap.to(ring, {
        scale: 1.5,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(ring, { scale: 1, opacity: 0.5 });
        },
      });
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleElementHover);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      document.body.style.cursor = "auto";
    };
  }, [isVisible]);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} />
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}
