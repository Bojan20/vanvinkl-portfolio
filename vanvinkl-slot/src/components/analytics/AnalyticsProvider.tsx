'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAnalytics } from '@/hooks/useAnalytics'

function AnalyticsTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { trackPageView, trackSessionStart } = useAnalytics()

  // Track session start
  useEffect(() => {
    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    const browser = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'unknown'

    trackSessionStart(deviceType, browser)
  }, [trackSessionStart])

  // Track page views
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url, document.referrer)
  }, [pathname, searchParams, trackPageView])

  // Track performance metrics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming

            // Track key metrics
            const metrics = {
              'DNS Lookup': navEntry.domainLookupEnd - navEntry.domainLookupStart,
              'TCP Connection': navEntry.connectEnd - navEntry.connectStart,
              'Request Time': navEntry.responseStart - navEntry.requestStart,
              'Response Time': navEntry.responseEnd - navEntry.responseStart,
              'DOM Processing': navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
              'Load Complete': navEntry.loadEventEnd - navEntry.loadEventStart,
              'Total Load Time': navEntry.loadEventEnd - navEntry.fetchStart
            }

            console.log('[Performance Metrics]', metrics)
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
      } catch (e) {
        // PerformanceObserver not fully supported
      }

      return () => observer.disconnect()
    }
  }, [])

  // Track Web Vitals
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any
          const fid = fidEntry.processingStart - fidEntry.startTime
          console.log('[FID]', fid, 'ms')
        }
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // Not supported
      }

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('[LCP]', lastEntry.startTime, 'ms')
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // Not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsScore = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value
          }
        }
        console.log('[CLS]', clsScore)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Not supported
      }

      return () => {
        fidObserver.disconnect()
        lcpObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [])

  return null
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracking />
      </Suspense>
      {children}
    </>
  )
}
