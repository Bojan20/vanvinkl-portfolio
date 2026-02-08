/**
 * ProjectDetail - Project modal content with portfolio video player
 *
 * PRODUCTION CODE - AAA quality modal with staggered animations
 */

import { useRef, useEffect, memo } from 'react'
import { useAudioStore } from '../../../store/audio'
import { sliderToGain } from '../../../audio'

interface ProjectData {
  icon: string
  title: string
  description: string
  year: string
  tags: string[]
  posterPath?: string
}

interface ProjectDetailProps {
  data: ProjectData
  showContent: boolean
}

export const ProjectDetail = memo(function ProjectDetail({
  data: proj,
  showContent
}: ProjectDetailProps) {
  // Global audio volume controls
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioStore()

  // Refs for synchronized audio playback
  const videoRef = useRef<HTMLVideoElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)
  const sfxRef = useRef<HTMLAudioElement>(null)

  // Synchronize audio with video playback
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
      music.pause()
      sfx.pause()
    }

    const handleSeeked = () => {
      const time = video.currentTime
      music.currentTime = time
      sfx.currentTime = time
    }

    const handleTimeUpdate = () => {
      // Sync audio if drift > 0.3s
      const drift = Math.abs(video.currentTime - music.currentTime)
      if (drift > 0.3) {
        music.currentTime = video.currentTime
        sfx.currentTime = video.currentTime
      }
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  // Update audio volumes — DAW-grade fader curve
  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = sliderToGain(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    if (sfxRef.current) sfxRef.current.volume = sliderToGain(sfxVolume)
  }, [sfxVolume])

  return (
    <div>
      {/* Header with icon and year */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px'
      }}>
        <span style={{
          fontSize: 'clamp(48px, 15vw, 90px)',
          animation: 'modalIconBounce 0.6s ease-out',
          filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.5))'
        }}>{proj.icon}</span>
        <div style={{
          color: '#ffd700',
          fontSize: '16px',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
          padding: '12px 24px',
          borderRadius: '25px',
          border: '1px solid rgba(255,215,0,0.5)',
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
          animation: 'modalYearPulse 2s ease-in-out infinite'
        }}>{proj.year}</div>
      </div>

      <h2 style={{
        margin: '0 0 24px 0',
        fontSize: 'clamp(24px, 6vw, 40px)',
        color: '#ffd700',
        fontWeight: 900,
        textShadow: '0 0 30px rgba(255,215,0,0.5)',
        animation: showContent ? 'modalTitleReveal 0.5s ease-out' : 'none'
      }}>{proj.title}</h2>

      <p style={{
        color: '#999',
        fontSize: 'clamp(14px, 3.5vw, 18px)',
        lineHeight: 1.8,
        marginBottom: 'clamp(16px, 4vw, 35px)',
        animation: showContent ? 'modalTextReveal 0.6s ease-out 0.1s both' : 'none'
      }}>{proj.description}</p>

      {/* Portfolio Video Player with Synchronized Audio */}
      <div style={{
        marginBottom: '30px',
        animation: showContent ? 'modalTextReveal 0.7s ease-out 0.2s both' : 'none'
      }}>
        <video
          ref={videoRef}
          controls
          playsInline
          style={{
            width: '100%',
            maxHeight: 'clamp(200px, 50vh, 500px)',
            aspectRatio: '16 / 9',
            borderRadius: '16px',
            border: '2px solid rgba(255,215,0,0.3)',
            boxShadow: '0 8px 40px rgba(255,215,0,0.2)',
            backgroundColor: '#000'
          }}
          poster={proj.posterPath || '/logo_van.png'}
        >
          <source src="/videoSlotPortfolio/Piggy Portfolio Video.mp4?v=5" type="video/mp4" />
          Your browser does not support video playback.
        </video>

        {/* Hidden synchronized audio tracks */}
        <audio ref={musicRef} style={{ display: 'none' }}>
          <source src="/audioSlotPortfolio/music/Piggy-Plunger-Music.opus" type="audio/opus" />
          <source src="/audioSlotPortfolio/music/Piggy-Plunger-Music.m4a" type="audio/mp4" />
        </audio>

        <audio ref={sfxRef} style={{ display: 'none' }}>
          <source src="/audioSlotPortfolio/sfx/Piggy-Plunger-SFX.opus" type="audio/opus" />
          <source src="/audioSlotPortfolio/sfx/Piggy-Plunger-SFX.m4a" type="audio/mp4" />
        </audio>
      </div>

      {/* Audio Volume Controls */}
      <div style={{
        marginBottom: '30px',
        animation: showContent ? 'modalTextReveal 0.8s ease-out 0.3s both' : 'none'
      }}>
        {/* Music Volume Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#ffd700',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎵</span>
              Music
            </label>
            <span style={{
              fontSize: '13px',
              color: '#999',
              fontFamily: 'monospace'
            }}>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicVolume * 100}
            onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${musicVolume * 100}%, rgba(255,215,0,0.2) ${musicVolume * 100}%, rgba(255,215,0,0.2) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none',
              touchAction: 'none'
            }}
          />
        </div>

        {/* SFX Volume Slider */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              color: '#ffd700',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🔊</span>
              SFX
            </label>
            <span style={{
              fontSize: '13px',
              color: '#999',
              fontFamily: 'monospace'
            }}>{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume * 100}
            onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #ffd700 0%, #ffd700 ${sfxVolume * 100}%, rgba(255,215,0,0.2) ${sfxVolume * 100}%, rgba(255,215,0,0.2) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none',
              touchAction: 'none'
            }}
          />
        </div>
      </div>

      {/* Tech tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 2vw, 12px)' }}>
        {proj.tags.map((t, i) => (
          <span key={t} style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            padding: 'clamp(8px, 2vw, 12px) clamp(14px, 4vw, 24px)',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))',
            borderRadius: '30px',
            color: '#ffd700',
            fontWeight: '600',
            border: '1px solid rgba(255,215,0,0.4)',
            boxShadow: '0 4px 20px rgba(255,215,0,0.2)',
            animation: showContent ? `modalTagReveal 0.4s ease-out ${0.1 + i * 0.05}s both` : 'none'
          }}>{t}</span>
        ))}
      </div>
    </div>
  )
})
