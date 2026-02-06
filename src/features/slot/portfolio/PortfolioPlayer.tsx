/**
 * PortfolioPlayer - Full-Screen Video Player with Dual Audio Sync
 *
 * PLAYBACK STATE MACHINE (FluxForge-style lifecycle):
 *   Idle → Prepared → Playing → Paused → Released
 *
 * - prepare() valid only from Idle → Prepared (idempotent from Prepared/Playing)
 * - start()  valid only from Prepared/Paused → Playing (NOOP from Playing)
 * - pause()  valid only from Playing → Paused
 * - release() from any → Released (cleanup, only way to re-prepare)
 *
 * AUDIO ARCHITECTURE:
 * - Video element is ALWAYS MUTED (video.muted = true)
 * - Audio routed exclusively through <audio> refs (music + SFX)
 * - Single transport.start() gate — no duplicate .play() calls
 * - No currentTime=0, load(), or src changes after initial mount
 *
 * KEYBOARD CONTROLS:
 * - Arrow Left/Right: Navigate focus (4 items)
 * - Arrow Up/Down: Adjust volume (on slider focus)
 * - Space: Play/Pause video
 * - Enter: Toggle mute (on mute button focus)
 * - Escape: Exit player
 * - Double Click: Toggle fullscreen
 */

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { uaPlaySynth } from '../../../audio'
import { isValidMediaPath } from '../../../utils/security'

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// ============================================================
// PLAYBACK STATE MACHINE
// ============================================================
type PlayState = 'idle' | 'prepared' | 'playing' | 'paused' | 'released'

interface PortfolioPlayerProps {
  project: {
    icon: string
    title: string
    description: string
    year: string
    tags: string[]
    videoPath?: string
    posterPath?: string
    musicPath?: string
    sfxPath?: string
  }
  onBack: () => void
}

