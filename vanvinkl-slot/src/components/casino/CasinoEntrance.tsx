'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptic } from '@/hooks/useHaptic'

interface CasinoEntranceProps {
  onComplete: () => void
  skipEnabled?: boolean
}

export function CasinoEntrance({ onComplete, skipEnabled = true }: CasinoEntranceProps) {
  const [step, setStep] = useState(0)
  const { haptic } = useHaptic()

  useEffect(() => {
    const sequence = async () => {
      // Step 0: Black screen (0-0.5s)
      await new Promise(r => setTimeout(r, 500))

      // Step 1: Exterior view (0.5-2.5s)
      setStep(1)
      haptic('light')
      await new Promise(r => setTimeout(r, 2000))

      // Step 2: Doors begin to open (2.5-4s)
      setStep(2)
      haptic('medium')
      await new Promise(r => setTimeout(r, 1500))

      // Step 3: Golden light flood (4-5s)
      setStep(3)
      haptic('heavy')
      await new Promise(r => setTimeout(r, 1000))

      // Step 4: Walk through doors (5-7s)
      setStep(4)
      await new Promise(r => setTimeout(r, 2000))

      // Step 5: Fade to lounge (7-8s)
      setStep(5)
      await new Promise(r => setTimeout(r, 1000))

      // Complete
      onComplete()
    }

    sequence()
  }, [onComplete, haptic])

  const handleSkip = () => {
    haptic('selection')
    onComplete()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <AnimatePresence mode="wait">
        {/* Skip button */}
        {skipEnabled && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={handleSkip}
            className="absolute top-8 right-8 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm font-bold z-50 transition-all"
          >
            SKIP ENTRANCE
          </motion.button>
        )}

        {/* Step 1: Exterior building view */}
        {step === 1 && (
          <motion.div
            key="exterior"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900 via-red-900 to-black"
          >
            {/* Building silhouette */}
            <div className="relative w-full h-full flex items-end justify-center pb-20">
              <motion.div
                className="relative w-96 h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-t-3xl border-4 border-orange-500/50 shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 0 50px rgba(255,122,59,0.3)',
                    '0 0 100px rgba(255,122,59,0.5)',
                    '0 0 50px rgba(255,122,59,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Entrance doors (closed) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-72 bg-gradient-to-b from-orange-700 to-orange-900 rounded-t-2xl border-t-4 border-x-4 border-orange-400">
                  {/* Door handles */}
                  <div className="absolute top-1/2 left-4 w-4 h-8 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full" />
                  <div className="absolute top-1/2 right-4 w-4 h-8 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full" />
                </div>

                {/* Neon sign above door */}
                <motion.div
                  className="absolute -top-16 left-1/2 -translate-x-1/2 text-6xl font-black"
                  animate={{
                    textShadow: [
                      '0 0 20px #FFD700, 0 0 40px #FFD700',
                      '0 0 40px #FFD700, 0 0 80px #FFD700',
                      '0 0 20px #FFD700, 0 0 40px #FFD700'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500">
                    VANVINKL
                  </span>
                </motion.div>

                <motion.p
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl tracking-[0.5em] text-orange-400"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  CASINO
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Doors opening */}
        {step === 2 && (
          <motion.div
            key="doors-opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black"
          >
            <div className="relative w-full h-full flex items-center justify-center perspective-1000">
              {/* Left door */}
              <motion.div
                className="absolute w-48 h-96 bg-gradient-to-r from-orange-900 to-orange-700 border-r-4 border-orange-400 origin-left"
                style={{ transformStyle: 'preserve-3d' }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -120 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Door details */}
                <div className="absolute top-1/2 right-4 w-6 h-12 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full" />
              </motion.div>

              {/* Right door */}
              <motion.div
                className="absolute w-48 h-96 bg-gradient-to-l from-orange-900 to-orange-700 border-l-4 border-orange-400 origin-right"
                style={{ transformStyle: 'preserve-3d' }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 120 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Door details */}
                <div className="absolute top-1/2 left-4 w-6 h-12 bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full" />
              </motion.div>

              {/* Door opening sound effect text */}
              <motion.div
                className="absolute text-sm text-orange-400/50 tracking-widest"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0, 1, 0], y: 0 }}
                transition={{ duration: 1.5 }}
              >
                *CREEK*
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Golden light flood */}
        {step === 3 && (
          <motion.div
            key="light-flood"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-orange-500 via-orange-800 to-black"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Light rays */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-full bg-gradient-to-b from-yellow-400/80 via-orange-500/40 to-transparent origin-bottom"
                  style={{
                    rotate: `${angle}deg`,
                    left: '50%',
                    bottom: '50%'
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                />
              )
            })}

            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-yellow-200">
                WELCOME
              </h1>
            </motion.div>
          </motion.div>
        )}

        {/* Step 4: Walking through (first-person POV) */}
        {step === 4 && (
          <motion.div
            key="walking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          >
            {/* Tunnel vision effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black"
              initial={{ scale: 2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2, ease: 'linear' }}
            />

            {/* Approaching slot machines (motion blur) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center gap-8"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeIn' }}
            >
              {[-1, 0, 1].map((x) => (
                <motion.div
                  key={x}
                  className="text-9xl"
                  style={{ x: x * 200 }}
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🎰
                </motion.div>
              ))}
            </motion.div>

            {/* Walking motion indicators */}
            <motion.div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-orange-400 text-sm tracking-widest"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ENTERING LOUNGE...
            </motion.div>
          </motion.div>
        )}

        {/* Step 5: Final fade */}
        {step === 5 && (
          <motion.div
            key="fade"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-black"
          />
        )}
      </AnimatePresence>

      {/* Ambient sound effect text (throughout) */}
      <motion.div
        className="absolute bottom-8 left-8 text-xs text-white/30 tracking-widest font-mono"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        *AMBIENT CASINO SOUNDS*
      </motion.div>
    </motion.div>
  )
}
