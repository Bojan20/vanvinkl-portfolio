# VanVinkl Casino - TODO Lista (Optimizacija → A+ Grade)

**Current Grade:** B+ (87/100)
**Target Grade:** A+ (95+)
**Timeline:** 4 nedelje

---

## 🔴 FAZA 1: CRITICAL FIXES (Week 1)

### Priority: URGENT - Performance Bottlenecks

**Estimated Impact:** +13 poena (87 → 100)
**Timeline:** 5 dana intenzivnog rada

---

### ✅ 1.1 Post-Processing Adaptive Quality System

**Problem:**
- Current FPS: 40-50fps (post-processing košta 21-29ms)
- Target: 60fps (16.6ms budget)
- GAP: -12ms (crítico)

**Tasks:**

- [ ] **1.1.1** Kreirati `src/store/quality.ts` (Zustand store za quality settings)
  - Auto-detect quality tier (low/medium/high/ultra)
  - FPS monitoring (measureFPS() helper)
  - Manual override opcija

- [ ] **1.1.2** Implement FPS Monitor
  ```typescript
  // src/utils/performance.ts
  export function measureFPS(): number {
    // Use requestAnimationFrame timing
    // Return average FPS over 60 frames
  }
  ```

- [ ] **1.1.3** Modify PostProcessing.tsx
  - Accept `quality` prop
  - Conditional rendering:
    - LOW: SSAO + Bloom + Vignette only (3 effects)
    - MEDIUM: + ChromaticAberration + Noise (5 effects)
    - HIGH: + God Rays (6 effects)
    - ULTRA: + DOF + Lens Flare (7 effects)

- [ ] **1.1.4** Integrate Quality Store u App.tsx
  ```typescript
  const quality = useQualityStore(s => s.quality)
  <PostProcessing quality={quality} />
  ```

- [ ] **1.1.5** Auto-adjustment Logic
  - useEffect u App.tsx
  - Meri FPS svake 3 sekunde
  - Ako fps < 50 → downgrade quality
  - Ako fps > 58 za 10s → upgrade quality

- [ ] **1.1.6** Testing
  - Test na low-end hardware (integrirani GPU)
  - Verify 60fps stability
  - Check visual quality degradation je prihvatljiva

**Success Criteria:**
- ✅ FPS >= 55fps na medium preset
- ✅ FPS >= 60fps na low preset
- ✅ Auto-adjustment radi bez jank-a

**Estimated Time:** 2 dana

---

### ✅ 1.2 Audio System Unification (Faza 1)

**Problem:**
- 3 audio sistema paralelno (AudioDSP, SynthSounds, AudioSystem)
- Zbunjujuća coordination logika
- 20MB memory waste (duplicate buffers)
- Global volume sliders ne kontrolišu sve sisteme

**Tasks:**

- [ ] **1.2.1** Kreirati `src/audio/UnifiedAudioSystem.ts`
  - Single AudioContext
  - Bus structure: master → music/sfx/ui/spatial
  - External sound loading (fetch + decode)
  - Synth sound generation (embed SynthSounds logic)
  - Volume control API

- [ ] **1.2.2** Migriraj AudioDSP functionality
  - Lounge music playback
  - Portfolio audio playback
  - Frequency analyzer (visualizer)
  - Duck/fade methods

- [ ] **1.2.3** Migriraj SynthSounds functionality
  - Embed synth generators (playTick, playSelect, etc.)
  - ADSR envelope logic
  - FM synthesis methods

- [ ] **1.2.4** Update AudioVolumeSync.tsx
  ```typescript
  useEffect(() => {
    unifiedAudioSystem.setBusVolume('music', musicVolume)
  }, [musicVolume])

  useEffect(() => {
    unifiedAudioSystem.setBusVolume('sfx', sfxVolume)
    unifiedAudioSystem.setBusVolume('ui', sfxVolume * 0.8)
  }, [sfxVolume])
  ```

- [ ] **1.2.5** Replace All Calls
  - dspPlay('lounge') → unifiedAudioSystem.play('lounge')
  - playSynthSelect() → unifiedAudioSystem.playSynth('select')
  - audioSystem.* → delete (deprecate legacy)

- [ ] **1.2.6** Testing
  - Verify sve sounds rade
  - Verify global sliders kontrolišu SVE
  - Memory profiling (expect -20MB)

**Success Criteria:**
- ✅ Samo 1 AudioContext
- ✅ Global sliders kontrolišu SVE sounds
- ✅ Memory < 85MB (current: 105MB)

**Estimated Time:** 3 dana (complex migration)

---

