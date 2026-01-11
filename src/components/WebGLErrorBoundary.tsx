/**
 * WebGL Error Boundary - Graceful degradation
 *
 * Handles:
 * - WebGL context loss (GPU reset, driver crash)
 * - WebGL not supported
 * - Render errors
 *
 * ZERO LATENCY: Error handling doesn't affect main render loop
 */

import React, { Component, ReactNode, useState, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { COLORS } from '../store/theme'

// ============================================
// CONTEXT LOSS HANDLER (Hook)
// ============================================
export function useWebGLContextHandler() {
  const { gl } = useThree()
  const [contextLost, setContextLost] = useState(false)

  useEffect(() => {
    const canvas = gl.domElement

    const handleContextLost = (event: WebGLContextEvent) => {
      event.preventDefault()
      console.error('[WebGL] Context lost')
      setContextLost(true)
    }

    const handleContextRestored = () => {
      console.log('[WebGL] Context restored')
      setContextLost(false)
      // Force re-render by reloading after short delay
      setTimeout(() => window.location.reload(), 500)
    }

    canvas.addEventListener('webglcontextlost', handleContextLost as EventListener)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost as EventListener)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [gl])

  return contextLost
}

// ============================================
// CONTEXT LOSS OVERLAY
// Shows when WebGL context is lost
// ============================================
interface ContextLostOverlayProps {
  onRetry?: () => void
}

export function ContextLostOverlay({ onRetry }: ContextLostOverlayProps) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      window.location.reload()
    }
  }, [countdown])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050508',
      zIndex: 10000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, #0a0a14 0%, #1a1028 50%, #0a0814 100%)',
        border: `2px solid ${COLORS.magenta}`,
        borderRadius: '16px',
        boxShadow: `0 0 60px ${COLORS.magenta}40`
      }}>
        <h1 style={{
          color: COLORS.cyan,
          fontSize: '32px',
          margin: '0 0 20px 0',
          textShadow: `0 0 20px ${COLORS.cyan}`
        }}>
          Graphics Reset
        </h1>

        <p style={{
          color: '#aaaacc',
          fontSize: '16px',
          margin: '0 0 30px 0'
        }}>
          Your graphics driver was reset.<br />
          Reloading in {countdown}...
        </p>

        <button
          onClick={onRetry || (() => window.location.reload())}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#000',
            background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.magenta})`,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Reload Now
        </button>
      </div>
    </div>
  )
}

// ============================================
// WEBGL NOT SUPPORTED FALLBACK
// ============================================
export function WebGLNotSupported() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050508',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{
          color: COLORS.magenta,
          fontSize: '28px',
          margin: '0 0 20px 0'
        }}>
          WebGL Not Available
        </h1>

        <p style={{
          color: '#aaaacc',
          fontSize: '16px',
          lineHeight: 1.6,
          margin: '0 0 30px 0'
        }}>
          This experience requires WebGL to run.
          Please try one of the following:
        </p>

        <ul style={{
          color: '#888899',
          fontSize: '14px',
          textAlign: 'left',
          lineHeight: 1.8
        }}>
          <li>Update your browser to the latest version</li>
          <li>Enable hardware acceleration in browser settings</li>
          <li>Try a different browser (Chrome, Firefox, Edge)</li>
          <li>Update your graphics drivers</li>
        </ul>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(136, 68, 255, 0.1)',
          border: `1px solid ${COLORS.purple}`,
          borderRadius: '8px'
        }}>
          <p style={{ color: COLORS.cyan, margin: 0 }}>
            Contact: <a href="mailto:email@vanvinkl.com" style={{ color: COLORS.cyan }}>email@vanvinkl.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ERROR BOUNDARY CLASS
// Catches render errors in React Three Fiber
// ============================================
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WebGL Error]', error, errorInfo)

    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'webgl_error', {
        error_message: error.message,
        error_stack: error.stack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050508',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, #0a0a14 0%, #1a1028 50%, #0a0814 100%)',
            border: `2px solid ${COLORS.magenta}`,
            borderRadius: '16px'
          }}>
            <h1 style={{
              color: COLORS.magenta,
              fontSize: '28px',
              margin: '0 0 20px 0'
            }}>
              Something Went Wrong
            </h1>

            <p style={{
              color: '#aaaacc',
              fontSize: '14px',
              margin: '0 0 20px 0',
              maxWidth: '400px'
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '10px 25px',
                  fontSize: '14px',
                  color: COLORS.cyan,
                  background: 'transparent',
                  border: `1px solid ${COLORS.cyan}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000',
                  background: COLORS.cyan,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================
// CONTEXT HANDLER COMPONENT
// Place inside Canvas to monitor WebGL context
// ============================================
export function ContextHandler() {
  const contextLost = useWebGLContextHandler()

  // This component doesn't render anything
  // Context loss overlay is rendered outside Canvas
  return null
}

// ============================================
// CHECK WEBGL SUPPORT
// ============================================
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (e) {
    return false
  }
}

export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch (e) {
    return false
  }
}
