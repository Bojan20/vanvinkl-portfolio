'use client'

import { useCallback } from 'react'
import { track } from '@vercel/analytics'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
}

export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    try {
      track(event.name, event.properties)

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event.name, event.properties)
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [])

  // Specific tracking functions
  const trackSlotSpin = useCallback((result: 'win' | 'lose', amount?: number) => {
    trackEvent({
      name: 'slot_spin',
      properties: {
        result,
        ...(amount !== undefined && { amount })
      }
    })
  }, [trackEvent])

  const trackSlotInteraction = useCallback((action: string) => {
    trackEvent({
      name: 'slot_interaction',
      properties: { action }
    })
  }, [trackEvent])

  const track3DNavigation = useCallback((section: string) => {
    trackEvent({
      name: '3d_navigation',
      properties: { section }
    })
  }, [trackEvent])

  const trackAudioEvent = useCallback((
    type: 'play' | 'pause' | 'volume_change' | 'dsp_toggle',
    details?: Record<string, string | number | boolean>
  ) => {
    trackEvent({
      name: 'audio_event',
      properties: {
        type,
        ...details
      }
    })
  }, [trackEvent])

  const trackGameState = useCallback((
    state: 'loading' | 'tutorial' | 'exploring' | 'playing',
    duration?: number
  ) => {
    trackEvent({
      name: 'game_state',
      properties: {
        state,
        ...(duration !== undefined && { duration })
      }
    })
  }, [trackEvent])

  const trackPerformance = useCallback((metric: string, value: number, unit: string) => {
    trackEvent({
      name: 'performance',
      properties: {
        metric,
        value,
        unit
      }
    })
  }, [trackEvent])

  const trackError = useCallback((error: string, context?: string) => {
    trackEvent({
      name: 'error',
      properties: {
        error,
        ...(context && { context })
      }
    })
  }, [trackEvent])

  const trackFeatureUsage = useCallback((feature: string, used: boolean) => {
    trackEvent({
      name: 'feature_usage',
      properties: {
        feature,
        used
      }
    })
  }, [trackEvent])

  const trackPageView = useCallback((page: string, referrer?: string) => {
    trackEvent({
      name: 'page_view',
      properties: {
        page,
        ...(referrer && { referrer })
      }
    })
  }, [trackEvent])

  const trackSessionStart = useCallback((deviceType: string, browser: string) => {
    trackEvent({
      name: 'session_start',
      properties: {
        deviceType,
        browser
      }
    })
  }, [trackEvent])

  return {
    trackEvent,
    trackSlotSpin,
    trackSlotInteraction,
    track3DNavigation,
    trackAudioEvent,
    trackGameState,
    trackPerformance,
    trackError,
    trackFeatureUsage,
    trackPageView,
    trackSessionStart
  }
}
