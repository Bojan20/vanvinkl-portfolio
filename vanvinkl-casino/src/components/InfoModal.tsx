/**
 * Info Modal - Rich visual content display
 *
 * Features:
 * - Skill bars with animated fill
 * - Timeline view for experience
 * - Service cards with features
 * - Cross-linking between sections
 * - Keyboard navigation (1-6 for direct machine jump)
 * - Progress tracking
 */

import { useEffect, useState, useCallback } from 'react'
import { playSound } from '../audio'
import {
  SLOT_CONTENT,
  MACHINE_ORDER,
  getNextMachine,
  getPrevMachine,
  markVisited,
  getProgress,
  type SlotSection,
  type SkillsSection,
  type ServicesSection,
  type AboutSection,
  type ProjectsSection,
  type ExperienceSection,
  type ContactSection
} from '../store/slotContent'

interface InfoModalProps {
  machineId: string
  onClose: () => void
  onNavigate?: (machineId: string) => void
}

// ============================================
// SKILL BAR COMPONENT
// ============================================
function SkillBar({ name, level, color, delay = 0 }: {
  name: string
  level: number
  color: string
  delay?: number
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(level), delay)
    return () => clearTimeout(timer)
  }, [level, delay])

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: '13px',
        color: '#ccccdd'
      }}>
        <span>{name}</span>
        <span style={{ color }}>{level}%</span>
      </div>
      <div style={{
        height: '6px',
        background: 'rgba(136, 68, 255, 0.2)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: '3px',
          transition: 'width 0.8s ease-out',
          boxShadow: `0 0 10px ${color}60`
        }} />
      </div>
    </div>
  )
}

