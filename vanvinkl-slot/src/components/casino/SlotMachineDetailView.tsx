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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close button */}
      <motion.button
        onClick={onClose}
        className="absolute top-8 right-8 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ESC TO CLOSE
      </motion.button>

      <div className="max-w-4xl w-full mx-8">
        {/* Machine header with spinning reels */}
        <motion.div
          className="bg-gradient-to-b from-red-900 to-red-950 rounded-t-3xl p-8 border-4 border-yellow-600/50"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-black text-yellow-400 text-center mb-8">
            {label.toUpperCase()}
          </h1>

          {/* Spinning reels */}
          <div className="flex justify-center gap-4 mb-8">
            {reelSymbols.map((symbol, i) => (
              <motion.div
                key={i}
                className="w-32 h-32 bg-black/50 rounded-xl border-4 border-yellow-600/30 flex items-center justify-center text-7xl"
                animate={isSpinning ? {
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{
                  duration: 0.1,
                  repeat: isSpinning ? Infinity : 0,
                  delay: i * 0.05
                }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          {/* Spinning status */}
          <AnimatePresence mode="wait">
            {isSpinning ? (
              <motion.p
                key="spinning"
                className="text-center text-yellow-400 text-xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                SPINNING...
              </motion.p>
            ) : (
              <motion.p
                key="win"
                className="text-center text-green-400 text-2xl font-black"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                ★ WINNER! ★
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content area */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="bg-gradient-to-b from-gray-900 to-black rounded-b-3xl p-8 border-4 border-t-0 border-yellow-600/50"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                {content.title}
              </h2>

              <p className="text-xl text-gray-300 mb-6">
                {content.description}
              </p>

              <div className="space-y-3">
                {content.details.map((detail, i) => (
                  <motion.div
                    key={i}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <p className="text-lg text-white">
                      {detail}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CTA button for contact */}
              {machineId === 'contact' && (
                <motion.button
                  className="mt-8 w-full py-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl text-black text-2xl font-black shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  START A PROJECT →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
