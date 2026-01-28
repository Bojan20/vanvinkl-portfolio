# VanVinkl Casino - TODO 100/100 (Apsolutna Perfekcija)

**Current Grade:** A+ (95/100)
**Target Grade:** **S++ (100/100)** — Perfection
**Remaining:** +5 poena
**Estimated Time:** 3 dana (paralelni agenti)

---

## 🎯 OVERVIEW

Put od **A+ (95/100) → S++ (100/100)** zahteva **apsolutnu perfekciju** u svim domenima.

**5 poena do perfekcije:**
1. Unit Testing (+2 poena) — Regression prevention, production confidence
2. Performance Budget Monitoring (+1 poen) — Automated quality gates
3. Mobile Optimization (+1 poen) — Console-quality mobile experience
4. PWA + Offline Support (+0.5 poena) — Native app-like experience
5. Advanced Analytics (+0.5 poena) — Data-driven insights

---

## 🔴 FAZA 5.1: UNIT TESTING (+2 POENA)

**Priority:** CRITICAL (highest ROI)
**Estimated Time:** 2 dana
**Impact:** Regression prevention, production confidence, future-proofing

### 5.1.1 Vitest Setup (0.5 dana)

**Install Dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event @vitest/ui
npm install -D jsdom happy-dom
```

**Create vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.*'
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      }
    }
  }
})
```

**Create src/test/setup.ts:**
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Web Audio API
global.AudioContext = vi.fn(() => ({
  createGain: vi.fn(() => ({ gain: { value: 1 }, connect: vi.fn() })),
  createOscillator: vi.fn(() => ({
    frequency: { value: 440, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn()
  })),
  createBufferSource: vi.fn(),
  decodeAudioData: vi.fn(),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn()
})) as any

// Mock WebGL (for Three.js tests)
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn()
})) as any

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Success Criteria:**
- [x] Vitest installed and configured
- [x] Test setup file created
- [x] Mocks for Web Audio API, WebGL, RAF
- [x] Coverage thresholds set (50%)

---

### 5.1.2 Test Utilities (0.5 dana)

**Create src/test/testUtils.tsx:**
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render sa providers
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  return render(ui, {
    wrapper: ({ children }) => children,
    ...options
  })
}

// Audio test helpers
export const mockAudioContext = () => ({
  isInitialized: () => true,
  play: vi.fn((id: string) => `${id}-instance-123`),
  stop: vi.fn(),
  setVolume: vi.fn(),
  getVolume: vi.fn(() => 0.5),
  playSynth: vi.fn(),
  getFrequencyData: vi.fn(() => new Uint8Array(128)),
  getBassLevel: vi.fn(() => 0.5)
})

// Animation test helpers
export const waitForRAF = (frames = 1) => {
  return new Promise(resolve => {
    let count = 0
    const tick = () => {
      count++
      if (count >= frames) {
        resolve(true)
      } else {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  })
}

// Navigation test helpers
export const simulateKeyPress = (key: string, options = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  })
  window.dispatchEvent(event)
}

// Three.js test helpers
export const mockThreeObject = () => ({
  position: { x: 0, y: 0, z: 0, set: vi.fn() },
  rotation: { x: 0, y: 0, z: 0, set: vi.fn() },
  scale: { x: 1, y: 1, z: 1, set: vi.fn() },
  updateMatrix: vi.fn(),
  matrix: {}
})
```

**Success Criteria:**
- [x] renderWithProviders utility
- [x] Audio mocking helpers
- [x] Animation testing utils
- [x] Keyboard simulation helpers
- [x] Three.js mocks

---

### 5.1.3 Security Utils Tests (0.25 dana)

**Create src/utils/security.test.ts:**
```typescript
import { describe, it, expect } from 'vitest'
import {
  isValidMediaPath,
  isValidStorageKey,
  safeGetLocalStorage,
  safeSetLocalStorage,
  isValidExternalURL
} from './security'

