/**
 * Vitest Setup File
 *
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom'

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock AudioContext (not available in jsdom)
const audioContextMock = {
  createOscillator: () => ({
    connect: () => {},
    start: () => {},
    stop: () => {},
    type: 'sine',
    frequency: { setValueAtTime: () => {}, value: 440 },
  }),
  createGain: () => ({
    connect: () => {},
    gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, value: 1 },
  }),
  createAnalyser: () => ({
    connect: () => {},
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: () => {},
  }),
  createBiquadFilter: () => ({
    connect: () => {},
    type: 'lowpass',
    frequency: { value: 1000 },
    Q: { value: 1 },
  }),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: () => Promise.resolve(),
  close: () => Promise.resolve(),
}

// @ts-expect-error - Mock AudioContext
window.AudioContext = vi.fn(() => audioContextMock)
// @ts-expect-error - Mock webkitAudioContext
window.webkitAudioContext = vi.fn(() => audioContextMock)

// Mock requestAnimationFrame
window.requestAnimationFrame = (callback) => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number
}

window.cancelAnimationFrame = (id) => {
  clearTimeout(id)
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - Mock IntersectionObserver
window.IntersectionObserver = IntersectionObserverMock

// Suppress console.log in tests (optional - remove if you want to see logs)
// vi.spyOn(console, 'log').mockImplementation(() => {})
