/**
 * StatDetail - Stat modal content with mega icon
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { memo } from 'react'

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
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Mega icon with effects */}
      <div style={{
        fontSize: '100px',
        marginBottom: '30px',
        animation: 'modalIconPulse 2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 40px rgba(136,68,255,0.5))'
      }}>{stat.icon}</div>

      {/* Animated counter value */}
      <div style={{
        fontSize: '80px',
        fontWeight: 900,
        color: '#8844ff',
        marginBottom: '12px',
        textShadow: '0 0 50px rgba(136,68,255,0.8)',
        fontFamily: 'monospace',
        animation: 'modalValuePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>{stat.value}</div>

      <div style={{
        color: '#666',
        fontSize: '16px',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        marginBottom: '30px'
      }}>{stat.label}</div>

      {/* Bio section */}
      {stat.bio && (
        <div style={{
          marginTop: '30px',
          padding: '20px 30px',
          background: 'rgba(136,68,255,0.1)',
          borderRadius: '16px',
          border: '1px solid rgba(136,68,255,0.3)',
          color: '#888',
          fontSize: '15px',
          lineHeight: 1.8,
          fontStyle: 'italic',
          animation: showContent ? 'modalTextReveal 0.6s ease-out 0.2s both' : 'none'
        }}>
          "{stat.bio}"
        </div>
      )}
    </div>
  )
})
