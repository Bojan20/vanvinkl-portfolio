import { memo, useState, useEffect } from 'react'
import type { ContactSection } from '../types'

const ContactView = memo(function ContactView({ section, focusIndex }: { section: ContactSection, focusIndex: number }) {
  // Reactive viewport dimensions for orientation changes
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

  const { w, h } = dims
  const isMobile = Math.min(w, h) < 600
  const isLandscape = w > h
  const itemCount = section.methods.length
  const columns = isMobile ? (isLandscape ? 2 : 1) : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)

  // Pixel-based responsive sizes
  const iconSize = isMobile ? (isLandscape ? 28 : 34) : 46
  const labelSize = isMobile ? (isLandscape ? 14 : 16) : 20
  const valueSize = isMobile ? (isLandscape ? 11 : 13) : 15
  const cardPadX = isMobile ? (isLandscape ? 10 : 12) : 22
  const cardPadY = isMobile ? (isLandscape ? 10 : 14) : 30
  const cardGap = isMobile ? (isLandscape ? 6 : 8) : 12
  const gridGap = isMobile ? (isLandscape ? 6 : 8) : 16
  const sectionGap = isMobile ? (isLandscape ? 8 : 12) : 24
  const availSize = isMobile ? (isLandscape ? 12 : 14) : 18
  const availPadX = isMobile ? (isLandscape ? 14 : 18) : 36
  const availPadY = isMobile ? (isLandscape ? 6 : 10) : 16

  return (
    <div style={{
      animation: 'fadeSlideIn 0.5s ease-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: `${sectionGap}px`,
      justifyContent: 'center'
    }}>
      {/* Contact cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gridGap}px`,
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
                borderRadius: isMobile ? '10px' : '14px',
                padding: `${cardPadY}px ${cardPadX}px`,
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
                gap: `${cardGap}px`,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{
                fontSize: `${iconSize}px`,
                filter: isFocused ? 'drop-shadow(0 0 10px rgba(255,68,68,0.6))' : 'none',
                lineHeight: 1
              }}>{method.icon}</div>
              <div style={{
                color: isFocused ? '#ff6666' : '#ff4444',
                fontWeight: 'bold',
                fontSize: `${labelSize}px`,
                letterSpacing: '0.5px'
              }}>{method.label}</div>
              <div style={{
                color: isFocused ? '#bbb' : '#888899',
                fontSize: `${valueSize}px`,
                fontWeight: isCopied ? 600 : 400
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
          padding: `${availPadY}px ${availPadX}px`,
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid rgba(0,255,136,0.3)'
        }}>
          <p style={{
            color: '#00ff88',
            fontSize: `${availSize}px`,
            fontWeight: 600,
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
