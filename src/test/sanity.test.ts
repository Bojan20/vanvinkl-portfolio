/**
 * Sanity test - verifies testing infrastructure works
 */

import { describe, it, expect } from 'vitest'

describe('Testing Infrastructure', () => {
  it('vitest runs correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom environment is available', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('mocks are working', () => {
    // matchMedia mock
    expect(typeof window.matchMedia).toBe('function')
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    expect(mq.matches).toBe(false)

    // localStorage mock
    expect(typeof localStorage.getItem).toBe('function')
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')

    // AudioContext mock
    expect(typeof AudioContext).toBe('function')

    // ResizeObserver mock
    expect(typeof ResizeObserver).toBe('function')
  })
})