### ✅ 1.3 Draw Call Reduction (Quick Wins)

**Problem:**
- Current: 96-107 draw calls
- Target: < 50 draw calls
- Impact: GPU bottleneck na slabijim karticama

**Tasks:**

- [ ] **1.3.1** Geometry Merging - Architecture
  ```typescript
  // src/components/CasinoScene.tsx
  import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

  const mergedWalls = useMemo(() => {
    const geometries = [wall1.geometry, wall2.geometry, ...]
    return mergeGeometries(geometries)
  }, [])

  <mesh geometry={mergedWalls} material={SHARED_MATERIALS.wall} />
  // 20 draw calls → 1 draw call
  ```

- [ ] **1.3.2** Instancing - Neon Tubes
  ```typescript
  <instancedMesh args={[tubeGeometry, neonMaterial, 30]}>
    {/* Update matrices u useFrame */}
  </instancedMesh>
  // 30 draw calls → 1 draw call
  ```

- [ ] **1.3.3** Measure Impact
  - Before: Record draw calls (Chrome DevTools)
  - After: Re-measure
  - Verify FPS improvement (+5-10fps expected)

**Success Criteria:**
- ✅ Draw calls < 50
- ✅ FPS +5fps minimum

**Estimated Time:** 1 dan

---

## 🟠 FAZA 2: HIGH PRIORITY (Week 2)

### ✅ 2.1 SlotFullScreen Refactoring

**Problem:** 6,465 linija u jednom fajlu

**Tasks:**

- [ ] **2.1.1** Kreirati folder strukturu
  ```
  src/features/slot/
  ├── SlotFullScreen.tsx           (500 LOC - orchestrator)
  ├── portfolio/
  │   ├── PortfolioPlayer.tsx      (300 LOC)
  │   ├── VideoPlayer.tsx          (150 LOC)
  │   ├── AudioSync.tsx            (100 LOC)
  │   └── Controls.tsx             (150 LOC)
  ├── views/
  │   ├── SkillsView.tsx           (300 LOC)
  │   ├── ProjectsView.tsx         (250 LOC)
  │   ├── ServicesView.tsx         (200 LOC)
  │   ├── AboutView.tsx            (200 LOC)
  │   ├── ExperienceView.tsx       (200 LOC)
  │   └── ContactView.tsx          (150 LOC)
  ├── modals/
  │   └── DetailModal.tsx          (500 LOC)
  └── animations/
      ├── ReelAnimation.tsx        (400 LOC)
      └── SpinEffects.tsx          (200 LOC)
  ```

- [ ] **2.1.2** Extract PortfolioPlayer
  - Move component definition
  - Export proper types
  - Update imports u SlotFullScreen

- [ ] **2.1.3** Extract Views (jedna po jedna)
  - SkillsView
  - ProjectsView
  - AboutView
  - ExperienceView
  - ContactView
  - ServicesView

- [ ] **2.1.4** Extract DetailModal

- [ ] **2.1.5** Extract Animations

- [ ] **2.1.6** Update SlotFullScreen.tsx (main orchestrator)
  - Import extracted components
  - Clean up (should be ~500 LOC)
  - Verify build works

**Success Criteria:**
- ✅ No file > 500 LOC
- ✅ Clear domain separation
- ✅ Zero regressions (sve radi kao pre)

**Estimated Time:** 3 dana

---

### ✅ 2.2 Bundle Size Optimization

**Problem:** 427KB gzipped (target: 300KB)

**Tasks:**

- [ ] **2.2.1** Improve vite.config.ts chunking
  ```typescript
  manualChunks(id) {
    if (id.includes('postprocessing')) return 'vendor-postprocessing'
    if (id.includes('drei')) return 'vendor-drei'
    if (id.includes('three/examples')) return 'vendor-three-examples'
    if (id.includes('node_modules/three/')) return 'vendor-three'
    if (id.includes('node_modules/')) return 'vendor'
  }
  ```

- [ ] **2.2.2** Tree-shake Three.js
  ```typescript
  // ❌ Don't:
  import * as THREE from 'three'

  // ✅ Do:
  import { Mesh } from 'three/src/objects/Mesh'
  import { BoxGeometry } from 'three/src/geometries/BoxGeometry'
  ```

- [ ] **2.2.3** Lazy Load Više Komponenti
  ```typescript
  const DetailModal = lazy(() => import('./features/slot/modals/DetailModal'))
  const WebGLErrorBoundary = lazy(() => import('./components/WebGLErrorBoundary'))
  ```

