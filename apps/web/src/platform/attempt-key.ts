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
 * An attempt key that a place derives instead of drawing, for a write the browser can reach again
 * after a reload with nothing it kept (code C37): the first 16 bytes of the SHA-256 of `seed`, as a
 * UUID of version 8 and the RFC variant, the shape the Hub's key asks.
 */
export async function derivedAttemptKey(seed: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed))
  const bytes = new Uint8Array(digest.slice(0, 16))
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x80
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
