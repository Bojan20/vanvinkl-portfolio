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
  // Mobile portrait: 2x2 grid; landscape: 4 cols single row
  const columns = isMobile ? (isLandscape ? 4 : 2) : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)
  const rows = Math.ceil(itemCount / columns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Pixel-based responsive sizes — very compact for landscape
  const roleSize = isMobile ? (isLandscape ? 10 : 13) : 19
  const companySize = isMobile ? (isLandscape ? 9 : 11) : 15
  const periodSize = isMobile ? (isLandscape ? 8 : 9) : 12
  const highlightSize = isMobile ? (isLandscape ? 8 : 10) : 14
  const cardPadX = isMobile ? (isLandscape ? 6 : 10) : 20
  const cardPadY = isMobile ? (isLandscape ? 5 : 8) : 20
  const cardGap = isMobile ? (isLandscape ? 2 : 4) : 10
  const gridGap = isMobile ? (isLandscape ? 4 : 6) : 16
  // Landscape: show only 2 highlights, 1 line each. Portrait: 3 highlights, 1 line each
  const maxHighlights = isMobile ? (isLandscape ? 2 : 3) : 4

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridAutoRows: isMobile ? (isLandscape ? '1fr' : 'minmax(0, 180px)') : 'minmax(0, 220px)',
      gap: `${gridGap}px`,
      maxWidth: columns === 1 ? '600px' : '1200px',
      width: '100%',
      height: '100%',
      margin: '0 auto',
      alignContent: 'center'
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
              borderRadius: isMobile ? '8px' : '14px',
              border: isActive ? '2px solid #00ff88' : '1px solid rgba(0,255,136,0.15)',
              boxShadow: isActive ? '0 6px 20px rgba(0,255,136,0.15)' : '0 2px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column' as const,
              overflow: 'hidden',
              minHeight: 0,
              gap: `${cardGap}px`,
              cursor: 'pointer',
              transform: pressedIndex === i ? 'scale(0.96)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none' as const
            }}
          >
            {/* Header — role + period */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: `${roleSize}px`,
                lineHeight: 1.2,
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{item.role}</div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px',
                marginTop: '1px'
              }}>
                <span style={{
                  color: isActive ? '#00ff88' : '#999aaa',
                  fontSize: `${companySize}px`,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{item.company}</span>
                <span style={{
                  color: '#00ff88',
                  fontSize: `${periodSize}px`,
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  padding: `${isMobile ? 2 : 3}px ${isMobile ? 5 : 8}px`,
                  background: 'rgba(0,255,136,0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,255,136,0.3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>{item.period}</span>
              </div>
            </div>
            {/* Highlights — limited count, single line each */}
            <div style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly'
            }}>
              {item.highlights.slice(0, maxHighlights).map((hl, j) => (
                <div key={j} style={{
                  color: isActive ? '#ccc' : '#999aaa',
                  fontSize: `${highlightSize}px`,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingLeft: `${isMobile ? 6 : 10}px`,
                  borderLeft: `2px solid rgba(0,255,136,${isActive ? '0.4' : '0.15'})`
                }}>{hl}</div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ExperienceView