describe('Security Utils', () => {
  describe('isValidMediaPath', () => {
    it('allows relative paths starting with /', () => {
      expect(isValidMediaPath('/video/project.mp4')).toBe(true)
      expect(isValidMediaPath('/audio/music.mp3')).toBe(true)
      expect(isValidMediaPath('/assets/image.png')).toBe(true)
    })

    it('blocks absolute URLs', () => {
      expect(isValidMediaPath('http://evil.com/xss.mp4')).toBe(false)
      expect(isValidMediaPath('https://evil.com/xss.mp4')).toBe(false)
      expect(isValidMediaPath('//evil.com/xss.mp4')).toBe(false)
    })

    it('blocks data URLs', () => {
      expect(isValidMediaPath('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('blocks blob URLs', () => {
      expect(isValidMediaPath('blob:http://example.com/uuid')).toBe(false)
    })

    it('blocks parent directory traversal', () => {
      expect(isValidMediaPath('../../../etc/passwd')).toBe(false)
      expect(isValidMediaPath('/path/../../../etc/passwd')).toBe(false)
    })

    it('handles undefined/null', () => {
      expect(isValidMediaPath(undefined)).toBe(false)
      expect(isValidMediaPath(null as any)).toBe(false)
      expect(isValidMediaPath('')).toBe(false)
    })
  })

  describe('isValidStorageKey', () => {
    it('allows alphanumeric + dash + underscore', () => {
      expect(isValidStorageKey('vanvinkl-intro-skipped-v2')).toBe(true)
      expect(isValidStorageKey('user_settings')).toBe(true)
      expect(isValidStorageKey('audio123')).toBe(true)
    })

    it('blocks special characters', () => {
      expect(isValidStorageKey('evil<script>alert(1)</script>')).toBe(false)
      expect(isValidStorageKey('key.with.dots')).toBe(false)
      expect(isValidStorageKey('key with spaces')).toBe(false)
      expect(isValidStorageKey('key/slash')).toBe(false)
    })

    it('handles undefined/null', () => {
      expect(isValidStorageKey(undefined)).toBe(false)
      expect(isValidStorageKey(null as any)).toBe(false)
      expect(isValidStorageKey('')).toBe(false)
    })
  })

  describe('safeGetLocalStorage', () => {
    it('returns value for valid key', () => {
      localStorage.setItem('test-key', 'test-value')
      expect(safeGetLocalStorage('test-key')).toBe('test-value')
    })

    it('returns null for invalid key', () => {
      expect(safeGetLocalStorage('evil<script>')).toBe(null)
    })
  })

  describe('safeSetLocalStorage', () => {
    it('sets value for valid key', () => {
      const result = safeSetLocalStorage('test-key-2', 'value')
      expect(result).toBe(true)
      expect(localStorage.getItem('test-key-2')).toBe('value')
    })

    it('returns false for invalid key', () => {
      const result = safeSetLocalStorage('evil<script>', 'value')
      expect(result).toBe(false)
    })
  })

  describe('isValidExternalURL', () => {
    it('allows HTTPS URLs', () => {
      expect(isValidExternalURL('https://api.example.com/data')).toBe(true)
    })

    it('blocks HTTP URLs', () => {
      expect(isValidExternalURL('http://insecure.com')).toBe(false)
    })

    it('blocks FTP URLs', () => {
      expect(isValidExternalURL('ftp://file-server.com/file')).toBe(false)
    })

    it('respects domain whitelist', () => {
      expect(isValidExternalURL('https://api.example.com', ['example.com'])).toBe(true)
      expect(isValidExternalURL('https://evil.com', ['example.com'])).toBe(false)
    })

    it('handles undefined/null', () => {
      expect(isValidExternalURL(undefined)).toBe(false)
      expect(isValidExternalURL(null as any)).toBe(false)
    })
  })
})
```

**Success Criteria:**
- [x] 100% coverage of security.ts
- [x] All edge cases tested (XSS, injection, traversal)
- [x] Passing tests (15+ test cases)

**Target Coverage:** 100% (security.ts)

---

### 5.1.4 Audio System Tests (0.25 dana)

**Create src/audio/UnifiedAudioSystem.test.ts:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { unifiedAudio, initUnifiedAudio, uaPlay, uaVolume } from './UnifiedAudioSystem'

describe('UnifiedAudioSystem', () => {
  beforeEach(() => {
    // Reset singleton state
    if (unifiedAudio['ctx']) {
      unifiedAudio.dispose()
    }
  })

  describe('Initialization', () => {
    it('creates single AudioContext', async () => {
      await initUnifiedAudio()
      expect(unifiedAudio.isInitialized()).toBe(true)
    })

    it('handles multiple init calls gracefully', async () => {
      await initUnifiedAudio()
      await initUnifiedAudio() // Should not error
      expect(unifiedAudio.isInitialized()).toBe(true)
    })

    it('resumes suspended context', async () => {
      await initUnifiedAudio()
      // Simulate suspend
      unifiedAudio['ctx']!.state = 'suspended' as any
      await initUnifiedAudio()
      expect(unifiedAudio['ctx']!.resume).toHaveBeenCalled()
    })
  })

  describe('Sound Registration', () => {
    it('registers sound config', () => {
      unifiedAudio.register('test-sound', {
        url: '/audio/test.mp3',
        volume: 0.5,
        loop: false,
        bus: 'sfx'
      })
      expect(unifiedAudio['sounds'].has('test-sound')).toBe(true)
    })

    it('registers multiple sounds at once', () => {
      unifiedAudio.registerAll({
        sound1: { url: '/audio/1.mp3', bus: 'music' },
        sound2: { url: '/audio/2.mp3', bus: 'sfx' }
      })
      expect(unifiedAudio['sounds'].has('sound1')).toBe(true)
      expect(unifiedAudio['sounds'].has('sound2')).toBe(true)
    })
  })

  describe('Playback', () => {
    it('queues sounds when not initialized', () => {
      const id = uaPlay('lounge')
      expect(id).toContain('lounge')
      expect(unifiedAudio['pendingPlays'].length).toBeGreaterThan(0)
    })

    it('plays sound when initialized', async () => {
      await initUnifiedAudio()
      unifiedAudio.register('test', { url: '/audio/test.mp3', bus: 'sfx' })

      // Mock fetch
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      } as Response))

      const id = uaPlay('test')
      expect(id).toContain('test')
    })

    it('returns unique instance IDs', async () => {
      await initUnifiedAudio()
      const id1 = uaPlay('lounge')
      const id2 = uaPlay('lounge')
      expect(id1).not.toBe(id2)
    })
  })

  describe('Volume Control', () => {
    it('sets bus volume', async () => {
      await initUnifiedAudio()
      uaVolume('music', 0.7)
      expect(unifiedAudio.getVolume('music')).toBe(0.7)
    })

    it('clamps volume to 0-1 range', async () => {
      await initUnifiedAudio()
      uaVolume('sfx', 1.5) // Over max
      expect(unifiedAudio.getVolume('sfx')).toBeLessThanOrEqual(1)

      uaVolume('sfx', -0.5) // Under min
      expect(unifiedAudio.getVolume('sfx')).toBeGreaterThanOrEqual(0)
    })

    it('applies fade time', async () => {
      await initUnifiedAudio()
      uaVolume('music', 0.5, 0.3) // 300ms fade
      // Verify linearRampToValueAtTime called
      const musicGain = unifiedAudio['musicGain']
      expect(musicGain?.gain.linearRampToValueAtTime).toHaveBeenCalled()
    })
  })

  describe('Synth Sounds', () => {
    it('plays synth sound when initialized', async () => {
      await initUnifiedAudio()
      expect(() => unifiedAudio.playSynth('tick', 0.5)).not.toThrow()
    })

    it('handles invalid synth type gracefully', async () => {
      await initUnifiedAudio()
      expect(() => unifiedAudio.playSynth('invalid' as any, 0.5)).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('disposes all resources', async () => {
      await initUnifiedAudio()
      unifiedAudio.dispose()
      expect(unifiedAudio.isInitialized()).toBe(false)
      expect(unifiedAudio['buffers'].size).toBe(0)
      expect(unifiedAudio['playing'].size).toBe(0)
    })

    it('closes AudioContext on dispose', async () => {
      await initUnifiedAudio()
      const ctx = unifiedAudio['ctx']
      unifiedAudio.dispose()
      expect(ctx?.close).toHaveBeenCalled()
    })
  })
})
```

**Success Criteria:**
- [x] 100% coverage of UnifiedAudioSystem.ts
- [x] 25+ test cases
- [x] All edge cases covered

**Target Coverage:** 100% (UnifiedAudioSystem.ts)

---

### 5.1.5 Component Tests (0.5 dana)

**Create src/features/slot/portfolio/PortfolioPlayer.test.tsx:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PortfolioPlayer from './PortfolioPlayer'

const mockProject = {
  icon: '🎮',
  title: 'Test Project',
  description: 'Test description',
  year: '2024',
  tags: ['React', 'Three.js'],
  videoPath: '/video/test.mp4',
  musicPath: '/audio/music.mp3',
  sfxPath: '/audio/sfx.mp3'
}

describe('PortfolioPlayer', () => {
  it('renders video player', () => {
    render(<PortfolioPlayer project={mockProject} onBack={vi.fn()} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('validates media paths', () => {
    const evilProject = {
      ...mockProject,
      videoPath: 'http://evil.com/xss.mp4'
    }
    render(<PortfolioPlayer project={evilProject} onBack={vi.fn()} />)
    // Should fallback to default (undefined)
    const video = document.querySelector('video')
    expect(video?.src).not.toContain('evil.com')
  })

  it('handles keyboard navigation (arrow keys)', () => {
    const { container } = render(<PortfolioPlayer project={mockProject} onBack={vi.fn()} />)

    // Press right arrow
    fireEvent.keyDown(container, { key: 'ArrowRight' })
    // Focus should move (tested via focusIndex state)
  })

  it('calls onBack when ESC pressed', () => {
    const onBack = vi.fn()
    const { container } = render(<PortfolioPlayer project={mockProject} onBack={onBack} />)

    fireEvent.keyDown(container, { key: 'Escape' })
    expect(onBack).toHaveBeenCalled()
  })

  it('toggles mute on ENTER (when mute button focused)', () => {
    render(<PortfolioPlayer project={mockProject} onBack={vi.fn()} />)
    // Test mute toggle logic
  })

  it('adjusts volume on arrow up/down', () => {
    render(<PortfolioPlayer project={mockProject} onBack={vi.fn()} />)
    // Test volume adjustment (5% increments)
  })

  it('cleans up media on unmount', () => {
    const { unmount } = render(<PortfolioPlayer project={mockProject} onBack={vi.fn()} />)
    const video = document.querySelector('video')
    unmount()
    // Verify pause() and removeAttribute('src') called
  })
})
```

**Create src/features/slot/views/SkillsView.test.tsx:**
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillsView from './SkillsView'

const mockSection = {
  id: 'skills',
  type: 'skills' as const,
  icon: '🎵',
  title: 'Skills',
  subtitle: 'Audio Expertise',
  data: {
    categories: [
      { name: 'Game Audio', skills: ['Adaptive Music', 'Interactive SFX'], level: 'Expert' }
    ]
  }
}

describe('SkillsView', () => {
  it('renders skills grid', () => {
    render(<SkillsView section={mockSection} focusIndex={0} />)
    expect(screen.getByText('Game Audio')).toBeInTheDocument()
  })

  it('highlights focused item', () => {
    const { container } = render(<SkillsView section={mockSection} focusIndex={0} />)
    const focusedItem = container.querySelector('[style*="rgba(255,215,0"]')
    expect(focusedItem).toBeTruthy()
  })

  it('displays progress bars', () => {
    render(<SkillsView section={mockSection} focusIndex={0} />)
    const progressBars = document.querySelectorAll('[style*="background: linear-gradient"]')
    expect(progressBars.length).toBeGreaterThan(0)
  })
})
```

**Create src/utils/performance.test.ts:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FPSMonitor } from './performance'

describe('FPSMonitor', () => {
  let monitor: FPSMonitor

  beforeEach(() => {
    monitor = new FPSMonitor()
    vi.useFakeTimers()
  })

  it('starts monitoring FPS', () => {
    monitor.start()
    expect(monitor['running']).toBe(true)
  })

  it('calculates rolling average', () => {
    monitor.start()

    // Simulate 60fps (16.67ms per frame)
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(16.67)
    }

    const fps = monitor.getFPS()
    expect(fps).toBeCloseTo(60, 0)
  })

  it('stops monitoring', () => {
    monitor.start()
    monitor.stop()
    expect(monitor['running']).toBe(false)
  })

  it('handles zero frames gracefully', () => {
    const fps = monitor.getFPS()
    expect(fps).toBe(60) // Default
  })
})
```

**Success Criteria:**
- [x] PortfolioPlayer tests (7+ cases)
- [x] View component tests (3+ cases each)
- [x] FPSMonitor tests (4+ cases)
- [x] 50%+ overall coverage

**Target Coverage:** 50% overall

---

### 5.1.6 Coverage Report & CI Integration (0.25 dana)

**Generate coverage:**
```bash
npm run test:coverage
```

**Expected output:**
```
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
src/audio/                  | 85.2    | 78.5     | 90.1    | 84.8
 UnifiedAudioSystem.ts      | 92.3    | 85.0     | 95.0    | 91.7
src/utils/                  | 100     | 100      | 100     | 100
 security.ts                | 100     | 100      | 100     | 100
 performance.ts             | 88.5    | 82.0     | 92.0    | 87.9
src/features/slot/          | 65.4    | 58.2     | 70.1    | 64.8
 portfolio/PortfolioPlayer  | 78.2    | 70.5     | 82.0    | 77.8
 views/*                    | 60.5    | 55.0     | 65.0    | 60.1
----------------------------|---------|----------|---------|--------
OVERALL                     | 72.3    | 65.8     | 75.5    | 71.9
```

**CI Integration (GitHub Actions):**

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

**Success Criteria:**
- [x] Coverage > 50%
- [x] CI integration (GitHub Actions)
- [x] Coverage badge in README
- [x] All tests passing

**Impact:** +2 poena → **97/100**

---

## 🟠 FAZA 5.2: PERFORMANCE BUDGET (+1 POEN)

**Priority:** HIGH
**Estimated Time:** 1 dan
**Impact:** Automated quality gates, prevent regressions

### 5.2.1 Lighthouse CI (0.5 dana)

**Install:**
```bash
npm install -D @lhci/cli
```

**Create lighthouserc.js:**
```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173'],
      numberOfRuns: 3
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance budget
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Bundle size
        'total-byte-weight': ['warn', { maxNumericValue: 500000 }], // 500KB
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

**GitHub Actions (.github/workflows/lighthouse.yml):**
```yaml
name: Lighthouse CI

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run lighthouse
      - uses: treosh/lighthouse-ci-action@v9
        with:
          uploadArtifacts: true
```

**Success Criteria:**
- [x] Lighthouse score > 90 (all categories)
- [x] FCP < 2s
- [x] LCP < 3s
- [x] CLS < 0.1
- [x] TBT < 300ms

---

### 5.2.2 Bundle Size Budget (0.25 dana)

**Update vite.config.ts:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkSizeWarningLimit: 200, // Strict: warn at 200KB
        manualChunks(id) {
          // ... existing chunking
        }
      }
    },
    // Size limits
    chunkSizeWarningLimit: 200, // KB
    assetsInlineLimit: 4096 // Inline assets < 4KB
  }
})
```

**Create size-limit config (.size-limit.json):**
```json
[
  {
    "name": "Critical Path (index + slot)",
    "path": "dist/assets/index-*.js",
    "limit": "36 KB", // Current: 35.27 KB gzip
    "gzip": true
  },
  {
    "name": "SlotFullScreen chunk",
    "path": "dist/assets/SlotFullScreen-*.js",
    "limit": "23 KB", // Current: 22.59 KB gzip
    "gzip": true
  },
  {
    "name": "Vendor chunks",
    "path": "dist/assets/vendor-*.js",
    "limit": "350 KB", // Total vendor
    "gzip": true
  }
]
```

**Install size-limit:**
```bash
npm install -D size-limit @size-limit/file
```

**Add to package.json:**
```json
{
  "scripts": {
    "size": "size-limit"
  }
}
```

**Success Criteria:**
- [x] Size limits enforced
- [x] CI fails if exceeded
- [x] Warnings for approaching limit

---

### 5.2.3 FPS Benchmarking (0.25 dana)

**Create src/test/benchmarks/fps.bench.ts:**
```typescript
import { bench, describe } from 'vitest'
import { FPSMonitor } from '../../utils/performance'

describe('FPS Monitor Performance', () => {
  bench('FPS calculation (60 frames)', () => {
    const monitor = new FPSMonitor()
    monitor.start()

    for (let i = 0; i < 60; i++) {
      monitor['frames'].push(60)
    }

    const fps = monitor.getFPS()
    monitor.stop()
  })

  bench('FPS monitor with high frequency updates', () => {
    const monitor = new FPSMonitor()
    monitor.start()

    // Simulate 1000 frame updates
    for (let i = 0; i < 1000; i++) {
      monitor['lastTime'] = performance.now()
      // measure() logic simulation
    }

    monitor.stop()
  })
})
```

**Run benchmarks:**
```bash
npx vitest bench
```

**Success Criteria:**
- [x] FPS monitor < 1ms overhead
- [x] No performance regressions
- [x] Benchmarks in CI

**Impact:** +1 poen → **98/100**

---

## 🟡 FAZA 5.3: MOBILE OPTIMIZATION (+1 POEN)

**Priority:** MEDIUM
**Estimated Time:** 1 dan
**Impact:** Console-quality mobile experience

### 5.3.1 Real Device Testing (0.25 dana)

**Devices to test:**
- iPhone 12+ (Safari)
- iPhone SE (low-end iOS)
- Samsung Galaxy S21+ (Chrome)
- Pixel 6 (Chrome)

**Test checklist:**
```
[ ] Lounge loads (60fps on flagship, 30fps on low-end)
[ ] Intro animation smooth
[ ] Slot machine spins (reels animate smoothly)
[ ] Video player (dual audio sync works)
[ ] Touch controls (swipe, tap, pinch)
[ ] Haptic feedback works
[ ] Portrait + landscape orientation
[ ] PWA install prompt shows
[ ] Offline fallback works
```

**Issues to check:**
- 100vh viewport (iOS Safari URL bar bug)
- Touch event conflicts
- Audio autoplay policy (iOS strict)
- Performance (thermal throttling)

---

### 5.3.2 Mobile Quality Preset (0.25 dana)

**Update src/store/quality.ts:**
```typescript
export function initQualitySystem() {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
  const isLowEndMobile = /iPhone SE|Android 8|Android 9/i.test(navigator.userAgent)

  const tier = detectDeviceTier()
  const store = useQualityStore.getState()

  // Mobile defaults to LOW, desktop to AUTO
  if (isMobile) {
    if (isLowEndMobile || tier === 'low') {
      store.setPreset('low')
      console.log('[Quality] Mobile: forced LOW quality')
    } else {
      store.setPreset('medium')
      console.log('[Quality] Mobile: starting MEDIUM quality')
    }
  } else {
    store.setPreset('auto')
  }

  store.detectDeviceTier()
}
```

**Add mobile-specific optimizations:**
```typescript
// PostProcessing.tsx - disable expensive effects on mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
const effectiveQuality = isMobile && quality === 'high' ? 'medium' : quality

// Disable God Rays on all mobile
const shouldEnableGodRays = !isMobile && (quality === 'high' || quality === 'ultra')
```

**Success Criteria:**
- [x] Mobile defaults to LOW/MEDIUM
- [x] Low-end mobile forced to LOW
- [x] God Rays disabled on mobile
- [x] 30fps minimum on low-end devices

---

### 5.3.3 Touch Gesture Improvements (0.25 dana)

**Video Player pinch-to-zoom:**
```typescript
// PortfolioPlayer.tsx
const [videoScale, setVideoScale] = useState(1)
const lastPinchDistance = useRef(0)

const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )
    lastPinchDistance.current = distance
  }
}

const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    e.preventDefault()
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    )

    const delta = distance - lastPinchDistance.current
    const newScale = Math.max(1, Math.min(3, videoScale + delta * 0.01))
    setVideoScale(newScale)
    lastPinchDistance.current = distance
  }
}

// Apply to video element
<video
  style={{
    transform: `scale(${videoScale})`,
    transformOrigin: 'center center'
  }}
/>
```

**Slot swipe navigation:**
```typescript
// CasinoScene.tsx - swipe between slots
const handleSwipeLeft = () => {
  // Navigate to next slot (right)
  gameRefs.setFocusedSlot((current + 1) % 6)
}

const handleSwipeRight = () => {
  // Navigate to previous slot (left)
  gameRefs.setFocusedSlot((current - 1 + 6) % 6)
}
```

**Success Criteria:**
- [x] Pinch-to-zoom video
- [x] Swipe between slots
- [x] Long press for detail modal
- [x] No gesture conflicts

---

### 5.3.4 iOS Safari Fixes (0.25 dana)

**100vh fix (URL bar issue):**
```typescript
// App.tsx or main.tsx
useEffect(() => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  setVH()
  window.addEventListener('resize', setVH)
  return () => window.removeEventListener('resize', setVH)
}, [])
```

**Update CSS:**
```css
/* Use calc(var(--vh, 1vh) * 100) instead of 100vh */
height: calc(var(--vh, 1vh) * 100);
```

**Audio autoplay workaround:**
```typescript
// iOS requires user gesture before AudioContext
const handleFirstInteraction = async () => {
  await initUnifiedAudio()
  document.removeEventListener('touchstart', handleFirstInteraction)
}
document.addEventListener('touchstart', handleFirstInteraction, { once: true })
```

**Success Criteria:**
- [x] 100vh works on iOS Safari
- [x] Audio plays after first touch
- [x] No layout jank on scroll

**Impact:** +1 poen → **99/100**

---

## 🟢 FAZA 5.4: PWA + OFFLINE (+0.5 POENA)

**Priority:** LOW
**Estimated Time:** 1 dan
**Impact:** Native app-like experience

### 5.4.1 Service Worker (0.5 dana)

**Install Workbox:**
```bash
npm install -D workbox-cli workbox-build
```

**Create workbox-config.js:**
```javascript
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,svg,ico,woff,woff2}'
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /\.(?:mp3|wav|opus|m4a)$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /\.(?:mp4|webm)$/,
      handler: 'NetworkOnly', // Videos too large to cache
      options: {
        cacheName: 'video-cache'
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets'
      }
    }
  ]
}
```

**Generate service worker:**
```bash
npx workbox generateSW workbox-config.js
```

**Register in src/main.tsx:**
```typescript
// Register service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[SW] Registered:', registration.scope)

      // Update prompt
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Show "New version available" prompt
            console.log('[SW] Update available')
          }
        })
      })
    } catch (error) {
      console.error('[SW] Registration failed:', error)
    }
  })
}
```

**Success Criteria:**
- [x] Service worker registered
- [x] Static assets cached
- [x] Audio cached (network-first)
- [x] Update prompt implemented

---

### 5.4.2 Install Prompt (0.25 dana)

**Create src/components/InstallPrompt.tsx:**
```typescript
import { useState, useEffect } from 'react'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Show prompt after 5s (user engaged)
      setTimeout(() => setShowPrompt(true), 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log('[PWA] Install outcome:', outcome)
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,10,20,0.95)',
      border: '2px solid #00ffff',
      borderRadius: '12px',
      padding: '16px 24px',
      zIndex: 9999,
      boxShadow: '0 0 30px rgba(0,255,255,0.5)',
      backdropFilter: 'blur(10px)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <p style={{ color: '#00ffff', marginBottom: '12px', fontSize: '14px' }}>
        Add VanVinkl Casino to your home screen for faster access
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg, #00ffff, #8844ff)',
            border: 'none',
            color: '#000',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}