- [ ] **2.2.4** Analyze Bundle
  ```bash
  npm install -D rollup-plugin-visualizer
  # Add to vite.config.ts
  # Generate report, identify waste
  ```

- [ ] **2.2.5** Remove Unused Dependencies
  - Check package.json
  - Remove ako ne koriste se

**Success Criteria:**
- ✅ Bundle < 350KB gzipped (stretch: 300KB)
- ✅ No regressions

**Estimated Time:** 2 dana

---

## 🟡 FAZA 3: MEDIUM PRIORITY (Week 3)

### ✅ 3.1 Memory Leak Audit & Fix

**Tasks:**

- [ ] **3.1.1** Video/Audio Element Cleanup
  ```typescript
  // PortfolioPlayer.tsx
  useEffect(() => {
    return () => {
      videoRef.current?.pause()
      videoRef.current?.removeAttribute('src')
      videoRef.current?.load()
      // Same za music/sfx refs
    }
  }, [])
  ```

- [ ] **3.1.2** Three.js Disposal Audit
  - Grep za `new THREE.` bez `dispose()`
  - Add disposal patterns

- [ ] **3.1.3** Long Session Testing
  - Chrome DevTools Memory profiler
  - Run 30min session
  - Check heap growth

**Success Criteria:**
- ✅ Heap stable nakon 30min
- ✅ No memory leaks detected

**Estimated Time:** 1 dan

---

### ✅ 3.2 UX Improvements

**Tasks:**

- [ ] **3.2.1** Auto-hide Video Controls Hint
  ```typescript
  const [showHint, setShowHint] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000)
    return () => clearTimeout(timer)
  }, [])
  ```

- [ ] **3.2.2** Video Progress Bar
  ```typescript
  <div style={{
    position: 'fixed',
    bottom: '60px',
    left: 0,
    width: `${(currentTime / duration) * 100}%`,
    height: '2px',
    background: '#ffd700'
  }} />
  ```

- [ ] **3.2.3** X Button Tooltip
  ```typescript
  <button title={selectedProject ? 'Back to Projects' : 'Exit to Lounge'}>
    ✕
  </button>
  ```

- [ ] **3.2.4** Portfolio Grid Onboarding
  - Tooltip: "Click a project to watch portfolio video"
  - Show na prvi ulazak u Projects INFO

**Success Criteria:**
- ✅ User flow jasniji
- ✅ Manje cognitive load

**Estimated Time:** 1 dan

---

### ✅ 3.3 Security Hardening

**Tasks:**

- [ ] **3.3.1** Add CSP Header (index.html)
  ```html
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    media-src 'self';
  ">
  ```

- [ ] **3.3.2** Path Validation za Media
  ```typescript
  function sanitizeMediaPath(path: string): string {
    if (!path.startsWith('/')) return '/default.mp4'
    if (path.includes('..')) return '/default.mp4'
    return path
  }
  ```

- [ ] **3.3.3** LocalStorage Validation
  ```typescript
  function getBoolean(key: string, defaultValue: boolean): boolean {
    const val = localStorage.getItem(key)
    return val === 'true' ? true : val === 'false' ? false : defaultValue
  }
  ```

**Success Criteria:**
- ✅ CSP header active
- ✅ No XSS vulnerabilities
- ✅ Validated inputs

**Estimated Time:** 1 dan

---

### ✅ 3.4 Audio Fade Improvements

**Tasks:**

- [ ] **3.4.1** Replace setInterval sa requestAnimationFrame
  ```typescript
  // SlotFullScreen.tsx - lounge music fade
  const fade = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / fadeDuration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
    const vol = startVolume * (1 - eased)
    dspVolume('music', vol)
    if (progress < 1) requestAnimationFrame(fade)
  }
  ```

- [ ] **3.4.2** Abort Previous Fade
  ```typescript
  const abortRef = useRef<() => void>()
  useEffect(() => {
    abortRef.current?.() // Cancel previous
    // ... new fade
  }, [selectedProject])
  ```

**Success Criteria:**
- ✅ Smooth fade (no jitter)
- ✅ No overlapping fades

**Estimated Time:** 0.5 dana

---

## 🟢 FAZA 4: NICE-TO-HAVE (Week 4)

### ✅ 4.1 Accessibility (WCAG 2.1 AA)

**Tasks:**

- [ ] **4.1.1** ARIA Labels
  ```typescript
  <button
    aria-label="Exit video player and return to projects"
    role="button"
    tabIndex={0}
  >
    ✕
  </button>
  ```

- [ ] **4.1.2** Focus Indicators (CSS)
  ```css
  button:focus-visible {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }
  ```

