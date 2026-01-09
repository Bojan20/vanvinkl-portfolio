"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSlotAudio } from "@/hooks/useSlotAudio";

interface SlotContentScreenProps {
  section: string;
  isWin: boolean;
  onClose: () => void;
}

// Section-specific content
const SECTION_CONTENT: Record<string, {
  title: string;
  subtitle: string;
  color: string;
  items: {
    icon: string;
    title: string;
    description: string;
    url?: string;
  }[];
  cta: {
    label: string;
    sublabel: string;
    url: string;
    isExternal?: boolean;
  };
}> = {
  services: {
    title: "SERVICES",
    subtitle: "Premium Slot Game Audio",
    color: "#ff7a3b",
    items: [
      {
        icon: "🎵",
        title: "Sound Effects",
        description: "Spins, wins, bonuses, UI feedback — every sound that makes slots addictive",
      },
      {
        icon: "🎼",
        title: "Music & Themes",
        description: "Original compositions that set the mood — from classic Vegas to modern adventures",
      },
      {
        icon: "🎚️",
        title: "Mixing & Mastering",
        description: "Professional polish for mobile & desktop — optimized for all platforms",
      },
      {
        icon: "🔊",
        title: "Audio Integration",
        description: "Wwise, FMOD, Unity, Unreal — seamless implementation support",
      },
    ],
    cta: {
      label: "LET'S WORK TOGETHER",
      sublabel: "Get a quote for your project",
      url: "mailto:hello@vanvinkl.studio?subject=Project%20Inquiry",
    },
  },
  projects: {
    title: "PROJECTS",
    subtitle: "Featured Game Audio Work",
    color: "#40c8ff",
    items: [
      {
        icon: "🎰",
        title: "Lucky Pharaoh Slots",
        description: "500+ sound effects, full music package — 10M+ downloads",
      },
      {
        icon: "💎",
        title: "Diamond Rush Casino",
        description: "Complete audio redesign — 40% increase in session time",
      },
      {
        icon: "🎮",
        title: "Neon Vegas Experience",
        description: "Immersive 3D audio — Featured in App Store",
      },
      {
        icon: "🏆",
        title: "Jackpot Kingdom",
        description: "Award-winning sound design — Best Audio 2023",
      },
    ],
    cta: {
      label: "VIEW FULL PORTFOLIO",
      sublabel: "See all 50+ projects",
      url: "https://vanvinkl.studio/portfolio",
      isExternal: true,
    },
  },
  about: {
    title: "ABOUT",
    subtitle: "The Sound Wizard",
    color: "#a855f7",
    items: [
      {
        icon: "🧙",
        title: "10+ Years Experience",
        description: "Specializing in slot game audio since 2014",
      },
      {
        icon: "🎧",
        title: "500+ Projects Delivered",
        description: "From indie studios to major publishers",
      },
      {
        icon: "🌍",
        title: "Global Clients",
        description: "Working with teams across 20+ countries",
      },
      {
        icon: "⚡",
        title: "Fast Turnaround",
        description: "Quality sound design, delivered on time",
      },
    ],
    cta: {
      label: "READ FULL BIO",
      sublabel: "My journey in game audio",
      url: "https://vanvinkl.studio/about",
      isExternal: true,
    },
  },
  contact: {
    title: "CONTACT",
    subtitle: "Let's Create Together",
    color: "#22c55e",
    items: [
      {
        icon: "📧",
        title: "Email",
        description: "hello@vanvinkl.studio",
        url: "mailto:hello@vanvinkl.studio",
      },
      {
        icon: "💬",
        title: "Discord",
        description: "@VanVinklSound",
        url: "https://discord.com/users/vanvinklsound",
      },
      {
        icon: "🌐",
        title: "LinkedIn",
        description: "/in/vanvinkl",
        url: "https://linkedin.com/in/vanvinkl",
      },
      {
        icon: "📍",
        title: "Location",
        description: "Belgrade, Serbia (Remote Worldwide)",
      },
    ],
    cta: {
      label: "SEND MESSAGE",
      sublabel: "Response within 24 hours",
      url: "mailto:hello@vanvinkl.studio?subject=Hello%20from%20the%20Lounge!",
    },
  },
  showreel: {
    title: "SHOWREEL",
    subtitle: "Hear The Magic",
    color: "#eab308",
    items: [
      {
        icon: "▶️",
        title: "Demo Reel 2024",
        description: "3-minute highlight of best work",
        url: "https://youtube.com/watch?v=vanvinkl-showreel",
      },
      {
        icon: "🎬",
        title: "Behind The Scenes",
        description: "See how the magic is made",
        url: "https://youtube.com/watch?v=vanvinkl-bts",
      },
      {
        icon: "🎧",
        title: "Audio Samples",
        description: "Individual sound effect packs",
        url: "https://soundcloud.com/vanvinkl",
      },
      {
        icon: "🎵",
        title: "Music Tracks",
        description: "Full compositions & loops",
        url: "https://soundcloud.com/vanvinkl/sets/music",
      },
    ],
    cta: {
      label: "PLAY SHOWREEL",
      sublabel: "Turn up your speakers!",
      url: "https://youtube.com/watch?v=vanvinkl-showreel",
      isExternal: true,
    },
  },
};