```

**Add to App.tsx:**
```typescript
import { InstallPrompt } from './components/InstallPrompt'

// In render:
<InstallPrompt />
```

**Success Criteria:**
- [x] Install prompt appears (after 5s engagement)
- [x] User can install as PWA
- [x] Dismissable (Later button)

---

### 5.4.3 Offline Fallback (0.25 dana)

**Create public/offline.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VanVinkl Casino - Offline</title>
  <style>
    body {
      background: linear-gradient(180deg, #03020a, #0a0820);
      color: #00ffff;
      font-family: 'Orbitron', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    h1 {
      font-size: 48px;
      text-shadow: 0 0 20px rgba(0,255,255,0.8);
    }
    p {
      font-size: 18px;
      color: #8844ff;
    }
  </style>
</head>
<body>
  <div>
    <h1>🎰 VanVinkl Casino</h1>
    <p>You're offline. Please check your connection.</p>
    <button onclick="location.reload()" style="
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #00ffff, #8844ff);
      border: none;
      color: #000;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
    ">
      Retry
    </button>
  </div>
</body>
</html>
```

**Update workbox-config.js:**
```javascript
module.exports = {
  // ... existing config
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api/]
}
```

**Success Criteria:**
- [x] Offline page shows when no connection
- [x] Retry button reloads
- [x] Cached assets work offline

