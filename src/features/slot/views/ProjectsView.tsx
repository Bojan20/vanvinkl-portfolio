import { memo } from 'react'
import type { ProjectsSection } from '../types'

const ProjectsView = memo(function ProjectsView({ section, focusIndex }: { section: ProjectsSection, focusIndex: number }) {
  const itemCount = section.featured.length
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const columns = isMobile ? 1 : (itemCount <= 2 ? itemCount : itemCount <= 4 ? 2 : 3)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '28px',
      maxWidth: columns === 2 ? '950px' : '1400px',
      margin: '0 auto'
    }}>
      {section.featured.map((proj, i) => {
        const isFocused = focusIndex === i
        return (
          <div
            key={proj.title}
            style={{
              background: isFocused
                ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))'
                : 'linear-gradient(135deg, rgba(255,215,0,0.04), rgba(255,215,0,0.01))',
              borderRadius: '20px',
              padding: '36px',
              border: isFocused ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.12)',
              animation: `fadeSlideIn 0.5s ease-out ${i * 0.1}s both`,
              boxShadow: isFocused ? '0 16px 50px rgba(255,215,0,0.15)' : '0 6px 25px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <span style={{
                fontSize: '52px',
                filter: isFocused ? 'drop-shadow(0 0 15px rgba(255,215,0,0.5))' : 'none'
              }}>{proj.icon}</span>
              <span style={{
                color: '#ffd700',
                fontSize: '13px',
                background: 'rgba(255,215,0,0.12)',
                padding: '8px 16px',
                borderRadius: '14px',
                fontWeight: 600,
                border: '1px solid rgba(255,215,0,0.25)'
              }}>{proj.year}</span>
            </div>
            <h3 style={{
              margin: '0 0 12px 0',
              color: '#ffd700',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>{proj.title}</h3>
            <p style={{
              margin: '0 0 20px 0',
              color: isFocused ? '#ccc' : '#888899',
              fontSize: '15px',
              lineHeight: 1.7
            }}>{proj.description}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {proj.tags.map((t) => (
                <span key={t} style={{
                  fontSize: '12px',
                  padding: '8px 14px',
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: '14px',
                  color: '#ffd700',
                  fontWeight: '500'
                }}>{t}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ProjectsView
