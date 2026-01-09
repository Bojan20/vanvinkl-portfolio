"use client";

import { useState, useEffect } from "react";

interface OnboardingTutorialProps {
  onComplete: () => void;
  isTouchDevice: boolean;
}

const STEPS = [
  {
    title: "Welcome to VanVinkl Casino Lounge",
    description: "An interactive portfolio experience. Explore the lounge and discover my work!",
    icon: "🎰",
  },
  {
    title: "Move Around",
    description: "Use WASD or arrow keys to walk around the casino floor.",
    descriptionTouch: "Use the joystick on the left to move around.",
    icon: "🚶",
    keys: ["W", "A", "S", "D"],
    keysTouch: ["Joystick"],
  },
  {
    title: "Interact with Machines",
    description: "Walk up to a slot machine and press E or Space to interact.",
    descriptionTouch: "Walk up to a slot machine and tap the action button.",
    icon: "🎮",
    keys: ["E"],
    keysTouch: ["TAP"],
  },
  {
    title: "Explore Sections",
    description: "Each machine reveals a different section: Services, Projects, About, Contact, and Showreel.",
    icon: "✨",
  },
  {
    title: "Ready to Explore!",
    description: "Press ? anytime for help. Now go explore and have fun!",
    descriptionTouch: "Tap the ? button anytime for help. Now go explore!",
    icon: "🎉",
  },
];

export function OnboardingTutorial({ onComplete, isTouchDevice }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsExiting(true);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  };

  // Allow keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        handleNext();
      }
      if (e.code === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
        opacity: isExiting ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Progress dots */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className="transition-all duration-300"
            style={{
              width: index === currentStep ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: index <= currentStep
                ? "linear-gradient(90deg, #ff7a3b 0%, #ffdd40 100%)"
                : "rgba(255,255,255,0.2)",
              boxShadow: index === currentStep
                ? "0 0 12px rgba(255,122,59,0.5)"
                : "none",
            }}
          />
        ))}
      </div>

      {/* Content card */}
      <div
        className="max-w-lg w-full mx-4 p-8 rounded-3xl text-center"
        style={{
          background: "linear-gradient(180deg, #0a0a12 0%, #12121a 100%)",
          border: "2px solid rgba(255,122,59,0.4)",
          boxShadow: "0 0 80px rgba(255,122,59,0.2), 0 30px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Icon */}
        <div
          className="text-6xl mb-6"
          style={{
            animation: "bounce 1s ease-in-out infinite",
          }}
        >
          {step.icon}
        </div>

        {/* Title */}
        <h2
          className="text-2xl sm:text-3xl font-bold mb-4 tracking-wider"
          style={{
            color: "#ff7a3b",
            fontFamily: "var(--font-orbitron), monospace",
            textShadow: "0 0 30px rgba(255,122,59,0.5)",
          }}
        >
          {step.title}
        </h2>

        {/* Description */}
        <p
          className="text-base sm:text-lg mb-6 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {isTouchDevice && step.descriptionTouch
            ? step.descriptionTouch
            : step.description}
        </p>

        {/* Keys visualization */}
        {(isTouchDevice ? step.keysTouch : step.keys) && (
          <div className="flex justify-center gap-2 mb-6">
            {(isTouchDevice ? step.keysTouch : step.keys)?.map((key, index) => (
              <kbd
                key={index}
                className="px-4 py-2 rounded-xl text-lg font-mono font-bold"
                style={{
                  background: "linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)",
                  border: "2px solid rgba(255,122,59,0.5)",
                  color: "#ff7a3b",
                  boxShadow: "0 4px 0 rgba(0,0,0,0.3), 0 0 20px rgba(255,122,59,0.2)",
                  minWidth: 50,
                }}
              >
                {key}
              </kbd>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-xl text-lg font-bold uppercase tracking-wider transition-all hover:scale-105"
            style={{
              background: "linear-gradient(180deg, #ff7a3b 0%, #cc5a1b 100%)",
              color: "#fff",
              boxShadow: "0 4px 0 #993d10, 0 0 30px rgba(255,122,59,0.4)",
              fontFamily: "var(--font-orbitron), monospace",
            }}
          >
            {isLastStep ? "Let's Go!" : "Next"}
          </button>
        </div>
      </div>

      {/* Skip hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Press <kbd className="px-2 py-1 rounded bg-white/10 font-mono mx-1">Enter</kbd> to continue
        or <kbd className="px-2 py-1 rounded bg-white/10 font-mono mx-1">ESC</kbd> to skip
      </div>

      {/* Bounce animation */}
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