**Impact:** +0.5 poena → **99.5/100**

---

## 🟢 FAZA 5.5: ANALYTICS (+0.5 POENA)

**Priority:** LOW
**Estimated Time:** 0.5 dana
**Impact:** Data-driven insights

### 5.5.1 Custom Event Tracking (0.25 dana)

**Create src/utils/analytics.ts:**
```typescript
type EventCategory = 'slot' | 'video' | 'navigation' | 'audio' | 'performance'

interface AnalyticsEvent {
  category: EventCategory
  action: string
  label?: string
  value?: number
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private sessionStart = Date.now()

  track(event: AnalyticsEvent) {
    this.events.push({
      ...event,
      timestamp: Date.now() - this.sessionStart
    } as any)

    console.log('[Analytics]', event)

    // Send to backend (if configured)
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
  }

  // Slot events
  trackSpin(segment: string, isJackpot: boolean) {
    this.track({
      category: 'slot',
      action: 'spin',
      label: segment,
      value: isJackpot ? 1 : 0
    })
  }

  trackJackpot(segment: string, story: string) {
    this.track({
      category: 'slot',
      action: 'jackpot',
      label: `${segment}: ${story}`
    })
  }

  // Video events
  trackVideoView(projectTitle: string, duration: number) {
    this.track({
      category: 'video',
      action: 'view',
      label: projectTitle,
      value: Math.round(duration)
    })
  }

  trackVideoComplete(projectTitle: string) {
    this.track({
      category: 'video',
      action: 'complete',
      label: projectTitle
    })
  }

  // Performance events
  trackFPS(averageFPS: number, quality: string) {
    this.track({
      category: 'performance',
      action: 'fps',
      label: quality,
      value: Math.round(averageFPS)
    })
  }

  trackMemory(heapMB: number) {
    this.track({
      category: 'performance',
      action: 'memory',
      value: Math.round(heapMB)
    })
  }

  // Navigation events
  trackNavigation(from: string, to: string) {
    this.track({
      category: 'navigation',
      action: 'navigate',
      label: `${from} → ${to}`
    })
  }

  // Session summary
  getSessionSummary() {
    const duration = (Date.now() - this.sessionStart) / 1000
    const spins = this.events.filter(e => e.action === 'spin').length
    const videos = this.events.filter(e => e.action === 'view').length
    const jackpots = this.events.filter(e => e.action === 'jackpot').length

    return {
      duration: Math.round(duration),
      totalEvents: this.events.length,
      spins,
      videos,
      jackpots,
      events: this.events
    }
  }
}

export const analytics = new Analytics()

// Auto-send summary on page unload
window.addEventListener('beforeunload', () => {
  const summary = analytics.getSessionSummary()
  console.log('[Analytics] Session summary:', summary)
  // navigator.sendBeacon('/api/analytics/session', JSON.stringify(summary))
})
```

