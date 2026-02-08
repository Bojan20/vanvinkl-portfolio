/**
 * FullscreenToggle - Site-wide fullscreen toggle button
 * Works in lounge AND inside slot views (z-index above SlotFullScreen)
 * Cross-browser: standard + webkit (iOS Safari)
 *
 * Mobile rotation handling:
 * - screen.orientation.lock('any') prevents Chrome from exiting FS on rotation
 * - Fallback: auto re-enter fullscreen if browser exits during rotation
 */

import { useState, useEffect, useCallback, useRef } from 'react'

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
    el.requestFullscreen().then(() => {
      // Lock orientation to 'any' — prevents browser from exiting fullscreen on rotation
      // Also lock to 'natural' first then 'any' — some browsers need the initial lock
      try {
        const so = screen.orientation as any
        if (so.lock) {
          so.lock('any').catch(() => {
            // Fallback: try 'natural' which has better support
            so.lock('natural').catch(() => {})
          })
        }
      } catch {}
    }).catch(() => {})
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen()
  }
}

function exitFullscreen() {
  // Unlock orientation when exiting fullscreen
  try { screen.orientation.unlock() } catch {}
  const doc = document as Document & { webkitExitFullscreen?: () => void }
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  } else if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen()
  }
}

export function FullscreenToggle({ compact = false, hidden = false }: { compact?: boolean, hidden?: boolean } = {}) {
  const isMobile = isMobileDevice()
  const [isFullscreen, setIsFullscreen] = useState(isInFullscreen)
  // Track whether USER intentionally wants fullscreen (vs browser auto-exiting on rotation)
  const userWantsFullscreenRef = useRef(isInFullscreen())
  // Track if currently rotating (to distinguish rotation exit from user exit)
  const rotatingRef = useRef(false)

  // Sync state with actual fullscreen changes
  useEffect(() => {
    const onChange = () => {
      const inFS = isInFullscreen()
      setIsFullscreen(inFS)

      // If fullscreen was exited by user (not rotation), clear intent
      // For rotation exits, the orientationchange handler below handles re-entry
      if (!inFS && userWantsFullscreenRef.current && !rotatingRef.current) {
        // Not a rotation — user or browser intentionally exited
        setTimeout(() => {
          if (!isInFullscreen()) {
            userWantsFullscreenRef.current = false
          }
        }, 500)
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Re-enter fullscreen on orientation change (rotation)
  // orientationchange is treated as user-initiated by some browsers,
  // allowing requestFullscreen() to succeed without a tap
  useEffect(() => {
    if (!isMobile) return

    const onOrientationChange = () => {
      if (!userWantsFullscreenRef.current) return

      rotatingRef.current = true
      setTimeout(() => { rotatingRef.current = false }, 1000)

      // Try re-enter from orientationchange (some browsers treat as user-initiated)
      if (!isInFullscreen()) {
        enterFullscreen()
      }
      // Backup attempts at staggered intervals — different browsers settle at different times
      const delays = [100, 250, 500]
      const timers = delays.map(d => setTimeout(() => {
        if (!isInFullscreen() && userWantsFullscreenRef.current) {
          enterFullscreen()
        }
      }, d))
      // Store timers for cleanup — use closure
      ;(onOrientationChange as any)._timers = timers
    }

    // Also listen to resize — fires after orientation settles, more reliable than orientationchange alone
    const onResize = () => {
      if (!userWantsFullscreenRef.current || isInFullscreen()) return
      // Only act during rotation window
      if (!rotatingRef.current) return
      enterFullscreen()
    }

    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('resize', onResize)
      // Clear any pending timers
      const timers = (onOrientationChange as any)._timers
      if (timers) timers.forEach((t: number) => clearTimeout(t))
    }
  }, [isMobile])

  const toggleFullscreen = useCallback(() => {
    if (isInFullscreen()) {
      userWantsFullscreenRef.current = false
      exitFullscreen()
    } else {
      userWantsFullscreenRef.current = true
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

  // Hidden mode: mount component (keep useEffect handlers active for rotation re-entry) but render nothing visible
  if (hidden) {
    return null
  }

  return (
    <div
      onClick={toggleFullscreen}
      role="button"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      style={{
        position: 'fixed',
        top: compact
          ? (isMobile ? 'max(16px, env(safe-area-inset-top, 0px))' : '64px')
          : (isMobile ? 'max(16px, env(safe-area-inset-top, 0px))' : '20px'),
        right: isMobile ? 'max(16px, env(safe-area-inset-right, 0px))' : '20px',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '0' : '8px',
        padding: compact ? (isMobile ? '12px' : '8px 12px') : (isMobile ? '12px 14px' : '10px 16px'),
        background: 'rgba(5, 5, 15, 0.75)',
        border: `1px solid ${isFullscreen ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 255, 0.3)'}`,
        borderRadius: compact ? (isMobile ? '50%' : '20px') : '20px',
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

      {/* Label - hidden in compact mode */}
      {!compact && (
        <span style={{
          color: isFullscreen ? '#00ff88' : '#00ffff',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          {isFullscreen ? 'EXIT' : 'FULL'}
        </span>
      )}

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
