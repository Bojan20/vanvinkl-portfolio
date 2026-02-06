import { memo, useState, useCallback, useEffect } from 'react'
import type { ExperienceSection } from '../types'

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const ExperienceView = memo(function ExperienceView({ section, focusIndex, onSelect }: { section: ExperienceSection, focusIndex: number, onSelect?: (index: number) => void }) {
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

  const { w, h } = dims
  const isMobile = Math.min(w, h) < 600
  const isLandscape = w > h
  const itemCount = section.timeline.length
  const columns = isMobile ? (isLandscape ? 2 : 1) : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)
  const rows = Math.ceil(itemCount / columns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Pixel-based responsive sizes
  const roleSize = isMobile ? (isLandscape ? 13 : 15) : 19
  const companySize = isMobile ? (isLandscape ? 11 : 13) : 15
  const periodSize = isMobile ? (isLandscape ? 9 : 10) : 12
  const highlightSize = isMobile ? (isLandscape ? 10 : 12) : 14
  const cardPadX = isMobile ? (isLandscape ? 10 : 12) : 20
  const cardPadY = isMobile ? (isLandscape ? 8 : 10) : 20
  const cardGap = isMobile ? (isLandscape ? 3 : 5) : 10
  const gridGap = isMobile ? (isLandscape ? 6 : 8) : 16
  const highlightLines = isMobile ? (isLandscape ? 1 : 2) : undefined
  const highlightLineHeight = isMobile ? 1.2 : 1.4

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: `${gridGap}px`,
      maxWidth: columns === 1 ? '600px' : '1200px',
      width: '100%',
      height: '100%',
      margin: '0 auto'
    }}>
      {section.timeline.map((item, i) => {
        const isFocused = focusIndex === i
        const isActive = isFocused || pressedIndex === i
        return (
          <div
            key={item.period}
            role="button"
            tabIndex={0}
            onClick={() => handleTap(i)}
            onTouchStart={() => setPressedIndex(i)}
            onTouchEnd={() => setPressedIndex(-1)}
            onTouchCancel={() => setPressedIndex(-1)}
            style={{
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              background: isActive
                ? 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.03))'
                : 'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(0,255,136,0.01))',
              padding: `${cardPadY}px ${cardPadX}px`,
              borderRadius: isMobile ? '10px' : '14px',
              border: isActive ? '2px solid #00ff88' : '1px solid rgba(0,255,136,0.15)',
              boxShadow: isActive ? '0 6px 20px rgba(0,255,136,0.15)' : '0 2px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: 0,
              gap: `${cardGap}px`,
              cursor: 'pointer',
              transform: pressedIndex === i ? 'scale(0.96)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none' as const
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: `${roleSize}px`,
                  marginBottom: '2px',
                  lineHeight: 1.2,
                  letterSpacing: '0.3px'
                }}>{item.role}</div>
                <div style={{
                  color: isActive ? '#00ff88' : '#999aaa',
                  fontSize: `${companySize}px`,
                  fontWeight: 500
                }}>{item.company}</div>
              </div>
              <div style={{
                color: '#00ff88',
                fontSize: `${periodSize}px`,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                padding: `${isMobile ? 3 : 4}px ${isMobile ? 7 : 10}px`,
                background: 'rgba(0,255,136,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(0,255,136,0.3)',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}>{item.period}</div>
            </div>
            {/* Highlights */}
            <ul style={{
              margin: 0,
              paddingLeft: `${isMobile ? 12 : 16}px`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly'
            }}>
              {item.highlights.map((hl, j) => (
                <li key={j} style={{
                  color: isActive ? '#ccc' : '#999aaa',
                  fontSize: `${highlightSize}px`,
                  lineHeight: highlightLineHeight,
                  marginBottom: `${isMobile ? 1 : 3}px`,
                  display: highlightLines ? '-webkit-box' : undefined,
                  WebkitLineClamp: highlightLines,
                  WebkitBoxOrient: highlightLines ? 'vertical' as const : undefined,
                  overflow: highlightLines ? 'hidden' : undefined
                }}>{hl}</li>
              ))}
            </ul>
            {isTouch && (
              <div style={{
                fontSize: '9px',
                color: '#00ff88',
                opacity: 0.4,
                letterSpacing: '1px',
                textTransform: 'uppercase' as const,
                textAlign: 'center' as const,
                marginTop: `${isMobile ? 1 : 3}px`
              }}>TAP FOR DETAILS</div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default ExperienceView