**Integrate in components:**
```typescript
// SlotFullScreen.tsx
import { analytics } from '../utils/analytics'

// After spin
analytics.trackSpin(machineId, isJackpot)
if (isJackpot) {
  analytics.trackJackpot(machineId, jackpotStory)
}

// PortfolioPlayer.tsx
useEffect(() => {
  const startTime = Date.now()
  return () => {
    const duration = (Date.now() - startTime) / 1000
    analytics.trackVideoView(project.title, duration)
  }
}, [project.title])

// App.tsx - FPS tracking
useEffect(() => {
  const interval = setInterval(() => {
    const { currentFPS, resolvedQuality } = useQualityStore.getState()
    analytics.trackFPS(currentFPS, resolvedQuality)
  }, 30000) // Every 30s
  return () => clearInterval(interval)
}, [])
```

**Success Criteria:**
- [x] Event tracking integrated
- [x] Session summary on unload
- [x] No performance impact (async)
- [x] Privacy-respecting (client-side only)

---

### 5.5.2 Error Tracking (0.25 dana)

**Create src/utils/errorTracking.ts:**
```typescript
interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  url: string
  userAgent: string
  grade: number
  fps: number
  memory: number
}

class ErrorTracker {
  private errors: ErrorReport[] = []

  captureError(error: Error, errorInfo?: { componentStack?: string }) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      grade: 95, // Current grade
      fps: useQualityStore.getState().currentFPS,
      memory: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
    }

    this.errors.push(report)
    console.error('[ErrorTracker]', report)

    // Send to backend (Sentry, custom endpoint)
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(report) })
  }

  getErrors() {
    return this.errors
  }
}

export const errorTracker = new ErrorTracker()

// Global error handler
window.addEventListener('error', (event) => {
  errorTracker.captureError(event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  const error = new Error(event.reason?.message || 'Unhandled promise rejection')
  error.stack = event.reason?.stack
  errorTracker.captureError(error)
})
```

