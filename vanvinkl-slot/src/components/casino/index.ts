/**
 * Realistic 3D Casino Lounge Components
 */

// Physics-based version (Rapier)
export { CasinoLoungeRealistic } from './CasinoLoungeRealistic'
export { SlotMachine3DRealistic } from './SlotMachine3DRealistic'
export { FirstPersonController, FirstPersonInstructions } from './FirstPersonController'
export { LoungeEnvironment } from './LoungeEnvironment'

// Simple version (no physics - production fallback)
export { CasinoLoungeSimple } from './CasinoLoungeSimple'
export { SlotMachine3DSimple } from './SlotMachine3DSimple'

// Optimized version (performance-focused)
export { CasinoLoungeOptimized } from './CasinoLoungeOptimized'

// Shared
export { CasinoEntrance } from './CasinoEntrance'