// ============================================
// SKILLS VIEW
// ============================================
function SkillsView({ section }: { section: SkillsSection }) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div>
      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {section.categories.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => {
              playSound('hover', 0.3)
              setActiveCategory(i)
            }}
            style={{
              padding: '8px 16px',
              background: i === activeCategory
                ? `linear-gradient(135deg, ${cat.color}40, ${cat.color}20)`
                : 'rgba(136, 68, 255, 0.1)',
              border: `1px solid ${i === activeCategory ? cat.color : '#8844ff40'}`,
              borderRadius: '20px',
              color: i === activeCategory ? cat.color : '#888899',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Skills list */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(136, 68, 255, 0.2)'
      }}>
        {section.categories[activeCategory].skills.map((skill, i) => (
          <SkillBar
            key={skill.name}
            name={skill.name}
            level={skill.level}
            color={section.categories[activeCategory].color}
            delay={i * 100}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// SERVICES VIEW
// ============================================
function ServicesView({ section }: { section: ServicesSection }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '15px'
    }}>
      {section.items.map((item) => (
        <div
          key={item.title}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 0, 170, 0.3)',
            transition: 'border-color 0.15s, transform 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#ff00aa'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 0, 170, 0.3)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            color: '#ff00aa',
            fontWeight: '600'
          }}>
            {item.title}
          </h3>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            color: '#aaaacc',
            lineHeight: 1.4
          }}>
            {item.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {item.features.map(f => (
              <span
                key={f}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'rgba(136, 68, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#8844ff'
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// ABOUT VIEW
// ============================================
function AboutView({ section }: { section: AboutSection }) {
  return (
    <div>
      {/* Bio */}
      <p style={{
        fontSize: '16px',
        color: '#ccccdd',
        lineHeight: 1.6,
        marginBottom: '25px',
        padding: '20px',
        background: 'rgba(136, 68, 255, 0.1)',
        borderRadius: '12px',
        borderLeft: '3px solid #8844ff'
      }}>
        {section.bio}
      </p>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {section.stats.map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(136, 68, 255, 0.2)'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '12px', color: '#888899', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '18px', color: '#8844ff', fontWeight: '600' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// PROJECTS VIEW
// ============================================
function ProjectsView({ section }: { section: ProjectsSection }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {section.featured.map((project) => (
        <div
          key={project.title}
          style={{
            display: 'flex',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            alignItems: 'flex-start'
          }}
        >
          <div style={{
            fontSize: '40px',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '12px',
            flexShrink: 0
          }}>
            {project.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffd700' }}>
                {project.title}
              </h3>
              <span style={{ fontSize: '12px', color: '#888899' }}>{project.year}</span>
            </div>
            <p style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              color: '#aaaacc',
              lineHeight: 1.4
            }}>
              {project.description}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {project.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: 'rgba(255, 215, 0, 0.15)',
                    borderRadius: '10px',
                    color: '#ffd700'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// EXPERIENCE VIEW (TIMELINE)
// ============================================
function ExperienceView({ section }: { section: ExperienceSection }) {
  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Timeline line */}
      <div style={{
        position: 'absolute',
        left: '6px',
        top: '8px',
        bottom: '8px',
        width: '2px',
        background: 'linear-gradient(180deg, #00ff88, #8844ff, #ff00aa)'
      }} />

      {section.timeline.map((item, i) => (
        <div
          key={item.period}
          style={{
            position: 'relative',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: i < section.timeline.length - 1
              ? '1px solid rgba(136, 68, 255, 0.1)'
              : 'none'
          }}
        >
          {/* Timeline dot */}
          <div style={{
            position: 'absolute',
            left: '-21px',
            top: '6px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: i === 0 ? '#00ff88' : '#8844ff',
            border: '2px solid #0a0a14',
            boxShadow: `0 0 10px ${i === 0 ? '#00ff88' : '#8844ff'}60`
          }} />

          <div style={{
            fontSize: '12px',
            color: '#00ff88',
            marginBottom: '4px',
            fontWeight: '600'
          }}>
            {item.period}
          </div>
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '16px',
            color: '#ffffff'
          }}>
            {item.role}
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#8844ff',
            marginBottom: '10px'
          }}>
            {item.company}
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '18px',
            color: '#aaaacc',
            fontSize: '13px'
          }}>
            {item.highlights.map((h, j) => (
              <li key={j} style={{ marginBottom: '4px' }}>{h}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ============================================
// CONTACT VIEW
// ============================================
function ContactView({ section }: { section: ContactSection }) {
  const handleClick = (method: typeof section.methods[0]) => {
    playSound('click', 0.5)
    if (method.action === 'email' && method.url) {
      window.location.href = method.url
    } else if (method.action === 'link' && method.url) {
      window.open(method.url, '_blank')
    } else if (method.action === 'copy') {
      navigator.clipboard.writeText(method.value)
    }
  }

  return (
    <div>
      {/* Contact methods */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {section.methods.map(method => (
          <button
            key={method.label}
            onClick={() => handleClick(method)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, transform 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ff4444'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{method.icon}</div>
            <div style={{ fontSize: '12px', color: '#888899', marginBottom: '4px' }}>
              {method.label}
            </div>
            <div style={{ fontSize: '14px', color: '#ff4444' }}>
              {method.value}
            </div>
          </button>
        ))}
      </div>

      {/* Availability */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#00ff88' }}>
          {section.availability}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PROGRESS INDICATOR
// ============================================
function ProgressIndicator({ currentId }: { currentId: string }) {
  const progress = getProgress()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '20px'
    }}>
      {MACHINE_ORDER.map((id, i) => {
        const isVisited = progress.visited.includes(id)
        const isCurrent = id === currentId

        return (
          <div
            key={id}
            style={{
              width: isCurrent ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: isCurrent
                ? SLOT_CONTENT[id].color
                : isVisited
                  ? `${SLOT_CONTENT[id].color}60`
                  : 'rgba(136, 68, 255, 0.2)',
              transition: 'all 0.2s ease',
              boxShadow: isCurrent ? `0 0 10px ${SLOT_CONTENT[id].color}` : 'none'
            }}
            title={`${i + 1}: ${SLOT_CONTENT[id].title}${isVisited ? ' (visited)' : ''}`}
          />
        )
      })}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function InfoModal({ machineId, onClose, onNavigate }: InfoModalProps) {
  const [currentId, setCurrentId] = useState(machineId)
  const section = SLOT_CONTENT[currentId] as SlotSection

  // Mark as visited
  useEffect(() => {
    markVisited(currentId)
  }, [currentId])

  // Navigate to another machine
  const navigateTo = useCallback((id: string) => {
    playSound('modalOpen', 0.4)
    setCurrentId(id)
    onNavigate?.(id)
  }, [onNavigate])

  // Handle CTA click
  const handleCTA = useCallback(() => {
    if (!section.cta) return

    playSound('click', 0.5)
    if (section.cta.machineId) {
      navigateTo(section.cta.machineId)
    } else if (section.cta.external) {
      window.open(section.cta.external, '_blank')
    }
  }, [section.cta, navigateTo])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-6 for direct navigation
      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < MACHINE_ORDER.length) {
          navigateTo(MACHINE_ORDER[index])
        }
        return
      }

      switch (e.code) {
        case 'Escape':
          e.preventDefault()
          playSound('click', 0.4)
          onClose()
          break

        case 'ArrowLeft':
          e.preventDefault()
          navigateTo(getPrevMachine(currentId))
          break

        case 'ArrowRight':
          e.preventDefault()
          navigateTo(getNextMachine(currentId))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [currentId, onClose, navigateTo])

  // Render content based on section type
  const renderContent = () => {
    switch (section.type) {
      case 'skills':
        return <SkillsView section={section as SkillsSection} />
      case 'services':
        return <ServicesView section={section as ServicesSection} />
      case 'about':
        return <AboutView section={section as AboutSection} />
      case 'projects':
        return <ProjectsView section={section as ProjectsSection} />
      case 'experience':
        return <ExperienceView section={section as ExperienceSection} />
      case 'contact':
        return <ContactView section={section as ContactSection} />
      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSound('click', 0.3)
          onClose()
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a14 0%, #12101c 50%, #0a0814 100%)',
          border: `2px solid ${section.color}`,
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '650px',
          width: '95%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: `0 0 60px ${section.color}40, 0 0 120px rgba(0, 0, 0, 0.8)`,
          animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), glowPulse 3s ease-in-out infinite, borderGlow 2s ease-in-out infinite',
          perspective: '1000px'
        }}
      >
        {/* Progress indicator */}
        <ProgressIndicator currentId={currentId} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '36px',
            fontWeight: 'bold',
            color: section.color,
            textShadow: `0 0 20px ${section.color}80, 0 0 40px ${section.color}40`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '3px',
            animation: 'titleReveal 0.6s ease-out 0.1s both'
          }}>
            {section.title}
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#888899',
            fontStyle: 'italic'
          }}>
            {section.tagline}
          </p>
        </div>

        {/* Dynamic content */}
        <div style={{ marginBottom: '25px' }}>
          {renderContent()}
        </div>

        {/* CTA Button */}
        {section.cta && (
          <button
            onClick={handleCTA}
            style={{
              width: '100%',
              padding: '14px',
              background: `linear-gradient(135deg, ${section.color}30, ${section.color}10)`,
              border: `2px solid ${section.color}`,
              borderRadius: '12px',
              color: section.color,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '20px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${section.color}50, ${section.color}30)`
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${section.color}30, ${section.color}10)`
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {section.cta.label} →
          </button>
        )}

        {/* Navigation footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '15px',
          borderTop: '1px solid rgba(136, 68, 255, 0.2)'
        }}>
          {/* Prev button */}
          <button
            onClick={() => navigateTo(getPrevMachine(currentId))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888899',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#00ffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888899'}
          >
            ← {SLOT_CONTENT[getPrevMachine(currentId)].title}
          </button>

          {/* Keyboard hints */}
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '12px',
            color: '#666677'
          }}>
            <span><span style={{ color: '#8844ff' }}>1-6</span> Jump</span>
            <span><span style={{ color: '#8844ff' }}>←→</span> Nav</span>
            <span><span style={{ color: '#8844ff' }}>ESC</span> Close</span>
          </div>

          {/* Next button */}
          <button
            onClick={() => navigateTo(getNextMachine(currentId))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888899',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#00ffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888899'}
          >
            {SLOT_CONTENT[getNextMachine(currentId)].title} →
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.9) rotateX(10deg);
            filter: blur(10px);
          }
          50% {
            filter: blur(2px);
          }
          80% {
            transform: translateY(-5px) scale(1.02) rotateX(-2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0);
          }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 60px ${section.color}40, 0 0 120px rgba(0, 0, 0, 0.8); }
          50% { box-shadow: 0 0 80px ${section.color}60, 0 0 150px rgba(0, 0, 0, 0.9); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: ${section.color}; }
          50% { border-color: ${section.color}cc; }
        }
        @keyframes titleReveal {
          0% {
            opacity: 0;
            letter-spacing: 20px;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            letter-spacing: 3px;
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  )
}

// Legacy export for backward compatibility
export function InfoModalLegacy({ title, content, onClose }: {
  title: string
  content: string[]
  onClose: () => void
}) {
  // Find machine ID from title
  const machineId = Object.keys(SLOT_CONTENT).find(
    k => SLOT_CONTENT[k].title === title
  ) || 'skills'

  return <InfoModal machineId={machineId} onClose={onClose} />
}
