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

  const itemCount = section.methods.length
  const columns = itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3

  return (
    <div style={{
      animation: 'fadeSlideIn 0.5s ease-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(14px, 2vh, 28px)',
      justifyContent: 'center'
    }}>
      {/* Contact cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'clamp(10px, 1.5vh, 18px)',
        maxWidth: columns === 2 ? '700px' : '1000px',
        width: '100%',
        margin: '0 auto'
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
                borderRadius: '14px',
                padding: 'clamp(18px, 2.5vh, 36px) clamp(14px, 1.5vw, 24px)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isFocused ? '0 6px 20px rgba(255,68,68,0.2)' : '0 2px 10px rgba(0,0,0,0.12)',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 1vh, 14px)'
              }}
            >
              <div style={{
                fontSize: 'clamp(32px, 4vh, 52px)',
                filter: isFocused ? 'drop-shadow(0 0 10px rgba(255,68,68,0.6))' : 'none',
                lineHeight: 1
              }}>{method.icon}</div>
              <div style={{
                color: isFocused ? '#ff6666' : '#ff4444',
                fontWeight: 'bold',
                fontSize: 'clamp(16px, 2vh, 22px)',
                letterSpacing: '0.5px'
              }}>{method.label}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#888899',
                fontSize: 'clamp(12px, 1.4vh, 15px)',
                fontWeight: isCopied ? '600' : '400'
              }}>
                {isCopied ? '✓ Copied!' : method.value}
              </div>
            </button>
          )
        })}
      </div>
      {/* Availability badge */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))',
          padding: 'clamp(10px, 1.5vh, 18px) clamp(20px, 3vw, 40px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,255,136,0.3)'
        }}>
          <p style={{
            color: '#00ff88',
            fontSize: 'clamp(14px, 1.8vh, 20px)',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 0 15px rgba(0,255,136,0.4)',
            letterSpacing: '0.5px'
          }}>
            {section.availability}
          </p>
        </div>
      </div>
    </div>
  )
})

export default ContactView
