import { memo, useState, useCallback, useEffect } from 'react'
import type { SkillsSection } from '../types'

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const SkillsView = memo(function SkillsView({ section, focusIndex, onSelect }: { section: SkillsSection, focusIndex: number, onSelect?: (index: number) => void }) {
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
  const catCount = section.categories.length
  // 2x2 grid always on mobile (fits 4 categories), desktop 2 cols
  const columns = isMobile ? 2 : (catCount <= 2 ? catCount : 2)
  const rows = Math.ceil(catCount / columns)
  const [pressedIndex, setPressedIndex] = useState(-1)

  const handleTap = useCallback((index: number) => {
    if (onSelect) onSelect(index)
  }, [onSelect])

  // Pixel-based responsive sizes — aggressive for landscape fit
  const iconSize = isMobile ? (isLandscape ? 14 : 18) : 28
  const catNameSize = isMobile ? (isLandscape ? 11 : 13) : 20
  const skillSize = isMobile ? (isLandscape ? 9 : 11) : 15
  const catPadX = isMobile ? (isLandscape ? 5 : 8) : 18
  const catPadY = isMobile ? (isLandscape ? 4 : 6) : 16
  const catGap = isMobile ? (isLandscape ? 4 : 6) : 14
  const skillGap = isMobile ? (isLandscape ? 3 : 4) : 8
  const skillPadX = isMobile ? (isLandscape ? 5 : 8) : 16
  const skillPadY = isMobile ? (isLandscape ? 2 : 4) : 9
  const headerMb = isMobile ? (isLandscape ? 3 : 4) : 12
  const headerPb = isMobile ? (isLandscape ? 3 : 4) : 10

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: `${catGap}px`,
      maxWidth: '1200px',
      width: '100%',
      height: '100%',
      margin: '0 auto'
    }}>
      {section.categories.map((cat, catIdx) => (
        <div key={cat.name} style={{
          animation: `fadeSlideIn 0.5s ease-out ${catIdx * 0.1}s both`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.015)',
          borderRadius: isMobile ? '8px' : '14px',
          padding: `${catPadY}px ${catPadX}px`,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Category header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${isMobile ? 4 : 10}px`,
            marginBottom: `${headerMb}px`,
            paddingBottom: `${headerPb}px`,
            borderBottom: `2px solid ${cat.color}40`,
            flexShrink: 0
          }}>
            <span style={{
              fontSize: `${iconSize}px`,
              filter: `drop-shadow(0 0 8px ${cat.color})`,
              lineHeight: 1
            }}>{cat.icon}</span>
            <span style={{
              color: cat.color,
              fontWeight: 'bold',
              fontSize: `${catNameSize}px`,
              letterSpacing: '0.3px',
              textShadow: `0 0 12px ${cat.color}50`
            }}>{cat.name}</span>
          </div>
          {/* Skills list — no scroll, overflow hidden */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${skillGap}px`,
            flex: 1,
            alignContent: 'flex-start',
            overflow: 'hidden'
          }}>
            {(() => {
              let baseIndex = 0
              for (let ci = 0; ci < catIdx; ci++) baseIndex += section.categories[ci].skills.length
              return cat.skills.map((skill, si) => {
                const currentIndex = baseIndex + si
                const isFocused = focusIndex === currentIndex
                const isActive = isFocused || pressedIndex === currentIndex
                return (
                  <div
                    key={skill.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTap(currentIndex)}
                    onTouchStart={() => setPressedIndex(currentIndex)}
                    onTouchEnd={() => setPressedIndex(-1)}
                    onTouchCancel={() => setPressedIndex(-1)}
                    style={{
                      padding: `${skillPadY}px ${skillPadX}px`,
                      borderRadius: '6px',
                      background: isActive ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)` : 'rgba(255,255,255,0.04)',
                      border: isActive ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isActive ? `0 4px 16px ${cat.color}25` : 'none',
                      transition: 'all 0.15s ease',
                      color: isActive ? '#fff' : '#c0c0d8',
                      fontSize: `${skillSize}px`,
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.2px',
                      cursor: 'pointer',
                      transform: pressedIndex === currentIndex ? 'scale(0.96)' : 'scale(1)',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none' as const,
                      lineHeight: 1.1
                    }}
                  >
                    {skill.name}
                  </div>
                )
              })
            })()}
          </div>
        </div>
      ))}
    </div>
  )
})

export default SkillsView
