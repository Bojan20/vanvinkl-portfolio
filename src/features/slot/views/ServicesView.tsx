import { memo } from 'react'
import type { ServicesSection } from '../types'

const ServicesView = memo(function ServicesView({ section, focusIndex }: { section: ServicesSection, focusIndex: number }) {
  const itemCount = section.items.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const columns = isMobile ? 1 : (itemCount <= 2 ? itemCount : 2)
  const rows = Math.ceil(itemCount / columns)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 'clamp(10px, 1.5vh, 18px)',
      maxWidth: '1000px',
      width: '100%',
      height: '100%',
      margin: '0 auto'
    }}>
      {section.items.map((item, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={item.title}
            style={{
              background: isFocused
                ? 'linear-gradient(135deg, rgba(255,0,170,0.15), rgba(255,0,170,0.05))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              borderRadius: '14px',
              padding: 'clamp(14px, 2vh, 28px) clamp(14px, 1.5vw, 24px)',
              border: isFocused ? '2px solid #ff00aa' : '1px solid rgba(255,0,170,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              boxShadow: isFocused ? '0 6px 20px rgba(255,0,170,0.2)' : '0 2px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(6px, 1vh, 14px)',
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            <div style={{
              fontSize: 'clamp(28px, 3.5vh, 48px)',
              filter: isFocused ? 'drop-shadow(0 0 12px rgba(255,0,170,0.5))' : 'none',
              lineHeight: 1
            }}>{item.icon}</div>
            <h3 style={{
              margin: 0,
              color: '#ff00aa',
              fontSize: 'clamp(16px, 2vh, 22px)',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>{item.title}</h3>
            <p style={{
              margin: 0,
              color: isFocused ? '#ccc' : '#999aaa',
              fontSize: 'clamp(12px, 1.4vh, 15px)',
              lineHeight: 1.5,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden'
            }}>{item.description}</p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(4px, 0.6vh, 8px)',
              justifyContent: 'center',
              marginTop: 'auto',
              paddingTop: 'clamp(4px, 0.6vh, 8px)'
            }}>
              {item.features.map((f) => (
                <span key={f} style={{
                  fontSize: 'clamp(10px, 1.2vh, 13px)',
                  padding: 'clamp(3px, 0.4vh, 6px) clamp(8px, 1vw, 12px)',
                  background: isFocused ? 'rgba(255,0,170,0.15)' : 'rgba(255,0,170,0.08)',
                  borderRadius: '8px',
                  color: '#ff00aa',
                  fontWeight: '600',
                  border: '1px solid rgba(255,0,170,0.15)',
                  letterSpacing: '0.3px'
                }}>{f}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ServicesView
