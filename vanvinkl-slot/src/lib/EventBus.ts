/**
 * Global Event Bus for cross-component communication
 *
 * Features:
 * - Type-safe event system
 * - Subscribe/unsubscribe pattern
 * - No React dependency (pure JS singleton)
 *
 * Usage:
 * ```ts
 * import { eventBus } from '@/lib/EventBus'
 *
 * // Subscribe
 * const unsubscribe = eventBus.on('SLOT_WIN', (data) => {
 *   console.log('Won:', data.amount)
 * })
 *
 * // Emit
 * eventBus.emit('SLOT_WIN', { machineId: 'skills', amount: 1000 })
 *
 * // Cleanup
 * unsubscribe()
 * ```
 */

export type EventType =
  | 'SLOT_WIN'
  | 'SLOT_LOSE'
  | 'SLOT_SPIN_START'
  | 'SLOT_SPIN_END'
  | 'MACHINE_PROXIMITY'
  | 'AVATAR_MOVE'
  | 'AUDIO_PLAY'
  | 'AUDIO_STOP'

export interface EventPayload {
  SLOT_WIN: { machineId: string; amount: number; symbols: string[] }
  SLOT_LOSE: { machineId: string }
  SLOT_SPIN_START: { machineId: string }
  SLOT_SPIN_END: { machineId: string; isWin: boolean }
  MACHINE_PROXIMITY: { machineId: string | null; distance?: number }
  AVATAR_MOVE: { position: [number, number, number]; rotation: number }
  AUDIO_PLAY: { soundId: string; volume: number }
  AUDIO_STOP: { soundId: string }
}

type EventHandler<T extends EventType> = (payload: EventPayload[T]) => void

class EventBus {
  private listeners: Map<EventType, Set<EventHandler<any>>> = new Map()

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once<T extends EventType>(event: T, handler: EventHandler<T>): void {
    const wrappedHandler = (payload: EventPayload[T]) => {
      handler(payload)
      this.listeners.get(event)?.delete(wrappedHandler)
    }

    this.on(event, wrappedHandler)
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T extends EventType>(event: T, payload: EventPayload[T]): void {
    const handlers = this.listeners.get(event)

    if (!handlers || handlers.size === 0) {
      // No listeners — silent pass
      return
    }

    handlers.forEach((handler) => {
      try {
        handler(payload)
      } catch (err) {
        console.error(`EventBus error in handler for "${event}":`, err)
      }
    })
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   */
  clear(event?: EventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size ?? 0
  }
}

export const eventBus = new EventBus()
