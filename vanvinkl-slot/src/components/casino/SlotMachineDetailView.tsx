'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SlotMachineDetailViewProps {
  machineId: string
  label: string
  onClose: () => void
}

// Portfolio content za svaku mašinu
const PORTFOLIO_CONTENT: Record<string, {
  title: string
  description: string
  details: string[]
  icon: string
}> = {
  about: {
    title: 'About VanVinkl Studio',
    description: 'Premium audio design and sound engineering for the gaming industry.',
    details: [
      '🎵 10+ years experience in game audio',
      '🎮 Specialized in slot machine sound design',
      '🏆 Award-winning audio productions',
      '🔊 AAA quality standards',
      '💎 Unique sonic branding',
    ],
    icon: '👤'
  },
  services: {
    title: 'Audio Services',
    description: 'Comprehensive audio solutions for your slot games.',
    details: [
      '🎼 Custom slot machine soundtracks',
      '🔔 Winning sound effects & jingles',
      '🎯 Button clicks & UI sounds',
      '🌟 Bonus round audio design',
      '🎚️ Professional mixing & mastering',
    ],
    icon: '🎧'
  },
  projects: {
    title: 'Featured Projects',
    description: 'Selected work from top-tier casino game clients.',
    details: [
      '🎰 "Golden Sphinx" - Egyptian themed slot',
      '💰 "Mega Fortune" - Progressive jackpot',
      '🍀 "Lucky Clover" - Irish folklore slot',
      '🐉 "Dragon\'s Hoard" - Asian fantasy',
      '🌊 "Ocean Treasures" - Underwater adventure',
    ],
    icon: '🎬'
  },
  skills: {
    title: 'Technical Skills',
    description: 'Cutting-edge tools and techniques for audio excellence.',
    details: [
      '🎹 Cubase Pro / Logic Pro X',
      '🔊 iZotope RX / FabFilter suite',
      '🎚️ Wwise / FMOD integration',
      '🖥️ DSP programming (Rust/C++)',
      '📊 Audio analytics & optimization',
    ],
    icon: '⚙️'
  },
  experience: {
    title: 'Experience',
    description: 'Trusted by leading casino game developers worldwide.',
    details: [
      '🏢 Senior Audio Designer at NetEnt (2018-2021)',
      '🎮 Lead Sound Engineer at Pragmatic Play (2021-2023)',
      '🎵 Freelance Audio Director (2023-present)',
      '🎓 Audio Engineering Degree - Berklee',
      '🌍 Worked with 50+ international clients',
    ],
    icon: '💼'
  },
  contact: {
    title: 'Get In Touch',
    description: 'Let\'s create something amazing together!',
    details: [
      '📧 Email: hello@vanvinkl.studio',
      '🌐 Website: vanvinkl.studio',
      '💬 Discord: VanVinkl#1234',
      '📱 WhatsApp: +1 (555) 123-4567',
      '🔗 LinkedIn: /in/vanvinkl-audio',
    ],
    icon: '📬'
  }
}

// Reel symbols for animation
const SYMBOLS = ['🍒', '💎', '⭐', '🍋', '7️⃣', '🔔', '💰', '🍇']

