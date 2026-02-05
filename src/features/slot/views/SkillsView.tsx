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
            flexDirection: 'column',
            gap: 'clamp(4px, 0.7vh, 10px)',
            flex: 1,
            justifyContent: 'space-evenly'
          }}>
            {cat.skills.map(skill => {
              const currentIndex = itemIndex
              const isFocused = focusIndex === currentIndex
              itemIndex++
              return (
                <div
                  key={skill.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 1vw, 14px)',
                    padding: 'clamp(6px, 0.8vh, 12px) clamp(8px, 1vw, 16px)',
                    borderRadius: '10px',
                    background: isFocused ? `linear-gradient(135deg, ${cat.color}18, ${cat.color}08)` : 'rgba(255,255,255,0.02)',
                    border: isFocused ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.04)',
                    boxShadow: isFocused ? `0 4px 16px ${cat.color}25` : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{
                    color: isFocused ? '#fff' : '#bbbbd0',
                    fontSize: 'clamp(12px, 1.5vh, 16px)',
                    minWidth: 'clamp(70px, 8vw, 110px)',
                    flex: '0 0 auto',
                    fontWeight: isFocused ? '700' : '500',
                    letterSpacing: '0.3px'
                  }}>{skill.name}</span>
                  <div style={{
                    flex: 1,
                    height: 'clamp(8px, 1.2vh, 14px)',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '7px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${skill.level}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${cat.color}80, ${cat.color})`,
                      borderRadius: '7px',
                      boxShadow: isFocused ? `0 0 12px ${cat.color}60` : `0 0 6px ${cat.color}30`,
                      animation: `barGrow 1s ease-out ${catIdx * 0.1}s both`
                    }} />
                  </div>
                  <span style={{
                    color: cat.color,
                    fontSize: 'clamp(12px, 1.4vh, 16px)',
                    width: '40px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>{skill.level}%</span>
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
