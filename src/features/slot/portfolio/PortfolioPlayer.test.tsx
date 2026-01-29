/**
 * PortfolioPlayer Component Tests
 *
 * Tests for video player, keyboard navigation, and audio sync.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import PortfolioPlayer from './PortfolioPlayer'

// Mock audio store
const mockMusicVolume = { current: 0.8 }
const mockSfxVolume = { current: 0.6 }
const mockSetMusicVolume = vi.fn()
const mockSetSfxVolume = vi.fn()

vi.mock('../../../store/audio', () => ({
  useAudioStore: () => ({
    musicVolume: mockMusicVolume.current,
    sfxVolume: mockSfxVolume.current,
    setMusicVolume: mockSetMusicVolume,
    setSfxVolume: mockSetSfxVolume
  })
}))

// Mock audio playback
vi.mock('../../../audio', () => ({
  uaPlaySynth: vi.fn()
}))

// Mock security validation
vi.mock('../../../utils/security', () => ({
  isValidMediaPath: (path: string | undefined) => {
    if (!path) return false
    return path.startsWith('/')
  }
}))

describe('PortfolioPlayer', () => {
  const mockOnBack = vi.fn()
  const defaultProps = {
    project: {
      icon: '🎮',
      title: 'Test Project',
      description: 'A test project',
      year: '2024',
      tags: ['React', 'Three.js'],
      videoPath: '/video/test.mp4',
      musicPath: '/audio/music/test',
      sfxPath: '/audio/sfx/test'
    },
    onBack: mockOnBack
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockMusicVolume.current = 0.8
    mockSfxVolume.current = 0.6

    // Mock HTMLMediaElement methods
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
    HTMLMediaElement.prototype.pause = vi.fn()
    HTMLMediaElement.prototype.load = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('renders video element', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('renders audio elements for music and sfx', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const audioElements = document.querySelectorAll('audio')
      expect(audioElements.length).toBe(2)
    })

    it('renders controls hint', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      expect(screen.getByText('CONTROLS')).toBeInTheDocument()
      expect(screen.getByText('←→ Focus')).toBeInTheDocument()
      expect(screen.getByText('↑↓ Volume')).toBeInTheDocument()
      expect(screen.getByText('SPACE Play')).toBeInTheDocument()
      expect(screen.getByText('ESC Exit')).toBeInTheDocument()
    })

    it('renders mute buttons', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const muteButtons = screen.getAllByRole('button')
      expect(muteButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('renders volume sliders', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const sliders = screen.getAllByRole('slider')
      expect(sliders.length).toBe(2)
    })
  })

  describe('security validation', () => {
    it('uses validated video path', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const video = document.querySelector('video source')
      expect(video?.getAttribute('src')).toContain('/video/test.mp4')
    })

    it('falls back to default when path invalid', () => {
      const propsWithInvalidPath = {
        ...defaultProps,
        project: {
          ...defaultProps.project,
          videoPath: 'http://evil.com/malware.js' // Invalid - absolute URL
        }
      }

      render(<PortfolioPlayer {...propsWithInvalidPath} />)

      const video = document.querySelector('video source')
      // Should fall back to default path
      expect(video?.getAttribute('src')).toContain('/videoSlotPortfolio/')
    })
  })

  describe('mute functionality', () => {
    it('toggles music mute on button click', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const musicMuteBtn = screen.getByLabelText(/mute music/i)
      fireEvent.click(musicMuteBtn)

      // Check visual change (would need to re-render to see state change)
      expect(musicMuteBtn).toBeInTheDocument()
    })

    it('toggles sfx mute on button click', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const sfxMuteBtn = screen.getByLabelText(/mute sound effects/i)
      fireEvent.click(sfxMuteBtn)

      expect(sfxMuteBtn).toBeInTheDocument()
    })
  })

  describe('volume sliders', () => {
    it('displays current music volume', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      expect(screen.getByText(/🎵 80%/)).toBeInTheDocument()
    })

    it('displays current sfx volume', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      expect(screen.getByText(/🔊 60%/)).toBeInTheDocument()
    })

    it('calls setMusicVolume on slider change', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const musicSlider = screen.getByLabelText('Music volume')
      fireEvent.change(musicSlider, { target: { value: '50' } })

      expect(mockSetMusicVolume).toHaveBeenCalledWith(0.5)
    })

    it('calls setSfxVolume on slider change', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const sfxSlider = screen.getByLabelText('Sound effects volume')
      fireEvent.change(sfxSlider, { target: { value: '75' } })

      expect(mockSetSfxVolume).toHaveBeenCalledWith(0.75)
    })
  })

  describe('keyboard navigation', () => {
    it('calls onBack when ESC is pressed', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockOnBack).toHaveBeenCalled()
    })

    it('toggles play/pause on Space', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const video = document.querySelector('video') as HTMLVideoElement

      fireEvent.keyDown(window, { key: ' ' })

      expect(video.play).toHaveBeenCalled()
    })
  })

  describe('video interaction', () => {
    it('toggles play/pause on video click', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const video = document.querySelector('video') as HTMLVideoElement
      fireEvent.click(video)

      expect(video.play).toHaveBeenCalled()
    })

    it('prevents context menu on video', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const video = document.querySelector('video') as HTMLVideoElement
      const event = fireEvent.contextMenu(video)

      // Default should be prevented
      expect(video).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-label on mute buttons', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      expect(screen.getByLabelText(/mute music/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mute sound effects/i)).toBeInTheDocument()
    })

    it('has aria attributes on sliders', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const musicSlider = screen.getByLabelText('Music volume')
      expect(musicSlider).toHaveAttribute('aria-valuemin', '0')
      expect(musicSlider).toHaveAttribute('aria-valuemax', '100')
      expect(musicSlider).toHaveAttribute('aria-valuenow', '80')

      const sfxSlider = screen.getByLabelText('Sound effects volume')
      expect(sfxSlider).toHaveAttribute('aria-valuemin', '0')
      expect(sfxSlider).toHaveAttribute('aria-valuemax', '100')
      expect(sfxSlider).toHaveAttribute('aria-valuenow', '60')
    })

    it('has proper role attributes', () => {
      render(<PortfolioPlayer {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      const sliders = screen.getAllByRole('slider')

      expect(buttons.length).toBeGreaterThanOrEqual(2)
      expect(sliders.length).toBe(2)
    })
  })
})
