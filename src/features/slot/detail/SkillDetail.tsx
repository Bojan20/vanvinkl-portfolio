/**
 * SkillDetail - Skill modal content with animated progress bar
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { memo } from 'react'

interface SkillData {
  name: string
  level: number
  category: string
  categoryColor: string
  categoryIcon: string
}

interface SkillDetailProps {
  data: SkillData
  showContent: boolean
  barAnimated: boolean
}

export const SkillDetail = memo(function SkillDetail({
  data: skill,
  showContent,
  barAnimated
}: SkillDetailProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Animated icon with glow pulse */}
      <div style={{
        fontSize: '80px',
        marginBottom: '24px',
        animation: 'modalIconPulse 2s ease-in-out infinite',
        filter: `drop-shadow(0 0 30px ${skill.categoryColor})`
      }}>{skill.categoryIcon}</div>

      {/* Category badge */}
      <div style={{
        display: 'inline-block',
        color: skill.categoryColor,
        fontSize: '12px',
        letterSpacing: '4px',
        marginBottom: '16px',
        padding: '8px 20px',
        background: `${skill.categoryColor}15`,
        borderRadius: '30px',
        border: `1px solid ${skill.categoryColor}40`,
        textTransform: 'uppercase',
        animation: showContent ? 'modalBadgeReveal 0.5s ease-out' : 'none',
        opacity: showContent ? 1 : 0
      }}>{skill.category}</div>

      {/* Skill name with glitch effect */}
      <h2 style={{
        margin: '0 0 40px 0',
        fontSize: '48px',
        color: '#fff',
        fontWeight: 900,
        textShadow: `0 0 20px ${skill.categoryColor}60, 0 0 40px ${skill.categoryColor}30`,
        animation: showContent ? 'modalTitleReveal 0.6s ease-out 0.1s both' : 'none'
      }}>{skill.name}</h2>

      {/* Premium progress bar */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '24px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
      }}>
        {/* Animated fill */}
        <div style={{
          width: barAnimated ? `${skill.level}%` : '0%',
          height: '100%',
          background: `linear-gradient(90deg, ${skill.categoryColor}80, ${skill.categoryColor}, ${skill.categoryColor}80)`,
          borderRadius: '12px',
          boxShadow: `0 0 30px ${skill.categoryColor}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}>
          {/* Shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
            borderRadius: '12px 12px 0 0'
          }} />
          {/* Moving sparkle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #fff, 0 0 20px #fff',
            animation: barAnimated ? 'modalSparkle 1s ease-in-out infinite' : 'none',
            opacity: barAnimated ? 1 : 0
          }} />
        </div>
        {/* Grid lines */}
        {[25, 50, 75].map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pos}%`,
            width: '1px',
            background: 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>

      {/* Percentage with counter animation */}
      <div style={{
        fontSize: '64px',
        fontWeight: 900,
        color: skill.categoryColor,
        textShadow: `0 0 40px ${skill.categoryColor}80`,
        fontFamily: 'monospace'
      }}>{barAnimated ? skill.level : 0}%</div>
      <div style={{
        color: '#666',
        marginTop: '8px',
        fontSize: '14px',
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>Proficiency Level</div>
    </div>
  )
})