- [ ] **4.1.3** Screen Reader Support
  - Add live regions za dynamic content
  - Skip links
  - Landmark roles

**Estimated Time:** 2 dana

---

### ✅ 4.2 Unit Testing

**Tasks:**

- [ ] **4.2.1** Setup Vitest
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  ```

- [ ] **4.2.2** Test Utils
  - Audio helpers
  - Animation utils
  - Validation functions

- [ ] **4.2.3** Component Tests
  - PortfolioPlayer (kad se extract-uje)
  - DetailModal
  - AudioVolumeSync

**Target:** 50% code coverage

**Estimated Time:** Ongoing

---

### ✅ 4.3 Mobile Optimization

**Tasks:**

- [ ] **4.3.1** Test na Real Device
  - iPhone (Safari)
  - Android (Chrome)

- [ ] **4.3.2** Conditional Quality
  ```typescript
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
  const defaultQuality = isMobile ? 'low' : 'auto'
  ```

- [ ] **4.3.3** Touch Gesture Improvements
  - Pinch to zoom video
  - Swipe to navigate slots

**Estimated Time:** 1 dan

---

### ✅ 4.4 PWA Features

**Tasks:**

- [ ] **4.4.1** Service Worker (Workbox)
  - Cache static assets
  - Offline fallback page

- [ ] **4.4.2** Install Prompt
  - "Add to Home Screen" banner

**Estimated Time:** 1 dan

---

## 📊 PROGRESS TRACKING

### Week 1 Checklist (Critical)

- [ ] 1.1 Post-Processing Adaptive Quality (2d)
- [ ] 1.2 Audio Unification Faza 1 (3d)
- [ ] 1.3 Draw Call Reduction (1d)

**Expected Outcome:** FPS 55-60fps, Memory -20MB

---

### Week 2 Checklist (High Priority)

- [ ] 2.1 SlotFullScreen Refactoring (3d)
- [ ] 2.2 Bundle Optimization (2d)

**Expected Outcome:** Bundle -127KB, Easier maintenance

---

### Week 3 Checklist (Medium Priority)

- [ ] 3.1 Memory Leak Audit (1d)
- [ ] 3.2 UX Improvements (1d)
- [ ] 3.3 Security Hardening (1d)
- [ ] 3.4 Audio Fade Improvements (0.5d)

**Expected Outcome:** Zero leaks, Better UX, CSP active

---

### Week 4 Checklist (Polish)

- [ ] 4.1 Accessibility (2d)
- [ ] 4.2 Unit Testing (ongoing)
- [ ] 4.3 Mobile Optimization (1d)
- [ ] 4.4 PWA Features (1d)

**Expected Outcome:** WCAG AA, Tests, PWA

---

## 🎯 MILESTONE GOALS

**After Week 1:**
- Grade: B+ → **A-** (90/100)
- FPS: 40-50fps → **55-60fps**
- Memory: 105MB → **85MB**

**After Week 2:**
- Grade: A- → **A** (93/100)
- Bundle: 427KB → **300KB**
- Codebase: Maintainable

**After Week 3:**
- Grade: A → **A** (94/100)
- Stability: Zero leaks
- Security: Hardened

**After Week 4:**
- Grade: A → **A+** (95+/100)
- Accessibility: WCAG AA
- Testing: 50% coverage
- Mobile: Optimized
- PWA: Ready

---

## 🚀 QUICK START - FAZA 1 (Day 1)

**Today's Focus:** Post-Processing Adaptive Quality

```bash
# 1. Kreirati quality store
touch src/store/quality.ts

# 2. Kreirati performance utils
mkdir -p src/utils
touch src/utils/performance.ts

# 3. Modify PostProcessing
# Edit src/components/PostProcessing.tsx

# 4. Integrate
# Edit src/App.tsx

# 5. Test
npm run dev
# Check FPS in browser
```

**Start with:** Task 1.1.1 (Quality Store)

---

## 📝 NOTES

**Dependencies:**
- Faza 1 mora biti gotova PRE Faze 2 (audio unification needed for refactor)
- Faza 3 može biti paralelna sa Fazom 2
- Faza 4 je independent (može biti bilo kada)

**Testing Strategy:**
- After svake task-a: npm run build
- Visual regression testing (screenshot comparison)
- Performance benchmarking (before/after FPS)

**Rollback Plan:**
- Git branch za svaku fazu
- Commit after svakog task-a
- Tag stable versions (v1.0-pre-optimization, v1.1-post-faza1, etc.)

---

**Created:** 2026-01-28
**Last Updated:** 2026-01-28 17:40
**Status:** Ready to Start - Faza 1
