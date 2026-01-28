# Mobile Slot Machine - ULTIMATIVNO (Ship Blockers)

**Analysis:** Ultra-detailed audit complete
**Issues Found:** 26 total (11 critical, 9 moderate, 6 minor)
**Status:** KOMPROMISOVAN — needs P0 fixes before AAA

---

## 🔴 P0 — SHIP BLOCKERS (Must Fix)

### 1. Spin Button Touch Target (CRITICAL)
**File:** src/features/slot/ui/GameUI.tsx
**Current:** `clamp(60px, 10vw, 100px)` → 39px
**Required:** 64px minimum
**Fix:**
```tsx
width: clamp(64px, 10vw, 100px)
height: clamp(64px, 10vw, 100px)
```

### 2. Music/SFX Mute Buttons (CRITICAL)
**File:** src/features/slot/portfolio/PortfolioPlayer.tsx
**Current:** 32×32px
**Required:** 48×48px
**Fix:**
```tsx
width: isMobile ? '48px' : '32px'
height: isMobile ? '48px' : '32px'
```

### 3. Marquee Title/Subtitle (CRITICAL)
**File:** src/features/slot/ui/GameUI.tsx
**Current:** Title 19.5px, Subtitle 7.8px
**Fix:**
```tsx
fontSize: clamp(32px, 5vw, 48px)  // Title
fontSize: clamp(13px, 2vw, 16px)  // Subtitle
```

### 4. Jackpot Story Overlap (CRITICAL)
**File:** src/components/SlotFullScreen.tsx
**Current:** bottom: 140px (conflicts with PRESS ENTER)
**Fix:**
```tsx
bottom: '250px'  // Above PRESS ENTER
```

### 5. Skills/Projects Force 1-Column (CRITICAL)
**File:** src/features/slot/views/SkillsView.tsx, ProjectsView.tsx
**Current:** 3 columns on mobile (103px cards)
**Fix:**
```tsx
gridTemplateColumns: window.innerWidth < 600
  ? '1fr'  // 1 column on mobile
  : `repeat(${columns}, 1fr)`
```

### 6. Stat Cards Force 2-Column (CRITICAL)
**File:** src/features/slot/views/AboutView.tsx
**Current:** 4 columns (79.5px cards)
**Fix:**
```tsx
gridTemplateColumns: window.innerWidth < 600
  ? 'repeat(2, 1fr)'  // 2×2 grid
  : `repeat(${Math.min(stats.length, 4)}, 1fr)`
```

---

## 🟡 P1 — QUALITY ISSUES (v1.1)

### 7. Reel Symbol Labels
**Fix:** `clamp(11px, 1.5vw, 14px)`

### 8. Skill Name Overflow
**Fix:** `max-width: 100%; overflow: hidden; text-overflow: ellipsis`

### 9. Video Player Exit Button
**Add:** X button top-right, 48×48px

### 10. Slider Thumb Size
**Fix:** CSS `::-webkit-slider-thumb { width: 20px; height: 20px }`

### 11. "PRESS ENTER" → "TAP TO VIEW"
**Fix:** Conditional text based on isMobile

---

## 🟢 P2 — POLISH (v1.2)

12. Controls hint: 10px → 12px
13. Landscape grid optimization
14. Touch feedback `:active` states
15. InfoPanel safe-area-inset
16. Video icon cue (🎬 emoji)

---

**Total Estimated Time:** 8-12 hours
**Priority:** P0 (6 critical fixes) = 2-3 hours

Ready for immediate execution.
