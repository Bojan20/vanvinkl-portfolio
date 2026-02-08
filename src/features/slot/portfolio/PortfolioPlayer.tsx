/**
 * PortfolioPlayer - Full-Screen Video Player with Dual Audio Sync
 *
 * PLAYBACK STATE MACHINE (FluxForge-style lifecycle):
 *   Idle → Preparing → Prepared → Playing → Paused → Released
 *
 * - On mount: immediately begins buffering video + audio
 * - Shows LOADING overlay until all media reaches canplaythrough
 * - Play button only appears when fully buffered
 * - start() valid only from Prepared/Paused → Playing
 * - pause() valid only from Playing → Paused
 * - release() from any → Released (cleanup, only way to re-prepare)
 *
 * AUDIO ARCHITECTURE:
 * - Video element is ALWAYS MUTED (video.muted = true)
 * - Audio routed exclusively through <audio> refs (music + SFX)
 * - Single transport.start() gate — no duplicate .play() calls
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
import { uaPlaySynth, uaGetContext, sliderToGain } from '../../../audio'
import { isValidMediaPath } from '../../../utils/security'

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// ============================================================
// PLAYBACK STATE MACHINE
// ============================================================
type PlayState = 'idle' | 'preparing' | 'prepared' | 'playing' | 'paused' | 'released'

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
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const doc = document as Document & { webkitFullscreenElement?: Element }
    return !!(document.fullscreenElement || doc.webkitFullscreenElement)
  })
  const [videoProgress, setVideoProgress] = useState(0)
  const [_videoDuration, setVideoDuration] = useState(0)

  // ============================================================
  // BUFFER STATE — tracks loading progress for UI
  // ============================================================
  const [bufferState, setBufferState] = useState<'loading' | 'ready' | 'playing' | 'paused'>('loading')
  const [bufferProgress, setBufferProgress] = useState(0) // 0-100

  // ============================================================
  // STATE MACHINE — single source of truth for playback
  // ============================================================
  const playStateRef = useRef<PlayState>('idle')
  const startingRef = useRef(false) // Lock to prevent concurrent start() calls
  const playStartedAtRef = useRef(0) // Timestamp of last start() — blocks premature pause
  const [isPlaying, setIsPlaying] = useState(false)

  // ============================================================
  // AudioContext routing — route <audio> elements through Web Audio API
  // This ensures all audio shares the same hardware clock = zero drift
  // ============================================================
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const sfxSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const sfxGainRef = useRef<GainNode | null>(null)

  // Focus items count
  const _FOCUS_ITEMS = 4

  /**
   * prepare() — Idle → Preparing → Prepared
   * Waits for ALL media to reach canplaythrough (readyState >= 4)
   * This ensures enough data is buffered for smooth uninterrupted playback.
   */
  const prepare = useCallback(async () => {
    const state = playStateRef.current
    if (state === 'prepared' || state === 'playing' || state === 'preparing') return
    if (state === 'released') return

    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    playStateRef.current = 'preparing'
    console.log('[Transport] Idle → Preparing (buffering media)')

    // Wait for canplaythrough OR readyState >= 3 (HAVE_FUTURE_DATA — enough to start)
    // Also listens for error events to avoid hanging forever on broken media
    const waitReady = (el: HTMLMediaElement, label: string) =>
      el.readyState >= 3 ? Promise.resolve() : new Promise<void>((resolve) => {
        const cleanup = () => {
          clearTimeout(timeout)
          clearInterval(poll)
          el.removeEventListener('canplaythrough', onReady)
          el.removeEventListener('canplay', onReady)
          el.removeEventListener('error', onError)
        }
        const timeout = setTimeout(() => {
          cleanup()
          console.warn(`[Transport] ${label} timeout — proceeding with readyState ${el.readyState}`)
          resolve()
        }, 10000)
        const onReady = () => {
          cleanup()
          console.log(`[Transport] ${label} ready (readyState: ${el.readyState})`)
          resolve()
        }
        const onError = () => {
          cleanup()
          console.warn(`[Transport] ${label} error — proceeding anyway`)
          resolve()
        }
        // Poll readyState as fallback — some browsers miss events
        const poll = setInterval(() => {
          if (el.readyState >= 3) {
            cleanup()
            console.log(`[Transport] ${label} ready via poll (readyState: ${el.readyState})`)
            resolve()
          }
        }, 500)
        el.addEventListener('canplaythrough', onReady)
        el.addEventListener('canplay', onReady)
        el.addEventListener('error', onError)
      })

    // Track individual readiness for progress reporting
    let readyCount = 0
    const totalTracks = 3

    const trackReady = async (el: HTMLMediaElement, label: string) => {
      await waitReady(el, label)
      readyCount++
      setBufferProgress(Math.round((readyCount / totalTracks) * 100))
    }

    try {
      await Promise.all([
        trackReady(video, 'video'),
        trackReady(music, 'music'),
        trackReady(sfx, 'sfx')
      ])
    } catch (e) {
      console.warn('[Transport] prepare() error — proceeding anyway:', e)
    }

    if (playStateRef.current === 'released') return // unmounted during prepare

    playStateRef.current = 'prepared'
    setBufferState('ready')
    console.log('[Transport] Preparing → Prepared (all media buffered)')
  }, [])

  /**
   * start() — Prepared/Paused → Playing
   * NOOP from Playing (prevents double attack)
   * Single gate: ALL play triggers route through here
   *
   * BULLETPROOF: startingRef lock held until 300ms AFTER playback begins.
   */
  const start = useCallback(async () => {
    if (startingRef.current) return
    if (playStateRef.current === 'playing') return
    if (playStateRef.current === 'released') return
    startingRef.current = true

    try {
      // If not prepared yet, prepare first (waits for buffer)
      if (playStateRef.current === 'idle' || playStateRef.current === 'preparing') {
        await prepare()
      }

      if (playStateRef.current !== 'prepared' && playStateRef.current !== 'paused') {
        return // Cannot start from this state
      }

      const video = videoRef.current
      const music = musicRef.current
      const sfx = sfxRef.current
      if (!video || !music || !sfx) return

      // STRATEGY: Video-first start with timeupdate gate.
      // 1. Start video (muted) — no audible effect
      // 2. Wait for first timeupdate — video decoder is now actively producing frames
      // 3. Read video.currentTime at that exact moment
      // 4. Set audio currentTime to match, then start audio
      // Result: audio starts from video's REAL decoded position, not an estimate.
      // With AudioContext routing, all audio shares the same hardware clock = zero drift.
      music.playbackRate = 1.0
      sfx.playbackRate = 1.0

      // Ensure AudioContext is running (may be suspended after tab switch)
      const ctx = uaGetContext()
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Start video first (it's muted so no audible desync)
      await video.play()

      // Wait for first timeupdate — video is now truly decoding
      await new Promise<void>((resolve) => {
        const onUpdate = () => {
          video.removeEventListener('timeupdate', onUpdate)
          resolve()
        }
        video.addEventListener('timeupdate', onUpdate)
        // Safety timeout — don't block forever
        setTimeout(() => {
          video.removeEventListener('timeupdate', onUpdate)
          resolve()
        }, 500)
      })

      // Now sync audio to where video ACTUALLY is and start them
      const syncTime = video.currentTime
      music.currentTime = syncTime
      sfx.currentTime = syncTime
      await Promise.all([
        music.play().catch(() => {}),
        sfx.play().catch(() => {})
      ])

      // Transition state
      playStateRef.current = 'playing'
      playStartedAtRef.current = Date.now()
      setIsPlaying(true)
      setBufferState('playing')
      console.log('[Transport] → Playing (AudioContext sync, offset:', syncTime.toFixed(3), 's)')
    } catch (e) {
      console.warn('[Transport] start() failed:', e)
    } finally {
      setTimeout(() => { startingRef.current = false }, 300)
    }
  }, [prepare])

  /**
   * pause() — Playing → Paused
   */
  const pause = useCallback(() => {
    if (playStateRef.current !== 'playing') return
    if (Date.now() - playStartedAtRef.current < 500) return

    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    video.pause()
    music.pause()
    sfx.pause()

    playStateRef.current = 'paused'
    setIsPlaying(false)
    setBufferState('paused')
    console.log('[Transport] Playing → Paused')
  }, [])

  /**
   * release() — Any → Released
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
      music.playbackRate = 1.0
      music.removeAttribute('src')
      music.load()
    }
    if (sfx) {
      sfx.pause()
      sfx.playbackRate = 1.0
      sfx.removeAttribute('src')
      sfx.load()
    }

    // Disconnect AudioContext nodes (don't null them — can't re-create MediaElementSource)
    try {
      if (musicSourceRef.current) musicSourceRef.current.disconnect()
      if (sfxSourceRef.current) sfxSourceRef.current.disconnect()
      if (musicGainRef.current) musicGainRef.current.disconnect()
      if (sfxGainRef.current) sfxGainRef.current.disconnect()
    } catch {}

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
    } else if (state === 'prepared' || state === 'paused') {
      start()
    }
  }, [start, pause])

  // ============================================================
  // LIFECYCLE
  // ============================================================

  // Cross-browser fullscreen helpers
  const toggleVideoFullscreen = useCallback(() => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void }
    const inFS = !!(document.fullscreenElement || doc.webkitFullscreenElement)
    if (inFS) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen()
    } else {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    }
  }, [])

  // Fullscreen change listener (standard + webkit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element }
      const inFullscreen = !!(document.fullscreenElement || doc.webkitFullscreenElement)
      setIsFullscreen(inFullscreen)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Staggered reveal
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Orientation → update portrait state only (NO audio seeks — AudioContext keeps sync)
  // Visibility → resume + re-sync (tab suspend may have diverged positions)
  useEffect(() => {
    let orientTimer: ReturnType<typeof setTimeout> | null = null
    let visTimer: ReturnType<typeof setTimeout> | null = null

    // Orientation change: just update layout, don't touch audio at all
    const handleOrientation = () => {
      if (orientTimer) clearTimeout(orientTimer)
      orientTimer = setTimeout(() => {
        setIsMobilePortrait(isMobile && window.innerHeight > window.innerWidth)
      }, 300)
    }

    // Visibility change: resume paused media + re-sync (only case where positions diverge)
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (visTimer) clearTimeout(visTimer)
      visTimer = setTimeout(() => {
        const video = videoRef.current
        const music = musicRef.current
        const sfx = sfxRef.current
        if (!video || !music || !sfx) return

        setIsMobilePortrait(isMobile && window.innerHeight > window.innerWidth)

        if (playStateRef.current === 'playing') {
          if (video.paused) video.play().catch(() => {})
          if (music.paused) music.play().catch(() => {})
          if (sfx.paused) sfx.play().catch(() => {})
          // Re-sync only after tab return — positions may have diverged while suspended
          music.currentTime = video.currentTime
          sfx.currentTime = video.currentTime
        }
      }, 500)
    }

    window.addEventListener('orientationchange', handleOrientation)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (orientTimer) clearTimeout(orientTimer)
      if (visTimer) clearTimeout(visTimer)
      window.removeEventListener('orientationchange', handleOrientation)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Initialize on mount — route audio through AudioContext + start buffering
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current

    if (video) {
      video.muted = true
      video.loop = false
    }
    if (music) music.pause()
    if (sfx) sfx.pause()

    // Route <audio> elements through shared AudioContext for hardware-clock sync
    const ctx = uaGetContext()
    if (ctx && music && sfx) {
      try {
        // createMediaElementSource can only be called ONCE per element
        if (!musicSourceRef.current) {
          const musicSource = ctx.createMediaElementSource(music)
          const musicGain = ctx.createGain()
          musicSource.connect(musicGain)
          musicGain.connect(ctx.destination)
          musicSourceRef.current = musicSource
          musicGainRef.current = musicGain
        }
        if (!sfxSourceRef.current) {
          const sfxSource = ctx.createMediaElementSource(sfx)
          const sfxGain = ctx.createGain()
          sfxSource.connect(sfxGain)
          sfxGain.connect(ctx.destination)
          sfxSourceRef.current = sfxSource
          sfxGainRef.current = sfxGain
        }
        console.log('[PortfolioPlayer] Audio routed through AudioContext')
      } catch (e) {
        console.warn('[PortfolioPlayer] AudioContext routing failed, using native:', e)
      }
    }

    playStateRef.current = 'idle'

    // Start buffering immediately — prepare() waits for canplaythrough
    prepare()

    return () => {
      release()
    }
  }, [release, prepare])

  // ============================================================
  // EVENT-DRIVEN SYNC — NO periodic drift correction
  // ============================================================
  //
  // Any periodic correction (playbackRate OR seek) causes audible stutter.
  // Instead: sync ONLY on discrete events (start, seeked, stall recovery).
  // Browser media decoders share the same system clock — natural drift is
  // typically <50ms over minutes of playback. Imperceptible.
  //
  useEffect(() => {
    const video = videoRef.current
    const music = musicRef.current
    const sfx = sfxRef.current
    if (!video || !music || !sfx) return

    let rafId = 0
    let lastProgressUpdate = 0

    // Progress bar only — no drift correction in RAF loop
    const progressLoop = () => {
      rafId = requestAnimationFrame(progressLoop)

      if (playStateRef.current !== 'playing') return
      if (video.paused || video.ended) return

      const now = performance.now()
      if (now - lastProgressUpdate > 100) {
        lastProgressUpdate = now
        if (video.duration > 0) {
          setVideoProgress((video.currentTime / video.duration) * 100)
        }
      }
    }

    rafId = requestAnimationFrame(progressLoop)

    // Sync on user-initiated seek
    const handleSeeked = () => {
      music.currentTime = video.currentTime
      sfx.currentTime = video.currentTime
    }

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration)
      console.log('[PortfolioPlayer] Video duration:', video.duration.toFixed(1), 's')
    }

    const handleEnded = () => {
      playStateRef.current = 'paused'
      setIsPlaying(false)
      setBufferState('paused')
      console.log('[Transport] Video ended → Paused')
    }

    // Stall handling: pause audio when video buffers, resume+sync when it plays again
    let stalled = false

    const handleWaiting = () => {
      if (playStateRef.current !== 'playing') return
      stalled = true
      music.pause()
      sfx.pause()
      setBufferState('loading')
      console.log('[Transport] Video stalled, pausing audio')
    }

    const handlePlaying = () => {
      if (!stalled) return
      if (playStateRef.current !== 'playing') return
      stalled = false
      // Sync after stall — only moment we touch currentTime during playback
      music.currentTime = video.currentTime
      sfx.currentTime = video.currentTime
      music.play().catch(() => {})
      sfx.play().catch(() => {})
      setBufferState('playing')
      console.log('[Transport] Resumed from stall, audio re-synced')
    }

    // Track buffer progress during initial load
    const handleProgress = () => {
      if (playStateRef.current !== 'idle' && playStateRef.current !== 'preparing') return
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const pct = Math.round((bufferedEnd / video.duration) * 100)
        setBufferProgress(prev => Math.max(prev, Math.min(pct, 99)))
      }
    }

    // Fullscreen transition recovery:
    // 1. Browser may fire 'waiting' during DOM re-layout but never 'playing' → audio stuck
    // 2. Even without stall, DOM re-layout can cause video decoder micro-stutters
    //    that desync audio by a few frames → audible jitter
    // Solution: always re-sync audio to video's actual position after fullscreen settles
    const handleFullscreenRecovery = () => {
      if (playStateRef.current !== 'playing') return
      // Wait for DOM layout to fully settle
      setTimeout(() => {
        if (playStateRef.current !== 'playing') return
        if (video.paused || video.ended) return

        // Force re-sync audio to video's actual decoded position
        const vt = video.currentTime
        if (Math.abs(music.currentTime - vt) > 0.05) {
          music.currentTime = vt
        }
        if (Math.abs(sfx.currentTime - vt) > 0.05) {
          sfx.currentTime = vt
        }

        // Recover from stall if 'playing' event never fired
        if (stalled) {
          stalled = false
          music.play().catch(() => {})
          sfx.play().catch(() => {})
          setBufferState('playing')
          console.log('[Transport] Fullscreen stall recovery — forced audio resume')
        } else {
          // Ensure audio is still running (DOM re-layout can pause it)
          if (music.paused) music.play().catch(() => {})
          if (sfx.paused) sfx.play().catch(() => {})
        }
        console.log('[Transport] Fullscreen sync — audio re-aligned to', vt.toFixed(3), 's')
      }, 150)
    }

    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('progress', handleProgress)
    document.addEventListener('fullscreenchange', handleFullscreenRecovery)
    document.addEventListener('webkitfullscreenchange', handleFullscreenRecovery)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('progress', handleProgress)
      document.removeEventListener('fullscreenchange', handleFullscreenRecovery)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenRecovery)
    }
  }, [])

  // ============================================================
  // LINEAR VOLUME — slider 100% = original file volume (unity gain)
  // ============================================================
  // DAW-grade Dr. Lex exponential curve (60dB range) — matches Cubase fader behavior
  // Smoothing via linearRampToValueAtTime — no clicks, no pops

  useEffect(() => {
    const gain = musicMuted ? 0 : sliderToGain(musicVolume)

    const ctx = uaGetContext()
    if (musicGainRef.current && ctx) {
      const now = ctx.currentTime
      musicGainRef.current.gain.cancelScheduledValues(now)
      musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, now)
      musicGainRef.current.gain.linearRampToValueAtTime(gain, now + 0.015)
    } else if (musicRef.current) {
      musicRef.current.volume = gain
    }
  }, [musicVolume, musicMuted])

  useEffect(() => {
    const gain = sfxMuted ? 0 : sliderToGain(sfxVolume)

    const ctx = uaGetContext()
    if (sfxGainRef.current && ctx) {
      const now = ctx.currentTime
      sfxGainRef.current.gain.cancelScheduledValues(now)
      sfxGainRef.current.gain.setValueAtTime(sfxGainRef.current.gain.value, now)
      sfxGainRef.current.gain.linearRampToValueAtTime(gain, now + 0.008)
    } else if (sfxRef.current) {
      sfxRef.current.volume = gain
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
          if (bufferState === 'ready' || bufferState === 'playing' || bufferState === 'paused') {
            togglePlayPause()
            uaPlaySynth('select', playStateRef.current === 'playing' ? 0.3 : 0.5)
          }
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
  }, [focusIndex, musicVolume, sfxVolume, musicMuted, sfxMuted, togglePlayPause, onBack, bufferState])

  // Mobile back: handled entirely via history.pushState/popstate in SlotFullScreen + App.tsx.
  // Native back gesture (edge swipe) fires popstate → App.tsx dispatches slot:closeVideo.
  // ← BACK button calls history.back() → same popstate flow.
  // No custom swipe handler here — it would double-fire with native back gesture.
  const containerDivRef = useRef<HTMLDivElement>(null)

  const isFocused = (index: number) => focusIndex === index

  return (
    <div
      ref={containerDivRef}
      style={{
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

      {/* Permanent Controls Hint - Bottom Left (desktop only, hidden in fullscreen) */}
      {!isMobile && !isFullscreen && (
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
        onClick={() => {
          if (bufferState === 'playing' || bufferState === 'paused') togglePlayPause()
          else if (bufferState === 'ready') start()
        }}
        onDoubleClick={toggleVideoFullscreen}
      >
        <source src={`${safeVideoPath || '/videoSlotPortfolio/Piggy Portfolio Video.mp4'}?v=6`} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      {/* LOADING overlay — shown while buffering */}
      {bufferState === 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 5,
            pointerEvents: 'none'
          }}
        >
          {/* Spinning ring */}
          <div style={{
            width: 'clamp(48px, 12vw, 72px)',
            height: 'clamp(48px, 12vw, 72px)',
            borderRadius: '50%',
            border: '3px solid rgba(255,215,0,0.15)',
            borderTopColor: '#ffd700',
            animation: 'ppSpinnerRotate 0.8s linear infinite'
          }} />
          <div style={{
            color: '#ffd700',
            fontSize: 'clamp(12px, 2.5vw, 15px)',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>LOADING</div>
          {/* Buffer progress bar */}
          <div style={{
            width: 'clamp(120px, 40vw, 200px)',
            height: '3px',
            background: 'rgba(255,215,0,0.15)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${bufferProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
              borderRadius: '2px',
              transition: 'width 0.3s ease-out'
            }} />
          </div>
        </div>
      )}

      {/* PLAY overlay — shown only when fully buffered and not yet playing */}
      {bufferState === 'ready' && (
        <div
          onClick={(e) => { e.stopPropagation(); start() }}
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
            backdropFilter: 'blur(4px)',
            animation: 'ppReadyPulse 1.5s ease-in-out infinite'
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

      {/* PAUSED overlay — tap to resume */}
      {bufferState === 'paused' && (
        <div
          onClick={(e) => { e.stopPropagation(); start() }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            cursor: 'pointer',
            zIndex: 5
          }}
        >
          <div style={{
            width: 'clamp(48px, 12vw, 80px)',
            height: 'clamp(48px, 12vw, 80px)',
            borderRadius: '50%',
            background: 'rgba(255,215,0,0.15)',
            border: '2px solid rgba(255,215,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              width: 0, height: 0,
              borderTop: 'clamp(10px, 3vw, 18px) solid transparent',
              borderBottom: 'clamp(10px, 3vw, 18px) solid transparent',
              borderLeft: 'clamp(18px, 5vw, 30px) solid rgba(255,215,0,0.7)',
              marginLeft: 'clamp(3px, 1vw, 6px)'
            }} />
          </div>
        </div>
      )}

      {/* Hidden audio tracks — SOLE audio source (video is muted) */}
      <audio ref={musicRef} preload="auto" style={{ display: 'none' }}>
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.opus`} type="audio/opus" />
        <source src={`${safeMusicPath || '/audioSlotPortfolio/music/Piggy-Plunger-Music'}.m4a`} type="audio/mp4" />
      </audio>

      <audio ref={sfxRef} preload="auto" style={{ display: 'none' }}>
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.opus`} type="audio/opus" />
        <source src={`${safeSfxPath || '/audioSlotPortfolio/sfx/Piggy-Plunger-SFX'}.m4a`} type="audio/mp4" />
      </audio>

      {/* Controls Overlay - Bottom (hidden in fullscreen) */}
      {!isFullscreen && <div style={{
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
      </div>}

      {/* Video Progress Bar — hidden in fullscreen */}
      {!isFullscreen && <div style={{
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
      }} />}

      {/* Spinner animation */}
      <style>{`
        @keyframes ppSpinnerRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ppReadyPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,215,0,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px 4px rgba(255,215,0,0.15); }
        }
      `}</style>
    </div>
  )
})

export default PortfolioPlayer
