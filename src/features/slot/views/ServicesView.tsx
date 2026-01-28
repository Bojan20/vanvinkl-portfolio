import { memo } from 'react'
import type { ServicesSection } from '../types'

const ServicesView = memo(function ServicesView({ section, focusIndex }: { section: ServicesSection, focusIndex: number }) {
  const itemCount = section.items.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 2 ? '900px' : '1400px',
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
              borderRadius: '20px',
              padding: '36px',
              border: isFocused ? '2px solid #ff00aa' : '1px solid rgba(255,0,170,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              boxShadow: isFocused
                ? '0 16px 50px rgba(255,0,170,0.2)'
                : '0 6px 25px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              fontSize: '52px',
              marginBottom: '20px',
              filter: isFocused ? 'drop-shadow(0 0 18px rgba(255,0,170,0.5))' : 'none'
            }}>{item.icon}</div>
            <h3 style={{
              margin: '0 0 14px 0',
              color: '#ff00aa',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>{item.title}</h3>
            <p style={{
              margin: '0 0 20px 0',
              color: isFocused ? '#ccc' : '#888899',
              fontSize: '15px',
              lineHeight: 1.7
            }}>{item.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {item.features.map((f) => (
                <span key={f} style={{
                  fontSize: '12px',
                  padding: '8px 14px',
                  background: 'rgba(255,0,170,0.1)',
                  borderRadius: '14px',
                  color: '#ff00aa',
                  fontWeight: '600'
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