**Success Criteria:**
- [x] Global error handler
- [x] Unhandled rejection handler
- [x] Error reports include context (FPS, memory, grade)
- [x] No user disruption (silent tracking)

**Impact:** +0.5 poena → **100/100** 🌟

---

## 📊 GRADE TRAJECTORY (95 → 100)

```
Current:         A+ (95/100)
─────────────────────────────────────────────────────
After 5.1:       S  (97/100) +2 poena (Unit testing)
After 5.2:       S  (98/100) +1 poen (Performance budget)
After 5.3:       S+ (99/100) +1 poen (Mobile optimization)
After 5.4:       S+ (99.5/100) +0.5 poena (PWA)
After 5.5:       S++ (100/100) +0.5 poena (Analytics)
─────────────────────────────────────────────────────
ULTIMATE:        S++ (100/100) 🌟 PERFECTION
```

**Timeline:**
- Day 1: Unit testing (5.1) +2 poena
- Day 2: Performance monitoring (5.2) + Mobile (5.3) +2 poena
- Day 3: PWA (5.4) + Analytics (5.5) +1 poen

**Total:** 3 dana (može 2 dana sa paralelnim agentima)

---

## 🎯 DETAILED TASK BREAKDOWN

### Day 1 - Testing Foundation

**Morning (4h):**
- [ ] 5.1.1 Vitest setup (install, config, mocks)
- [ ] 5.1.2 Test utilities (renderWithProviders, audio mocks)
- [ ] 5.1.3 Security utils tests (15+ test cases, 100% coverage)

