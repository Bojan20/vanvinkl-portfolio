/**
 * AudioVolumeSync Component Tests
 *
 * Tests for volume synchronization between Zustand store and UnifiedAudioSystem.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AudioVolumeSync } from './AudioVolumeSync'

// Mock the audio store
const mockMusicVolume = { current: 0.8 }
const mockSfxVolume = { current: 0.6 }

vi.mock('../store/audio', () => ({
  useAudioStore: (selector: (state: any) => any) => {
    const state = {
      musicVolume: mockMusicVolume.current,
      sfxVolume: mockSfxVolume.current
    }
    return selector(state)
  }
}))

// Mock the unified audio system
const mockSetVolume = vi.fn()
const mockIsInitialized = vi.fn(() => true)

vi.mock('../audio', () => ({
  unifiedAudio: {
    setVolume: (...args: any[]) => mockSetVolume(...args),
    isInitialized: () => mockIsInitialized()
  }
}))

describe('AudioVolumeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMusicVolume.current = 0.8
    mockSfxVolume.current = 0.6
    mockIsInitialized.mockReturnValue(true)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing (returns null)', () => {
    const { container } = render(<AudioVolumeSync />)
    expect(container.firstChild).toBeNull()
  })

  it('syncs music volume on mount when initialized', () => {
    render(<AudioVolumeSync />)

    expect(mockSetVolume).toHaveBeenCalledWith('music', 0.8)
  })

  it('syncs sfx and ui volumes on mount when initialized', () => {
    render(<AudioVolumeSync />)

    expect(mockSetVolume).toHaveBeenCalledWith('sfx', 0.6)
    expect(mockSetVolume).toHaveBeenCalledWith('ui', 0.6)
  })

  it('does not sync when audio not initialized', () => {
    mockIsInitialized.mockReturnValue(false)

    render(<AudioVolumeSync />)

    expect(mockSetVolume).not.toHaveBeenCalled()
  })

  it('syncs both music and sfx buses', () => {
    render(<AudioVolumeSync />)

    // Should have called setVolume for music, sfx, and ui
    const calls = mockSetVolume.mock.calls
    const busNames = calls.map(call => call[0])

    expect(busNames).toContain('music')
    expect(busNames).toContain('sfx')
    expect(busNames).toContain('ui')
  })
})
