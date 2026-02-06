/**
 * FullscreenToggle - Site-wide fullscreen toggle button
 */

import { useState, useEffect, useCallback } from 'react'

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export function FullscreenToggle() {
  const isMobile = isMobileDevice()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state with actual fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Keyboard shortcut (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger when typing in inputs
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen not supported or denied
      })
    }
  }, [])

  // Hide if browser doesn't support Fullscreen API at all
  if (!document.documentElement.requestFullscreen) {
    return null
  }

  return (
    <div
      onClick={toggleFullscreen}
      style={{
        position: 'fixed',
        top: isMobile ? '20px' : '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: `1px solid ${isFullscreen ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.3)'}`,
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        zIndex: 100,
        transition: 'all 0.2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Fullscreen icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isFullscreen ? '#00ff88' : '#00ffff'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isFullscreen ? (
          <>
            {/* Exit fullscreen arrows (pointing inward) */}
            <polyline points="4 14 8 14 8 18" />
            <polyline points="20 10 16 10 16 6" />
            <polyline points="14 4 14 8 18 8" />
            <polyline points="10 20 10 16 6 16" />
          </>
        ) : (
          <>
            {/* Enter fullscreen arrows (pointing outward) */}
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <polyline points="21 3 14 10" />
            <polyline points="3 21 10 14" />
          </>
        )}
      </svg>

      {/* Label */}
      <span style={{
        color: isFullscreen ? '#00ff88' : '#00ffff',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        {isFullscreen ? 'EXIT' : 'FULL'}
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
          F
        </span>
      )}
    </div>
  )
}
