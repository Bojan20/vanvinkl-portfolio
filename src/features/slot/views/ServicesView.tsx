import { memo, useState, useCallback, useEffect } from 'react'
import type { ServicesSection } from '../types'

const ServicesView = memo(function ServicesView({ section, focusIndex, onSelect }: { section: ServicesSection, focusIndex: number, onSelect?: (index: number) => void }) {
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
  const itemCount = section.items.length
  const columns = isMobile
    ? (isLandscape ? 2 : 1)
    : (itemCount <= 2 ? itemCount : 2)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Responsive sizes based on actual pixels, not vh
  const iconSize = isMobile ? (isLandscape ? 28 : 34) : 42
  const titleSize = isMobile ? (isLandscape ? 14 : 16) : 20
  const descSize = isMobile ? (isLandscape ? 12 : 13) : 14
  const chipSize = isMobile ? 11 : 12
  const cardPadX = isMobile ? (isLandscape ? 12 : 14) : 20
  const cardPadY = isMobile ? (isLandscape ? 8 : 12) : 18
  const cardGap = isMobile ? (isLandscape ? 4 : 6) : 10
  const descLines = isMobile ? (isLandscape ? 2 : 3) : 5

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: isMobile ? '8px' : '14px',
      maxWidth: '1000px',
      width: '100%',
      height: '100%',
      margin: '0 auto',
      alignContent: 'start',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch' as any
    }}>
      {section.items.map((item, i) => {
        const isFocused = focusIndex === i
        const isActive = isFocused || pressedIndex === i
        return (
          <div
            key={item.title}
            role="button"
            tabIndex={0}
            onClick={() => handleTap(i)}
            onTouchStart={() => setPressedIndex(i)}
            onTouchEnd={() => setPressedIndex(-1)}
            onTouchCancel={() => setPressedIndex(-1)}
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(255,0,170,0.15), rgba(255,0,170,0.05))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              borderRadius: '12px',
              padding: `${cardPadY}px ${cardPadX}px`,
              border: isActive ? '2px solid #ff00aa' : '1px solid rgba(255,0,170,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.08}s both`,
              boxShadow: isActive ? '0 6px 20px rgba(255,0,170,0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: isMobile && !isLandscape ? 'column' as const : 'row' as const,
              alignItems: isMobile && !isLandscape ? 'center' : 'flex-start',
              gap: `${cardGap}px`,
              overflow: 'hidden',
              cursor: 'pointer',
              transform: pressedIndex === i ? 'scale(0.97)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none' as const
            }}
          >
            {/* Icon area */}
            <div style={{
              fontSize: `${iconSize}px`,
              lineHeight: 1,
              flexShrink: 0,
              filter: isActive ? 'drop-shadow(0 0 10px rgba(255,0,170,0.5))' : 'none',
              ...(isMobile && !isLandscape ? {} : { paddingTop: '2px' })
            }}>
              {item.icon}
            </div>

            {/* Content area */}
            <div style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: `${Math.max(3, cardGap - 2)}px`,
              alignItems: isMobile && !isLandscape ? 'center' : 'flex-start'
            }}>
              {/* Title */}
              <h3 style={{
                margin: 0,
                color: '#ff00aa',
                fontSize: `${titleSize}px`,
                fontWeight: 'bold',
                textAlign: isMobile && !isLandscape ? 'center' : 'left',
                letterSpacing: '0.3px',
                lineHeight: 1.2
              }}>{item.title}</h3>

              {/* Description */}
              <p style={{
                margin: 0,
                color: isActive ? '#ccc' : '#999',
                fontSize: `${descSize}px`,
                lineHeight: 1.5,
                textAlign: isMobile && !isLandscape ? 'center' : 'left',
                display: '-webkit-box',
                WebkitLineClamp: descLines,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden'
              }}>{item.description}</p>

              {/* Feature chips */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isMobile ? '4px' : '6px',
                justifyContent: isMobile && !isLandscape ? 'center' : 'flex-start',
                marginTop: '2px'
              }}>
                {item.features.map((f) => (
                  <span key={f} style={{
                    fontSize: `${chipSize}px`,
                    padding: isMobile ? '3px 8px' : '4px 10px',
                    background: isActive ? 'rgba(255,0,170,0.15)' : 'rgba(255,0,170,0.08)',
                    borderRadius: '6px',
                    color: isActive ? '#ff44cc' : '#ff00aa',
                    fontWeight: 600,
                    border: '1px solid rgba(255,0,170,0.15)',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap' as const
                  }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ServicesView
