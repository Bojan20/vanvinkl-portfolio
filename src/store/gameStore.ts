/**
 * Game Store - Zustand state management
 *
 * ZERO LATENCY DESIGN:
 * - Atomic updates (no cascading re-renders)
 * - Refs for per-frame data (position, rotation)
 * - Store only for UI-relevant state changes
 * - Subscriptions are granular (components pick what they need)
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

// ============================================
// TYPES
// ============================================
interface CouchPosition {
  id: string
  x: number
  z: number
  rotation: number
  seatX: number
  seatZ: number
  standX: number
  standZ: number
}

// ============================================
// GAME STATE
// ============================================
interface GameState {
  // Intro
  showIntro: boolean
  overlayComplete: boolean
  cameraComplete: boolean

  // Player state
  isSitting: boolean
  currentCouch: CouchPosition | null

  // Interaction proximity (for UI indicators)
  nearMachine: string | null
  nearCouch: CouchPosition | null

  // Slot machine state
  spinningMachine: string | null
  winMachine: string | null
  isJackpot: boolean

  // Modal
  modalData: { id: string; title: string; content: string[] } | null

  // Audio
  audioInitialized: boolean
  masterVolume: number
  muted: boolean
}

// ============================================
// ACTIONS
// ============================================
interface GameActions {
  // Intro
  setOverlayComplete: () => void
  setCameraComplete: () => void
  endIntro: () => void

  // Player
  sitDown: (couch: CouchPosition) => void
  standUp: () => void

  // Proximity (called every frame - must be FAST)
  setNearMachine: (id: string | null) => void
  setNearCouch: (couch: CouchPosition | null) => void

  // Slots
  startSpin: (machineId: string) => void
  triggerWin: (machineId: string, isJackpot: boolean) => void
  endSpin: () => void

  // Modal
  showModal: (id: string, title: string, content: string[]) => void
  closeModal: () => void

  // Audio
  setAudioInitialized: () => void
  setMasterVolume: (volume: number) => void
  toggleMute: () => void

  // Reset
  reset: () => void
}

// ============================================
// INITIAL STATE
// ============================================
const initialState: GameState = {
  showIntro: true,
  overlayComplete: false,
  cameraComplete: false,

  isSitting: false,
  currentCouch: null,

  nearMachine: null,
  nearCouch: null,

  spinningMachine: null,
  winMachine: null,
  isJackpot: false,

  modalData: null,

  audioInitialized: false,
  masterVolume: 0.8,
  muted: false
}

// ============================================
// STORE
// ============================================
export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Intro actions
    setOverlayComplete: () => set({ overlayComplete: true }),
    setCameraComplete: () => set({ cameraComplete: true }),
    endIntro: () => set({ showIntro: false }),

    // Player actions
    sitDown: (couch) => set({
      isSitting: true,
      currentCouch: couch
    }),

    standUp: () => set({
      isSitting: false,
      currentCouch: null
    }),

    // Proximity actions - optimized for per-frame calls
    // Only updates if value actually changed
    setNearMachine: (id) => {
      if (get().nearMachine !== id) {
        set({ nearMachine: id })
      }
    },

    setNearCouch: (couch) => {
      const current = get().nearCouch
      // Compare by id to avoid object reference issues
      if (current?.id !== couch?.id) {
        set({ nearCouch: couch })
      }
    },

    // Slot actions
    startSpin: (machineId) => set({ spinningMachine: machineId }),

    triggerWin: (machineId, isJackpot) => set({
      winMachine: machineId,
      isJackpot
    }),

    endSpin: () => set({
      spinningMachine: null,
      winMachine: null,
      isJackpot: false
    }),

    // Modal actions
    showModal: (id, title, content) => set({
      modalData: { id, title, content },
      spinningMachine: null  // Clear spinning when modal opens
    }),

    closeModal: () => set({ modalData: null }),

    // Audio actions
    setAudioInitialized: () => set({ audioInitialized: true }),
    setMasterVolume: (volume) => set({ masterVolume: volume }),
    toggleMute: () => set(state => ({ muted: !state.muted })),

    // Reset
    reset: () => set(initialState)
  }))
)

// ============================================
// SELECTORS - For granular subscriptions
// ============================================
export const selectShowIntro = (state: GameState) => state.showIntro
export const selectIsSitting = (state: GameState) => state.isSitting
export const selectNearMachine = (state: GameState) => state.nearMachine
export const selectNearCouch = (state: GameState) => state.nearCouch
export const selectSpinningMachine = (state: GameState) => state.spinningMachine
export const selectWinMachine = (state: GameState) => state.winMachine
export const selectIsJackpot = (state: GameState) => state.isJackpot
export const selectModalData = (state: GameState) => state.modalData
export const selectMuted = (state: GameState) => state.muted

// ============================================
// REF-BASED STATE (for per-frame updates)
// These are NOT in Zustand - direct mutation, zero overhead
// ============================================
export const gameRefs = {
  // Avatar position/rotation - mutated every frame
  avatarPosition: new THREE.Vector3(0, 0, 10),
  avatarRotation: 0,
  isMoving: false,

  // Camera orbit (when sitting)
  orbitAngle: 0,
  orbitPitch: 0.3,
  orbitDistance: 6,

  // Arrow key state
  orbitKeys: { left: false, right: false, up: false, down: false },

  // Audio timing
  lastFootstepTime: 0,

  // Sitting rotation
  sittingRotation: 0
}

// Reset refs helper
export function resetGameRefs() {
  gameRefs.avatarPosition.set(0, 0, 10)
  gameRefs.avatarRotation = 0
  gameRefs.isMoving = false
  gameRefs.orbitAngle = 0
  gameRefs.orbitPitch = 0.3
  gameRefs.orbitDistance = 6
  gameRefs.orbitKeys = { left: false, right: false, up: false, down: false }
  gameRefs.lastFootstepTime = 0
  gameRefs.sittingRotation = 0
}
