import type { PublishRequest } from '@conexus/hub-api'
import { useState } from 'react'

/**
 * The sentence a screen keeps above for the last action, held with the request the screen showed
 * when it was said. It reads while that request, or none, is on the screen, and is forgotten for
 * good when the screen shows another request: a sentence about a request that closed never sits
 * over the next one, nor comes back when that one leaves. `say` takes the sentence, or nothing to
 * clear it.
 */
export function useSaid(request: PublishRequest | null) {
  const [said, setSaid] = useState<{ text: string; requestId?: string }>()
  if (said !== undefined && request !== null && request.id !== said.requestId) setSaid(undefined)
  function say(text?: string) {
    setSaid(text === undefined ? undefined : { text, requestId: request?.id })
  }
  return [said?.text, say] as const
}
