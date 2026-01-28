# VanVinkl Casino - Keyboard Shortcuts

**Accessibility:** Full keyboard navigation support (WCAG 2.1 AA compliant)

---

## 🎮 GLOBAL SHORTCUTS

| Key | Action | Context |
|-----|--------|---------|
| **M** | Toggle mute/unmute | Global (any screen) |
| **ESC** | Exit current view | Context-dependent |
| **SPACE** | Context action | Screen-dependent |
| **ENTER** | Confirm/activate | Context-dependent |

---

## 🏛️ CASINO LOUNGE (Main Scene)

| Key | Action |
|-----|--------|
| **W** / **↑** | Move forward |
| **S** / **↓** | Move backward |
| **A** / **←** | Move left |
| **D** / **→** | Move right |
| **SPACE** | Sit at focused slot machine |
| **SHIFT** | Sprint (move faster) |
| **Mouse Move** | Look around (camera control) |

---

## 🎰 SLOT MACHINE (Full Screen)

### Intro Phase

| Key | Action |
|-----|--------|
| **ESC** | Skip intro (once, persists) |
| **ENTER** | Skip intro (once, persists) |

### Spinning Phase

| Key | Action |
|-----|--------|
| **SPACE** | Force stop all reels |
| **ESC** | Exit slot machine (return to lounge) |

### Result Phase

| Key | Action |
|-----|--------|
| **ENTER** | Continue to content view |
| **ESC** | Exit slot machine |

### Content Phase (Grid Navigation)

| Key | Action |
|-----|--------|
| **↑** | Navigate up (grid) |
| **↓** | Navigate down (grid) |
| **←** | Navigate left (grid) |
| **→** | Navigate right (grid) |
| **ENTER** | Open detail modal for focused item |
| **ESC** | Exit slot machine |

### Detail Modal

| Key | Action |
|-----|--------|
| **ESC** | Close detail modal |
| **ENTER** | Open video player (if project) |

---

## 📹 VIDEO PLAYER (Portfolio Projects)

### Focus Navigation

| Key | Action |
|-----|--------|
| **←** | Move focus left (4 items: music mute → music slider → sfx mute → sfx slider) |
| **→** | Move focus right (circular navigation) |
| **↑** | Increase volume (when slider focused, +5%) |
| **↓** | Decrease volume (when slider focused, -5%) |

### Playback Controls

| Key | Action |
|-----|--------|
| **SPACE** | Play/pause video (global, any focus) |
| **ENTER** | Toggle mute (when mute button focused) |
| **ESC** | Exit video player (return to projects grid) |
| **Double Click** | Toggle fullscreen |

### Focus Items

1. **Music Mute Button** (🎵/🔇)
   - ENTER: Toggle music mute
   - Visual: Golden border when focused

2. **Music Volume Slider** (🎵 0-100%)
   - ↑/↓: Adjust volume (5% increments)
   - Visual: Golden glow when focused

3. **SFX Mute Button** (🔊/🔇)
   - ENTER: Toggle SFX mute
   - Visual: Golden border when focused

4. **SFX Volume Slider** (🔊 0-100%)
   - ↑/↓: Adjust volume (5% increments)
   - Visual: Golden glow when focused

---

## 📊 VOLUME SLIDERS (App Level)

### Context

Global volume sliders appear on right side (only when not in keyboard shortcuts modal).

| Key | Action |
|-----|--------|
| **↑** | Music volume up (+10%) |
| **↓** | Music volume down (-10%) |
| **SHIFT + ↑** | SFX volume up (+10%) |
| **SHIFT + ↓** | SFX volume down (-10%) |

---

## ♿ ACCESSIBILITY FEATURES

### WCAG 2.1 AA Compliance

✅ **Keyboard Navigation**
- All interactive elements accessible via keyboard
- Logical tab order
- Visible focus indicators (golden outline)

✅ **Screen Reader Support**
- ARIA labels on all buttons
- ARIA roles (button, slider, application, main)
- ARIA live regions (spinning phase)
- ARIA pressed states (mute buttons)
- ARIA value attributes (sliders)

✅ **Focus Management**
- `:focus-visible` pseudo-class (modern browsers)
- 2px golden outline + 4px glow shadow
- High contrast mode support
- Skip to main content link

✅ **Visual Feedback**
- Focus borders (golden #ffd700)
- Pressed states (visual + ARIA)
- Disabled states (grayed out)
- Hover states (glow effects)

---

## 🎯 SHORTCUT CHEATSHEET

**Quick Reference:**

```
MOVEMENT:        WASD or Arrow Keys
SIT AT SLOT:     SPACE
EXIT:            ESC
NAVIGATE GRID:   Arrow Keys
SELECT ITEM:     ENTER
SKIP INTRO:      ESC or ENTER (first time only)
FORCE STOP REELS: SPACE
MUTE AUDIO:      M
PLAY/PAUSE:      SPACE (in video player)
ADJUST VOLUME:   ↑/↓ (when slider focused)
FULLSCREEN:      Double Click (video player)
```

---

## 🔊 AUDIO CUES

**Synth Sound Feedback:**
- **Tick** — Navigation (arrow keys)
- **Select** — Confirmation (ENTER)
- **Back** — Cancel (ESC)
- **Whoosh** — Modal open
- **Swoosh** — Modal close
- **Reel Spin** — Slot spinning
- **Reel Stop** — Reel lands
- **Win** — Successful result
- **Jackpot** — Epic win

---

## 📱 MOBILE TOUCH CONTROLS

**Video Player:**
- Tap Music Mute → Toggle
- Tap SFX Mute → Toggle
- Swipe left/right on sliders → Adjust volume
- Tap video → Play/pause
- Double tap video → Fullscreen

**Haptic Feedback:**
- Light vibration: Navigation
- Medium vibration: Selection
- Strong vibration: Important actions
- Jackpot pattern: Epic wins

---

**Last Updated:** 2026-01-28
**Version:** 1.0 (FAZA 4)
**Compliance:** WCAG 2.1 AA
