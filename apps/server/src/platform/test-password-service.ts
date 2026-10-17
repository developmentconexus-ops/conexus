import { createHash } from 'node:crypto'

type Lifetime = { after(cleanup: () => Promise<void> | void): void }

/** What the fake of the leaked-password service answers; `leaked` holds the passwords it knows. */
export type PasswordService = {
  mode: 'CLEAN' | 'DOWN' | 'HANG'
  leaked: Set<string>
  /** The five-character hash prefixes the Hub asked for. */
  asked: string[]
}

const PASSWORD_RANGE = 'https://api.pwnedpasswords.com/range/'

/**
 * Stands in for the leaked-password service at `fetch` (testing T14), so no test reaches the real
 * one: the library's check sends the first five characters of the hash and reads the rest back.
 */
export function plantPasswordService(t: Lifetime): PasswordService {
  const service: PasswordService = { mode: 'CLEAN', leaked: new Set(), asked: [] }
  const real = globalThis.fetch
  const held: (() => void)[] = []
  function rangeOf(prefix: string): string {
    const padding = `${'0'.repeat(35)}:0`
    const leaks = [...service.leaked].map((password) => {
      const hash = createHash('sha1').update(password).digest('hex').toUpperCase()
      return hash.startsWith(prefix) ? `${hash.slice(5)}:3` : padding
    })
    return [padding, ...leaks].join('\r\n')
  }
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (!url.startsWith(PASSWORD_RANGE)) return await real(input, init)
    const prefix = url.slice(PASSWORD_RANGE.length)
    service.asked.push(prefix)
    if (service.mode === 'HANG') await new Promise<void>((resolve) => held.push(resolve))
    if (service.mode !== 'CLEAN') return new Response('unavailable', { status: 503 })
    return new Response(rangeOf(prefix))
  }
  t.after(() => {
    globalThis.fetch = real
    for (const release of held) release()
  })
  return service
}