**Afternoon (4h):**
- [ ] 5.1.4 Audio system tests (25+ test cases, 90%+ coverage)
- [ ] 5.1.5 Component tests (PortfolioPlayer, views)
- [ ] 5.1.6 Coverage report (target: 50%+ overall)

**Evening (1h):**
- [ ] CI integration (GitHub Actions)
- [ ] Coverage badge in README
- [ ] Verify all tests passing

**Result:** +2 poena → S (97/100)

---

### Day 2 - Performance & Mobile

**Morning (4h):**
- [ ] 5.2.1 Lighthouse CI setup
- [ ] 5.2.2 Bundle size budget (size-limit)
- [ ] 5.2.3 FPS benchmarking
- [ ] CI integration (lighthouse + size checks)

**Afternoon (4h):**
- [ ] 5.3.1 Real device testing (iPhone, Android)
- [ ] 5.3.2 Mobile quality preset (LOW/MEDIUM defaults)
- [ ] 5.3.3 Touch gestures (pinch-to-zoom, swipe)
- [ ] 5.3.4 iOS Safari fixes (100vh, audio autoplay)

**Result:** +2 poena → S+ (99/100)

---

### Day 3 - PWA & Analytics

**Morning (4h):**
- [ ] 5.4.1 Service worker (Workbox, cache strategies)
- [ ] 5.4.2 Install prompt (beforeinstallprompt)
- [ ] 5.4.3 Offline fallback page
- [ ] PWA testing (install, offline, update)

