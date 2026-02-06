/**
 * PortfolioPlayer - Full-Screen Video Player with Dual Audio Sync
 *
 * PRODUCTION CRITICAL FEATURES:
 * - Video/audio synchronization (drift detection < 0.3s)
 * - Keyboard navigation (4 focus items: music mute, music slider, sfx mute, sfx slider)
 * - Progress bar with scrubbing
 * - Fullscreen support
 * - RAF-based volume control sliders
 * - Auto-hide hints (5s)
 *
 * AUDIO ARCHITECTURE:
 * - Dual audio tracks: music + SFX (separate from video)
 * - Synchronized playback with video timeline
 * - Independent volume control + mute per track
 * - Audio continues after video ends
 *
 * KEYBOARD CONTROLS:
 * - Arrow Left/Right: Navigate focus (4 items)
 * - Arrow Up/Down: Adjust volume (on slider focus)
 * - Space: Play/Pause video
 * - Enter: Toggle mute (on mute button focus)
 * - Escape: Exit player
 * - Double Click: Toggle fullscreen
 *
 * Extracted from SlotFullScreen.tsx (lines 2717-3247)
 */

import { useState, useEffect, useRef, memo, useMemo } from 'react'
import { uaPlaySynth } from '../../../audio'
import { isValidMediaPath } from '../../../utils/security'

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

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
  // Portrait detection (evaluated at render time, not module load)
  const isMobilePortrait = isMobile && typeof window !== 'undefined' && window.innerHeight > window.innerWidth

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
  const [focusIndex, setFocusIndex] = useState(1) // 1: music mute, 2: music slider, 3: sfx mute, 4: sfx slider
  const [musicMuted, setMusicMuted] = useState(false)
  const [sfxMuted, setSfxMuted] = useState(false)
  const [_isFullscreen, setIsFullscreen] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0) // 0-100%
  const [_videoDuration, setVideoDuration] = useState(0)

  // Focus items count
  const _FOCUS_ITEMS = 4

  // Auto-hide removed - permanent controls hint now displayed

  // Fullscreen change listener - enable controls only in fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement
      setIsFullscreen(inFullscreen)
      const video = videoRef.current
      if (video) {
        // Enable controls in fullscreen, disable otherwise
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

  // Lounge music is now handled by parent (selectedProject state change)

  // Auto-play video when component mounts (smooth start, no second click needed)
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (video) {
      video.currentTime = 0
      video.loop = false // Video stops at last frame, doesn't loop

      // Wait for enough data to play smoothly, then auto-start
      const tryAutoPlay = () => {
        video.play().then(() => {
          console.log('[PortfolioPlayer] Auto-play started')
        }).catch(e => {
          // Browser blocked autoplay — user will need to tap
          console.warn('[PortfolioPlayer] Auto-play blocked:', e.message)
        })
      }

      // If video already has data, play immediately
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA
        tryAutoPlay()
      } else {
        // Wait for canplay event (enough data buffered)
        video.addEventListener('canplay', tryAutoPlay, { once: true })
      }
    }
    if (music) {
      music.currentTime = 0
      music.pause()
    }
    if (sfx) {
      sfx.currentTime = 0
      sfx.pause()
    }

    console.log('[PortfolioPlayer] Video auto-play queued, video.loop = false')

    // Cleanup on unmount - prevent memory leaks
    return () => {
      if (video) {
        video.pause()
        video.removeAttribute('src')
        video.load() // Force release of media resources
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
      console.log('[PortfolioPlayer] Media resources cleaned up on unmount')
    }
  }, [])

  // Synchronize audio with video (audio continues after video ends)
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (!video || !music || !sfx) return

    const handlePlay = () => {
      music.play().catch(e => console.warn('Music play failed:', e))
      sfx.play().catch(e => console.warn('SFX play failed:', e))
    }

    const handlePause = () => {
      // Only pause audio if video is paused manually (not ended)
      if (!video.ended) {
        music.pause()
        sfx.pause()
      }
    }

    const handleSeeked = () => {
      const time = video.currentTime
      music.currentTime = time
      sfx.currentTime = time
    }

    const handleTimeUpdate = () => {
      // Update progress bar
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100
        setVideoProgress(progress)
      }

      // Only sync if video is still playing (not ended)
      if (video.ended) return

      const drift = Math.abs(video.currentTime - music.currentTime)
      if (drift > (isMobile ? 0.15 : 0.3)) {
        music.currentTime = video.currentTime
        sfx.currentTime = video.currentTime
      }
    }

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
      console.log('[PortfolioPlayer] Video duration:', video.duration.toFixed(1), 's')
    }

    const handleEnded = () => {
      // Video ended but audio continues playing
      console.log('[PortfolioPlayer] Video ended, audio continues')
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
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
          // Navigate focus left (1 → 4 → 3 → 2 → 1)
          setFocusIndex(prev => {
            const next = prev - 1
            return next < 1 ? 4 : next
          })
          uaPlaySynth('tick',0.3)
          break

        case 'ArrowRight':
          e.preventDefault()
          // Navigate focus right (1 → 2 → 3 → 4 → 1)
          setFocusIndex(prev => {
            const next = prev + 1
            return next > 4 ? 1 : next
          })
          uaPlaySynth('tick',0.3)
          break

        case 'ArrowUp':
          e.preventDefault()
          // Increase volume on slider focus
          if (focusIndex === 2) {
            // Music slider
            setMusicVolume(Math.min(1, musicVolume + 0.05))
            uaPlaySynth('tick',0.2)
          } else if (focusIndex === 4) {
            // SFX slider
            setSfxVolume(Math.min(1, sfxVolume + 0.05))
            uaPlaySynth('tick',0.2)
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          // Decrease volume on slider focus
          if (focusIndex === 2) {
            // Music slider
            setMusicVolume(Math.max(0, musicVolume - 0.05))
            uaPlaySynth('tick',0.2)
          } else if (focusIndex === 4) {
            // SFX slider
            setSfxVolume(Math.max(0, sfxVolume - 0.05))
            uaPlaySynth('tick',0.2)
          }
          break

        case ' ':
          e.preventDefault()
          // SPACE always plays/pauses video (regardless of focus)
          const video = videoRef.current
          if (video) {
            if (video.paused) {
              video.play()
              uaPlaySynth('select',0.5)
            } else {
              video.pause()
              uaPlaySynth('select',0.3)
            }
          }
          break

        case 'Enter':
          e.preventDefault()
          if (focusIndex === 1) {
            // Music mute toggle
            setMusicMuted(!musicMuted)
            uaPlaySynth('select',0.4)
          } else if (focusIndex === 3) {
            // SFX mute toggle
            setSfxMuted(!sfxMuted)
            uaPlaySynth('select',0.4)
          }
          break

        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          console.log('[PortfolioPlayer] ESC pressed, calling onBack()')
          uaPlaySynth('back',0.4)
          onBack()
          break
      }
    }

    // Use capture phase to intercept before parent handlers
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [focusIndex, musicVolume, sfxVolume, musicMuted, sfxMuted, setMusicVolume, setSfxVolume, onBack])

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
      {/* Mobile back button (no ESC key on touch devices) */}
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

      {/* Permanent Controls Hint - Bottom Left (desktop only — no keyboard on mobile) */}
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

      {/* Video Player - FULL SCREEN */}
      <video
        ref={videoRef}
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture={true}
        playsInline
        preload="auto"
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
        onClick={(_e) => {
          const video = videoRef.current
          if (video) {
            if (video.paused) video.play()
            else video.pause()
          }
        }}
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

      {/* Hidden audio tracks */}
      <audio ref={musicRef} style={{ display: 'none' }}>
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.opus`} type="audio/opus" />
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.m4a`} type="audio/mp4" />
      </audio>

      <audio ref={sfxRef} style={{ display: 'none' }}>
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.opus`} type="audio/opus" />
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.m4a`} type="audio/mp4" />
      </audio>

      {/* Controls Overlay - Bottom
           Desktop: single row [MuteBtn][Slider][MuteBtn][Slider]
           Mobile portrait: two rows, each [MuteBtn][Slider] full width */}
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
          {/* Music Mute Button (focus 1) */}
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

          {/* Music Slider (focus 2) */}
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
          {/* SFX Mute Button (focus 3) */}
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

          {/* SFX Slider (focus 4) */}
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

      {/* Video Progress Bar - Thin overlay above controls */}
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

      {/* Auto-hide hint removed - permanent controls hint now visible */}
    </div>
  )
})

export default PortfolioPlayer
