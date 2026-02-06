import { memo } from 'react'
import type { ExperienceSection } from '../types'

const ExperienceView = memo(function ExperienceView({ section, focusIndex }: { section: ExperienceSection, focusIndex: number }) {
  const itemCount = section.timeline.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const columns = isMobile ? 1 : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)
  const rows = Math.ceil(itemCount / columns)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 'clamp(10px, 1.5vh, 18px)',
      maxWidth: columns === 1 ? '600px' : '1200px',
      width: '100%',
      height: '100%',
      margin: '0 auto'
    }}>
      {section.timeline.map((item, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={item.period}
            style={{
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              background: isFocused
                ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.03))'
                : 'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(0,255,136,0.01))',
              padding: isMobile ? 'clamp(8px, 1.2vh, 14px) clamp(10px, 1.5vw, 16px)' : 'clamp(14px, 2vh, 24px) clamp(14px, 1.5vw, 22px)',
              borderRadius: '14px',
              border: isFocused ? '2px solid #00ff88' : '1px solid rgba(0,255,136,0.15)',
              boxShadow: isFocused ? '0 6px 20px rgba(0,255,136,0.15)' : '0 2px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: 0,
              gap: isMobile ? 'clamp(3px, 0.5vh, 6px)' : 'clamp(6px, 1vh, 12px)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 'clamp(15px, 1.8vh, 20px)',
                  marginBottom: '3px',
                  lineHeight: 1.2,
                  letterSpacing: '0.3px'
                }}>{item.role}</div>
                <div style={{
                  color: isFocused ? '#00ff88' : '#999aaa',
                  fontSize: 'clamp(13px, 1.5vh, 16px)',
                  fontWeight: '500'
                }}>{item.company}</div>
              </div>
              <div style={{
                color: '#00ff88',
                fontSize: 'clamp(10px, 1.2vh, 12px)',
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                padding: '4px 10px',
                background: 'rgba(0,255,136,0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(0,255,136,0.3)',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}>{item.period}</div>
            </div>
            {/* Highlights */}
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly'
            }}>
              {item.highlights.map((h, j) => (
                <li key={j} style={{
                  color: isFocused ? '#ccc' : '#999aaa',
                  fontSize: 'clamp(11px, 1.3vh, 14px)',
                  lineHeight: isMobile ? 1.2 : 1.4,
                  marginBottom: 'clamp(2px, 0.3vh, 4px)',
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 2 : undefined,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: isMobile ? 'hidden' : undefined
                }}>{h}</li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
})

export default ExperienceView
