/**
 * FullscreenToggle - Site-wide fullscreen toggle button
 * Works in lounge AND inside slot views (z-index above SlotFullScreen)
 * Cross-browser: standard + webkit (iOS Safari)
 */

import { useState, useEffect, useCallback } from 'react'

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// Cross-browser fullscreen helpers
function canFullscreen(): boolean {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
  return !!(el.requestFullscreen || el.webkitRequestFullscreen)
}

function isInFullscreen(): boolean {
  return !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement)
}

function enterFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {})
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen()
  }
}

function exitFullscreen() {
  const doc = document as Document & { webkitExitFullscreen?: () => void }
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  } else if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen()
  }
}

export function FullscreenToggle() {
  const isMobile = isMobileDevice()
  const [isFullscreen, setIsFullscreen] = useState(isInFullscreen)

  // Sync state with actual fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onChange = () => setIsFullscreen(isInFullscreen())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (isInFullscreen()) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [])

  // Keyboard shortcut (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen])

  // Hide if browser doesn't support Fullscreen API at all
  if (!canFullscreen()) {
    return null
  }

  return (
    <div
      onClick={toggleFullscreen}
      role="button"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      style={{
        position: 'fixed',
        top: isMobile ? 'max(16px, env(safe-area-inset-top, 0px))' : '20px',
        right: isMobile ? 'max(16px, env(safe-area-inset-right, 0px))' : '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: isMobile ? '12px 14px' : '10px 16px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: `1px solid ${isFullscreen ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.3)'}`,
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        zIndex: 10000,
        transition: 'all 0.2s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none' as const
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
