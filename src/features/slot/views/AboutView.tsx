import { memo } from 'react'
import type { AboutSection } from '../types'

const AboutView = memo(function AboutView({ section, focusIndex }: { section: AboutSection, focusIndex: number }) {
  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Bio - prominent centered text */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(136,68,255,0.08), rgba(136,68,255,0.02))',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '40px',
        border: '1px solid rgba(136,68,255,0.15)',
        maxWidth: '1000px',
        margin: '0 auto 40px'
      }}>
        <p style={{
          color: '#ddddf0',
          fontSize: '20px',
          lineHeight: 1.9,
          textAlign: 'center',
          margin: 0,
          textShadow: '0 2px 15px rgba(0,0,0,0.4)'
        }}>
          {section.bio}
        </p>
      </div>
      {/* Stats grid - 4 in a row on desktop, 2 on tablet, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(section.stats.length, 4)}, 1fr)`,
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
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
                borderRadius: '20px',
                padding: '40px 24px',
                textAlign: 'center',
                border: isFocused ? '2px solid #8844ff' : '1px solid rgba(136,68,255,0.12)',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused ? '0 16px 50px rgba(136,68,255,0.2)' : '0 6px 25px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '52px',
                marginBottom: '16px',
                filter: isFocused ? 'drop-shadow(0 0 20px rgba(136,68,255,0.6))' : 'none'
              }}>{stat.icon}</div>
              <div style={{
                color: '#8844ff',
                fontWeight: 'bold',
                fontSize: '40px',
                marginBottom: '10px',
                fontFamily: 'monospace',
                textShadow: isFocused ? '0 0 20px rgba(136,68,255,0.4)' : 'none'
              }}>{stat.value}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#666688',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600
              }}>{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default AboutView
