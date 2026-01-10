/**
 * Info Modal - Cyberpunk styled overlay
 *
 * Keyboard navigation:
 * - Arrow Up/Down: Navigate options
 * - Enter: Select option
 * - Escape: Close modal
 */

import { useEffect, useState } from 'react'

interface InfoModalProps {
  title: string
  content: string[]
  onClose: () => void
}

export function InfoModal({ title, content, onClose }: InfoModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      switch (e.code) {
        case 'Escape':
          if (expandedIndex !== null) {
            // If viewing details, go back to list
            setExpandedIndex(null)
          } else {
            // Otherwise close modal
            onClose()
          }
          break

        case 'ArrowUp':
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : content.length - 1))
          break

        case 'ArrowDown':
          setSelectedIndex(prev => (prev < content.length - 1 ? prev + 1 : 0))
          break

        case 'Enter':
        case 'Space':
          if (expandedIndex === null) {
            setExpandedIndex(selectedIndex)
          } else {
            setExpandedIndex(null)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [onClose, content.length, selectedIndex, expandedIndex])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a14 0%, #1a1028 50%, #0a0814 100%)',
          border: '2px solid #ff00aa',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 0 60px rgba(255, 0, 170, 0.4), 0 0 120px rgba(0, 255, 255, 0.2), inset 0 0 60px rgba(136, 68, 255, 0.1)',
          animation: 'slideUp 0.4s ease-out'
        }}
      >
        {/* Neon title */}
        <h1
          style={{
            margin: '0 0 30px 0',
            fontSize: '42px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#00ffff',
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '4px'
          }}
        >
          {title}
        </h1>

        {/* Content lines - selectable */}
        <div style={{ marginBottom: '30px' }}>
          {content.map((line, i) => {
            const isSelected = i === selectedIndex
            const isExpanded = i === expandedIndex

            return (
              <div
                key={i}
                style={{
                  padding: '12px 20px',
                  marginBottom: '10px',
                  background: isSelected
                    ? 'rgba(0, 255, 255, 0.25)'
                    : 'rgba(136, 68, 255, 0.15)',
                  borderLeft: isSelected
                    ? '4px solid #00ffff'
                    : '3px solid #ff00aa',
                  borderRadius: '0 8px 8px 0',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transform: isSelected ? 'translateX(8px)' : 'none',
                  // NO transition - INSTANT response
                  boxShadow: isSelected
                    ? '0 0 20px rgba(0, 255, 255, 0.3)'
                    : 'none',
                  cursor: 'pointer'
                }}
              >
                {/* Selection indicator - INSTANT */}
                <span style={{
                  color: '#00ffff',
                  marginRight: '10px',
                  opacity: isSelected ? 1 : 0
                  // NO transition - INSTANT
                }}>
                  ▶
                </span>
                {line}

                {/* Expanded details - INSTANT */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '15px',
                      paddingTop: '15px',
                      borderTop: '1px solid rgba(0, 255, 255, 0.3)',
                      fontSize: '14px',
                      color: '#aaaacc'
                      // NO animation - INSTANT
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0' }}>
                      Click to learn more about this skill/service.
                    </p>
                    <p style={{ margin: 0, color: '#8844ff' }}>
                      Press ESC to go back, ENTER to collapse
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation hint */}
        <div
          style={{
            textAlign: 'center',
            color: '#8844ff',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px'
          }}
        >
          <span>
            <span style={{ color: '#00ffff' }}>↑↓</span> Navigate
          </span>
          <span>
            <span style={{ color: '#00ffff' }}>ENTER</span> Select
          </span>
          <span>
            <span style={{ color: '#00ffff' }}>ESC</span> {expandedIndex !== null ? 'Back' : 'Close'}
          </span>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
