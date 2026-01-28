import { memo } from 'react'
import type { SkillsSection } from '../types'

const SkillsView = memo(function SkillsView({ section, focusIndex }: { section: SkillsSection, focusIndex: number }) {
  // Flatten all skills for navigation
  let itemIndex = 0
  const catCount = section.categories.length
  const columns = catCount <= 2 ? catCount : catCount <= 4 ? 2 : 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '40px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {section.categories.map((cat, catIdx) => (
        <div key={cat.name} style={{ animation: `fadeSlideIn 0.5s ease-out ${catIdx * 0.1}s both` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
            paddingBottom: '14px',
            borderBottom: `2px solid ${cat.color}40`
          }}>
            <span style={{
              fontSize: '36px',
              filter: `drop-shadow(0 0 12px ${cat.color})`
            }}>{cat.icon}</span>
            <span style={{
              color: cat.color,
              fontWeight: 'bold',
              fontSize: '22px',
              letterSpacing: '2px',
              textShadow: `0 0 12px ${cat.color}50`
            }}>{cat.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    gap: '16px',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: isFocused ? `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)` : 'rgba(255,255,255,0.02)',
                    border: isFocused ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isFocused ? `0 8px 30px ${cat.color}25` : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{
                    color: isFocused ? '#fff' : '#aaaacc',
                    fontSize: '16px',
                    minWidth: '110px',
                    flex: '0 0 auto',
                    fontWeight: isFocused ? '600' : '500'
                  }}>{skill.name}</span>
                  <div style={{
                    flex: 1,
                    height: '14px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '7px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${skill.level}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${cat.color}90, ${cat.color})`,
                      borderRadius: '7px',
                      boxShadow: isFocused ? `0 0 18px ${cat.color}60` : `0 0 10px ${cat.color}30`,
                      animation: `barGrow 1s ease-out ${catIdx * 0.1}s both`
                    }} />
                  </div>
                  <span style={{
                    color: cat.color,
                    fontSize: '16px',
                    width: '55px',
                    fontWeight: 'bold',
                    textAlign: 'right'
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
