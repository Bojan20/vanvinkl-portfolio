/**
 * OnboardingTooltip - First-time user guidance
 */

import { useState, useEffect, useCallback } from 'react'

interface OnboardingTooltipProps {
  onDismiss: () => void
}

const tips = [
  { icon: '⌨️', title: 'Move Around', text: 'Use arrow keys or WASD to walk' },
  { icon: '🎰', title: 'Play Slots', text: 'Walk to a machine and press SPACE' },
  { icon: '🔊', title: 'Audio Settings', text: 'Press A for audio controls, M to mute' },
  { icon: '❓', title: 'Need Help?', text: 'Press ? for all keyboard shortcuts' }
]

export function OnboardingTooltip({ onDismiss }: OnboardingTooltipProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const handleNext = useCallback(() => {
    if (step < tips.length - 1) {
      setStep(s => s + 1)
    } else {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }
  }, [step, onDismiss])

  const handleSkip = useCallback(() => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }, [onDismiss])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handleSkip])

  const tip = tips[step]

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(5, 5, 15, 0.95)',
      border: '2px solid rgba(0, 255, 255, 0.4)',
      borderRadius: '20px',
      padding: '24px 32px',
      backdropFilter: 'blur(12px)',
      zIndex: 150,
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: '0 0 40px rgba(0, 255, 255, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5)',
      animation: visible ? 'tooltipSlideUp 0.3s ease-out' : 'tooltipSlideDown 0.3s ease-in',
      opacity: visible ? 1 : 0,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Progress dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {tips.map((_, i) => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i === step ? '#00ffff' : 'rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s ease'
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tip.icon}</div>
        <div style={{
          color: '#00ffff',
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>{tip.title}</div>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px'
        }}>{tip.text}</div>
      </div>

      {/* Keyboard hints */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '20px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <span><kbd style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          marginRight: '6px'
        }}>ESC</kbd> Skip all</span>
        <span><kbd style={{
          background: 'rgba(0,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: '4px',
          marginRight: '6px',
          color: '#00ffff'
        }}>ENTER</kbd> {step < tips.length - 1 ? 'Next' : 'Done'}</span>
      </div>

      <style>{`
        @keyframes tooltipSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes tooltipSlideDown {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
      `}</style>
    </div>
  )
}
