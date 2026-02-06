/**
 * VanVinkl Casino - Portfolio Website
 *
 * AAA Quality cyberpunk casino experience
 * Performance Target: 60fps smooth gameplay
 */

import { Suspense, useState, useCallback, useEffect, useRef, lazy } from 'react'

// UI Components (extracted for maintainability)
import {
  SoundToggle,
  FullscreenToggle,
  SpectrumVisualizer,
  KeyboardShortcutsModal,
  AchievementToast,
  KonamiEasterEgg,
  LoadingScreen,
  AudioSettings,
  KeyboardControlsHint,
  ClickToEnterSplash
} from './components/ui'

// Hooks
import { useKonamiCode } from './hooks/useKonamiCode'
import { usePageVisibility } from './hooks/usePageVisibility'

// Inline mobile detection (avoid importing MobileControls module)
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// Lazy load components (reduce initial bundle - load on demand)
// PERFORMANCE POLICY §4-5: Three.js/R3F/postprocessing deferred via CasinoCanvas
const CasinoCanvas = lazy(() => import('./components/CasinoCanvas').then(m => ({ default: m.CasinoCanvas })))
const SlotFullScreen = lazy(() => import('./components/SlotFullScreen').then(m => ({ default: m.SlotFullScreen })))
const IntroOverlay = lazy(() => import('./components/IntroSequence').then(m => ({ default: m.IntroOverlay })))
const MobileControls = lazy(() => import('./components/MobileControls').then(m => ({ default: m.MobileControls })))
const AudioVolumeSync = lazy(() => import('./components/AudioVolumeSync').then(m => ({ default: m.AudioVolumeSync })))

import {
  WebGLErrorBoundary,
  ContextLostOverlay,
  WebGLNotSupported,
  isWebGLSupported
} from './components/WebGLErrorBoundary'
import { gameRefs } from './store'
// Unified Audio System
import { initUnifiedAudio, unifiedAudio, uaPlay, uaVolume, uaIsPlaying } from './audio'
import { useAudioStore } from './store/audio'
import { achievementStore, type Achievement } from './store/achievements'
import { trackSession } from './hooks/useAnalytics'
import { useQualityStore, initQualitySystem } from './store/quality'
import { FPSMonitor } from './utils/performance'
import { safeGetLocalStorage, safeSetLocalStorage } from './utils/security'


