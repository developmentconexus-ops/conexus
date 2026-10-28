import type { AppFailureCode } from '@conexus/app-contract'
import { APP_FAILURE_CODES, CallerAccess } from '@conexus/app-contract'
import { z } from 'zod'
import type { Operations } from './operations.ts'

/** What a person reads when a call fails, by code (code C48): the one owner of these phrases. */
export const failureText: Readonly<Record<AppFailureCode, string>> = {
  OPERATION_NOT_FOUND: 'Esta função não existe neste app.',
  INPUT_INVALID: 'Os dados enviados não são válidos. Confira e tente de novo.',
  OUTPUT_INVALID: 'O app respondeu de um jeito inesperado. Tente de novo.',
  HANDLER_FAILED: 'O app não conseguiu concluir. Tente de novo.',
  ROLE_FORBIDDEN: 'Seu papel neste app não permite isto.',
  UNREACHABLE: 'Não foi possível falar com o app. Tente de novo.',
}

/** A call that did not give its answer, by the code alone. */
export class CallFailed extends Error {
  readonly code: AppFailureCode

  constructor(code: AppFailureCode, options?: ErrorOptions) {
    super(failureText[code], options)
    this.name = 'CallFailed'
    this.code = code
  }
}

const Failure = z.strictObject({ code: z.enum(APP_FAILURE_CODES) })

/** The browser's `location`, as far as the client reads it: the package types no DOM, the app's screens do. */
declare const location: Readonly<{ reload(): void }>

/** Who calls, as `GET /api/caller` answers. */
const WhoCalls = z.strictObject({ personName: z.string(), access: CallerAccess })

/**
 * Whether the role holds for this access. It only mirrors the server's rule so a screen can hide a
 * button; the guarantee is the server's `ROLE_FORBIDDEN` (code C26).
 */
export function can(access: CallerAccess, role: string): boolean {
  return access.kind === 'BUILDER' || access.role === role
}

/**
 * Sends one call to the app and returns its JSON answer. The dispatcher speaking to the browser, not
 * the app, is a redirect to the Hub (the app's session is gone) or a 4xx page that is not JSON: the
 * page reloads, so the navigation shows the Hub's refusal. A 5xx page stays `UNREACHABLE`, because
 * reloading does not mend a Hub that is down.
 */
async function send(fetcher: typeof fetch, path: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetcher(path, { ...init, redirect: 'manual' })
  } catch (cause) {
    throw new CallFailed('UNREACHABLE', { cause })
  }
  if (response.type === 'opaqueredirect') return refusedByPlatform()
  // biome-ignore lint/plugin: a body that is not JSON is the platform's own page, read as a refusal or UNREACHABLE below
  const body: unknown = await response.json().catch(() => undefined)
  if (response.ok) return body
  const failure = Failure.safeParse(body)
  if (failure.success) throw new CallFailed(failure.data.code)
  if (body === undefined && response.status >= 400 && response.status < 500) {
    return refusedByPlatform()
  }
  throw new CallFailed('UNREACHABLE')
}

function refusedByPlatform(): never {
  location.reload()
  throw new CallFailed('UNREACHABLE')
}

/** Who is using the app and how they hold it, for a screen to hide what the role cannot do. */
export async function readCaller(
  fetcher: typeof fetch = fetch,
): Promise<Readonly<{ personName: string; access: CallerAccess }>> {
  const body = await send(fetcher, '/api/caller', { method: 'GET' })
  const caller = WhoCalls.safeParse(body)
  if (!caller.success) throw new CallFailed('UNREACHABLE')
  return caller.data
}

/**
 * The client of an app's operations, `api('name', input)`: it sends the input to `POST /api/<name>`
 * and returns the output checked against the operation's Zod (code C27); any failure is a
 * `CallFailed`.
 */
export function createApi<const O extends Operations>(
  operations: O,
  fetcher: typeof fetch = fetch,
) {
  async function call<K extends keyof O & string>(
    name: K,
    input: z.input<O[K]['input']>,
  ): Promise<z.output<O[K]['output']>>
  async function call(name: string, input: unknown): Promise<unknown> {
    const body = await send(fetcher, `/api/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const output = operations[name]?.output.safeParse(body)
    if (output?.success !== true) throw new CallFailed('OUTPUT_INVALID')
    return output.data
  }
  return call
}
