import { z } from 'zod'
import type { Connectors } from './connectors.ts'
import type { Db } from './db.ts'
import type { AppFailureCode } from './failures.ts'
import type { AppProps, Caller } from './props.ts'

/** What a handler receives beside its input (decision 0019). */
export type Context = Readonly<{ db: Db; caller: Caller; connectors: Connectors }>

/** Who may call an operation: the app's roles it names, or everyone with access. */
export type OperationRoles = readonly string[] | 'everyone'

/** An app's operations in its own Zod (decision 0055): what each one takes, what it answers and who calls it. */
export type Operations = Readonly<
  Record<string, Readonly<{ input: z.ZodType; output: z.ZodType; roles?: OperationRoles }>>
>

/** The app's roles, by name, with what a person reads in Quem usa o app. */
export type Roles = Readonly<Record<string, string>>

/** One operation's code: its input as the input schema decodes it in, its output before encoding out. */
export type Handler = (input: unknown, context: Context) => unknown

/** The name of an operation, as `/api/<name>` says it, marked so a port takes it only from here (code C23). */
const OperationName = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/)
  .brand<'OperationName'>()
type OperationName = z.infer<typeof OperationName>

type Served = Readonly<{
  input: z.ZodType
  output: z.ZodType
  roles: OperationRoles | undefined
  handler: Handler
}>

/** The runtime's own refusals, by code only: an answer never repeats the value it refused. */
function answer(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function refuse(status: number, code: AppFailureCode): Response {
  return answer(status, { code })
}

/**
 * What the app sees of the caller (code C26): a role the version no longer declares is no role, so
 * the handler and `/api/caller` get `null` and no operation, which can name only declared roles
 * (`lockOf`), admits it.
 */
function seenBy(declared: Roles, caller: Caller): Caller {
  const { access } = caller
  if (access.kind === 'BUILDER' || access.role === null || Object.hasOwn(declared, access.role))
    return caller
  return { ...caller, access: { kind: 'USER', role: null } }
}

/** Whether the caller may run an operation: a builder runs all, a role runs the operations that list it. */
function mayRun(operation: Served, caller: Caller): boolean {
  if (operation.roles === undefined || operation.roles === 'everyone') return true
  if (caller.access.kind === 'BUILDER') return true
  const { role } = caller.access
  return role !== null && operation.roles.includes(role)
}

/** An app with roles locks every operation, and only with roles it declares; an app without them locks none. */
function lockOf(name: string, roles: OperationRoles | undefined, declared: Roles | undefined) {
  if (declared === undefined && roles === undefined) return
  if (roles === undefined) throw new Error(`Operation without roles: ${name}`)
  if (roles === 'everyone') return
  const unknown = roles.filter((role) => !Object.hasOwn(declared ?? {}, role))
  if (unknown.length > 0)
    throw new Error(`Operation ${name} names undeclared roles: ${unknown.join(', ')}`)
}

function servedOf(
  operations: Operations,
  handlers: Readonly<Record<string, Handler>>,
  declared: Roles | undefined,
) {
  const extra = Object.keys(handlers).filter((name) => !Object.hasOwn(operations, name))
  if (extra.length > 0) throw new Error(`Handlers without an operation: ${extra.join(', ')}`)
  return new Map(
    Object.entries(operations).map(([name, { input, output, roles }]): [OperationName, Served] => {
      const handler = Object.hasOwn(handlers, name) ? handlers[name] : undefined
      if (handler === undefined) throw new Error(`Operation without a handler: ${name}`)
      lockOf(name, roles, declared)
      return [OperationName.parse(name), { input, output, roles, handler }]
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

/** The handler's answer for a call already admitted and decoded: the output encoded, or the app's failure by code. */
async function respond(
  name: OperationName,
  operation: Served,
  input: unknown,
  context: Context,
): Promise<Response> {
  let output: unknown
  try {
    output = await operation.handler(input, context)
  } catch (error) {
    // The Worker's log keeps which operation failed and how, never the message's values.
    const kind = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 50, msg: 'HANDLER_FAILED', operation: name, kind }))
    return refuse(500, 'HANDLER_FAILED')
  }
  const checked = encoded(name, operation.output, output)
  if (checked === undefined) return refuse(500, 'OUTPUT_INVALID')
  return answer(200, checked.wire)
}

/**
 * The app's Worker for contract 1 (decisions 0019, 0055): `POST /api/<operation>` becomes
 * `handler(input, { db, caller, connectors })`, the input decoded by the operation's own Zod and the output
 * encoded by it, after the operation's `roles` admit the caller (`ROLE_FORBIDDEN`, before the input is
 * read), and `GET /api/caller` answers who calls. Static files never reach here: the platform
 * answers them first, so an unknown path is a 404. An operation without its handler, a handler
 * without its operation, a name `/api` cannot say, or, in an app with roles, an operation without
 * `roles` or naming a role the app does not declare stops the Worker from starting.
 */
export function serveApp(
  app: Readonly<{
    operations: Operations
    handlers: Readonly<Record<string, Handler>>
    roles?: Roles
  }>,
) {
  const served = servedOf(app.operations, app.handlers, app.roles)
  const declared = app.roles ?? {}
  return {
    async fetch(request: Request, _env: unknown, ctx: Readonly<{ props: AppProps }>) {
      const { pathname } = new URL(request.url)
      if (request.method === 'GET' && pathname === '/api/caller') {
        const { personName, access } = seenBy(declared, ctx.props.caller)
        return answer(200, { personName, access })
      }
      const name = pathname.startsWith('/api/')
        ? OperationName.safeParse(pathname.slice('/api/'.length)).data
        : undefined
      const operation =
        request.method === 'POST' && name !== undefined ? served.get(name) : undefined
      if (name === undefined || operation === undefined) return refuse(404, 'OPERATION_NOT_FOUND')
      const { db, connectors } = ctx.props
      const caller = seenBy(declared, ctx.props.caller)
      if (!mayRun(operation, caller)) return refuse(403, 'ROLE_FORBIDDEN')
      // biome-ignore lint/plugin: an unreadable body fails the operation's input schema next (C27, C53)
      const body: unknown = await request.json().catch(() => undefined)
      const input = operation.input.safeParse(body)
      if (!input.success) return refuse(400, 'INPUT_INVALID')
      return respond(name, operation, input.data, { db, caller, connectors })
    },
  }
}
