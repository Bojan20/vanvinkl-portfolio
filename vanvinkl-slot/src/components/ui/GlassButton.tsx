'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { useHaptic } from '@/hooks/useHaptic'

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  hapticFeedback?: boolean
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-500 hover:to-red-500 border-orange-500/50',
  secondary: 'bg-white/10 hover:bg-white/20 border-white/30',
  ghost: 'bg-transparent hover:bg-white/10 border-white/20'
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  hapticFeedback = true,
  onClick,
  ...motionProps
}: GlassButtonProps) {
  const { haptic } = useHaptic()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback) {
      haptic('medium')
    }
    onClick?.(e)
  }

  return (
    <motion.button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-xl border backdrop-blur-md
        font-bold tracking-wide
        transition-all duration-300
        relative overflow-hidden
        ${glow ? 'shadow-[0_0_30px_rgba(255,122,59,0.4)]' : 'shadow-lg'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleClick}
      {...motionProps}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-200%', '200%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