export function SlotMachineDetailView({ machineId, label, onClose }: SlotMachineDetailViewProps) {
  const [isSpinning, setIsSpinning] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [reelSymbols, setReelSymbols] = useState([
    SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]
  ])

  const content = PORTFOLIO_CONTENT[machineId] || PORTFOLIO_CONTENT.about

  useEffect(() => {
    // Spin animation
    const spinInterval = setInterval(() => {
      if (isSpinning) {
        setReelSymbols([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ])
      }
    }, 100)

    // Stop spinning after 2 seconds
    const stopTimer = setTimeout(() => {
      setIsSpinning(false)
      setReelSymbols([content.icon, content.icon, content.icon])

      // Show content after reels stop
      setTimeout(() => {
        setShowContent(true)
      }, 500)
    }, 2000)

    return () => {
      clearInterval(spinInterval)
      clearTimeout(stopTimer)
    }
  }, [content.icon, isSpinning])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-2xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radial gradient spotlight */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-orange-500/5 via-transparent to-transparent"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Close button - Premium style */}
      <motion.button
        onClick={onClose}
        className="absolute top-8 right-8 px-8 py-4 bg-gradient-to-r from-red-900/80 to-red-950/80 backdrop-blur-lg border-2 border-yellow-500/50 rounded-2xl text-yellow-400 text-base font-black hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all group"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">✕</span>
          <span>ESC TO CLOSE</span>
        </span>
      </motion.button>

      <div className="max-w-5xl w-full mx-8 relative">
        {/* Premium machine header with spinning reels */}
        <motion.div
          className="relative bg-gradient-to-br from-red-950 via-red-900 to-orange-950 rounded-t-[2.5rem] p-12 border-4 border-yellow-500/60 shadow-[0_0_60px_rgba(234,179,8,0.2)]"
          initial={{ y: -100, opacity: 0, rotateX: 20 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-yellow-400/50 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-yellow-400/50 rounded-tr-xl" />

          {/* Title with premium styling */}
          <motion.h1
            className="text-6xl font-black text-center mb-12 bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent"
            style={{
              textShadow: "0 0 40px rgba(234, 179, 8, 0.5)",
              letterSpacing: "0.1em"
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {label.toUpperCase()}
          </motion.h1>

          {/* Premium spinning reels with glassmorphism */}
          <div className="flex justify-center gap-6 mb-12">
            {reelSymbols.map((symbol, i) => (
              <motion.div
                key={i}
                className="relative w-40 h-40 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl rounded-2xl border-4 border-yellow-500/40 flex items-center justify-center text-8xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                animate={isSpinning ? {
                  y: [0, -15, 0],
                  scale: [1, 1.15, 1],
                  rotateY: [0, 5, 0]
                } : {
                  scale: [1, 1.1, 1]
                }}
                transition={isSpinning ? {
                  duration: 0.15,
                  repeat: Infinity,
                  delay: i * 0.08
                } : {
                  duration: 0.6,
                  delay: i * 0.1
                }}
                style={{
                  boxShadow: isSpinning
                    ? "0 0 40px rgba(234, 179, 8, 0.4)"
                    : "0 0 60px rgba(74, 222, 128, 0.5)"
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl" />

                {/* Symbol */}
                <motion.span
                  animate={!isSpinning ? {
                    scale: [1, 1.2, 1],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.2
                  }}
                >
                  {symbol}
                </motion.span>

                {/* Shine effect */}
                {!isSpinning && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-2xl"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.5,
                      delay: 2 + i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Premium spinning status */}
          <AnimatePresence mode="wait">
            {isSpinning ? (
              <motion.div
                key="spinning"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-yellow-400 text-3xl font-black mb-2">
                  SPINNING...
                </p>
                <motion.div
                  className="w-48 h-2 mx-auto bg-black/50 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="win"
                className="text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-5xl font-black mb-2 bg-gradient-to-r from-green-300 via-green-400 to-emerald-400 bg-clip-text text-transparent"
                  style={{
                    textShadow: "0 0 40px rgba(74, 222, 128, 0.6)"
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                >
                  ★ JACKPOT! ★
                </motion.p>
                <p className="text-green-400 text-xl font-bold tracking-widest">
                  PORTFOLIO UNLOCKED
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Premium content area */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="relative bg-gradient-to-b from-gray-950 via-black to-gray-950 rounded-b-[2.5rem] p-12 border-4 border-t-0 border-yellow-500/60 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {/* Decorative bottom corners */}
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-yellow-400/50 rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-yellow-400/50 rounded-br-xl" />

              {/* Content title */}
              <motion.h2
                className="text-5xl font-black text-white mb-6"
                style={{
                  textShadow: "0 4px 20px rgba(255,255,255,0.1)"
                }}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {content.title}
              </motion.h2>

              {/* Description with gradient border */}
              <motion.div
                className="relative p-6 mb-8 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl border-2 border-yellow-500/30"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-2xl text-gray-200 leading-relaxed">
                  {content.description}
                </p>
              </motion.div>

              {/* Premium detail cards */}
              <div className="space-y-4">
                {content.details.map((detail, i) => (
                  <motion.div
                    key={i}
                    className="group relative bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-xl border-2 border-white/10 rounded-2xl p-6 hover:border-yellow-500/50 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 transition-all duration-300 overflow-hidden"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 * i }}
                    whileHover={{
                      scale: 1.03,
                      x: 10,
                      boxShadow: "0 10px 40px rgba(234, 179, 8, 0.2)"
                    }}
                  >
                    {/* Shine effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />

                    <p className="relative text-xl text-white font-medium leading-relaxed">
                      {detail}
                    </p>

                    {/* Hover accent */}
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Premium CTA button for contact */}
              {machineId === 'contact' && (
                <motion.button
                  className="relative mt-12 w-full py-8 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 rounded-3xl text-black text-3xl font-black shadow-[0_10px_60px_rgba(251,146,60,0.4)] overflow-hidden group"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 80px rgba(251,146,60,0.6)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  {/* Animated background shine */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  />

                  <span className="relative flex items-center justify-center gap-4">
                    <span>START A PROJECT</span>
                    <motion.span
                      animate={{ x: [0, 10, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5
                      }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
