/**
 * ExperienceDetail - Experience modal content with timeline
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { memo } from 'react'

interface ExperienceData {
  period: string
  role: string
  company: string
  highlights: string[]
}

interface ExperienceDetailProps {
  data: ExperienceData
  showContent: boolean
}

export const ExperienceDetail = memo(function ExperienceDetail({
  data: exp,
  showContent
}: ExperienceDetailProps) {
  return (
    <div>
      {/* Timeline badge */}
      <div style={{
        display: 'inline-block',
        color: '#00ff88',
        fontSize: '14px',
        marginBottom: '16px',
        letterSpacing: '3px',
        padding: '10px 24px',
        background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))',
        borderRadius: '30px',
        border: '1px solid rgba(0,255,136,0.4)',
        boxShadow: '0 0 20px rgba(0,255,136,0.2)',
        animation: 'modalPeriodGlow 2s ease-in-out infinite'
      }}>{exp.period}</div>

      <h2 style={{
        margin: '0 0 12px 0',
        fontSize: '40px',
        color: '#fff',
        fontWeight: 900,
        textShadow: '0 0 20px rgba(0,255,136,0.3)',
        animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
      }}>{exp.role}</h2>

      <div style={{
        color: '#666',
        fontSize: '22px',
        marginBottom: '35px',
        fontWeight: 500,
        animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
      }}>{exp.company}</div>

      {/* Animated highlights */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {exp.highlights.map((h, i) => (
          <li key={i} style={{
            color: '#aaa',
            fontSize: '16px',
            marginBottom: '18px',
            lineHeight: 1.8,
            paddingLeft: '32px',
            position: 'relative',
            animation: showContent ? `modalHighlightReveal 0.5s ease-out ${0.2 + i * 0.1}s both` : 'none'
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: '2px',
              color: '#00ff88',
              fontSize: '18px',
              textShadow: '0 0 10px rgba(0,255,136,0.5)'
            }}>▸</span>
            {h}
          </li>
        ))}
      </ul>
    </div>
  )
})
