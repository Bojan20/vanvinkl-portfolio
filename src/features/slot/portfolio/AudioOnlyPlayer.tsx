/**
 * AudioOnlyPlayer - Full-Screen Audio Player for audio-only portfolio projects
 *
 * Shows separate audio players for each track (Base Game, Big Win, etc.)
 * No video - just clean audio playback with progress bars.
 *
 * KEYBOARD CONTROLS:
 * - Space: Play/Pause focused track
 * - Arrow Up/Down: Switch between tracks
 * - Arrow Left/Right: Track volume ±5%
 * - Escape: Exit player
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import { uaPlaySynth, uaGetContext, sliderToGain } from '../../../audio'

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

interface AudioTrack {
  label: string
  path: string
}

interface AudioOnlyPlayerProps {
  project: {
    icon: string
    title: string
    description: string
    year: string
    tags: string[]
    audioTracks: AudioTrack[]
  }
  onBack: () => void
}

interface TrackState {
  playing: boolean
  progress: number
  duration: number
  currentTime: number
}

const AudioOnlyPlayer = memo(function AudioOnlyPlayer({
  project,
  onBack
}: AudioOnlyPlayerProps) {
  const [showContent, setShowContent] = useState(false)
  const [focusedTrack, setFocusedTrack] = useState(0)
  const [trackStates, setTrackStates] = useState<TrackState[]>(
    project.audioTracks.map(() => ({ playing: false, progress: 0, duration: 0, currentTime: 0 }))
  )
  // Single volume slider for the entire player (0–1, default 100%)
  const [playerVolume, setPlayerVolume] = useState(1)
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
  // Track which index is intentionally playing (survives orientation changes)
  const playingIndexRef = useRef<number>(-1)

  // AudioContext DSP routing — per-track MediaElementSource → GainNode → ctx.destination
  const sourceRefs = useRef<(MediaElementAudioSourceNode | null)[]>([])
  const gainRefs = useRef<(GainNode | null)[]>([])

  // Landscape detection for compact layout
  const [isLandscape, setIsLandscape] = useState(
    isMobile && typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  )
  useEffect(() => {
    if (!isMobile) return
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', () => setTimeout(update, 100))
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // Staggered reveal
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Route <audio> elements through AudioContext for hardware-clock sync + perceptual volume
  const connectToAudioContext = useCallback((index: number) => {
    const audio = audioRefs.current[index]
    if (!audio || sourceRefs.current[index]) return // Already connected
    const ctx = uaGetContext()
    if (!ctx) return
    try {
      const source = ctx.createMediaElementSource(audio)
      const gainNode = ctx.createGain()
      // DAW-grade fader curve — matches all other sliders in the system
      gainNode.gain.value = sliderToGain(playerVolume)
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      sourceRefs.current[index] = source
      gainRefs.current[index] = gainNode
    } catch (e) {
      console.warn('[AudioOnlyPlayer] AudioContext routing failed for track', index, e)
    }
  }, [playerVolume])

  // Cleanup on unmount — disconnect DSP nodes + pause audio
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause()
          audio.removeAttribute('src')
          audio.load()
        }
      })
      // Disconnect AudioContext nodes
      try {
        sourceRefs.current.forEach(s => s?.disconnect())
        gainRefs.current.forEach(g => g?.disconnect())
      } catch {}
      sourceRefs.current = []
      gainRefs.current = []
    }
  }, [])

  // Player volume — DAW-grade Dr. Lex exponential curve (60dB range)
  // Independent from global musicVolume (this player has its own volume control)
  useEffect(() => {
    const gain = sliderToGain(playerVolume)
    const ctx = uaGetContext()
    let hasAudioContext = false

    gainRefs.current.forEach(gainNode => {
      if (gainNode && ctx) {
        hasAudioContext = true
        const now = ctx.currentTime
        gainNode.gain.cancelScheduledValues(now)
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(gain, now + 0.015)
      }
    })

    // Fallback: if no AudioContext routing, apply curve to <audio> elements
    if (!hasAudioContext) {
      audioRefs.current.forEach(audio => {
        if (audio) audio.volume = gain
      })
    }
  }, [playerVolume])

  // Orientation / resize / visibility → resume audio interrupted by browser (debounced)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const resumePlaying = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const idx = playingIndexRef.current
        if (idx < 0) return
        const audio = audioRefs.current[idx]
        if (audio && audio.paused && audio.currentTime < audio.duration) {
          audio.play().catch(() => {})
        }
      }, 300)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') resumePlaying()
    }

    window.addEventListener('orientationchange', resumePlaying)
    window.addEventListener('resize', resumePlaying)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('orientationchange', resumePlaying)
      window.removeEventListener('resize', resumePlaying)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setFocusedTrack(prev => {
            const next = prev - 1
            return next < 0 ? project.audioTracks.length - 1 : next
          })
          uaPlaySynth('tick', 0.3)
          break

        case 'ArrowDown':
          e.preventDefault()
          setFocusedTrack(prev => {
            const next = prev + 1
            return next >= project.audioTracks.length ? 0 : next
          })
          uaPlaySynth('tick', 0.3)
          break

        case 'ArrowLeft':
          e.preventDefault()
          setPlayerVolume(v => Math.max(0, Math.round((v - 0.05) * 100) / 100))
          uaPlaySynth('tick', 0.2)
          break

        case 'ArrowRight':
          e.preventDefault()
          setPlayerVolume(v => Math.min(1, Math.round((v + 0.05) * 100) / 100))
          uaPlaySynth('tick', 0.2)
          break

        case ' ':
          e.preventDefault()
          togglePlayPause(focusedTrack)
          break

        case 'r':
        case 'R':
          e.preventDefault()
          {
            const audio = audioRefs.current[focusedTrack]
            if (audio) {
              audio.currentTime = 0
              setTrackStates(prev => {
                const next = [...prev]
                next[focusedTrack] = { ...next[focusedTrack], progress: 0, currentTime: 0 }
                return next
              })
            }
            uaPlaySynth('tick', 0.3)
          }
          break

        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          uaPlaySynth('back', 0.4)
          onBack()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [focusedTrack, onBack, project.audioTracks.length])

  const togglePlayPause = (index: number) => {
    const audio = audioRefs.current[index]
    if (!audio) return
    // Block toggle while seeking — prevents double-action from timeline tap
    if (seekingRef.current) return

    if (audio.paused) {
      // Pause all other tracks first
      audioRefs.current.forEach((a, i) => {
        if (a && i !== index && !a.paused) {
          a.pause()
          setTrackStates(prev => {
            const next = [...prev]
            next[i] = { ...next[i], playing: false }
            return next
          })
        }
      })
      // Route through AudioContext on first play (createMediaElementSource can only be called once)
      connectToAudioContext(index)
      audio.play().catch(e => console.warn('Audio play failed:', e))
      playingIndexRef.current = index
      uaPlaySynth('select', 0.5)
    } else {
      audio.pause()
      playingIndexRef.current = -1
      uaPlaySynth('select', 0.3)
    }
  }

  const handleTimeUpdate = (index: number) => {
    const audio = audioRefs.current[index]
    if (!audio || !audio.duration) return
    // Skip UI updates while seeking — prevents progress bar jumping back to old position
    if (seekingRef.current) return

    setTrackStates(prev => {
      const next = [...prev]
      next[index] = {
        playing: !audio.paused,
        progress: (audio.currentTime / audio.duration) * 100,
        duration: audio.duration,
        currentTime: audio.currentTime
      }
      return next
    })
  }

  const handleLoadedMetadata = (index: number) => {
    const audio = audioRefs.current[index]
    if (!audio) return

    setTrackStates(prev => {
      const next = [...prev]
      next[index] = { ...next[index], duration: audio.duration }
      return next
    })
  }

  const handleEnded = (index: number) => {
    if (playingIndexRef.current === index) playingIndexRef.current = -1
    setTrackStates(prev => {
      const next = [...prev]
      next[index] = { ...next[index], playing: false, progress: 0 }
      return next
    })
    const audio = audioRefs.current[index]
    if (audio) audio.currentTime = 0
  }

  const seekingRef = useRef(false)
  const handleSeek = (index: number, e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[index]
    if (!audio || !audio.duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const targetTime = pct * audio.duration

    // Set seeking flag — blocks togglePlayPause from parent click bubbling
    seekingRef.current = true

    // Immediately update UI to target position
    setTrackStates(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        progress: pct * 100,
        currentTime: targetTime
      }
      return next
    })

    // Direct seek — no pause/resume, browser handles it natively
    // If not playing, start playback from target position
    const wasPlaying = !audio.paused
    audio.currentTime = targetTime

    if (!wasPlaying) {
      // Route through AudioContext on first play
      connectToAudioContext(index)
      // Pause all other tracks
      audioRefs.current.forEach((a, i) => {
        if (a && i !== index && !a.paused) {
          a.pause()
          setTrackStates(prev => {
            const next = [...prev]
            next[i] = { ...next[i], playing: false }
            return next
          })
        }
      })
      audio.play().catch(() => {})
      playingIndexRef.current = index
    }

    // Clear seeking flag after browser has processed the seek
    const onSeeked = () => {
      audio.removeEventListener('seeked', onSeeked)
      requestAnimationFrame(() => { seekingRef.current = false })
    }
    audio.addEventListener('seeked', onSeeked)
    setTimeout(() => {
      audio.removeEventListener('seeked', onSeeked)
      seekingRef.current = false
    }, 300)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100dvh',
      animation: showContent ? 'fadeSlideIn 0.5s ease-out' : 'none',
      overflowY: isLandscape ? 'hidden' : 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch' as any,
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: isLandscape ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isLandscape ? '16px' : '0',
      padding: isLandscape
        ? `max(8px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(8px, env(safe-area-inset-bottom, 0px)) max(50px, env(safe-area-inset-left, 0px))`
        : `max(20px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(80px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))`,
      zIndex: 900
    }}>
      {/* Volume slider thumb styling */}
      <style>{`
        .aop-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${isLandscape ? '14px' : (isMobile ? '22px' : '16px')};
          height: ${isLandscape ? '14px' : (isMobile ? '22px' : '16px')};
          border-radius: 50%;
          background: #00ffff;
          border: 2px solid rgba(0,0,0,0.3);
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0,255,255,0.5);
        }
        .aop-volume-slider::-moz-range-thumb {
          width: ${isLandscape ? '14px' : (isMobile ? '22px' : '16px')};
          height: ${isLandscape ? '14px' : (isMobile ? '22px' : '16px')};
          border-radius: 50%;
          background: #00ffff;
          border: 2px solid rgba(0,0,0,0.3);
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0,255,255,0.5);
        }
        .aop-volume-slider::-webkit-slider-runnable-track {
          height: ${isLandscape ? '4px' : (isMobile ? '6px' : '4px')};
          border-radius: 2px;
        }
        .aop-volume-slider::-moz-range-track {
          height: ${isLandscape ? '4px' : (isMobile ? '6px' : '4px')};
          border-radius: 2px;
          background: transparent;
        }
      `}</style>

      {/* Mobile back button (no ESC key on touch devices) */}
      {isMobile && (
        <div
          onClick={() => { uaPlaySynth('back', 0.4); onBack() }}
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            left: 'max(16px, env(safe-area-inset-left, 0px))',
            padding: isLandscape ? '6px 10px' : '10px 16px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,215,0,0.3)',
            color: '#ffd700',
            fontSize: isLandscape ? '11px' : '14px',
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

      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Project Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isLandscape ? '0' : 'clamp(16px, 4vh, 40px)',
        zIndex: 1,
        flexShrink: 0,
        ...(isLandscape ? { width: '30%', maxWidth: '200px' } : {})
      }}>
        <div style={{
          fontSize: isLandscape ? '36px' : 'clamp(48px, 15vw, 80px)',
          marginBottom: isLandscape ? '4px' : 'clamp(8px, 2vw, 16px)',
          filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))'
        }}>
          {project.icon}
        </div>
        <h1 style={{
          color: '#ffd700',
          fontSize: isLandscape ? '16px' : 'clamp(22px, 6vw, 36px)',
          fontWeight: 900,
          margin: isLandscape ? '0 0 2px 0' : '0 0 8px 0',
          textShadow: '0 0 20px rgba(255,215,0,0.4)'
        }}>
          {project.title}
        </h1>
        <div style={{
          color: '#666',
          fontSize: isLandscape ? '10px' : '14px',
          fontFamily: 'monospace'
        }}>
          {project.year}
        </div>
      </div>

      {/* Audio Tracks */}
      <div style={{
        width: isLandscape ? '65%' : '90%',
        maxWidth: isLandscape ? '500px' : '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: isLandscape ? '6px' : '16px',
        zIndex: 1
      }}>
        {project.audioTracks.map((track, index) => {
          const state = trackStates[index]
          const isFocused = focusedTrack === index

          return (
            <div
              key={track.label}
              onClick={() => {
                setFocusedTrack(index)
                togglePlayPause(index)
              }}
              style={{
                background: isFocused
                  ? 'rgba(255,215,0,0.1)'
                  : 'rgba(255,255,255,0.03)',
                border: isFocused
                  ? '2px solid rgba(255,215,0,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: isLandscape ? '10px' : '16px',
                padding: isLandscape ? '8px 12px' : '20px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isFocused
                  ? '0 0 30px rgba(255,215,0,0.2)'
                  : 'none'
              }}
            >
              {/* Track header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isLandscape ? '4px' : '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isLandscape ? '8px' : '12px'
                }}>
                  {/* Play/Pause button */}
                  <div style={{
                    width: isLandscape ? '30px' : '48px',
                    height: isLandscape ? '30px' : '48px',
                    borderRadius: '50%',
                    background: state.playing
                      ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
                      : (isFocused ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isLandscape ? '12px' : '18px',
                    color: state.playing ? '#000' : (isFocused ? '#ffd700' : '#888'),
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}>
                    {state.playing ? '⏸' : '▶'}
                  </div>

                  <div>
                    <div style={{
                      color: isFocused ? '#ffd700' : '#ccc',
                      fontSize: isLandscape ? '12px' : '16px',
                      fontWeight: 700
                    }}>
                      {track.label}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: isLandscape ? '9px' : '12px',
                      fontFamily: 'monospace',
                      marginTop: isLandscape ? '0' : '2px'
                    }}>
                      {state.duration > 0
                        ? `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
                        : 'Loading...'
                      }
                    </div>
                  </div>
                </div>

                {/* Restart button */}
                {state.currentTime > 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      const audio = audioRefs.current[index]
                      if (audio) {
                        audio.currentTime = 0
                        setTrackStates(prev => {
                          const next = [...prev]
                          next[index] = { ...next[index], progress: 0, currentTime: 0 }
                          return next
                        })
                      }
                      uaPlaySynth('tick', 0.3)
                    }}
                    style={{
                      minHeight: isLandscape ? '30px' : '44px',
                      padding: isLandscape ? '0 8px' : '0 14px',
                      borderRadius: isLandscape ? '15px' : '22px',
                      background: isFocused ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: isLandscape ? '11px' : '14px',
                      color: isFocused ? '#ffd700' : '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    title="Restart track (R)"
                  >
                    ⏮ {!isLandscape && <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'monospace' }}>R</span>}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeek(index, e)
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  handleSeek(index, e)
                }}
                style={{
                  width: '100%',
                  height: isLandscape ? '14px' : (isMobile ? '24px' : '6px'),
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: isLandscape ? '7px' : (isMobile ? '12px' : '3px'),
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: `${state.progress}%`,
                  height: '100%',
                  background: isFocused
                    ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                    : 'rgba(255,215,0,0.5)',
                  borderRadius: isLandscape ? '7px' : (isMobile ? '12px' : '3px'),
                  transition: 'width 0.1s linear'
                }} />
              </div>

              {/* Hidden audio element */}
              <audio
                ref={el => { audioRefs.current[index] = el }}
                onTimeUpdate={() => handleTimeUpdate(index)}
                onLoadedMetadata={() => handleLoadedMetadata(index)}
                onEnded={() => handleEnded(index)}
                onPlay={() => {
                  setTrackStates(prev => {
                    const next = [...prev]
                    next[index] = { ...next[index], playing: true }
                    return next
                  })
                }}
                onPause={() => {
                  setTrackStates(prev => {
                    const next = [...prev]
                    next[index] = { ...next[index], playing: false }
                    return next
                  })
                }}
                preload="metadata"
                style={{ display: 'none' }}
              >
                <source src={`${track.path}.opus`} type="audio/opus" />
                <source src={`${track.path}.m4a`} type="audio/mp4" />
              </audio>
            </div>
          )
        })}
      </div>

      {/* Player Volume Slider — below tracks */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          marginTop: isLandscape ? '8px' : '12px',
          width: isLandscape ? '65%' : '90%',
          maxWidth: isLandscape ? '500px' : '600px',
          display: 'flex',
          alignItems: 'center',
          gap: isLandscape ? '8px' : '12px',
          padding: isLandscape ? '6px 12px' : '10px 20px',
          background: 'rgba(0,0,0,0.85)',
          border: `1px solid ${playerVolume === 0 ? 'rgba(255,68,68,0.4)' : 'rgba(0,255,255,0.3)'}`,
          borderRadius: '20px',
          backdropFilter: 'blur(8px)',
          zIndex: 1000
        }}
      >
        {/* Speaker icon — click to mute/unmute */}
        <svg
          width={isLandscape ? '16' : '20'}
          height={isLandscape ? '16' : '20'}
          viewBox="0 0 24 24"
          fill="none"
          stroke={playerVolume === 0 ? '#ff4444' : '#00ffff'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setPlayerVolume(playerVolume === 0 ? 1 : 0)
          }}
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {playerVolume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
          {playerVolume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
        </svg>

        {/* Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={playerVolume}
          className="aop-volume-slider"
          onChange={(e) => {
            e.stopPropagation()
            setPlayerVolume(parseFloat(e.target.value))
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            height: isLandscape ? '4px' : (isMobile ? '6px' : '4px'),
            appearance: 'none',
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, ${
              playerVolume === 0 ? '#ff4444' : '#00ffff'
            } ${playerVolume * 100}%, rgba(255,255,255,0.15) ${playerVolume * 100}%)`,
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            margin: 0
          }}
        />

        {/* Percentage */}
        <span style={{
          color: playerVolume === 0 ? '#ff4444' : '#00ffff',
          fontSize: isLandscape ? '10px' : '12px',
          fontFamily: 'monospace',
          minWidth: '32px',
          textAlign: 'right',
          flexShrink: 0,
          fontWeight: 600
        }}>
          {Math.round(playerVolume * 100)}%
        </span>
      </div>

      {/* Controls Hint (desktop only — keyboard controls) */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
          left: 'max(12px, env(safe-area-inset-left, 0px))',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: '6px',
          padding: '8px 10px',
          zIndex: 999,
          color: '#ffd700',
          fontSize: '12px',
          fontFamily: 'monospace',
          lineHeight: '1.4',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', color: '#00ffff', fontSize: '11px' }}>CONTROLS</div>
          <div>↑↓ Switch Track</div>
          <div>←→ Volume</div>
          <div>SPACE Play/Pause</div>
          <div>R Restart Track</div>
          <div>ESC Exit</div>
        </div>
      )}
    </div>
  )
})

export default AudioOnlyPlayer
