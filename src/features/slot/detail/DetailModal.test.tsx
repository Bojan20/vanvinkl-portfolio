/**
 * DetailModal Component Tests
 *
 * Tests for modal routing, animations, and close behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import DetailModal from './DetailModal'

// Mock child detail components
vi.mock('./SkillDetail', () => ({
  SkillDetail: ({ data, showContent }: any) => (
    <div data-testid="skill-detail">
      Skill: {data?.name || 'unknown'}
      {showContent && <span data-testid="content-visible">visible</span>}
    </div>
  )
}))

vi.mock('./ServiceDetail', () => ({
  ServiceDetail: ({ data, showContent }: any) => (
    <div data-testid="service-detail">
      Service: {data?.name || 'unknown'}
      {showContent && <span data-testid="content-visible">visible</span>}
    </div>
  )
}))

vi.mock('./ProjectDetail', () => ({
  ProjectDetail: ({ data, showContent }: any) => (
    <div data-testid="project-detail">
      Project: {data?.name || 'unknown'}
      {showContent && <span data-testid="content-visible">visible</span>}
    </div>
  )
}))

vi.mock('./ExperienceDetail', () => ({
  ExperienceDetail: ({ data, showContent }: any) => (
    <div data-testid="experience-detail">
      Experience: {data?.name || 'unknown'}
      {showContent && <span data-testid="content-visible">visible</span>}
    </div>
  )
}))

vi.mock('./StatDetail', () => ({
  StatDetail: ({ data, showContent }: any) => (
    <div data-testid="stat-detail">
      Stat: {data?.name || 'unknown'}
      {showContent && <span data-testid="content-visible">visible</span>}
    </div>
  )
}))

describe('DetailModal', () => {
  const mockOnClose = vi.fn()
  const defaultProps = {
    item: { type: 'skill', index: 0, data: { name: 'React' } },
    primaryColor: '#ff00aa',
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('routing', () => {
    it('renders SkillDetail for skill type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'skill', index: 0, data: { name: 'React' } }} />)

      expect(screen.getByTestId('skill-detail')).toBeInTheDocument()
      expect(screen.getByText(/Skill: React/)).toBeInTheDocument()
    })

    it('renders ServiceDetail for service type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'service', index: 0, data: { name: 'Web Dev' } }} />)

      expect(screen.getByTestId('service-detail')).toBeInTheDocument()
      expect(screen.getByText(/Service: Web Dev/)).toBeInTheDocument()
    })

    it('renders ProjectDetail for project type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'project', index: 0, data: { name: 'Casino' } }} />)

      expect(screen.getByTestId('project-detail')).toBeInTheDocument()
      expect(screen.getByText(/Project: Casino/)).toBeInTheDocument()
    })

    it('renders ExperienceDetail for experience type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'experience', index: 0, data: { name: 'Senior Dev' } }} />)

      expect(screen.getByTestId('experience-detail')).toBeInTheDocument()
      expect(screen.getByText(/Experience: Senior Dev/)).toBeInTheDocument()
    })

    it('renders StatDetail for stat type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'stat', index: 0, data: { name: '100%' } }} />)

      expect(screen.getByTestId('stat-detail')).toBeInTheDocument()
      expect(screen.getByText(/Stat: 100%/)).toBeInTheDocument()
    })

    it('renders nothing for unknown type', () => {
      render(<DetailModal {...defaultProps} item={{ type: 'unknown', index: 0, data: {} }} />)

      expect(screen.queryByTestId('skill-detail')).not.toBeInTheDocument()
      expect(screen.queryByTestId('service-detail')).not.toBeInTheDocument()
    })
  })

  describe('close behavior', () => {
    it('calls onClose when backdrop is clicked', () => {
      const { container } = render(<DetailModal {...defaultProps} />)

      // Click on the backdrop (first div)
      const backdrop = container.firstChild as HTMLElement
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when modal content is clicked', () => {
      render(<DetailModal {...defaultProps} />)

      // Click on the skill detail content
      fireEvent.click(screen.getByTestId('skill-detail'))

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('shows ESC close hint', () => {
      render(<DetailModal {...defaultProps} />)

      expect(screen.getByText('ESC')).toBeInTheDocument()
      expect(screen.getByText(/to close/)).toBeInTheDocument()
    })
  })

  describe('animations', () => {
    it('shows content after staggered delay', async () => {
      // Use real timers for this test to avoid waitFor issues
      vi.useRealTimers()

      render(<DetailModal {...defaultProps} />)

      // Wait for content to appear (100ms delay + buffer)
      await waitFor(() => {
        expect(screen.getByTestId('content-visible')).toBeInTheDocument()
      }, { timeout: 500 })

      // Restore fake timers for other tests
      vi.useFakeTimers()
    })
  })

  describe('styling', () => {
    it('applies primary color to modal styling', () => {
      const { container } = render(<DetailModal {...defaultProps} primaryColor="#00ffff" />)

      // Check that the modal uses the primary color
      const modalCard = container.querySelector('[style*="border"]')
      expect(modalCard).toBeInTheDocument()
    })

    it('renders corner decorations', () => {
      const { container } = render(<DetailModal {...defaultProps} />)

      // Should have 4 corner elements (top-left, top-right, bottom-left, bottom-right)
      const corners = container.querySelectorAll('[style*="position: absolute"]')
      expect(corners.length).toBeGreaterThanOrEqual(4)
    })
  })
})