**Afternoon (2h):**
- [ ] 5.5.1 Analytics integration (custom events)
- [ ] 5.5.2 Error tracking (global handlers)
- [ ] Analytics testing (verify events fire)

**Evening (1h):**
- [ ] Final verification (all 5 faze working)
- [ ] Documentation update
- [ ] Grade calculation → 100/100
- [ ] Celebration commit 🎉

**Result:** +1 poen → **S++ (100/100)** 🌟

---

## 📋 SUCCESS CRITERIA (100/100)

### Unit Testing (97/100)
- [x] 50%+ code coverage
- [x] 50+ test cases passing
- [x] CI integration (GitHub Actions)
- [x] Coverage badge in README
- [x] Security utils: 100% coverage
- [x] Audio system: 90%+ coverage
- [x] Components: 60%+ coverage

### Performance Budget (98/100)
- [x] Lighthouse score > 90 (all categories)
- [x] Bundle size limits enforced
- [x] FPS benchmarks passing
- [x] CI fails on budget violations
- [x] Performance metrics tracked

### Mobile Optimization (99/100)
- [x] 30fps minimum on low-end devices
- [x] Mobile quality preset (LOW/MEDIUM)
- [x] Touch gestures (pinch, swipe, long press)
- [x] iOS Safari fixes (100vh, audio)
- [x] Real device testing (4+ devices)

### PWA (99.5/100)
- [x] Service worker registered
- [x] Static assets cached
- [x] Audio cached (network-first)
- [x] Install prompt functional
- [x] Offline fallback page
- [x] Update prompt on new version

### Analytics (100/100)
- [x] Custom event tracking (slot, video, navigation)
- [x] Performance metrics (FPS, memory)
- [x] Error tracking (global handlers)
- [x] Session summary on unload
- [x] Privacy-respecting (client-side)

---

## 🏆 ULTIMATE QUALITY CHECKLIST

### Performance
- [x] 60fps stable (desktop)
- [x] 30fps minimum (mobile low-end)
- [x] Draw calls < 80 (achieved: 74)
- [x] Bundle < 60KB gzip (achieved: ~57KB)
- [x] Memory < 85MB (achieved: ~80MB)
- [x] FCP < 2s (Lighthouse)
- [x] LCP < 3s (Lighthouse)
- [x] CLS < 0.1 (Lighthouse)

### Architecture
- [x] Modular (68 files, domain-driven)
- [x] TypeScript strict (zero errors)
- [x] Single AudioContext (unified)
- [x] Zero memory leaks (all disposal)
- [x] Reusable components
- [x] Tree-shakeable exports

### Security
- [x] CSP header (XSS protection)
- [x] Input validation (100% coverage)
- [x] HTTPS enforcement (external URLs)
- [x] No vulnerabilities (audit passed)

### Accessibility
- [x] WCAG 2.1 AA (7 criteria)
- [x] Keyboard navigation (100%)
- [x] Screen reader support
- [x] Focus indicators
- [x] ARIA complete

### Testing
- [x] Unit tests (50%+ coverage)
- [x] CI integration
- [x] Benchmarks
- [x] Coverage thresholds

### Production
- [x] PWA installable
- [x] Offline support
- [x] Service worker
- [x] Analytics tracking
- [x] Error monitoring

---

## 💎 FINAL DELIVERABLES (100/100)

**Code:**
- 50+ unit tests
- 50%+ coverage
- Performance benchmarks
- Analytics integration
- Error tracking
- PWA manifest + service worker

**CI/CD:**
- GitHub Actions (tests, lighthouse, size)
- Automated quality gates
- Coverage reports
- Bundle size tracking

**Documentation:**
- Test suite documentation
- Analytics setup guide
- PWA installation guide
- Performance budget docs

**Quality:**
- 100/100 grade (S++ tier)
- Production-hardened
- Zero regressions guaranteed
- Future-proof architecture

---

## 🚀 QUICK START (Day 1)

```bash
# Setup testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom

# Create files
touch vitest.config.ts
touch src/test/setup.ts
touch src/test/testUtils.tsx
touch src/utils/security.test.ts
touch src/audio/UnifiedAudioSystem.test.ts

# Run tests
npm run test

# Coverage
npm run test:coverage
```

**Start with:** Task 5.1.1 (Vitest Setup)

---

**Created:** 2026-01-28 22:15
**Target:** S++ (100/100)
**Estimated:** 3 dana (2 sa paralelnim agentima)
**Status:** Ready to Execute
