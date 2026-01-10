'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptic } from '@/hooks/useHaptic'

interface CasinoEntranceProps {
  onComplete: () => void
  skipEnabled?: boolean
}

export function CasinoEntrance({ onComplete, skipEnabled = true }: CasinoEntranceProps) {
  const [started, setStarted] = useState(false)
  const { haptic } = useHaptic()

  // Auto-start after brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!started) {
        handleStart()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [started])

  const handleStart = () => {
    setStarted(true)
    haptic('heavy')

    // Complete after 2.5 seconds (short WOW entrance)
    setTimeout(() => {
      onComplete()
    }, 2500)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black overflow-hidden cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      onClick={handleStart}
    >
      <AnimatePresence>
        {/* Initial "Click to Enter" button */}
        {!started && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 100px rgba(255,165,0,0.8)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="group relative px-20 py-10 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 rounded-3xl text-black text-4xl font-black shadow-2xl overflow-hidden pointer-events-auto"
              animate={{
                boxShadow: [
                  '0 0 40px rgba(255,165,0,0.4)',
                  '0 0 80px rgba(255,165,0,0.7)',
                  '0 0 40px rgba(255,165,0,0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="relative z-10 tracking-wider">ENTER LOUNGE</span>
            </motion.button>
          </motion.div>
        )}

        {/* WOW ENTRANCE - Fast & Spectacular */}
        {started && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Golden explosion from center */}
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-yellow-400 via-orange-600 to-black"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 8, opacity: [0, 1, 0.5, 0] }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Circular light rays burst */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360
              return (
                <motion.div
                  key={i}
                  className="absolute w-3 h-full bg-gradient-to-b from-yellow-300/90 via-orange-500/50 to-transparent origin-bottom"
                  style={{
                    rotate: `${angle}deg`,
                    left: '50%',
                    bottom: '50%',
                    transformOrigin: 'bottom center'
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{
                    scaleY: [0, 1.5, 1],
                    opacity: [0, 1, 0.3, 0],
                    rotate: `${angle + 180}deg`
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.02,
                    ease: 'easeOut'
                  }}
                />
              )
            })}

            {/* Cascading slot machine symbols */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(5)].map((_, ring) => (
                <div key={ring} className="absolute">
                  {[...Array(8)].map((_, i) => {
                    const radius = 100 + ring * 150
                    const angle = (i / 8) * Math.PI * 2
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius
                    const symbols = ['🎰', '🎲', '🃏', '💎', '⭐', '🎯', '🏆', '💰']

                    return (
                      <motion.div
                        key={`${ring}-${i}`}
                        className="absolute text-6xl"
                        style={{ x, y }}
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        animate={{
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0],
                          rotate: 360,
                          x: x * 2,
                          y: y * 2
                        }}
                        transition={{
                          duration: 2,
                          delay: ring * 0.15 + i * 0.05,
                          ease: 'easeOut'
                        }}
                      >
                        {symbols[i % symbols.length]}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Central "VANVINKL LOUNGE" text explosion */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2.5,
                  times: [0, 0.3, 0.7, 1],
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <motion.h1
                  className="text-[12rem] font-black leading-none"
                  style={{
                    textShadow: '0 0 60px rgba(255,165,0,0.8), 0 0 120px rgba(255,215,0,0.6)'
                  }}
                >
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-yellow-200 animate-pulse">
                    VANVINKL
                  </span>
                </motion.h1>
                <motion.p
                  className="text-4xl tracking-[0.5em] text-orange-300 font-bold mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: [0, 1, 1, 0], y: 0 }}
                  transition={{ duration: 2.5, delay: 0.2 }}
                >
                  PORTFOLIO LOUNGE
                </motion.p>
              </motion.div>
            </div>

            {/* Particles explosion */}
            {Array.from({ length: 80 }).map((_, i) => {
              const angle = (i / 80) * Math.PI * 2
              const distance = 50 + Math.random() * 500
              const x = Math.cos(angle) * distance
              const y = Math.sin(angle) * distance

              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500"
                  style={{
                    left: '50%',
                    top: '50%'
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x,
                    y,
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1.5 + Math.random() * 0.5,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut'
                  }}
                />
              )
            })}

            {/* Flash effect */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.5, times: [0, 0.1, 1] }}
            />

            {/* Bottom progress indicator */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
              <motion.div
                className="text-orange-300 text-sm tracking-[0.3em] font-bold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                LOADING EXPERIENCE
              </motion.div>
              <motion.div
                className="mt-3 w-64 h-1 bg-black/50 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip indicator (subtle) */}
      {started && skipEnabled && (
        <motion.div
          className="absolute top-8 right-8 text-white/50 text-xs tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
        >
          CLICK TO SKIP
        </motion.div>
      )}
    </motion.div>
  )
}
