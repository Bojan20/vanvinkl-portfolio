'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useHaptic } from '@/hooks/useHaptic'

interface CinematicIntroProps {
  onComplete: () => void
  skipEnabled?: boolean
}

export function CinematicIntro({ onComplete, skipEnabled = true }: CinematicIntroProps) {
  const controls = useAnimation()
  const [step, setStep] = useState(0)
  const { haptic } = useHaptic()

  useEffect(() => {
    const sequence = async () => {
      // Step 0: Black screen (0-0.5s)
      await new Promise(r => setTimeout(r, 500))

      // Step 1: Fade in from black (0.5-1.5s)
      await controls.start({
        opacity: [0, 1],
        transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
      })
      setStep(1)
      haptic('light')

      // Step 2: Show logo (1.5-3.5s)
      await new Promise(r => setTimeout(r, 2000))
      setStep(2)
      haptic('medium')

      // Step 3: Pulse effect (3.5-4.5s)
      await new Promise(r => setTimeout(r, 1000))
      setStep(3)

      // Step 4: Explode into particles (4.5-6s)
      await new Promise(r => setTimeout(r, 1500))
      setStep(4)
      haptic('heavy')

      // Step 5: Fade to casino (6-7s)
      await new Promise(r => setTimeout(r, 1500))

      onComplete()
    }

    sequence()
  }, [controls, onComplete, haptic])

  const handleSkip = () => {
    haptic('selection')
    onComplete()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      animate={controls}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* Skip button */}
      {skipEnabled && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          onClick={handleSkip}
          className="absolute top-8 right-8 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm font-medium z-10"
        >
          SKIP
        </motion.button>
      )}

      {/* Step 1: Logo entrance */}
      {step === 1 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.h1
            className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              backgroundSize: '200% 100%'
            }}
          >
            VANVINKL
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl text-orange-400 mt-6 tracking-[0.3em] font-medium"
          >
            CASINO LOUNGE
          </motion.p>
        </motion.div>
      )}

      {/* Step 2: Pulsing emblem */}
      {step === 2 && (
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <motion.div
            className="text-9xl"
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            🎰
          </motion.div>

          {/* Concentric glow rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-orange-500/30"
              style={{
                width: '150%',
                height: '150%',
                left: '-25%',
                top: '-25%'
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Step 3: Intense pulse */}
      {step === 3 && (
        <motion.div
          animate={{
            scale: [1, 1.5, 0.8, 1.2],
            opacity: [1, 0.8, 1, 0.9]
          }}
          transition={{
            duration: 0.5,
            times: [0, 0.3, 0.6, 1]
          }}
          className="text-9xl relative"
        >
          🎰
          <motion.div
            className="absolute inset-0"
            animate={{
              boxShadow: [
                '0 0 0px rgba(255,122,59,0)',
                '0 0 200px rgba(255,122,59,1)',
                '0 0 400px rgba(255,122,59,0.5)',
                '0 0 0px rgba(255,122,59,0)'
              ]
            }}
            transition={{
              duration: 0.5
            }}
          />
        </motion.div>
      )}

      {/* Step 4: Particle explosion */}
      {step === 4 && (
        <div className="relative w-full h-full">
          {/* Radial particle burst */}
          {Array.from({ length: 80 }).map((_, i) => {
            const angle = (i / 80) * Math.PI * 2
            const radius = 50
            const endX = Math.cos(angle) * radius
            const endY = Math.sin(angle) * radius

            return (
              <motion.div
                key={i}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 1,
                  opacity: 1
                }}
                animate={{
                  x: `calc(50vw + ${endX}vw)`,
                  y: `calc(50vh + ${endY}vh)`,
                  scale: 0,
                  opacity: 0
                }}
                transition={{
                  duration: 1.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.random() * 0.3
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i % 3 === 0
                    ? '#ff7a3b'
                    : i % 3 === 1
                    ? '#40c8ff'
                    : '#40ff90'
                }}
              />
            )
          })}

          {/* Center flash */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white"
            animate={{
              scale: [0, 4],
              opacity: [1, 0]
            }}
            transition={{
              duration: 1,
              ease: 'easeOut'
            }}
          />
        </div>
      )}

      {/* Ambient particle background (all steps) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
