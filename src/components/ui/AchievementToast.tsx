/**
 * AchievementToast - Shows achievement unlock notification
 */

import { useEffect, useState } from 'react'
import type { Achievement } from '../../store/achievements'

interface AchievementToastProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setVisible(true)
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300) // Wait for fade out
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: 'rgba(5, 5, 15, 0.95)',
      border: '2px solid rgba(255, 215, 0, 0.6)',
      borderRadius: '16px',
      padding: '16px 24px',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 0 40px rgba(255, 215, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5)',
      animation: visible ? 'achievementIn 0.4s ease-out' : 'achievementOut 0.3s ease-in',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(100px)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ fontSize: '36px' }}>{achievement.icon}</div>
      <div>
        <div style={{
          color: '#ffd700',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          marginBottom: '4px'
        }}>
          ACHIEVEMENT UNLOCKED
        </div>
        <div style={{
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {achievement.title}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px',
          marginTop: '2px'
        }}>
          {achievement.description}
        </div>
      </div>

      <style>{`
        @keyframes achievementIn {
          from { opacity: 0; transform: translateX(100px) scale(0.8); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes achievementOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100px); }
        }
      `}</style>
    </div>
  )
}
