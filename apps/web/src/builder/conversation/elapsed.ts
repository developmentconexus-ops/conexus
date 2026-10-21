import { useEffect, useReducer, useState } from 'react'

/** Draws the component again every second, for a count the eye follows. */
export function useEverySecond(): void {
  const [, tick] = useReducer((count: number) => count + 1, 0)
  useEffect(() => {
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])
}

/** The whole seconds since the component first showed, counted every second. */
export function useSecondsShown(): number {
  const [since] = useState(Date.now)
  useEverySecond()
  return Math.floor((Date.now() - since) / 1000)
}