export function SlotContentScreen({ section, isWin, onClose }: SlotContentScreenProps) {
  const content = SECTION_CONTENT[section] || SECTION_CONTENT.services;
  const screenRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const reelsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const scanlinesRef = useRef<HTMLDivElement>(null);

  const audio = useSlotAudio();
  const [showScanlines, setShowScanlines] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track if animation has run
  const hasAnimatedRef = useRef(false);

  // Cinematic entrance animation - runs only once on mount
  useEffect(() => {
    // Prevent re-running animation
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // Play section open sound
    audio.playSectionOpen();

    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
      gsap.set(screenRef.current, { opacity: 1 });
      gsap.set(machineRef.current, { scale: 1, y: 0, rotateX: 0 });
      gsap.set(headerRef.current, { y: 0, opacity: 1 });
      gsap.set(reelsRef.current, { scale: 1, opacity: 1 });
      gsap.set(contentRef.current, { y: 0, opacity: 1 });
      gsap.set(itemsRef.current, { x: 0, opacity: 1, scale: 1 });
      gsap.set(ctaRef.current, { y: 0, opacity: 1, scale: 1 });
      return;
    }

    const tl = gsap.timeline();

    // Initial state
    gsap.set(screenRef.current, { opacity: 0 });
    gsap.set(machineRef.current, { scale: 0.8, y: 100, rotateX: 15 });
    gsap.set(headerRef.current, { y: -50, opacity: 0 });
    gsap.set(reelsRef.current, { scale: 0, opacity: 0 });
    gsap.set(contentRef.current, { y: 50, opacity: 0 });
    gsap.set(itemsRef.current, { x: -30, opacity: 0, scale: 0.9 });
    gsap.set(ctaRef.current, { y: 30, opacity: 0, scale: 0.95 });

    // Screen flash in
    tl.to(screenRef.current, {
      opacity: 1,
      duration: 0.1,
    });

    // Machine zoom in with 3D rotation
    tl.to(machineRef.current, {
      scale: 1,
      y: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "power3.out",
    });

    // Header slide down
    tl.to(headerRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    }, "-=0.4");

    // Reels spin in
    tl.to(reelsRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: "back.out(2)",
    }, "-=0.3");

    // Content area fade in
    tl.to(contentRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    }, "-=0.2");

    // Items stagger in from left
    tl.to(itemsRef.current, {
      x: 0,
      opacity: 1,
      scale: 1,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out",
    }, "-=0.3");

    // CTA button pop
    tl.to(ctaRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    }, "-=0.2");

    // Win celebration
    if (isWin) {
      tl.to(machineRef.current, {
        boxShadow: `0 0 150px ${content.color}`,
        duration: 0.2,
        yoyo: true,
        repeat: 5,
      }, 0.5);

      // Screen shake
      tl.to(machineRef.current, {
        x: "random(-5, 5)",
        y: "random(-3, 3)",
        duration: 0.05,
        repeat: 20,
        yoyo: true,
      }, 0.5);
    }

    // Scanline flicker (skip if reduced motion)
    if (!prefersReducedMotion) {
      const flickerInterval = setInterval(() => {
        setShowScanlines(prev => Math.random() > 0.1 ? true : !prev);
      }, 100);

      return () => clearInterval(flickerInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.color, isWin, prefersReducedMotion]);

  // ESC to close with exit animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        audio.playSectionClose();
        gsap.to(machineRef.current, {
          scale: 0.9,
          y: 50,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: onClose,
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, audio]);

  const handleClose = () => {
    audio.playSectionClose();
    gsap.to(machineRef.current, {
      scale: 0.9,
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onClose,
    });
  };

  return (
    <div
      ref={screenRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: "#000",
      }}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, ${content.color}30 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 30% 80%, ${content.color}15 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 70% 80%, ${content.color}15 0%, transparent 40%),
            linear-gradient(180deg, #030305 0%, #0a0a12 50%, #050508 100%)
          `,
        }}
      />

      {/* Volumetric light rays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            conic-gradient(from 180deg at 50% 0%,
              transparent 40%,
              ${content.color}08 45%,
              ${content.color}15 50%,
              ${content.color}08 55%,
              transparent 60%
            )
          `,
          opacity: 0.5,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 3 === 0 ? content.color : i % 3 === 1 ? "#fff" : content.color,
              opacity: 0.1 + Math.random() * 0.3,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Win celebration burst */}
      {isWin && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: "50%",
                top: "30%",
                background: i % 2 === 0 ? content.color : "#ffd700",
                animation: `burst ${1 + Math.random()}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${i * 9}deg) translateY(-${100 + Math.random() * 200}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* SLOT MACHINE FRAME - FULL SCREEN */}
      <div
        ref={machineRef}
        className="absolute inset-4 md:inset-8 lg:inset-12 flex flex-col"
        style={{
          perspective: "1500px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Outer chrome frame */}
        <div
          className="relative flex-1 rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, #3a3a45 0%, #1a1a22 50%, #0a0a10 100%)`,
            boxShadow: `
              0 0 0 2px rgba(255,255,255,0.1),
              0 0 100px ${content.color}50,
              0 50px 100px rgba(0,0,0,0.8),
              inset 0 1px 0 rgba(255,255,255,0.2),
              inset 0 -1px 0 rgba(0,0,0,0.5)
            `,
            border: `3px solid ${content.color}40`,
          }}
        >
          {/* Chrome trim top */}
          <div
            className="absolute top-0 left-4 right-4 h-2"
            style={{
              background: `linear-gradient(180deg, #888 0%, #444 50%, #888 100%)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          />

          {/* Inner screen bezel */}
          <div className="absolute inset-3 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "#050508",
              boxShadow: `
                inset 0 5px 30px rgba(0,0,0,0.9),
                inset 0 0 100px rgba(0,0,0,0.5)
              `,
            }}
          >
            {/* HEADER - LED DISPLAY STYLE */}
            <div
              ref={headerRef}
              className="relative text-center py-6 px-8"
              style={{
                background: `linear-gradient(180deg, #0a0a10 0%, #12121a 100%)`,
                borderBottom: `4px solid ${content.color}`,
                boxShadow: `0 4px 30px ${content.color}40`,
              }}
            >
              {/* Win banner */}
              {isWin && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 px-8 py-2 rounded-b-xl text-lg font-bold z-10"
                  style={{
                    background: `linear-gradient(180deg, ${content.color} 0%, ${content.color}cc 100%)`,
                    color: "#000",
                    fontFamily: "var(--font-orbitron), monospace",
                    boxShadow: `0 0 40px ${content.color}, 0 5px 20px ${content.color}80`,
                    animation: "pulse 0.5s ease-in-out infinite",
                  }}
                >
                  🎰 JACKPOT! 🎰
                </div>
              )}

              <h1
                className="text-4xl md:text-6xl lg:text-7xl font-black tracking-widest mb-3"
                style={{
                  color: content.color,
                  textShadow: `
                    0 0 30px ${content.color},
                    0 0 60px ${content.color}80,
                    0 0 100px ${content.color}40,
                    0 2px 0 rgba(0,0,0,0.8)
                  `,
                  fontFamily: "var(--font-orbitron), monospace",
                }}
              >
                {content.title}
              </h1>
              <p
                className="text-lg md:text-xl text-white/50 tracking-widest uppercase"
                style={{ fontFamily: "var(--font-orbitron), monospace" }}
              >
                {content.subtitle}
              </p>

              {/* Decorative reel indicators */}
              <div ref={reelsRef} className="flex justify-center gap-4 mt-6">
                {content.items.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl md:text-4xl"
                    style={{
                      background: `linear-gradient(180deg, #0a0a12 0%, #050508 100%)`,
                      border: `2px solid ${content.color}50`,
                      boxShadow: `
                        inset 0 2px 10px rgba(0,0,0,0.8),
                        0 0 20px ${content.color}30,
                        0 4px 0 rgba(0,0,0,0.5)
                      `,
                      animation: isWin ? `bounce 0.5s ease-in-out ${i * 0.1}s infinite` : "none",
                    }}
                  >
                    {item.icon}
                  </div>
                ))}
              </div>
            </div>

            {/* CONTENT AREA - SCROLLABLE */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10"
              style={{
                background: `
                  linear-gradient(180deg,
                    rgba(${content.color === "#ff7a3b" ? "255,122,59" : content.color === "#40c8ff" ? "64,200,255" : content.color === "#a855f7" ? "168,85,247" : content.color === "#22c55e" ? "34,197,94" : "234,179,8"},0.03) 0%,
                    transparent 30%
                  )
                `,
              }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Items grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {content.items.map((item, index) => {
                    const ItemWrapper = item.url ? 'a' : 'div';
                    const itemProps = item.url ? {
                      href: item.url,
                      target: item.url.startsWith('mailto:') ? undefined : '_blank',
                      rel: item.url.startsWith('mailto:') ? undefined : 'noopener noreferrer',
                    } : {};

                    return (
                      <ItemWrapper
                        key={index}
                        {...itemProps}
                        ref={(el: HTMLElement | null) => { itemsRef.current[index] = el as HTMLDivElement; }}
                        onMouseEnter={() => audio.playHover()}
                        onClick={() => item.url && audio.playClick()}
                        className={`p-5 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] group block ${item.url ? 'cursor-pointer' : ''}`}
                        style={{
                          background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                          border: `1px solid rgba(255,255,255,0.1)`,
                          boxShadow: `
                            inset 0 1px 0 rgba(255,255,255,0.1),
                            0 10px 40px rgba(0,0,0,0.3)
                          `,
                          textDecoration: 'none',
                        }}
                      >
                        <div className="flex items-start gap-5">
                          {/* Icon with glow */}
                          <div
                            className="w-16 h-16 md:w-18 md:h-18 rounded-xl flex items-center justify-center text-3xl md:text-4xl flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                            style={{
                              background: `linear-gradient(135deg, ${content.color}25 0%, ${content.color}10 100%)`,
                              border: `2px solid ${content.color}40`,
                              boxShadow: `
                                0 0 30px ${content.color}20,
                                inset 0 0 20px ${content.color}10
                              `,
                            }}
                          >
                            {item.icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1">
                            <h3
                              className="text-xl md:text-2xl font-bold mb-2 transition-colors duration-300"
                              style={{
                                color: content.color,
                                fontFamily: "var(--font-orbitron), monospace",
                                textShadow: `0 0 20px ${content.color}50`,
                              }}
                            >
                              {item.title}
                              {item.url && (
                                <span className="ml-2 text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                                  {item.url.startsWith('mailto:') ? '→' : '↗'}
                                </span>
                              )}
                            </h3>
                            <p className="text-white/60 text-sm md:text-base leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </ItemWrapper>
                    );
                  })}
                </div>

                {/* CTA BUTTON - SLOT STYLE */}
                <div className="mt-8 md:mt-10">
                  <a
                    ref={ctaRef}
                    href={content.cta.url}
                    target={content.cta.isExternal ? '_blank' : undefined}
                    rel={content.cta.isExternal ? 'noopener noreferrer' : undefined}
                    onMouseEnter={() => audio.playHover()}
                    onClick={() => audio.playClick()}
                    className="block w-full py-5 md:py-6 rounded-2xl font-bold text-xl md:text-2xl uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
                    style={{
                      background: `linear-gradient(180deg, ${content.color} 0%, ${content.color}bb 100%)`,
                      color: "#000",
                      boxShadow: `
                        0 6px 0 ${content.color}80,
                        0 10px 40px ${content.color}60,
                        inset 0 2px 0 rgba(255,255,255,0.3)
                      `,
                      fontFamily: "var(--font-orbitron), monospace",
                      textShadow: "0 1px 0 rgba(255,255,255,0.3)",
                      textDecoration: 'none',
                    }}
                  >
                    {content.cta.label}
                  </a>
                  <p
                    className="text-center mt-4 text-white/40 text-sm tracking-wide"
                    style={{ fontFamily: "var(--font-orbitron), monospace" }}
                  >
                    {content.cta.sublabel}
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER - CONTROL PANEL */}
            <div
              className="px-6 md:px-8 py-4 flex items-center justify-between"
              style={{
                background: `linear-gradient(180deg, #0a0a10 0%, #050508 100%)`,
                borderTop: `2px solid ${content.color}30`,
              }}
            >
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontFamily: "var(--font-orbitron), monospace",
                }}
              >
                ← BACK TO LOUNGE
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider"
                  style={{
                    background: `${content.color}20`,
                    color: content.color,
                    border: `1px solid ${content.color}40`,
                  }}
                >
                  ESC to close
                </div>
              </div>
            </div>
          </div>

          {/* Corner decorations */}
          {[
            { top: "8px", left: "8px" },
            { top: "8px", right: "8px" },
            { bottom: "8px", left: "8px" },
            { bottom: "8px", right: "8px" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-5 h-5 rounded-full"
              style={{
                ...pos,
                background: `radial-gradient(circle at 30% 30%, #888 0%, #333 100%)`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.5)`,
              }}
            />
          ))}

          {/* Side accent lights */}
          {[
            { top: "30%", left: "-4px" },
            { top: "30%", right: "-4px" },
            { top: "60%", left: "-4px" },
            { top: "60%", right: "-4px" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-3 h-10 rounded-full"
              style={{
                ...pos,
                background: `linear-gradient(180deg, ${content.color} 0%, ${content.color}80 100%)`,
                boxShadow: `0 0 20px ${content.color}80, 0 0 40px ${content.color}40`,
                animation: isWin ? "pulse 0.3s ease-in-out infinite" : "pulse 2s ease-in-out infinite",
              }}
            />
          ))}

          {/* Scanlines overlay */}
          <div
            ref={scanlinesRef}
            className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
            style={{
              opacity: showScanlines ? 0.03 : 0,
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.5) 2px,
                rgba(0,0,0,0.5) 4px
              )`,
              transition: "opacity 0.05s",
            }}
          />

          {/* Screen glare */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255,255,255,0.1) 0%,
                  transparent 30%,
                  transparent 70%,
                  rgba(255,255,255,0.02) 100%
                )
              `,
            }}
          />
        </div>
      </div>

      {/* AVATAR HEAD - BOTTOM */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        style={{ width: "280px", height: "180px" }}
      >
        <div className="relative w-full h-full">
          {/* Shoulders */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: "260px",
              height: "70px",
              background: `linear-gradient(180deg, #1a1a2a 0%, #0a0a15 100%)`,
              borderRadius: "130px 130px 0 0",
              boxShadow: `0 -5px 30px ${content.color}20`,
            }}
          />

          {/* Neck */}
          <div
            className="absolute bottom-[55px] left-1/2 -translate-x-1/2"
            style={{
              width: "55px",
              height: "35px",
              background: `linear-gradient(180deg, #252535 0%, #1a1a2a 100%)`,
            }}
          />

          {/* Head */}
          <div
            className="absolute bottom-[85px] left-1/2 -translate-x-1/2"
            style={{
              width: "90px",
              height: "100px",
              background: `linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)`,
              borderRadius: "45px 45px 40px 40px",
              boxShadow: `
                0 0 40px ${content.color}40,
                inset 0 -10px 30px rgba(0,0,0,0.3)
              `,
              border: `2px solid ${content.color}30`,
            }}
          >
            {/* Ears */}
            <div
              className="absolute top-1/3 -left-3"
              style={{
                width: "14px",
                height: "22px",
                background: `linear-gradient(90deg, #1a1a25 0%, #252535 100%)`,
                borderRadius: "7px",
              }}
            />
            <div
              className="absolute top-1/3 -right-3"
              style={{
                width: "14px",
                height: "22px",
                background: `linear-gradient(-90deg, #1a1a25 0%, #252535 100%)`,
                borderRadius: "7px",
              }}
            />
          </div>

          {/* Wizard hat */}
          <div
            className="absolute bottom-[180px] left-1/2 -translate-x-1/2"
            style={{
              width: "0",
              height: "0",
              borderLeft: "32px solid transparent",
              borderRight: "32px solid transparent",
              borderBottom: "55px solid #12121a",
              filter: `drop-shadow(0 0 15px ${content.color}50)`,
            }}
          />
          <div
            className="absolute bottom-[175px] left-1/2 -translate-x-1/2"
            style={{
              width: "110px",
              height: "14px",
              background: `linear-gradient(180deg, #1a1a25 0%, #12121a 100%)`,
              borderRadius: "55px",
              boxShadow: `0 2px 10px rgba(0,0,0,0.5)`,
            }}
          />

          {/* Hat glow */}
          <div
            className="absolute bottom-[190px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{
              background: content.color,
              boxShadow: `0 0 20px ${content.color}, 0 0 40px ${content.color}80`,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes burst {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0) translateY(-200px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
