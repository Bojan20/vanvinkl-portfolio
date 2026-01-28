import { memo, useState } from 'react'
import type { ContactSection } from '../types'

const ContactView = memo(function ContactView({ section, focusIndex }: { section: ContactSection, focusIndex: number }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleClick = (method: typeof section.methods[0], index: number) => {
    if (method.action === 'email' && method.url) {
      window.location.href = method.url
    } else if (method.action === 'link' && method.url) {
      window.open(method.url, '_blank', 'noopener,noreferrer')
    } else if (method.action === 'copy') {
      navigator.clipboard.writeText(method.value)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  // Determine columns based on item count
  const itemCount = section.methods.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
      {/* Contact cards - fixed columns based on count */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '28px',
        maxWidth: columns === 2 ? '800px' : '1200px',
        margin: '0 auto 50px'
      }}>
        {section.methods.map((method, i) => {
          const isFocused = focusIndex === i
          const isCopied = copiedIndex === i
          return (
            <button
              key={method.label}
              onClick={() => handleClick(method, i)}
              style={{
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(255,68,68,0.15), rgba(255,68,68,0.05))'
                  : 'linear-gradient(135deg, rgba(255,68,68,0.06), rgba(255,68,68,0.02))',
                border: isFocused ? '2px solid #ff4444' : '1px solid rgba(255,68,68,0.12)',
                borderRadius: '20px',
                padding: '48px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused
                  ? '0 16px 50px rgba(255,68,68,0.2)'
                  : '0 6px 30px rgba(0,0,0,0.12)',
                outline: 'none'
              }}
            >
              <div style={{
                fontSize: '60px',
                marginBottom: '20px',
                filter: isFocused ? 'drop-shadow(0 0 15px rgba(255,68,68,0.6))' : 'none',
                transition: 'all 0.3s ease'
              }}>{method.icon}</div>
              <div style={{
                color: isFocused ? '#ff6666' : '#ff4444',
                fontWeight: 'bold',
                fontSize: '26px',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}>{method.label}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#777788',
                fontSize: '16px',
                transition: 'color 0.3s ease'
              }}>
                {isCopied ? '✓ Copied!' : method.value}
              </div>
            </button>
          )
        })}
      </div>
      {/* Availability badge */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))',
          padding: '18px 48px',
          borderRadius: '30px',
          border: '1px solid rgba(0,255,136,0.3)'
        }}>
          <p style={{
            color: '#00ff88',
            fontSize: '22px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 0 20px rgba(0,255,136,0.4)'
          }}>
            {section.availability}
          </p>
        </div>
      </div>
    </div>
  )
})

export default ContactView
