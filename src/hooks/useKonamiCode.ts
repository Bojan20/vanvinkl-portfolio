/**
 * useKonamiCode - Easter egg hook for Konami code detection
 *
 * Tracks keyboard input and detects the Konami code:
 * ↑↑↓↓←→←→BA
 */

import { useState, useEffect, useCallback } from 'react'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
]

export function useKonamiCode(): [boolean, () => void] {
  const [_keys, setKeys] = useState<string[]>([])
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = [...prev, e.code].slice(-KONAMI_CODE.length)
        if (newKeys.length === KONAMI_CODE.length &&
            newKeys.every((k, i) => k === KONAMI_CODE[i])) {
          setActivated(true)
        }
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const reset = useCallback(() => {
    setActivated(false)
    setKeys([])
  }, [])

  return [activated, reset]
}
