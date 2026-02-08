/**
 * StatDetail - Stat modal content with mega icon
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { memo, useState, useEffect } from 'react'

interface StatData {
  icon: string
  value: string
  label: string
  bio: string
}

interface StatDetailProps {
  data: StatData
  showContent: boolean
}

export const StatDetail = memo(function StatDetail({
  data: stat,
  showContent
}: StatDetailProps) {
  const [dims, setDims] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768
  }))

  useEffect(() => {
    let rafId = 0
    const update = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setDims({ w: window.innerWidth, h: window.innerHeight })
      })
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  const { w, h } = dims
  const isLandscape = w > h
  const isCompact = Math.min(w, h) < 600 && isLandscape

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Mega icon with effects */}
      <div style={{
        fontSize: isCompact ? '36px' : 'clamp(56px, 18vw, 100px)',
        marginBottom: isCompact ? '6px' : 'clamp(16px, 4vw, 30px)',
        animation: 'modalIconPulse 2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 40px rgba(136,68,255,0.5))'
      }}>{stat.icon}</div>

      {/* Animated counter value */}
      <div style={{
        fontSize: isCompact ? '28px' : 'clamp(40px, 12vw, 80px)',
        fontWeight: 900,
        color: '#8844ff',
        marginBottom: isCompact ? '4px' : '12px',
        textShadow: '0 0 50px rgba(136,68,255,0.8)',
        fontFamily: 'monospace',
        animation: 'modalValuePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>{stat.value}</div>

      <div style={{
        color: '#666',
        fontSize: isCompact ? '11px' : '16px',
        letterSpacing: isCompact ? '2px' : '4px',
        textTransform: 'uppercase',
        marginBottom: isCompact ? '4px' : 'clamp(16px, 4vw, 30px)'
      }}>{stat.label}</div>

      {/* Bio section */}
      {stat.bio && (
        <div style={{
          marginTop: isCompact ? '6px' : 'clamp(16px, 4vw, 30px)',
          padding: isCompact ? '6px 10px' : 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 30px)',
          background: 'rgba(136,68,255,0.1)',
          borderRadius: isCompact ? '10px' : '16px',
          border: '1px solid rgba(136,68,255,0.3)',
          color: '#888',
          fontSize: isCompact ? '11px' : 'clamp(13px, 3.5vw, 15px)',
          lineHeight: isCompact ? 1.4 : 1.8,
          fontStyle: 'italic',
          animation: showContent ? 'modalTextReveal 0.6s ease-out 0.2s both' : 'none'
        }}>
          "{stat.bio}"
        </div>
      )}
    </div>
  )
})
