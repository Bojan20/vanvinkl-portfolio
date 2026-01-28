import { useRef, useEffect } from 'react'

/**
 * Request Animation Frame hook with deltaTime calculation
 * Used for 60fps animations in SkillReelColumn and other animated components
 *
 * @param callback - Function called on each frame with deltaTime in milliseconds
 * @param active - Whether the RAF loop should be running
 */
function useRAF(callback: (deltaTime: number) => void, active: boolean) {
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const animate = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16.67
      lastTimeRef.current = time
      callbackRef.current(delta)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active])
}

export default useRAF
