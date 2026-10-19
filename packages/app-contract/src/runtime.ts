import type { z } from 'zod'
import type { Db } from './db.ts'
import { Manifest, schemaOf } from './manifest.ts'
import type { AppProps, Caller } from './props.ts'

/** One operation's code: the checked input in, a value of the declared output shape out. */
export type Handler = (input: unknown, context: Readonly<{ db: Db; caller: Caller }>) => unknown

type Operation = Readonly<{ input: z.ZodType; output: z.ZodType; handler: Handler }>

/** The runtime's own refusals, by code only: an answer never repeats the value it refused. */
function answer(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function operationsOf(manifest: unknown, handlers: Readonly<Record<string, Handler>>) {
  const parsed = Manifest.parse(manifest)
  const names = Object.keys(parsed.operations)
  const extra = Object.keys(handlers).filter((name) => !names.includes(name))
  if (extra.length > 0) throw new Error(`Handlers without an operation: ${extra.join(', ')}`)
  return new Map(
    Object.entries(parsed.operations).map(([name, { input, output }]): [string, Operation] => {
      const handler = handlers[name]
      if (handler === undefined) throw new Error(`Operation without a handler: ${name}`)
      return [name, { input: schemaOf(input), output: schemaOf(output), handler }]
    }),
  )
}

/**
 * The app's Worker for contract 1 (decision 0019): `POST /api/<operation>` becomes
 * `handler(input, { db, caller })`, with the input and the output checked against the manifest.
 * Static files never reach here: the platform answers them first, so an unknown path is a 404.
 * A manifest that does not parse, or a handler missing, stops the Worker from starting.
 */
export function serveApp(
  app: Readonly<{ manifest: unknown; handlers: Readonly<Record<string, Handler>> }>,
) {
  const operations = operationsOf(app.manifest, app.handlers)
  return {
    async fetch(request: Request, _env: unknown, ctx: Readonly<{ props: AppProps }>) {
      const { pathname } = new URL(request.url)
      const name = pathname.startsWith('/api/') ? pathname.slice('/api/'.length) : ''
      const operation = request.method === 'POST' ? operations.get(name) : undefined
      if (operation === undefined) return answer(404, { code: 'OPERATION_NOT_FOUND' })
      // biome-ignore lint/plugin: an unreadable body fails the operation's input schema next (C27, C53)
      const body: unknown = await request.json().catch(() => undefined)
      const input = operation.input.safeParse(body)
      if (!input.success) return answer(400, { code: 'INPUT_INVALID' })
      const { db, caller } = ctx.props
      let output: unknown
      try {
        output = await operation.handler(input.data, { db, caller })
      } catch (error) {
        // The Worker's log keeps which operation failed and how, never the message's values.
        const kind = error instanceof Error ? error.name : typeof error
        console.error(JSON.stringify({ level: 50, msg: 'HANDLER_FAILED', operation: name, kind }))
        return answer(500, { code: 'HANDLER_FAILED' })
      }
      const checked = operation.output.safeParse(output)
      if (!checked.success) return answer(500, { code: 'OUTPUT_INVALID' })
      return answer(200, checked.data)
    },
  }
}
