'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingFlowProps {
  onComplete: () => void
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to VanVinkl',
    description: 'Explore my creative portfolio in a unique 3D Vegas-style experience',
    icon: '🎰',
    mobileDescription: 'Use the joystick to explore my portfolio'
  },
  {
    title: 'Navigate the Lounge',
    description: 'Use WASD or arrow keys to walk through the casino',
    icon: '🎮',
    mobileDescription: 'Drag the joystick in any direction to move'
  },
  {
    title: 'Discover My Work',
    description: 'Walk close to a slot machine and press SPACE to view details',
    icon: '✨',
    mobileDescription: 'Approach a machine and tap the golden button to interact'
  }
]

// Check if this is user's first visit
export function isFirstVisit(): boolean {
  if (typeof window === 'undefined') return true
  return !localStorage.getItem('vanvinkl-onboarding-complete')
}

// Mark onboarding as complete
export function markOnboardingComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vanvinkl-onboarding-complete', 'true')
  }
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window ||
                           navigator.maxTouchPoints > 0 ||
                           window.innerWidth < 1024
      setIsMobile(isTouchDevice)
    }
    checkMobile()
  }, [])

  // Auto-advance after 4 seconds
  useEffect(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      // Last step — auto close after 3 seconds
      const timer = setTimeout(() => {
        handleComplete()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const handleComplete = () => {
    markOnboardingComplete()
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  const step = ONBOARDING_STEPS[currentStep]
  const description = isMobile && step.mobileDescription ? step.mobileDescription : step.description

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative max-w-md mx-4"
        >
          {/* Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="text-6xl mb-4 text-center">{step.icon}</div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3 text-center">
              {step.title}
            </h2>

            {/* Description - adapts to device */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-8 bg-yellow-500'
                      : i < currentStep
                      ? 'w-2 bg-yellow-500/50'
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Skip Tutorial
              </button>

              <button
                onClick={() => {
                  if (currentStep < ONBOARDING_STEPS.length - 1) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    handleComplete()
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded-lg transition-colors"
              >
                {currentStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Start Exploring'}
              </button>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl -z-10" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