const PortfolioPlayer = memo(function PortfolioPlayer({
  project,
  onBack
}: PortfolioPlayerProps) {
  // Reactive portrait detection
  const [isMobilePortrait, setIsMobilePortrait] = useState(
    () => isMobile && typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  )

  // SECURITY: Validate media paths before use
  const safeVideoPath = isValidMediaPath(project.videoPath) ? project.videoPath : undefined
  const safePosterPath = isValidMediaPath(project.posterPath) ? project.posterPath : undefined
  const safeMusicPath = isValidMediaPath(project.musicPath) ? project.musicPath : undefined
  const safeSfxPath = isValidMediaPath(project.sfxPath) ? project.sfxPath : undefined

  // LOCAL state for video player volumes (100% default, NOT synced with lounge)
  const [musicVolume, setMusicVolume] = useState(1.0)
  const [sfxVolume, setSfxVolume] = useState(1.0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)
  const sfxRef = useRef<HTMLAudioElement>(null)
  const [showContent, setShowContent] = useState(false)
  const [focusIndex, setFocusIndex] = useState(1)
  const [musicMuted, setMusicMuted] = useState(false)
  const [sfxMuted, setSfxMuted] = useState(false)
  const [_isFullscreen, setIsFullscreen] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [_videoDuration, setVideoDuration] = useState(0)

  // ============================================================
  // STATE MACHINE — single source of truth for playback
  // ============================================================
  const playStateRef = useRef<PlayState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)

  // Focus items count
  const _FOCUS_ITEMS = 4

  /**
   * prepare() — Idle → Prepared
   * Idempotent: NOOP from Prepared or Playing
   * Ensures video readyState >= HAVE_FUTURE_DATA before resolving
   */
  const prepare = useCallback(async () => {
    const state = playStateRef.current
    if (state === 'prepared' || state === 'playing') return // idempotent
    if (state === 'released') return // cannot prepare after release

    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    // Wait for video to be ready enough
    if (video.readyState < 3) { // HAVE_FUTURE_DATA
      await new Promise<void>((resolve) => {
        const onReady = () => {
          video.removeEventListener('canplay', onReady)
          resolve()
        }
        video.addEventListener('canplay', onReady)
      })
    }

    playStateRef.current = 'prepared'
    console.log('[Transport] Idle → Prepared')
  }, [])

  /**
   * start() — Prepared/Paused → Playing
   * NOOP from Playing (prevents double attack)
   * Single gate: ALL play triggers route through here
   */
  const start = useCallback(async () => {
    const state = playStateRef.current
    if (state === 'playing') return // NOOP — prevents double attack
    if (state === 'idle') {
      await prepare()
    }
    if (state === 'released') return

    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    // Single atomic start sequence:
    // 1. Sync audio timeline to video
    music.currentTime = video.currentTime
    sfx.currentTime = video.currentTime

    // 2. Start video (muted — audio comes from <audio> elements only)
    try {
      await video.play()
    } catch (e) {
      console.warn('[Transport] video.play() failed:', e)
      return
    }

    // 3. Start audio tracks
    music.play().catch(e => console.warn('[Transport] music.play() failed:', e))
    sfx.play().catch(e => console.warn('[Transport] sfx.play() failed:', e))

    // 4. Transition state
    playStateRef.current = 'playing'
    setIsPlaying(true)
    console.log('[Transport] → Playing')
  }, [prepare])

  /**
   * pause() — Playing → Paused
   * NOOP from non-Playing states
   */
  const pause = useCallback(() => {
    if (playStateRef.current !== 'playing') return

    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    video.pause()
    music.pause()
    sfx.pause()

    playStateRef.current = 'paused'
    setIsPlaying(false)
    console.log('[Transport] Playing → Paused')
  }, [])

  /**
   * release() — Any → Released
   * Full cleanup. Only way to re-prepare is remount.
   */
  const release = useCallback(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (video) {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
    if (music) {
      music.pause()
      music.removeAttribute('src')
      music.load()
    }
    if (sfx) {
      sfx.pause()
      sfx.removeAttribute('src')
      sfx.load()
    }

    playStateRef.current = 'released'
    setIsPlaying(false)
    console.log('[Transport] → Released (cleanup)')
  }, [])

  /**
   * togglePlayPause() — single entry point for all user play/pause actions
   */
  const togglePlayPause = useCallback(() => {
    const state = playStateRef.current
    if (state === 'playing') {
      pause()
    } else {
      start()
    }
  }, [start, pause])

  // ============================================================
  // LIFECYCLE
  // ============================================================

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement
      setIsFullscreen(inFullscreen)
      const video = videoRef.current
      if (video) {
        video.controls = inFullscreen
        console.log(`[PortfolioPlayer] Fullscreen: ${inFullscreen}, controls: ${inFullscreen}`)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Staggered reveal
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Orientation / resize / visibility → HARD SYNC (no extra play calls)
  useEffect(() => {
    const forceSync = () => {
      const video = videoRef.current
      const music = musicRef.current
      const sfx = sfxRef.current
      if (!video || !music || !sfx) return

      setIsMobilePortrait(isMobile && window.innerHeight > window.innerWidth)

      // Only sync timeline if actively playing — NO play() calls here
      if (playStateRef.current === 'playing') {
        music.currentTime = video.currentTime
        sfx.currentTime = video.currentTime
        console.log('[Transport] Hard sync on orientation/resize/visibility')
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        forceSync()
        // Resume audio if state is playing but audio got suspended by OS
        if (playStateRef.current === 'playing') {
          const music = musicRef.current
          const sfx = sfxRef.current
          if (music?.paused) music.play().catch(() => {})
          if (sfx?.paused) sfx.play().catch(() => {})
        }
      }
    }

    window.addEventListener('orientationchange', forceSync)
    window.addEventListener('resize', forceSync)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('orientationchange', forceSync)
      window.removeEventListener('resize', forceSync)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Initialize on mount — NO autoplay, NO currentTime resets after this
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    // Ensure video is muted — audio comes ONLY from <audio> refs
    if (video) {
      video.muted = true
      video.loop = false
    }
    if (music) music.pause()
    if (sfx) sfx.pause()

    playStateRef.current = 'idle'

    return () => {
      release()
    }
  }, [release])

  // Video event listeners — route through state machine, no direct play() calls
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    const handleSeeked = () => {
      // Sync audio timeline on user scrub
      music.currentTime = video.currentTime
      sfx.currentTime = video.currentTime
    }

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        setVideoProgress((video.currentTime / video.duration) * 100)
      }
      if (video.ended || playStateRef.current !== 'playing') return

      // Drift correction — sync audio to video (50ms mobile, 100ms desktop)
      const threshold = isMobile ? 0.05 : 0.1
      const musicDrift = Math.abs(video.currentTime - music.currentTime)
      if (musicDrift > threshold) {
        music.currentTime = video.currentTime
      }
      const sfxDrift = Math.abs(video.currentTime - sfx.currentTime)
      if (sfxDrift > threshold) {
        sfx.currentTime = video.currentTime
      }
    }

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
      console.log('[PortfolioPlayer] Video duration:', video.duration.toFixed(1), 's')
    }

    const handleEnded = () => {
      playStateRef.current = 'paused'
      setIsPlaying(false)
      console.log('[Transport] Video ended → Paused')
    }

    // Video stall → pause audio to prevent drift (state stays 'playing')
    const handleWaiting = () => {
      if (playStateRef.current !== 'playing') return
      music.pause()
      sfx.pause()
      console.log('[Transport] Video stalled, audio paused (state still Playing)')
    }

    // Video resumed from stall → hard sync + resume audio (no state change)
    const handlePlaying = () => {
      if (playStateRef.current !== 'playing') return
      music.currentTime = video.currentTime
      sfx.currentTime = video.currentTime
      if (music.paused) music.play().catch(() => {})
      if (sfx.paused) sfx.play().catch(() => {})
    }

    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)

    return () => {
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [])

  // Update audio volumes with mute support
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicMuted ? 0 : musicVolume
    }
  }, [musicVolume, musicMuted])

  useEffect(() => {
    if (sfxRef.current) {
      sfxRef.current.volume = sfxMuted ? 0 : sfxVolume
    }
  }, [sfxVolume, sfxMuted])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setFocusIndex(prev => {
            const next = prev - 1
            return next < 1 ? 4 : next
          })
          uaPlaySynth('tick', 0.3)
          break

        case 'ArrowRight':
          e.preventDefault()
          setFocusIndex(prev => {
            const next = prev + 1
            return next > 4 ? 1 : next
          })
          uaPlaySynth('tick', 0.3)
          break

        case 'ArrowUp':
          e.preventDefault()
          if (focusIndex === 2) {
            setMusicVolume(Math.min(1, musicVolume + 0.05))
            uaPlaySynth('tick', 0.2)
          } else if (focusIndex === 4) {
            setSfxVolume(Math.min(1, sfxVolume + 0.05))
            uaPlaySynth('tick', 0.2)
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (focusIndex === 2) {
            setMusicVolume(Math.max(0, musicVolume - 0.05))
            uaPlaySynth('tick', 0.2)
          } else if (focusIndex === 4) {
            setSfxVolume(Math.max(0, sfxVolume - 0.05))
            uaPlaySynth('tick', 0.2)
          }
          break

        case ' ':
          e.preventDefault()
          togglePlayPause()
          uaPlaySynth('select', playStateRef.current === 'playing' ? 0.3 : 0.5)
          break

        case 'Enter':
          e.preventDefault()
          if (focusIndex === 1) {
            setMusicMuted(!musicMuted)
            uaPlaySynth('select', 0.4)
          } else if (focusIndex === 3) {
            setSfxMuted(!sfxMuted)
            uaPlaySynth('select', 0.4)
          }
          break

        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          console.log('[PortfolioPlayer] ESC pressed, calling onBack()')
          uaPlaySynth('back', 0.4)
          onBack()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [focusIndex, musicVolume, sfxVolume, musicMuted, sfxMuted, togglePlayPause, onBack])

  const isFocused = (index: number) => focusIndex === index

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100dvh',
      margin: '0',
      padding: '0',
      animation: showContent ? 'fadeSlideIn 0.5s ease-out' : 'none',
      overflow: 'hidden',
      backgroundColor: '#000',
      cursor: 'pointer'
    }}>
      {/* Mobile back button */}
      {isMobile && (
        <div
          onClick={() => { uaPlaySynth('back', 0.4); onBack() }}
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            left: 'max(16px, env(safe-area-inset-left, 0px))',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,215,0,0.3)',
            color: '#ffd700',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 1001,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← BACK
        </div>
      )}

      {/* Permanent Controls Hint - Bottom Left (desktop only) */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '12px',
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: '6px',
          padding: '8px 10px',
          zIndex: 999,
          color: '#ffd700',
          fontSize: "12px",
          fontFamily: 'monospace',
          lineHeight: '1.4',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', color: '#00ffff', fontSize: '11px' }}>CONTROLS</div>
          <div>←→ Focus</div>
          <div>↑↓ Volume</div>
          <div>SPACE Play</div>
          <div>ESC Exit</div>
        </div>
      )}

      {/* Video Player — ALWAYS MUTED, audio via <audio> refs only */}
      <video
        ref={videoRef}
        muted
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture={true}
        playsInline
        preload="metadata"
        poster={safePosterPath || '/logo_van.png'}
        onContextMenu={(e) => e.preventDefault()}
        className="portfolio-video-player"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
        onClick={() => togglePlayPause()}
        onDoubleClick={() => {
          const video = videoRef.current
          if (video) {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              video.requestFullscreen().catch(e => console.warn('Fullscreen failed:', e))
            }
          }
        }}
      >
        <source src={`${safeVideoPath || '/videoSlotPortfolio/Piggy Portfolio Video.mp4'}?v=6`} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      {/* Play overlay — shown until user starts playback */}
      {!isPlaying && (
        <div
          onClick={() => start()}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(0,0,0,0.5)',
            cursor: 'pointer',
            zIndex: 5
          }}
        >
          <div style={{
            width: 'clamp(48px, 12vw, 80px)',
            height: 'clamp(48px, 12vw, 80px)',
            borderRadius: '50%',
            background: 'rgba(255,215,0,0.2)',
            border: '2px solid rgba(255,215,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              width: 0, height: 0,
              borderTop: 'clamp(10px, 3vw, 18px) solid transparent',
              borderBottom: 'clamp(10px, 3vw, 18px) solid transparent',
              borderLeft: 'clamp(18px, 5vw, 30px) solid rgba(255,215,0,0.9)',
              marginLeft: 'clamp(3px, 1vw, 6px)'
            }} />
          </div>
          <div style={{
            color: 'rgba(255,215,0,0.8)',
            fontSize: 'clamp(12px, 2.5vw, 16px)',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>TAP TO PLAY</div>
        </div>
      )}

      {/* Hidden audio tracks — SOLE audio source (video is muted) */}
      <audio ref={musicRef} style={{ display: 'none' }}>
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.opus`} type="audio/opus" />
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.m4a`} type="audio/mp4" />
      </audio>

      <audio ref={sfxRef} style={{ display: 'none' }}>
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.opus`} type="audio/opus" />
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.m4a`} type="audio/mp4" />
      </audio>

      {/* Controls Overlay - Bottom */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        flexDirection: isMobilePortrait ? 'column' : 'row',
        gap: isMobilePortrait ? '6px' : '8px',
        alignItems: isMobilePortrait ? 'stretch' : 'center',
        padding: isMobile
          ? `8px max(12px, env(safe-area-inset-left, 0px)) max(10px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-right, 0px))`
          : `12px max(20px, env(safe-area-inset-left, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-right, 0px))`,
        background: 'rgba(0,0,0,0.85)',
        borderTop: '1px solid rgba(255,215,0,0.2)',
        zIndex: 1000
      }}>
        {/* Music row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: isMobilePortrait ? undefined : 1 }}>
          <button
            onClick={() => setMusicMuted(!musicMuted)}
            aria-label={musicMuted ? 'Unmute music track' : 'Mute music track'}
            aria-pressed={musicMuted}
            tabIndex={0}
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              padding: '0',
              border: isFocused(1) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
              borderRadius: '6px',
              background: musicMuted ? 'rgba(255,0,0,0.2)' : (isFocused(1) ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.5)'),
              color: musicMuted ? '#ff4444' : (isFocused(1) ? '#ffd700' : '#999'),
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isFocused(1) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {musicMuted ? '🔇' : '🎵'}
          </button>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '4px 8px' : '6px 10px',
            border: isFocused(2) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
            borderRadius: '6px',
            background: isFocused(2) ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
            boxShadow: isFocused(2) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <span style={{
              fontSize: '11px',
              color: isFocused(2) ? '#ffd700' : '#ccc',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap'
            }}>
              🎵 {Math.round(musicVolume * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              aria-label="Music volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(musicVolume * 100)}
              role="slider"
              tabIndex={0}
              style={{
                flex: 1,
                height: isMobile ? '20px' : '4px',
                borderRadius: isMobile ? '10px' : '2px',
                background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${musicVolume * 100}%, rgba(255,215,0,0.3) ${musicVolume * 100}%, rgba(255,215,0,0.3) 100%)`,
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
        </div>

        {/* SFX row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: isMobilePortrait ? undefined : 1 }}>
          <button
            onClick={() => setSfxMuted(!sfxMuted)}
            aria-label={sfxMuted ? 'Unmute sound effects track' : 'Mute sound effects track'}
            aria-pressed={sfxMuted}
            tabIndex={0}
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              padding: '0',
              border: isFocused(3) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
              borderRadius: '6px',
              background: sfxMuted ? 'rgba(255,0,0,0.2)' : (isFocused(3) ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.5)'),
              color: sfxMuted ? '#ff4444' : (isFocused(3) ? '#ffd700' : '#999'),
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isFocused(3) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {sfxMuted ? '🔇' : '🔊'}
          </button>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '4px 8px' : '6px 10px',
            border: isFocused(4) ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
            borderRadius: '6px',
            background: isFocused(4) ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
            boxShadow: isFocused(4) ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <span style={{
              fontSize: '11px',
              color: isFocused(4) ? '#ffd700' : '#ccc',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap'
            }}>
              🔊 {Math.round(sfxVolume * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume * 100}
              onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
              aria-label="Sound effects volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sfxVolume * 100)}
              role="slider"
              tabIndex={0}
              style={{
                flex: 1,
                height: isMobile ? '20px' : '4px',
                borderRadius: isMobile ? '10px' : '2px',
                background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${sfxVolume * 100}%, rgba(255,215,0,0.3) ${sfxVolume * 100}%, rgba(255,215,0,0.3) 100%)`,
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Video Progress Bar */}
      <div style={{
        position: 'fixed',
        bottom: isMobilePortrait ? '108px' : '62px',
        left: 0,
        width: `${videoProgress}%`,
        height: isMobile ? '6px' : '4px',
        background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
        boxShadow: '0 0 10px rgba(255,215,0,0.6)',
        transition: 'width 0.1s linear',
        zIndex: 1001,
        pointerEvents: 'none'
      }} />
    </div>
  )
})

export default PortfolioPlayer
