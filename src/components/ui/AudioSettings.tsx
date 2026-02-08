/**
 * AudioSettings - Audio volume control panel
 * Opens with A key, controlled with arrow keys
 *
 * CONNECTED TO GLOBAL STORE - syncs with PortfolioPlayer sliders
 */

import { useState, useEffect } from 'react'
import { uaVolume } from '../../audio'
import { useAudioStore } from '../../store/audio'

// Inline mobile detection
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

interface AudioSettingsProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function AudioSettings({ isOpen, setIsOpen }: AudioSettingsProps) {
  const isMobile = isMobileDevice()
  const [selected, setSelected] = useState<'music' | 'sfx'>('music')

  // USE GLOBAL STORE - synced with PortfolioPlayer
  const { musicVolume, sfxVolume, setMusicVolume, setSfxVolume } = useAudioStore()

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A key toggles menu (open AND close)
      if (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsOpen(!isOpen)
        return
      }

      // Only handle other keys when menu is open
      if (!isOpen) return

      const step = 0.05 // 5% per press

      switch (e.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault()
          setSelected(prev => prev === 'music' ? 'sfx' : 'music')
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (selected === 'music') {
            const newVal = Math.max(0, musicVolume - step)
            setMusicVolume(newVal)
            uaVolume('music', newVal)
          } else {
            const newVal = Math.max(0, sfxVolume - step)
            setSfxVolume(newVal)
            uaVolume('sfx', newVal)
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (selected === 'music') {
            const newVal = Math.min(1, musicVolume + step)
            setMusicVolume(newVal)
            uaVolume('music', newVal)
          } else {
            const newVal = Math.min(1, sfxVolume + step)
            setSfxVolume(newVal)
            uaVolume('sfx', newVal)
          }
          break

        case 'Escape':
          // ESC also closes (standard UX expectation)
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selected, musicVolume, sfxVolume, setMusicVolume, setSfxVolume, setIsOpen])

  return (
    <>
      {/* Hint button - desktop: bottom-right, mobile: below fullscreen toggle */}
      <div style={{
        position: 'fixed',
        top: isMobile ? 'calc(max(16px, env(safe-area-inset-top, 0px)) + 52px)' : 'auto',
        bottom: isMobile ? 'auto' : '20px',
        right: isMobile ? 'max(16px, env(safe-area-inset-right, 0px))' : '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: isMobile ? '10px 12px' : '8px 14px',
        background: 'rgba(5, 5, 15, 0.75)',
        border: '1px solid rgba(136, 68, 255, 0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none' as const
      }}
      onClick={() => setIsOpen(!isOpen)}
      >
        {/* Icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8844ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        {/* Keyboard hint - desktop only */}
        {!isMobile && (
          <span style={{
            padding: '2px 6px',
            background: 'rgba(136, 68, 255, 0.2)',
            border: '1px solid rgba(136, 68, 255, 0.5)',
            borderRadius: '4px',
            color: '#8844ff',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>
            A
          </span>
        )}
        <span style={{ color: '#888899', fontSize: '11px' }}>AUDIO</span>
      </div>

      {/* Audio Settings Panel */}
      {isOpen && (
        <>
          {/* Backdrop - tap to close */}
          {isMobile && (
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 199
              }}
            />
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: isMobile ? 'calc(max(16px, env(safe-area-inset-top, 0px)) + 100px)' : 'auto',
              bottom: isMobile ? 'auto' : '70px',
              right: isMobile ? 'max(16px, env(safe-area-inset-right, 0px))' : '20px',
              background: 'rgba(5, 5, 15, 0.95)',
              border: '1px solid rgba(136, 68, 255, 0.4)',
              borderRadius: '16px',
              padding: '16px 20px',
              backdropFilter: 'blur(12px)',
              zIndex: 200,
              minWidth: '220px',
              boxShadow: '0 0 40px rgba(136, 68, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
              animation: 'audioSettingsIn 0.2s ease-out',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8844ff" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span style={{
                  color: '#8844ff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '2px'
                }}>
                  AUDIO
                </span>
              </div>
              <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '9px',
                letterSpacing: '1px'
              }}>
                {isMobile ? 'TAP ANYWHERE TO CLOSE' : 'A TO CLOSE'}
              </span>
            </div>

            {/* Music Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              background: selected === 'music' ? 'rgba(255, 0, 170, 0.15)' : 'transparent',
              border: selected === 'music' ? '1px solid rgba(255, 0, 170, 0.4)' : '1px solid transparent'
            }}>
              <span style={{
                color: selected === 'music' ? '#ff00aa' : '#666',
                fontSize: '11px',
                letterSpacing: '1px',
                fontWeight: selected === 'music' ? 'bold' : 'normal'
              }}>
                MUSIC
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMobile ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume * 100}
                    onChange={(e) => {
                      const vol = Number(e.target.value) / 100
                      setMusicVolume(vol)
                      uaVolume('music', vol)
                    }}
                    style={{ width: '100px', height: '6px', cursor: 'pointer', touchAction: 'none' }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${musicVolume * 100}%`,
                      height: '100%',
                      background: selected === 'music'
                        ? 'linear-gradient(90deg, #ff00aa, #ff66cc)'
                        : 'rgba(255, 0, 170, 0.5)',
                      borderRadius: '3px',
                      transition: 'none'
                    }} />
                  </div>
                )}
                <span style={{
                  color: selected === 'music' ? '#ff00aa' : '#666',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  minWidth: '32px',
                  textAlign: 'right'
                }}>
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            </div>

            {/* SFX Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              background: selected === 'sfx' ? 'rgba(0, 255, 255, 0.15)' : 'transparent',
              border: selected === 'sfx' ? '1px solid rgba(0, 255, 255, 0.4)' : '1px solid transparent'
            }}>
              <span style={{
                color: selected === 'sfx' ? '#00ffff' : '#666',
                fontSize: '11px',
                letterSpacing: '1px',
                fontWeight: selected === 'sfx' ? 'bold' : 'normal'
              }}>
                SFX
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMobile ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume * 100}
                    onChange={(e) => {
                      const vol = Number(e.target.value) / 100
                      setSfxVolume(vol)
                      uaVolume('sfx', vol)
                      uaVolume('ui', vol)
                    }}
                    style={{ width: '100px', height: '6px', cursor: 'pointer', touchAction: 'none' }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${sfxVolume * 100}%`,
                      height: '100%',
                      background: selected === 'sfx'
                        ? 'linear-gradient(90deg, #00ffff, #66ffff)'
                        : 'rgba(0, 255, 255, 0.5)',
                      borderRadius: '3px',
                      transition: 'none'
                    }} />
                  </div>
                )}
                <span style={{
                  color: selected === 'sfx' ? '#00ffff' : '#666',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  minWidth: '32px',
                  textAlign: 'right'
                }}>
                  {Math.round(sfxVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Controls hint - desktop only */}
            {!isMobile && (
              <div style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    padding: '2px 6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    color: '#666',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}>↑↓</span>
                  <span style={{ color: '#555', fontSize: '9px' }}>SELECT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    padding: '2px 6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    color: '#666',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}>←→</span>
                  <span style={{ color: '#555', fontSize: '9px' }}>ADJUST</span>
                </div>
              </div>
            )}

            {/* Mobile instructions */}
            {isMobile && (
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'center',
                color: '#666',
                fontSize: '10px'
              }}>
                Tap and drag sliders to adjust
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes audioSettingsIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
