"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface SectionPanelProps {
  section: string | null;
  isWin: boolean;
  onClose: () => void;
}

const SECTION_CONTENT: Record<string, {
  title: string;
  subtitle: string;
  emoji: string;
  items: { title: string; description: string }[];
}> = {
  services: {
    title: "Services",
    subtitle: "Premium Audio Solutions",
    emoji: "🎵",
    items: [
      { title: "Sound Design", description: "Custom sound effects and audio assets for slot games, from spinning reels to jackpot celebrations." },
      { title: "Music Production", description: "Original compositions that capture the excitement and energy of casino gaming." },
      { title: "Voice Over", description: "Professional voice acting and narration for game tutorials and announcements." },
      { title: "Audio Implementation", description: "Wwise, FMOD, and custom engine integration for seamless audio experiences." },
    ],
  },
  projects: {
    title: "Projects",
    subtitle: "Featured Work",
    emoji: "🎮",
    items: [
      { title: "Fortune Spin Deluxe", description: "Complete audio package for 5-reel progressive slot with 50+ unique sound effects." },
      { title: "Aztec Gold Rush", description: "Immersive soundscape with authentic instruments and dynamic win celebrations." },
      { title: "Neon Vegas Nights", description: "Retro-futuristic audio design with synthwave influences and glitchy effects." },
      { title: "Dragon's Treasure", description: "Epic orchestral score with Asian-inspired elements and powerful impacts." },
    ],
  },
  about: {
    title: "About Me",
    subtitle: "Your Sound Wizard",
    emoji: "🧙",
    items: [
      { title: "11+ Years Experience", description: "Crafting audio for the gaming industry since 2015." },
      { title: "478+ Projects", description: "Completed projects across slots, casino games, and interactive media." },
      { title: "350+ Clients", description: "Trusted by studios worldwide for quality and reliability." },
      { title: "Award Winning", description: "Recognized for excellence in game audio design." },
    ],
  },
  contact: {
    title: "Contact",
    subtitle: "Let's Create Together",
    emoji: "📧",
    items: [
      { title: "Email", description: "hello@vanvinkl.com" },
      { title: "Discord", description: "VanVinkl#0001" },
      { title: "Location", description: "Available worldwide, remote collaboration" },
      { title: "Response Time", description: "Usually within 24 hours" },
    ],
  },
};

export function SectionPanel({ section, isWin, onClose }: SectionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (section && panelRef.current && contentRef.current) {
      // Panel slide in
      gsap.fromTo(
        panelRef.current,
        { y: "100%" },
        {
          y: "0%",
          duration: 0.6,
          ease: "power3.out",
        }
      );

      // Content stagger reveal
      const items = contentRef.current.querySelectorAll(".reveal-item");
      gsap.fromTo(
        items,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.3,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [section]);

  const handleClose = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        y: "100%",
        duration: 0.4,
        ease: "power3.in",
        onComplete: onClose,
      });
    }
  };

  if (!section) return null;

  const content = SECTION_CONTENT[section];
  if (!content) return null;

  return (
    <div
      ref={panelRef}
      className="section-panel overflow-auto custom-scrollbar"
      style={{ transform: "translateY(100%)" }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
        style={{
          background: "var(--bg-elevated)",
          border: "2px solid var(--bg-surface)",
        }}
      >
        ✕
      </button>

      {/* Back to spin button */}
      <button
        onClick={handleClose}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-full font-bold transition-all hover:scale-105"
        style={{
          background: "var(--accent)",
          color: "black",
        }}
      >
        ↻ SPIN AGAIN
      </button>

      {/* Content */}
      <div ref={contentRef} className="max-w-4xl mx-auto px-6 py-20">
        {/* Win celebration */}
        {isWin && (
          <div className="reveal-item text-center mb-8">
            <div
              className="inline-block px-6 py-2 rounded-full text-lg font-bold win-flash"
              style={{
                background: "var(--freq-mid)",
                color: "black",
                boxShadow: "var(--glow-green)",
              }}
            >
              🎰 JACKPOT! 🎰
            </div>
          </div>
        )}

        {/* Header */}
        <div className="reveal-item text-center mb-16">
          <span className="text-7xl mb-4 block">{content.emoji}</span>
          <h2
            className="text-5xl font-bold mb-2"
            style={{ color: "var(--accent)" }}
          >
            {content.title}
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>{content.subtitle}</p>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.items.map((item, i) => (
            <div
              key={i}
              className="reveal-item info-panel rounded-2xl p-6 transition-all hover:scale-[1.02]"
              style={{
                borderColor: isWin ? "var(--freq-mid)" : "var(--bg-surface)",
              }}
            >
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Audio visualizer decoration */}
        <div className="reveal-item flex justify-center items-end gap-1 h-16 mt-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="visualizer-bar animate-pulse"
              style={{
                width: 4,
                height: 10 + Math.random() * 40,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
