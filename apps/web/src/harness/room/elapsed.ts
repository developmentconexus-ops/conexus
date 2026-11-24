import { useEffect, useReducer, useState } from 'react'

/** Draws the component again every second, for a count the eye follows. */
export function useEverySecond(): void {
  const [, tick] = useReducer((count: number) => count + 1, 0)
  useEffect(() => {
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])
}

/** The whole seconds since `since` (epoch ms), counted every second. */
export function useSecondsSince(since: number): number {
  useEverySecond()
  return Math.floor((Date.now() - since) / 1000)
}

/** The whole seconds since the component first showed, counted every second. */
export function useSecondsShown(): number {
  return useSecondsSince(useState(Date.now)[0])
}
