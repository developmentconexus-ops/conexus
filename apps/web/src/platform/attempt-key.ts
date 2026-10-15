import { useRef } from 'react'
import { HubFailure } from './hub.ts'

/**
 * One key per attempt to create something: two clicks and a retry after a lost reply carry the same
 * key, so the Hub creates once; the next attempt gets a new one once the Hub has answered (code C37,
 * web W24).
 */
export function useAttemptKey(): <T>(work: (key: string) => Promise<T>) => Promise<T> {
  const key = useRef<string | undefined>(undefined)
  return async function attempt<T>(work: (key: string) => Promise<T>): Promise<T> {
    key.current ??= crypto.randomUUID()
    try {
      const result = await work(key.current)
      key.current = undefined
      return result
    } catch (error) {
      if (!(error instanceof HubFailure && error.replyLost)) key.current = undefined
      throw error
    }
  }
}
