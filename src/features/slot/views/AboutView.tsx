import { memo, useState, useCallback, useEffect } from 'react'
import type { AboutSection } from '../types'

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const AboutView = memo(function AboutView({ section, focusIndex, onSelect }: { section: AboutSection, focusIndex: number, onSelect?: (index: number) => void }) {
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
  const statColumns = isMobile ? (isLandscape ? 3 : 2) : Math.min(section.stats.length, 3)
  const statRows = Math.ceil(section.stats.length / statColumns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Pixel-based responsive sizes
  const bioSize = isMobile ? (isLandscape ? 12 : 14) : 17
  const bioPadX = isMobile ? (isLandscape ? 10 : 14) : 32
  const bioPadY = isMobile ? (isLandscape ? 6 : 10) : 24
  const bioLines = isMobile ? (isLandscape ? 2 : 3) : undefined
  const statIconSize = isMobile ? (isLandscape ? 20 : 24) : 36
  const statValueSize = isMobile ? (isLandscape ? 16 : 20) : 32
  const statLabelSize = isMobile ? (isLandscape ? 9 : 10) : 13
  const statPadX = isMobile ? (isLandscape ? 6 : 8) : 18
  const statPadY = isMobile ? (isLandscape ? 6 : 10) : 20
  const statGap = isMobile ? (isLandscape ? 3 : 4) : 8
  const gridGap = isMobile ? (isLandscape ? 6 : 8) : 14
  const sectionGap = isMobile ? (isLandscape ? 6 : 10) : 20

  return (
    <div style={{
      animation: 'fadeSlideIn 0.5s ease-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: `${sectionGap}px`
    }}>
      {/* Bio */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(136,68,255,0.08), rgba(136,68,255,0.02))',
        borderRadius: isMobile ? '10px' : '14px',
        padding: `${bioPadY}px ${bioPadX}px`,
        border: '1px solid rgba(136,68,255,0.15)',
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        flexShrink: 0
      }}>
        <p style={{
          color: '#ddddf0',
          fontSize: `${bioSize}px`,
          lineHeight: 1.5,
          textAlign: 'center',
          margin: 0,
          textShadow: '0 2px 15px rgba(0,0,0,0.4)',
          letterSpacing: '0.2px',
          display: bioLines ? '-webkit-box' : undefined,
          WebkitLineClamp: bioLines,
          WebkitBoxOrient: bioLines ? 'vertical' as const : undefined,
          overflow: bioLines ? 'hidden' : undefined
        }}>
          {section.bio}
        </p>
      </div>
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${statColumns}, 1fr)`,
        gridTemplateRows: `repeat(${statRows}, 1fr)`,
        gap: `${gridGap}px`,
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
        minHeight: 0
      }}>
        {section.stats.map((stat, i) => {
          const isFocused = focusIndex === i
          const isActive = isFocused || pressedIndex === i
          return (
            <div
              key={stat.label}
              role="button"
              tabIndex={0}
              onClick={() => handleTap(i)}
              onTouchStart={() => setPressedIndex(i)}
              onTouchEnd={() => setPressedIndex(-1)}
              onTouchCancel={() => setPressedIndex(-1)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(136,68,255,0.18), rgba(136,68,255,0.06))'
                  : 'linear-gradient(135deg, rgba(136,68,255,0.06), rgba(136,68,255,0.02))',
                borderRadius: isMobile ? '10px' : '14px',
                padding: `${statPadY}px ${statPadX}px`,
                textAlign: 'center',
                border: isActive ? '2px solid #8844ff' : '1px solid rgba(136,68,255,0.12)',
                animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: isActive ? '0 6px 20px rgba(136,68,255,0.2)' : '0 2px 10px rgba(0,0,0,0.12)',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${statGap}px`,
                minHeight: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                transform: pressedIndex === i ? 'scale(0.96)' : 'scale(1)',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none' as const
              }}
            >
              <div style={{
                fontSize: `${statIconSize}px`,
                filter: isActive ? 'drop-shadow(0 0 12px rgba(136,68,255,0.6))' : 'none',
                lineHeight: 1
              }}>{stat.icon}</div>
              <div style={{
                color: '#8844ff',
                fontWeight: 'bold',
                fontSize: `${statValueSize}px`,
                fontFamily: 'monospace',
                textShadow: isActive ? '0 0 15px rgba(136,68,255,0.4)' : 'none',
                lineHeight: 1.1
              }}>{stat.value}</div>
              <div style={{
                color: isActive ? '#bbb' : '#777799',
                fontSize: `${statLabelSize}px`,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                fontWeight: 600,
                lineHeight: 1.2
              }}>{stat.label}</div>
              {isTouch && (
                <div style={{
                  fontSize: '9px',
                  color: '#8844ff',
                  opacity: 0.4,
                  letterSpacing: '1px',
                  textTransform: 'uppercase' as const,
                  marginTop: `${isMobile ? 1 : 3}px`
                }}>TAP FOR DETAILS</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default AboutView
