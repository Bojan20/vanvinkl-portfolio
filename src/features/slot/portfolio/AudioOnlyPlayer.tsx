/**
 * AudioOnlyPlayer - Full-Screen Audio Player for audio-only portfolio projects
 *
 * Shows separate audio players for each track (Base Game, Big Win, etc.)
 * No video - just clean audio playback with progress bars.
 *
 * KEYBOARD CONTROLS:
 * - Space: Play/Pause focused track
 * - Arrow Up/Down: Switch between tracks
 * - Escape: Exit player
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react'
import { uaPlaySynth } from '../../../audio'

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
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
  // Track which index is intentionally playing (survives orientation changes)
  const playingIndexRef = useRef<number>(-1)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause()
          audio.removeAttribute('src')
          audio.load()
        }
      })
    }
  }, [])

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

  const handleSeek = (index: number, e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[index]
    if (!audio || !audio.duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = pct * audio.duration
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
          <div>SPACE Play/Pause</div>
          <div>R Restart Track</div>
          <div>ESC Exit</div>
        </div>
      )}
    </div>
  )
})

export default AudioOnlyPlayer