export function App() {
  const [showSplash, setShowSplash] = useState(true) // Click to enter splash
  const [showIntro, setShowIntro] = useState(false) // Intro waits for splash
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [cameraComplete, setCameraComplete] = useState(false)
  const [spinningSlot, setSpinningSlot] = useState<string | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [konamiActive, resetKonami] = useKonamiCode()
  const [tabVisible, setTabVisible] = useState(true)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)

  // LIFECYCLE POLICY §6 — Suspend on tab hidden, resume on visible
  usePageVisibility({
    onHidden: () => setTabVisible(false),
    onVisible: () => setTabVisible(true)
  })
  const [_isSitting, setIsSitting] = useState(false)
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false)


  // Track session on mount
  useEffect(() => {
    trackSession()
  }, [])

  // Initialize quality system - detect device tier
  useEffect(() => {
    initQualitySystem()
    console.log('[Quality] System initialized, device tier detected')
  }, [])

  // FPS Monitoring - adaptive quality adjustment
  useEffect(() => {
    const updateFPS = useQualityStore.getState().updateFPS
    const monitor = new FPSMonitor()
    monitor.start()

    // Update store every 500ms (balance between responsiveness and overhead)
    const interval = setInterval(() => {
      const fps = monitor.getFPS()
      updateFPS(fps)
    }, 500)

    return () => {
      clearInterval(interval)
      monitor.stop()
    }
  }, [])

  // Handle splash click - init audio and start intro
  const handleSplashEnter = useCallback(async () => {
    // Initialize Unified Audio System (single AudioContext - replaces legacy systems)
    await initUnifiedAudio()
    // Preload critical sounds (lounge already plays, preload UI + slot sounds)
    unifiedAudio.preload(['footstep1', 'footstep2', 'reelStop1', 'reelStop2', 'reelStop3', 'winSmall', 'spinLoop'])
    console.log('[Audio] Unified system initialized, critical sounds preloading...')

    // Always try to play music (mute state is handled by masterGain)
    uaPlay('lounge')
    // Set initial music volume from store (default 50%)
    const { musicVolume } = useAudioStore.getState()
    uaVolume('music', musicVolume)

    // Hide splash
    setShowSplash(false)

    // Always show intro on fresh load (new user, new session)
    // Intro can be skipped with ESC/ENTER but doesn't persist
    setShowIntro(true)
    console.log('[Intro] Starting intro animation')
  }, [])

  // Subscribe to achievement unlocks
  useEffect(() => {
    const unsubscribe = achievementStore.onUnlock((achievement) => {
      setUnlockedAchievement(achievement)
    })
    return unsubscribe
  }, [])

  // Track Konami code for achievement
  useEffect(() => {
    if (konamiActive) {
      achievementStore.trackKonami()
    }
  }, [konamiActive])

  // Track spinningSlot as ref for gesture handlers (avoids stale closures)
  const spinningSlotRef = useRef(spinningSlot)
  spinningSlotRef.current = spinningSlot

  // Mobile movement ref - updated by joystick
  const mobileMovementRef = useRef({ x: 0, y: 0 })

  // Check for mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Mobile gestures: edge swipe back + pull-to-refresh
  useEffect(() => {
    if (!isMobile) return

    let startX = 0
    let startY = 0
    let startTime = 0
    let pulling = false
    let pullIndicator: HTMLDivElement | null = null

    const createPullIndicator = () => {
      const el = document.createElement('div')
      el.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, transparent, #00ff88, transparent);
        transform: scaleX(0); transform-origin: center;
        transition: transform 0.1s ease-out; z-index: 99999;
        pointer-events: none;
      `
      document.body.appendChild(el)
      return el
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
      pulling = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const dy = touch.clientY - startY
      const dx = touch.clientX - startX

      // Pull-to-refresh: vertical pull down, minimal horizontal movement
      if (dy > 20 && Math.abs(dx) < dy * 0.5) {
        pulling = true
        if (!pullIndicator) pullIndicator = createPullIndicator()
        const progress = Math.min(dy / 120, 1)
        pullIndicator.style.transform = `scaleX(${progress})`
        if (progress >= 1) {
          pullIndicator.style.background = 'linear-gradient(90deg, transparent, #ff00aa, transparent)'
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const dt = Date.now() - startTime

      // Remove pull indicator
      if (pullIndicator) {
        pullIndicator.remove()
        pullIndicator = null
      }

      // Pull-to-refresh: pulled down >120px (skip when slot is open)
      if (!spinningSlotRef.current && pulling && dy > 120 && dt < 1500) {
        window.location.reload()
        return
      }

      // Edge swipe back: started from left 30px edge, swiped right >80px
      // Skip when slot is open — SlotFullScreen has its own swipe handler
      if (!spinningSlotRef.current && startX < 30 && dx > 80 && dt < 600 && Math.abs(dx) > Math.abs(dy) * 2) {
        history.back()
        return
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      if (pullIndicator) pullIndicator.remove()
    }
  }, [isMobile])

  // Global keyboard shortcuts (? for help)
  // Note: M for mute is handled by SoundToggle component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? or / for help (Shift+/ = ?)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setShowHelp(prev => !prev)
      }
      // ESC closes help
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  // Browser back button / edge swipe closes slot via popstate
  const closingViaEscRef = useRef(false)
  useEffect(() => {
    const handlePopState = () => {
      // Skip if slot is already closing via ESC/onClose
      if (closingViaEscRef.current) {
        closingViaEscRef.current = false
        return
      }
      if (spinningSlot) {
        setSpinningSlot(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [spinningSlot])

  // Check WebGL support
  if (!isWebGLSupported()) {
    return <WebGLNotSupported />
  }

  const handleSlotSpin = useCallback((machineId: string) => {
    setSpinningSlot(machineId)
    // Push history entry so browser back closes the slot
    history.pushState({ slot: machineId }, '')
  }, [])

  const handleIntroOverlayComplete = useCallback(() => {
    setOverlayComplete(true)
  }, [])

  const handleIntroCameraComplete = useCallback(() => {
    setCameraComplete(true)
  }, [])

  // End intro when BOTH camera and overlay are complete
  useEffect(() => {
    if (overlayComplete && cameraComplete) {
      setShowIntro(false)
    }
  }, [overlayComplete, cameraComplete])

  // Mobile joystick handler - directly updates gameRefs for zero latency
  const handleMobileMove = useCallback((x: number, y: number) => {
    mobileMovementRef.current.x = x
    mobileMovementRef.current.y = y
    // Update game refs directly - Avatar component reads these
    gameRefs.isMoving = x !== 0 || y !== 0
  }, [])

  // Mobile action button - simulates SPACE key
  const handleMobileAction = useCallback(() => {
    // Dispatch a synthetic keydown event for SPACE
    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true
    })
    window.dispatchEvent(event)
  }, [])

  // Context lost handler
  const handleContextLost = useCallback(() => {
    setContextLost(true)
  }, [])

  // Show context lost overlay
  if (contextLost) {
    return <ContextLostOverlay />
  }

  return (
    <WebGLErrorBoundary>
      {/* Global audio volume synchronization */}
      <AudioVolumeSync />

      {/* 3D Scene — lazy loaded (PERFORMANCE POLICY §4-5: Three.js deferred from initial bundle) */}
      <Suspense fallback={<LoadingScreen />}>
        <CasinoCanvas
          isMobile={isMobile}
          tabVisible={tabVisible}
          showIntro={showIntro}
          spinningSlot={spinningSlot}
          audioSettingsOpen={audioSettingsOpen}
          mobileMovementRef={mobileMovementRef}
          onSlotSpin={handleSlotSpin}
          onSitChange={setIsSitting}
          onIntroCameraComplete={handleIntroCameraComplete}
          onContextLost={handleContextLost}
        />
      </Suspense>

      {/* Sound Toggle - always visible after intro */}
      {!showIntro && <SoundToggle />}

      {/* Fullscreen Toggle - top-right corner */}
      {!showIntro && <FullscreenToggle />}

      {/* Audio Settings - keyboard-controlled panel (A key to open) */}
      {!showIntro && <AudioSettings disabled={!!spinningSlot} isOpen={audioSettingsOpen} setIsOpen={setAudioSettingsOpen} />}

      {/* Spectrum Visualizer - audio reactive bars */}
      {!showIntro && !spinningSlot && !isMobile && (
        <SpectrumVisualizer />
      )}

      {/* Keyboard Controls Hint - arrow keys + space at bottom center */}
      {!showIntro && !spinningSlot && !isMobile && (
        <KeyboardControlsHint />
      )}

      {/* Mobile Controls - only on mobile devices */}
      {!showIntro && !spinningSlot && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          visible={isMobile}
        />
      )}

      {/* Intro overlay - glitch text with ESC/ENTER skip */}
      <IntroOverlay
        active={showIntro}
        onComplete={handleIntroOverlayComplete}
      />

      {/* Full screen slot experience - includes content after spin */}
      {spinningSlot && (
        <Suspense fallback={null}>
          <SlotFullScreen
            machineId={spinningSlot}
            onClose={() => {
              setSpinningSlot(null)
              // Pop the history entry we pushed when slot opened
              if (history.state?.slot) {
                closingViaEscRef.current = true
                history.back()
              }
              // Reset quality to AUTO when returning to lounge (remove blur)
              const qualityStore = useQualityStore.getState()
              if (qualityStore.resolvedQuality === 'low') {
                qualityStore.setPreset('auto')
                console.log('[Quality] Slot closed - reset to AUTO (remove blur)')
              }
              // Resume lounge music — ALWAYS restart + force volume
              // SlotFullScreen may have stopped lounge or left music bus at 0
              const { musicVolume } = useAudioStore.getState()
              uaVolume('music', 0, 0) // Instant zero (cancel any stale ramp)
              if (!uaIsPlaying('lounge')) {
                uaPlay('lounge')
              }
              // Fade in from 0 to stored volume over 500ms
              setTimeout(() => uaVolume('music', musicVolume, 0.5), 50)
              console.log(`[Music] Slot closed - lounge resumed, fade to ${musicVolume.toFixed(2)}`)
            }}
            onNavigate={(machineId) => {
              setSpinningSlot(machineId)
              // Replace current history entry (don't stack multiple slot entries)
              history.replaceState({ slot: machineId }, '')
            }}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Konami Code Easter Egg */}
      <KonamiEasterEgg active={konamiActive} onComplete={resetKonami} />

      {/* Achievement Toast */}
      <AchievementToast
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      {/* Onboarding tooltip removed - controls hint already shown at bottom of screen */}

      {/* Click to Enter Splash - first thing user sees */}
      {showSplash && <ClickToEnterSplash onEnter={handleSplashEnter} />}
    </WebGLErrorBoundary>
  )
}
