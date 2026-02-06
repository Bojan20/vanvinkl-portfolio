import { memo, useState, useCallback, useEffect } from 'react'
import type { ProjectsSection } from '../types'

const ProjectsView = memo(function ProjectsView({ section, focusIndex, onSelect }: { section: ProjectsSection, focusIndex: number, onSelect?: (index: number) => void }) {
  // Track viewport dimensions for orientation change responsiveness
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

  const itemCount = section.featured.length
  const { w, h } = dims
  const isLandscape = w > h
  const isMobile = Math.min(w, h) < 600
  const isNarrow = w < 400
  const isTablet = w < 900 && !isMobile
  // Landscape mobile: 4 cols to fit cards compactly; portrait mobile: 2 cols (or 1 if very narrow)
  const columns = isMobile
    ? (isLandscape ? 4 : isNarrow ? 1 : 2)
    : isTablet ? 3 : (itemCount <= 4 ? 2 : itemCount <= 6 ? 3 : 4)
  const rows = Math.ceil(itemCount / columns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Pixel-based responsive sizes
  const iconSize = isMobile ? (isLandscape ? 20 : 28) : 40
  const titleSize = isMobile ? (isLandscape ? 11 : 14) : 20
  const badgeSize = isMobile ? (isLandscape ? 8 : 9) : 12
  const badgeIconSize = isMobile ? (isLandscape ? 9 : 10) : 13
  const cardPadX = isMobile ? (isLandscape ? 5 : 8) : 20
  const cardPadY = isMobile ? (isLandscape ? 4 : 8) : 24
  const cardGap = isMobile ? (isLandscape ? 2 : 4) : 12
  const gridGap = isMobile ? (isLandscape ? 4 : 6) : 14
  const badgePadX = isMobile ? (isLandscape ? 4 : 5) : 9
  const badgePadY = isMobile ? (isLandscape ? 1 : 2) : 5
  const badgeTop = isMobile ? (isLandscape ? 3 : 5) : 9
  const badgeRight = isMobile ? (isLandscape ? 3 : 5) : 9

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: `${gridGap}px`,
      maxWidth: '1400px',
      width: '100%',
      height: '100%',
      margin: '0 auto'
    }}>
      {section.featured.map((proj, i) => {
        const isFocused = focusIndex === i
        const isPressed = pressedIndex === i
        const hasVideo = !!proj.videoPath
        const hasAudioOnly = !proj.videoPath && !!proj.audioTracks?.length
        const hasMedia = hasVideo || hasAudioOnly
        const accentColor = hasVideo ? '#00ccff' : hasAudioOnly ? '#ff8800' : '#ffd700'
        const accentBg = hasVideo ? 'rgba(0,204,255,' : hasAudioOnly ? 'rgba(255,136,0,' : 'rgba(255,215,0,'

        return (
          <div
            key={proj.title}
            role={hasMedia ? 'button' : undefined}
            tabIndex={hasMedia ? 0 : undefined}
            onClick={hasMedia ? () => handleTap(i) : undefined}
            onTouchStart={hasMedia ? () => setPressedIndex(i) : undefined}
            onTouchEnd={hasMedia ? () => setPressedIndex(-1) : undefined}
            onTouchCancel={hasMedia ? () => setPressedIndex(-1) : undefined}
            onMouseDown={hasMedia ? () => setPressedIndex(i) : undefined}
            onMouseUp={hasMedia ? () => setPressedIndex(-1) : undefined}
            onMouseLeave={hasMedia ? () => setPressedIndex(-1) : undefined}
            style={{
              background: (isFocused || isPressed)
                ? `linear-gradient(135deg, ${accentBg}0.12), ${accentBg}0.04))`
                : `linear-gradient(135deg, ${accentBg}0.04), ${accentBg}0.01))`,
              borderRadius: isMobile ? '10px' : '14px',
              padding: `${cardPadY}px ${cardPadX}px`,
              border: (isFocused || isPressed) ? `2px solid ${accentColor}` : `1px solid ${accentBg}0.15)`,
              animation: `fadeSlideIn 0.4s ease-out ${i * 0.05}s both`,
              boxShadow: (isFocused || isPressed) ? `0 6px 20px ${accentBg}0.2)` : '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
              overflow: 'hidden',
              position: 'relative' as const,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'space-evenly',
              alignItems: 'center',
              gap: `${cardGap}px`,
              minHeight: 0,
              cursor: hasMedia ? 'pointer' : 'default',
              transform: isPressed ? 'scale(0.96)' : 'scale(1)',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none' as const
            }}
          >
            {/* Type badge */}
            {(hasVideo || hasAudioOnly) && (
              <div style={{
                position: 'absolute',
                top: `${badgeTop}px`,
                right: `${badgeRight}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: `${badgePadY}px ${badgePadX}px`,
                borderRadius: '6px',
                background: hasVideo ? 'rgba(0,204,255,0.15)' : 'rgba(255,136,0,0.15)',
                border: `1px solid ${hasVideo ? 'rgba(0,204,255,0.3)' : 'rgba(255,136,0,0.3)'}`,
                fontSize: `${badgeSize}px`,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: '0.5px',
                zIndex: 1
              }}>
                <span style={{ fontSize: `${badgeIconSize}px` }}>{hasVideo ? '🎬' : '🎧'}</span>
                {hasVideo ? 'VIDEO' : 'AUDIO'}
              </div>
            )}

            {/* Icon + Title (name only, no description) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: `${isMobile ? 3 : 6}px`
            }}>
              <span style={{
                fontSize: `${iconSize}px`,
                filter: (isFocused || isPressed) ? `drop-shadow(0 0 10px ${accentBg}0.5))` : 'none',
                lineHeight: 1
              }}>{proj.icon}</span>
              <h3 style={{
                margin: 0,
                color: accentColor,
                fontSize: `${titleSize}px`,
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: 1.2,
                letterSpacing: '0.3px'
              }}>{proj.title}</h3>
            </div>

            {/* Tap hint on mobile for media cards */}
            {hasMedia && isMobile && (
              <div style={{
                fontSize: '9px',
                color: accentColor,
                opacity: 0.4,
                letterSpacing: '1px',
                textTransform: 'uppercase' as const
              }}>TAP TO PLAY</div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default ProjectsView
