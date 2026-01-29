/**
 * KonamiEasterEgg - Shows easter egg when Konami code is entered
 */

import { useEffect, useState } from 'react'

interface KonamiEasterEggProps {
  active: boolean
  onComplete: () => void
}

export function KonamiEasterEgg({ active, onComplete }: KonamiEasterEggProps) {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'message' | 'done'>('idle')

  useEffect(() => {
    if (!active) return

    // Sequence: flash → message → fade out
    setPhase('flash')
    const flashTimer = setTimeout(() => setPhase('message'), 200)
    const messageTimer = setTimeout(() => setPhase('done'), 3000)
    const completeTimer = setTimeout(() => {
      setPhase('idle')
      onComplete()
    }, 3500)

    return () => {
      clearTimeout(flashTimer)
      clearTimeout(messageTimer)
      clearTimeout(completeTimer)
    }
  }, [active, onComplete])

  if (phase === 'idle') return null

  return (
    <>
      {/* Full screen flash */}
      {phase === 'flash' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#fff',
          zIndex: 60000,
          animation: 'konamiFlash 0.2s ease-out'
        }} />
      )}

      {/* Message overlay */}
      {(phase === 'message' || phase === 'done') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 60000,
          opacity: phase === 'done' ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'konamiBounce 0.5s ease-out'
          }}>
            🎮
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffd700',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
            letterSpacing: '8px',
            animation: 'konamiText 0.5s ease-out'
          }}>
            KONAMI CODE!
          </div>
          <div style={{
            marginTop: '16px',
            color: '#00ffff',
            fontSize: '14px',
            letterSpacing: '4px'
          }}>
            ↑↑↓↓←→←→BA
          </div>
          <div style={{
            marginTop: '24px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px'
          }}>
            Old school gamer detected!
          </div>
        </div>
      )}

      <style>{`
        @keyframes konamiFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes konamiBounce {
          0% { transform: scale(0) rotate(-180deg); }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes konamiText {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
