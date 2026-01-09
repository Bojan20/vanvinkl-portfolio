'use client'

import { useRef, useState, useCallback } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { useHaptic } from '@/hooks/useHaptic'

export interface PhysicsSlotReelProps {
  symbols: string[]
  onStop?: (symbol: string, index: number) => void
  spinDuration?: number
  className?: string
}

export function PhysicsSlotReel({
  symbols,
  onStop,
  spinDuration = 3000,
  className = ''
}: PhysicsSlotReelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { haptic } = useHaptic()

  // Spring animation for smooth physics
  const [{ y }, api] = useSpring(() => ({
    y: 0,
    config: {
      tension: 120,
      friction: 14,
      mass: 1
    }
  }))

  const spin = useCallback(() => {
    if (isSpinning) return

    setIsSpinning(true)
    haptic('spin')

    // Phase 1: Accelerate (fast spin)
    api.start({
      y: -5000,
      config: {
        duration: 800,
        easing: (t) => t * t  // ease-in-quad
      }
    })

    // Phase 2: Decelerate and land on symbol
    setTimeout(() => {
      const targetIndex = Math.floor(Math.random() * symbols.length)
      const symbolHeight = 120  // Height of each symbol
      const extraSpins = 2  // Extra full rotations for drama
      const totalSymbols = symbols.length
      const snapPosition = -(targetIndex * symbolHeight + extraSpins * totalSymbols * symbolHeight)

      // Haptic feedback as reels stop
      haptic('medium')

      api.start({
        y: snapPosition,
        config: {
          tension: 60,
          friction: 25,
          mass: 2  // Heavy mass = slow, weighty stop
        },
        onRest: () => {
          setIsSpinning(false)
          setCurrentIndex(targetIndex)

          // Final haptic and callback
          haptic('selection')
          onStop?.(symbols[targetIndex], targetIndex)
        }
      })
    }, 800)
  }, [isSpinning, symbols, api, onStop, haptic])

  // Drag interaction (bonus feature)
  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], last, memo = y.get() }) => {
      if (isSpinning) return memo

      const newY = memo + my

      if (!last) {
        // While dragging
        api.start({
          y: newY,
          immediate: true
        })
      } else {
        // Released - apply momentum
        const symbolHeight = 120
        const nearestIndex = Math.round(-newY / symbolHeight) % symbols.length
        const snapY = -(nearestIndex * symbolHeight)

        api.start({
          y: snapY,
          config: {
            velocity: vy * 100,
            friction: 20,
            tension: 300
          },
          onRest: () => {
            setCurrentIndex(nearestIndex)
            onStop?.(symbols[nearestIndex], nearestIndex)
          }
        })

        haptic('light')
      }

      return newY
    },
    {
      from: () => [0, y.get()],
      axis: 'y'
    }
  )

  // Triple the symbols for infinite scroll illusion
  const infiniteSymbols = [...symbols, ...symbols, ...symbols]

  return (
    <div className={`relative h-[360px] overflow-hidden ${className}`}>
      {/* Reel container */}
      <animated.div
        {...bind()}
        style={{
          y,
          touchAction: 'none'
        }}
        className="flex flex-col cursor-grab active:cursor-grabbing"
      >
        {infiniteSymbols.map((symbol, i) => (
          <div
            key={i}
            className="h-[120px] flex items-center justify-center text-6xl font-black select-none"
            style={{
              textShadow: '0 0 20px rgba(255,122,59,0.8), 0 0 40px rgba(255,122,59,0.4)'
            }}
          >
            {symbol}
          </div>
        ))}
      </animated.div>

      {/* Center highlight indicator */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-orange-500/10 to-orange-500/20 rounded-xl border-2 border-orange-500/50" />
      </div>

      {/* Top/bottom fade masks */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className={`
          absolute bottom-4 left-1/2 -translate-x-1/2
          px-8 py-4 rounded-xl font-black text-lg tracking-wider
          bg-gradient-to-r from-orange-500 to-red-500
          border-2 border-orange-400
          shadow-[0_0_30px_rgba(255,122,59,0.6)]
          transition-all duration-300
          ${isSpinning
            ? 'opacity-50 cursor-not-allowed scale-95'
            : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(255,122,59,0.8)] active:scale-95'
          }
        `}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </button>
    </div>
  )
}
