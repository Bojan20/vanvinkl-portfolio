/**
 * SpectrumVisualizer - Audio reactive bars
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { uaGetFrequencyData } from '../../audio'

export function SpectrumVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const animationRef = useRef<number>()

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get frequency data from audio system
    const frequencyData = uaGetFrequencyData()

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bars
    const barCount = 32
    const barWidth = canvas.width / barCount - 2
    const maxHeight = canvas.height

    for (let i = 0; i < barCount; i++) {
      // Sample frequency data evenly
      const dataIndex = Math.floor((i / barCount) * (frequencyData?.length || 128))
      const value = frequencyData ? frequencyData[dataIndex] / 255 : 0.1 + Math.random() * 0.1

      const barHeight = value * maxHeight * (isHovered ? 1.2 : 1)
      const x = i * (barWidth + 2)
      const y = maxHeight - barHeight

      // Gradient based on frequency
      const hue = 180 + (i / barCount) * 60 // Cyan to magenta
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.6 + value * 0.4})`

      // Draw bar with rounded top
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0])
      ctx.fill()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isHovered])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        width: '200px',
        height: '60px',
        background: 'rgba(5, 5, 15, 0.5)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '8px',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 0 20px rgba(0, 255, 255, 0.3)' : 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        width={184}
        height={44}
        style={{ display: 'block' }}
      />
    </div>
  )
}
