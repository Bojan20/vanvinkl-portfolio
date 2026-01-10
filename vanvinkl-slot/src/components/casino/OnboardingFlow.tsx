'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingFlowProps {
  onComplete: () => void
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to the Casino Lounge',
    description: 'Explore my portfolio in a unique 3D Vegas-style experience',
    icon: '🎰'
  },
  {
    title: 'Move Around',
    description: 'Use arrow keys (↑ ↓ ← →) to walk through the casino',
    icon: '🎮'
  },
  {
    title: 'Interact with Machines',
    description: 'Walk close to a slot machine and press SPACE to view details',
    icon: '✨'
  }
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-advance after 3 seconds
  useEffect(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      // Last step — auto close after 2 seconds
      const timer = setTimeout(() => {
        handleComplete()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const handleComplete = () => {
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

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {step.description}
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
