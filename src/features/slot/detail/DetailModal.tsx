/**
 * DetailModal - Main modal wrapper with routing
 *
 * PRODUCTION CODE - AAA quality modal with cinematic effects and staggered animations
 *
 * Routes to correct detail component based on item type:
 * - skill → SkillDetail
 * - service → ServiceDetail
 * - project → ProjectDetail
 * - experience → ExperienceDetail
 * - stat → StatDetail
 */

import { useState, useEffect, memo } from 'react'
import { SkillDetail } from './SkillDetail'
import { ServiceDetail } from './ServiceDetail'
import { ProjectDetail } from './ProjectDetail'
import { ExperienceDetail } from './ExperienceDetail'
import { StatDetail } from './StatDetail'

interface DetailModalProps {
  item: { type: string; index: number; data: unknown }
  primaryColor: string
  onClose: () => void
}

const DetailModal = memo(function DetailModal({
  item,
  primaryColor,
  onClose
}: DetailModalProps) {
  const [showContent, setShowContent] = useState(false)
  const [barAnimated, setBarAnimated] = useState(false)

  // Staggered reveal animation
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 100)
    const t2 = setTimeout(() => setBarAnimated(true), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const renderContent = () => {
    switch (item.type) {
      case 'skill':
        return (
          <SkillDetail
            data={item.data as any}
            showContent={showContent}
            barAnimated={barAnimated}
          />
        )
      case 'service':
        return (
          <ServiceDetail
            data={item.data as any}
            showContent={showContent}
          />
        )
      case 'project':
        return (
          <ProjectDetail
            data={item.data as any}
            showContent={showContent}
          />
        )
      case 'experience':
        return (
          <ExperienceDetail
            data={item.data as any}
            showContent={showContent}
          />
        )
      case 'stat':
        return (
          <StatDetail
            data={item.data as any}
            showContent={showContent}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 'max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))',
        animation: 'modalBackdropReveal 0.4s ease-out forwards'
      }}
    >
      {/* Cinematic light rays */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200vw',
        height: '200vh',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse at center, ${primaryColor}20 0%, transparent 50%)`,
        animation: 'modalLightPulse 3s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Corner decorations (hidden on mobile - saves space) */}
      {!window.matchMedia('(pointer: coarse)').matches && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner, i) => (
        <div key={corner} style={{
          position: 'absolute',
          [corner.includes('top') ? 'top' : 'bottom']: '20px',
          [corner.includes('left') ? 'left' : 'right']: '20px',
          width: '60px',
          height: '60px',
          borderTop: corner.includes('top') ? `2px solid ${primaryColor}60` : 'none',
          borderBottom: corner.includes('bottom') ? `2px solid ${primaryColor}60` : 'none',
          borderLeft: corner.includes('left') ? `2px solid ${primaryColor}60` : 'none',
          borderRight: corner.includes('right') ? `2px solid ${primaryColor}60` : 'none',
          animation: `modalCornerReveal 0.5s ease-out ${0.1 * i}s both`,
          pointerEvents: 'none'
        }} />
      ))}

      {/* Mobile back button */}
      {window.matchMedia('(pointer: coarse)').matches && (
        <div
          onClick={(e) => { e.stopPropagation(); onClose() }}
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            left: 'max(16px, env(safe-area-inset-left, 0px))',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${primaryColor}50`,
            color: primaryColor,
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 2001,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'modalCardReveal 0.3s ease-out'
          }}
        >
          ← BACK
        </div>
      )}

      {/* Main modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #18182e 0%, #0c0c18 100%)',
          borderRadius: window.innerWidth > window.innerHeight && Math.min(window.innerWidth, window.innerHeight) < 600 ? '16px' : '28px',
          padding: window.innerWidth > window.innerHeight && Math.min(window.innerWidth, window.innerHeight) < 600 ? '14px 18px' : 'clamp(20px, 5vw, 60px)',
          maxWidth: '650px',
          width: '90%',
          maxHeight: '85dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch' as any,
          border: `2px solid ${primaryColor}50`,
          boxShadow: `
            0 0 80px ${primaryColor}40,
            0 0 120px ${primaryColor}20,
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 0 40px rgba(0,0,0,0.5)
          `,
          animation: 'modalCardReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative'
        }}
      >
        {/* Top shine line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${primaryColor}80, transparent)`,
          animation: 'modalShineMove 3s linear infinite'
        }} />

        {/* Content */}
        {renderContent()}

        {/* Close hint with enhanced style */}
        <div style={{
          marginTop: window.innerWidth > window.innerHeight && Math.min(window.innerWidth, window.innerHeight) < 600 ? '8px' : 'clamp(20px, 4vw, 50px)',
          textAlign: 'center',
          color: '#444',
          fontSize: window.innerWidth > window.innerHeight && Math.min(window.innerWidth, window.innerHeight) < 600 ? '11px' : '14px',
          animation: 'modalHintReveal 0.5s ease-out 0.5s both'
        }}>
          {window.matchMedia('(pointer: coarse)').matches ? (
            <>Tap outside or ← BACK to close</>
          ) : (
            <>Press <span style={{
              color: primaryColor,
              padding: '6px 16px',
              background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
              borderRadius: '8px',
              border: `1px solid ${primaryColor}40`,
              fontWeight: 600,
              boxShadow: `0 2px 10px ${primaryColor}20`
            }}>ESC</span> to close</>
          )}
        </div>
      </div>
    </div>
  )
})

export default DetailModal
