'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  intensity?: 'light' | 'medium' | 'heavy'
  glow?: boolean
  glowColor?: 'orange' | 'cyan' | 'green' | 'red'
  hover?: boolean
  className?: string
}

const intensityClasses = {
  light: 'bg-white/5 backdrop-blur-sm border-white/10',
  medium: 'bg-white/10 backdrop-blur-md border-white/20',
  heavy: 'bg-white/20 backdrop-blur-lg border-white/30'
}

const glowColors = {
  orange: 'rgba(255, 122, 59, 0.3)',
  cyan: 'rgba(64, 200, 255, 0.3)',
  green: 'rgba(64, 255, 144, 0.3)',
  red: 'rgba(255, 64, 96, 0.3)'
}

const glowColorsHover = {
  orange: 'rgba(255, 122, 59, 0.5)',
  cyan: 'rgba(64, 200, 255, 0.5)',
  green: 'rgba(64, 255, 144, 0.5)',
  red: 'rgba(255, 64, 96, 0.5)'
}

const glowGradients = {
  orange: 'from-orange-500/10 to-transparent',
  cyan: 'from-cyan-500/10 to-transparent',
  green: 'from-green-500/10 to-transparent',
  red: 'from-red-500/10 to-transparent'
}

export function GlassCard({
  children,
  intensity = 'medium',
  glow = false,
  glowColor = 'orange',
  hover = true,
  className = '',
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={`
        ${intensityClasses[intensity]}
        rounded-2xl border
        shadow-2xl
        relative overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? {
        scale: 1.02,
        boxShadow: glow
          ? `0 0 60px ${glowColorsHover[glowColor]}, 0 20px 40px rgba(0,0,0,0.4)`
          : '0 20px 40px rgba(0,0,0,0.3)'
      } : undefined}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]  // expo-out
      }}
      {...motionProps}
    >
      {/* Inner glow gradient */}
      {glow && (
        <div
          className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-br ${glowGradients[glowColor]}
            pointer-events-none
          `}
        />
      )}

      {/* Border shine effect */}
      <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
