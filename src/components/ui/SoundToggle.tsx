/**
 * SoundToggle - Persistent mute control
 */

import { useState, useEffect } from 'react'
import { uaMute } from '../../audio'
import { safeGetLocalStorage, safeSetLocalStorage } from '../../utils/security'

// Inline mobile detection
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export function SoundToggle() {
  const isMobile = isMobileDevice()
  const [isMuted, setIsMuted] = useState(() => {
    return safeGetLocalStorage('vanvinkl-muted') === 'true'
  })

  // Initial mute state sync
  useEffect(() => {
    uaMute(isMuted)
  }, [])

  // Keyboard shortcut (M key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsMuted(prev => {
          const newState = !prev
          uaMute(newState)
          safeSetLocalStorage('vanvinkl-muted', String(newState))
          return newState
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleMute = () => {
    setIsMuted(prev => {
      const newState = !prev
      uaMute(newState)
      safeSetLocalStorage('vanvinkl-muted', String(newState))
      return newState
    })
  }

  return (
    <div
      onClick={toggleMute}
      style={{
        position: 'fixed',
        top: isMobile ? '20px' : '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: `1px solid ${isMuted ? 'rgba(255, 60, 60, 0.4)' : 'rgba(0, 255, 255, 0.3)'}`,
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        zIndex: 100,
        transition: 'all 0.2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Sound icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isMuted ? '#ff4444' : '#00ffff'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {isMuted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>

      {/* Label */}
      <span style={{
        color: isMuted ? '#ff4444' : '#00ffff',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        {isMuted ? 'MUTED' : 'SOUND'}
      </span>

      {/* Keyboard hint - desktop only */}
      {!isMobile && (
        <span style={{
          padding: '2px 6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          color: '#666',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}>
          M
        </span>
      )}
    </div>
  )
}
