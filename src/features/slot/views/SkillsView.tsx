import { memo } from 'react'
import type { SkillsSection } from '../types'

const SkillsView = memo(function SkillsView({ section, focusIndex }: { section: SkillsSection, focusIndex: number }) {
  let itemIndex = 0
  const catCount = section.categories.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const columns = isMobile ? 1 : (catCount <= 2 ? catCount : 2)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${Math.ceil(catCount / columns)}, 1fr)`,
      gap: 'clamp(10px, 1.5vh, 20px)',
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
          borderRadius: '14px',
          padding: 'clamp(10px, 1.5vh, 20px) clamp(12px, 1.5vw, 20px)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Category header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 12px)',
            marginBottom: 'clamp(8px, 1.2vh, 16px)',
            paddingBottom: 'clamp(6px, 0.8vh, 12px)',
            borderBottom: `2px solid ${cat.color}40`,
            flexShrink: 0
          }}>
            <span style={{
              fontSize: 'clamp(20px, 2.5vh, 32px)',
              filter: `drop-shadow(0 0 8px ${cat.color})`,
              lineHeight: 1
            }}>{cat.icon}</span>
            <span style={{
              color: cat.color,
              fontWeight: 'bold',
              fontSize: 'clamp(15px, 1.8vh, 22px)',
              letterSpacing: '1px',
              textShadow: `0 0 12px ${cat.color}50`
            }}>{cat.name}</span>
          </div>
          {/* Skills list */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(6px, 0.8vh, 10px)',
            flex: 1,
            alignContent: 'flex-start'
          }}>
            {cat.skills.map(skill => {
              const currentIndex = itemIndex
              const isFocused = focusIndex === currentIndex
              itemIndex++
              return (
                <div
                  key={skill.name}
                  style={{
                    padding: 'clamp(6px, 0.8vh, 10px) clamp(12px, 1.2vw, 18px)',
                    borderRadius: '8px',
                    background: isFocused ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)` : 'rgba(255,255,255,0.04)',
                    border: isFocused ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isFocused ? `0 4px 16px ${cat.color}25` : 'none',
                    transition: 'all 0.3s ease',
                    color: isFocused ? '#fff' : '#c0c0d8',
                    fontSize: 'clamp(12px, 1.5vh, 16px)',
                    fontWeight: isFocused ? '600' : '400',
                    letterSpacing: '0.3px'
                  }}
                >
                  {skill.name}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})

export default SkillsView
