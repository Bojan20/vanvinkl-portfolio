import { memo } from 'react'
import type { AboutSection } from '../types'

const AboutView = memo(function AboutView({ section, focusIndex }: { section: AboutSection, focusIndex: number }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const statColumns = isMobile ? 2 : Math.min(section.stats.length, 3)
  const statRows = Math.ceil(section.stats.length / statColumns)

  return (
    <div style={{
      animation: 'fadeSlideIn 0.5s ease-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(12px, 1.8vh, 22px)'
    }}>
      {/* Bio */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(136,68,255,0.08), rgba(136,68,255,0.02))',
        borderRadius: '14px',
        padding: 'clamp(16px, 2.5vh, 32px) clamp(18px, 3vw, 36px)',
        border: '1px solid rgba(136,68,255,0.15)',
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        flexShrink: 0
      }}>
        <p style={{
          color: '#ddddf0',
          fontSize: 'clamp(14px, 1.8vh, 18px)',
          lineHeight: 1.6,
          textAlign: 'center',
          margin: 0,
          textShadow: '0 2px 15px rgba(0,0,0,0.4)',
          letterSpacing: '0.2px'
        }}>
          {section.bio}
        </p>
      </div>
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${statColumns}, 1fr)`,
        gridTemplateRows: `repeat(${statRows}, 1fr)`,
        gap: 'clamp(8px, 1.2vh, 16px)',
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
        minHeight: 0
      }}>
        {section.stats.map((stat, i) => {
          const isFocused = focusIndex === i
          return (
            <div
              key={stat.label}
              style={{
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(136,68,255,0.18), rgba(136,68,255,0.06))'
                  : 'linear-gradient(135deg, rgba(136,68,255,0.06), rgba(136,68,255,0.02))',
                borderRadius: '14px',
                padding: 'clamp(12px, 1.5vh, 24px) clamp(10px, 1.2vw, 20px)',
                textAlign: 'center',
                border: isFocused ? '2px solid #8844ff' : '1px solid rgba(136,68,255,0.12)',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused ? '0 6px 20px rgba(136,68,255,0.2)' : '0 2px 10px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(4px, 0.6vh, 10px)',
                minHeight: 0,
                overflow: 'hidden'
              }}
            >
              <div style={{
                fontSize: 'clamp(24px, 3vh, 40px)',
                filter: isFocused ? 'drop-shadow(0 0 12px rgba(136,68,255,0.6))' : 'none',
                lineHeight: 1
              }}>{stat.icon}</div>
              <div style={{
                color: '#8844ff',
                fontWeight: 'bold',
                fontSize: 'clamp(20px, 2.8vh, 34px)',
                fontFamily: 'monospace',
                textShadow: isFocused ? '0 0 15px rgba(136,68,255,0.4)' : 'none',
                lineHeight: 1.1
              }}>{stat.value}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#777799',
                fontSize: 'clamp(10px, 1.3vh, 14px)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                lineHeight: 1.2
              }}>{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default AboutView
