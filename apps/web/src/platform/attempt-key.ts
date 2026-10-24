import { useRef } from 'react'
import { HubFailure } from './hub.ts'

/** Whether the next attempt keeps the key: the Hub may have acted on the last (code C37, web W24). */
export function keepsAttemptKey(error: unknown): boolean {
  return error instanceof HubFailure && error.outcomeUnknown
}

/**
 * One key per attempt to create something: two clicks and a retry after an answer that does not
 * settle the outcome carry the same key, so the Hub creates once; the next attempt gets a new one
 * once the Hub has answered whole (code C37, web W24).
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
      if (!keepsAttemptKey(error)) key.current = undefined
      throw error
    }
  }
}

/**
 * One attempt key per scope: a retry of the same content keeps its key, and two contents sent at
 * once never share one.
 */
export function useAttemptKeys(): <T>(
  scope: string,
  work: (key: string) => Promise<T>,
) => Promise<T> {
  const keys = useRef(new Map<string, string>())
  return async function attempt<T>(scope: string, work: (key: string) => Promise<T>): Promise<T> {
    const key = keys.current.get(scope) ?? crypto.randomUUID()
    keys.current.set(scope, key)
    try {
      const result = await work(key)
      keys.current.delete(scope)
      return result
    } catch (error) {
      if (!keepsAttemptKey(error)) keys.current.delete(scope)
      throw error
    }
  }
}
