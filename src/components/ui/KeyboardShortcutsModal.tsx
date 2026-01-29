/**
 * KeyboardShortcutsModal - Help modal showing all keyboard shortcuts
 */

import { useEffect } from 'react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  { key: '↑↓←→', desc: 'Move avatar' },
  { key: 'W A S D', desc: 'Alternative movement' },
  { key: 'SPACE', desc: 'Interact with slot machine' },
  { key: 'M', desc: 'Toggle sound' },
  { key: 'A', desc: 'Audio settings' },
  { key: 'ESC', desc: 'Close modal / Skip intro' },
  { key: '?', desc: 'Show this help' },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(10, 10, 20, 0.95)',
        border: '2px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '20px',
        padding: '32px 40px',
        zIndex: 10001,
        minWidth: '320px',
        boxShadow: '0 0 60px rgba(0, 255, 255, 0.2), 0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'modalIn 0.3s ease-out',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>⌨️</span>
            <span style={{
              color: '#00ffff',
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}>
              KEYBOARD SHORTCUTS
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit'
            }}
          >
            ESC
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map(({ key, desc }) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                minWidth: '100px',
                padding: '6px 12px',
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '6px',
                color: '#00ffff',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {key}
              </div>
              <span style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px'
              }}>
                {desc}
              </span>
            </div>
          ))}
        </div>

        {/* Konami hint */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '11px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Psst... try the Konami code 🎮
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  )
}
