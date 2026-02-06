import { memo, useState, useCallback } from 'react'
import type { ProjectsSection } from '../types'

const ProjectsView = memo(function ProjectsView({ section, focusIndex, onSelect }: { section: ProjectsSection, focusIndex: number, onSelect?: (index: number) => void }) {
  const itemCount = section.featured.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 900
  const columns = isMobile ? 2 : isTablet ? 3 : (itemCount <= 4 ? 2 : itemCount <= 6 ? 3 : 4)
  const rows = Math.ceil(itemCount / columns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 'clamp(8px, 1.2vh, 16px)',
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
              borderRadius: '14px',
              padding: 'clamp(14px, 2vh, 28px) clamp(14px, 1.5vw, 24px)',
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
              gap: 'clamp(6px, 1vh, 14px)',
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
                top: 'clamp(6px, 1vh, 10px)',
                right: 'clamp(6px, 1vw, 10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 'clamp(3px, 0.4vh, 5px) clamp(6px, 0.8vw, 10px)',
                borderRadius: '8px',
                background: hasVideo ? 'rgba(0,204,255,0.15)' : 'rgba(255,136,0,0.15)',
                border: `1px solid ${hasVideo ? 'rgba(0,204,255,0.3)' : 'rgba(255,136,0,0.3)'}`,
                fontSize: 'clamp(10px, 1.2vh, 12px)',
                fontWeight: 700,
                color: accentColor,
                letterSpacing: '0.5px',
                zIndex: 1
              }}>
                <span style={{ fontSize: 'clamp(11px, 1.3vh, 14px)' }}>{hasVideo ? '🎬' : '🎧'}</span>
                {hasVideo ? 'VIDEO' : 'AUDIO'}
              </div>
            )}

            {/* Icon + Title */}
            <div style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: 'clamp(4px, 0.6vh, 8px)'
            }}>
              <span style={{
                fontSize: 'clamp(28px, 3.5vh, 44px)',
                filter: (isFocused || isPressed) ? `drop-shadow(0 0 10px ${accentBg}0.5))` : 'none',
                lineHeight: 1
              }}>{proj.icon}</span>
              <h3 style={{
                margin: 0,
                color: accentColor,
                fontSize: 'clamp(16px, 2vh, 22px)',
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: 1.2,
                letterSpacing: '0.3px'
              }}>{proj.title}</h3>
              <span style={{
                color: accentColor,
                fontSize: 'clamp(11px, 1.2vh, 13px)',
                opacity: 0.7,
                fontWeight: 600
              }}>{proj.year}</span>
            </div>

            {/* Description */}
            <p style={{
              margin: 0,
              color: (isFocused || isPressed) ? '#ccc' : '#aab',
              fontSize: 'clamp(12px, 1.5vh, 16px)',
              lineHeight: 1.6,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden'
            }}>{proj.description}</p>

            {/* Tap hint on mobile for media cards */}
            {hasMedia && isMobile && (
              <div style={{
                fontSize: '10px',
                color: accentColor,
                opacity: 0.5,
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
