import type { SlotSection } from '../types'

/**
 * Navigation Helpers - Keyboard navigation utilities for SlotFullScreen
 * Extracted from SlotFullScreen.tsx for reusability
 */

/**
 * Get navigable items from a section for keyboard navigation
 * Flattens section data based on type and returns items with icon, title, subtitle, and details
 */
export function getNavigableItems(section: SlotSection): { icon: string; title: string; subtitle?: string; details: React.ReactNode }[] {
  switch (section.type) {
    case 'skills':
      return section.categories.map(cat => ({
        icon: cat.icon,
        title: cat.name,
        subtitle: `${cat.skills.length} skills`,
        details: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cat.skills.map(skill => (
              <div key={skill.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#fff' }}>{skill.name}</span>
                  <span style={{ color: cat.color, fontWeight: 'bold' }}>{skill.level}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                  <div style={{ width: `${skill.level}%`, height: '100%', background: cat.color, borderRadius: '4px', boxShadow: `0 0 10px ${cat.color}60` }} />
                </div>
              </div>
            ))}
          </div>
        )
      }))
    case 'services':
      return section.items.map(item => ({
        icon: item.icon,
        title: item.title,
        subtitle: item.description.slice(0, 60) + '...',
        details: (
          <div>
            <p style={{ color: '#bbb', lineHeight: 1.8, marginBottom: '20px' }}>{item.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {item.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: section.color }}>✓</span>
                  <span style={{ color: '#aaa' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }))
    case 'about':
      return [
        {
          icon: '👤',
          title: 'Biography',
          subtitle: 'Full story',
          details: <p style={{ color: '#bbb', lineHeight: 2, whiteSpace: 'pre-line' }}>{section.bio}</p>
        },
        ...section.stats.map(stat => ({
          icon: stat.icon,
          title: stat.label,
          subtitle: stat.value,
          details: <div style={{ fontSize: '48px', color: section.color, textAlign: 'center' as const }}>{stat.value}</div>
        }))
      ]
    case 'projects':
      return section.featured.map(proj => ({
        icon: proj.icon,
        title: proj.title,
        subtitle: proj.year,
        details: (
          <div>
            <p style={{ color: '#bbb', lineHeight: 1.8, marginBottom: '20px' }}>{proj.description}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {proj.tags.map(t => (
                <span key={t} style={{ padding: '6px 14px', background: `${section.color}20`, borderRadius: '20px', color: section.color, fontSize: '13px' }}>{t}</span>
              ))}
            </div>
          </div>
        )
      }))
    case 'experience':
      return section.timeline.map(item => ({
        icon: '💼',
        title: item.role,
        subtitle: `${item.company} • ${item.period}`,
        details: (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {item.highlights.map((h, i) => (
              <li key={i} style={{ color: '#aaa', marginBottom: '12px', paddingLeft: '20px', position: 'relative' as const, lineHeight: 1.6 }}>
                <span style={{ position: 'absolute' as const, left: 0, color: section.color }}>•</span>
                {h}
              </li>
            ))}
          </ul>
        )
      }))
    case 'contact':
      return section.methods.map(method => ({
        icon: method.icon,
        title: method.label,
        subtitle: method.value,
        details: (
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>{method.icon}</div>
            <div style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>{method.value}</div>
            <button
              onClick={() => {
                if (method.action === 'email' && method.url) window.location.href = method.url
                else if (method.action === 'link' && method.url) window.open(method.url, '_blank', 'noopener,noreferrer')
                else if (method.action === 'copy') navigator.clipboard.writeText(method.value)
              }}
              style={{
                background: section.color,
                color: '#000',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '20px'
              }}
            >
              {method.action === 'email' ? 'Send Email' : method.action === 'link' ? 'Open Link' : 'Copy to Clipboard'}
            </button>
          </div>
        )
      }))
    default:
      return []
  }
}

/**
 * Get total number of focusable items for a section
 * Must match what the view component renders as focusable items
 * Skills: individual skills across all categories (not category count)
 */
export function getItemCount(section: SlotSection): number {
  switch (section.type) {
    case 'skills': return section.categories.reduce((sum, cat) => sum + cat.skills.length, 0)
    case 'services': return section.items.length
    case 'about': return section.stats.length
    case 'projects': return section.featured.length
    case 'experience': return section.timeline.length
    case 'contact': return section.methods.length
    default: return 0
  }
}

/**
 * Get grid column count for 2D keyboard navigation
 * MUST match the actual grid layout in each view component
 * Used for ArrowUp/ArrowDown to jump by column count
 */
export function getGridColumns(section: SlotSection): number {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  const isMobile = Math.min(w, h) < 600
  const isNarrow = w < 400
  const isTablet = w < 900 && !isMobile
  const isLandscape = w > h

  switch (section.type) {
    case 'skills': {
      // Skills navigate per individual skill — flat list, vertical navigation
      return 1
    }
    case 'services': return isMobile ? (isLandscape ? 4 : 2) : 2
    case 'about': return isMobile ? 3 : Math.min(section.stats.length, 3)
    case 'projects': {
      const count = section.featured.length
      return isMobile ? (isLandscape ? 4 : isNarrow ? 1 : 2) : isTablet ? 3 : (count <= 4 ? 2 : count <= 6 ? 3 : 4)
    }
    case 'experience': {
      const count = section.timeline.length
      return isMobile ? (isLandscape ? 4 : 2) : (count <= 2 ? count : count <= 4 ? 2 : 3)
    }
    case 'contact': {
      const count = section.methods.length
      return isMobile ? (isLandscape ? 4 : 2) : (count <= 2 ? count : count <= 4 ? 2 : 3)
    }
    default: return 1
  }
}
