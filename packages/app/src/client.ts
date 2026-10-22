import type { AppFailureCode } from '@conexus/app-contract'
import { APP_FAILURE_CODES } from '@conexus/app-contract'
import { z } from 'zod'
import type { Operations } from './operations.ts'

/** What a person reads when a call fails, by code (code C48): the one owner of these phrases. */
export const failureText: Readonly<Record<AppFailureCode, string>> = {
  OPERATION_NOT_FOUND: 'Esta função não existe neste app.',
  INPUT_INVALID: 'Os dados enviados não são válidos. Confira e tente de novo.',
  OUTPUT_INVALID: 'O app respondeu de um jeito inesperado. Tente de novo.',
  HANDLER_FAILED: 'O app não conseguiu concluir. Tente de novo.',
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
    let response: Response
    try {
      response = await fetcher(`/api/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    } catch (cause) {
      throw new CallFailed('UNREACHABLE', { cause })
    }
    // biome-ignore lint/plugin: a body that is not JSON is the platform's own page, read as UNREACHABLE below
    const body: unknown = await response.json().catch(() => undefined)
    if (!response.ok) {
      const failure = Failure.safeParse(body)
      throw new CallFailed(failure.success ? failure.data.code : 'UNREACHABLE')
    }
    const output = operations[name]?.output.safeParse(body)
    if (output?.success !== true) throw new CallFailed('OUTPUT_INVALID')
    return output.data
  }
  return call
}
