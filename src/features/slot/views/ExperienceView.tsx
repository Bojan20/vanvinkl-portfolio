import { memo } from 'react'
import type { ExperienceSection } from '../types'

const ExperienceView = memo(function ExperienceView({ section, focusIndex }: { section: ExperienceSection, focusIndex: number }) {
  const itemCount = section.timeline.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 1 ? '600px' : columns === 2 ? '1000px' : '1400px',
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
              padding: '28px',
              borderRadius: '16px',
              border: isFocused ? '2px solid #00ff88' : '1px solid rgba(0,255,136,0.15)',
              boxShadow: isFocused ? '0 12px 40px rgba(0,255,136,0.15)' : '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  marginBottom: '4px'
                }}>{item.role}</div>
                <div style={{
                  color: isFocused ? '#00ff88' : '#888899',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>{item.company}</div>
              </div>
              <div style={{
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: 'rgba(0,255,136,0.1)',
                borderRadius: '20px',
                border: '1px solid rgba(0,255,136,0.3)',
                textShadow: isFocused ? '0 0 10px rgba(0,255,136,0.4)' : 'none',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}>{item.period}</div>
            </div>
            {/* Highlights */}
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {item.highlights.map((h, j) => (
                <li key={j} style={{
                  color: isFocused ? '#ccc' : '#888899',
                  fontSize: '14px',
                  marginBottom: '8px',
                  lineHeight: 1.6
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
