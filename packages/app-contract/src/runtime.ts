import { z } from 'zod'
import type { Db } from './db.ts'
import type { AppFailureCode } from './failures.ts'
import type { AppProps, Caller } from './props.ts'

/** What a handler receives beside its input (decision 0019). */
export type Context = Readonly<{ db: Db; caller: Caller }>

/** An app's operations in its own Zod (decision 0055): what each one takes and what it answers. */
export type Operations = Readonly<Record<string, Readonly<{ input: z.ZodType; output: z.ZodType }>>>

/** One operation's code: its input as the input schema decodes it in, its output before encoding out. */
export type Handler = (input: unknown, context: Context) => unknown

/** The name of an operation, as `/api/<name>` says it, marked so a port takes it only from here (code C23). */
const OperationName = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/)
  .brand<'OperationName'>()
type OperationName = z.infer<typeof OperationName>

type Served = Readonly<{ input: z.ZodType; output: z.ZodType; handler: Handler }>

/** The runtime's own refusals, by code only: an answer never repeats the value it refused. */
function answer(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function refuse(status: number, code: AppFailureCode): Response {
  return answer(status, { code })
}

function servedOf(operations: Operations, handlers: Readonly<Record<string, Handler>>) {
  const extra = Object.keys(handlers).filter((name) => !Object.hasOwn(operations, name))
  if (extra.length > 0) throw new Error(`Handlers without an operation: ${extra.join(', ')}`)
  return new Map(
    Object.entries(operations).map(([name, { input, output }]): [OperationName, Served] => {
      const handler = Object.hasOwn(handlers, name) ? handlers[name] : undefined
      if (handler === undefined) throw new Error(`Operation without a handler: ${name}`)
      return [OperationName.parse(name), { input, output, handler }]
    }),
  )
}

/**
 * The output as it travels, by the output schema's own codecs. Zod's `safeEncode` throws on a
 * one-way transform (`$ZodEncodeError`, zod 4.6.5) instead of failing, and an output that cannot be
 * encoded is the app's, so either way the call ends in `OUTPUT_INVALID`.
 */
function encoded(
  operation: OperationName,
  schema: z.ZodType,
  output: unknown,
): Readonly<{ wire: unknown }> | undefined {
  try {
    const result = schema.safeEncode(output)
    return result.success ? { wire: result.data } : undefined
  } catch (error) {
    const kind = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 50, msg: 'OUTPUT_INVALID', operation, kind }))
    return undefined
  }
}

/**
 * The app's Worker for contract 1 (decisions 0019, 0055): `POST /api/<operation>` becomes
 * `handler(input, { db, caller })`, the input decoded by the operation's own Zod and the output
 * encoded by it. Static files never reach here: the platform answers them first, so an unknown path
 * is a 404. An operation without its handler, a handler without its operation, or a name `/api`
 * cannot say stops the Worker from starting.
 */
export function serveApp(
  app: Readonly<{ operations: Operations; handlers: Readonly<Record<string, Handler>> }>,
) {
  const served = servedOf(app.operations, app.handlers)
  return {
    async fetch(request: Request, _env: unknown, ctx: Readonly<{ props: AppProps }>) {
      const { pathname } = new URL(request.url)
      const name = pathname.startsWith('/api/')
        ? OperationName.safeParse(pathname.slice('/api/'.length)).data
        : undefined
      const operation =
        request.method === 'POST' && name !== undefined ? served.get(name) : undefined
      if (name === undefined || operation === undefined) return refuse(404, 'OPERATION_NOT_FOUND')
      // biome-ignore lint/plugin: an unreadable body fails the operation's input schema next (C27, C53)
      const body: unknown = await request.json().catch(() => undefined)
      const input = operation.input.safeParse(body)
      if (!input.success) return refuse(400, 'INPUT_INVALID')
      const { db, caller } = ctx.props
      let output: unknown
      try {
        output = await operation.handler(input.data, { db, caller })
      } catch (error) {
        // The Worker's log keeps which operation failed and how, never the message's values.
        const kind = error instanceof Error ? error.name : typeof error
        console.error(JSON.stringify({ level: 50, msg: 'HANDLER_FAILED', operation: name, kind }))
        return refuse(500, 'HANDLER_FAILED')
      }
      const checked = encoded(name, operation.output, output)
      if (checked === undefined) return refuse(500, 'OUTPUT_INVALID')
      return answer(200, checked.wire)
    },
  }
}
