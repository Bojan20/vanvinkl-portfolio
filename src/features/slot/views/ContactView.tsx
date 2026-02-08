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
    if (method.disabled) return
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
  // Mobile portrait: 2x2; landscape: 4 cols single row
  const columns = isMobile ? (isLandscape ? 4 : 2) : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)
  const rows = Math.ceil(itemCount / columns)

  // Pixel-based responsive sizes
  const iconSize = isMobile ? (isLandscape ? 22 : 28) : 46
  const labelSize = isMobile ? (isLandscape ? 11 : 14) : 20
  const valueSize = isMobile ? (isLandscape ? 9 : 11) : 15
  const cardPadX = isMobile ? (isLandscape ? 6 : 10) : 22
  const cardPadY = isMobile ? (isLandscape ? 5 : 10) : 30
  const cardGap = isMobile ? (isLandscape ? 3 : 5) : 12
  const gridGap = isMobile ? (isLandscape ? 4 : 6) : 16
  const sectionGap = isMobile ? (isLandscape ? 4 : 8) : 24

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
        gridAutoRows: isMobile ? (isLandscape ? '1fr' : 'minmax(0, 140px)') : 'minmax(0, 180px)',
        gap: `${gridGap}px`,
        maxWidth: columns === 2 ? '700px' : '1000px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
        minHeight: 0,
        alignContent: 'center'
      }}>
        {section.methods.map((method, i) => {
          const isFocused = focusIndex === i
          const isCopied = copiedIndex === i
          const isDisabled = !!method.disabled
          return (
            <button
              key={method.label}
              onClick={() => handleClick(method, i)}
              disabled={isDisabled}
              style={{
                background: isDisabled
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
                  : isFocused
                    ? 'linear-gradient(135deg, rgba(255,68,68,0.15), rgba(255,68,68,0.05))'
                    : 'linear-gradient(135deg, rgba(255,68,68,0.06), rgba(255,68,68,0.02))',
                border: isDisabled
                  ? '1px solid rgba(255,255,255,0.08)'
                  : isFocused ? '2px solid #ff4444' : '1px solid rgba(255,68,68,0.12)',
                borderRadius: isMobile ? '8px' : '14px',
                padding: `${cardPadY}px ${cardPadX}px`,
                textAlign: 'center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isDisabled ? 'none' : isFocused ? '0 6px 20px rgba(255,68,68,0.2)' : '0 2px 10px rgba(0,0,0,0.12)',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${cardGap}px`,
                minHeight: 0,
                overflow: 'hidden',
                opacity: isDisabled ? 0.35 : 1,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{
                fontSize: `${iconSize}px`,
                filter: isDisabled ? 'grayscale(1)' : isFocused ? 'drop-shadow(0 0 10px rgba(255,68,68,0.6))' : 'none',
                lineHeight: 1
              }}>{method.icon}</div>
              <div style={{
                color: isDisabled ? '#666' : isFocused ? '#ff6666' : '#ff4444',
                fontWeight: 'bold',
                fontSize: `${labelSize}px`,
                letterSpacing: '0.3px'
              }}>{method.label}</div>
              <div style={{
                color: isDisabled ? '#555' : isFocused ? '#bbb' : '#888899',
                fontSize: `${valueSize}px`,
                fontWeight: isCopied ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}>
                {isCopied ? '✓ Copied!' : method.value}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default ContactView
