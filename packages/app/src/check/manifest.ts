import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Manifest } from '@conexus/app-contract'
import { build } from 'esbuild'
import { z } from 'zod'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED, problem, workOf } from './step.ts'

/** The two files of the contract the app's Worker is made of (decision 0055). */
export const OPERATIONS = 'shared/operations.ts'
export const HANDLERS = 'server/handlers.ts'
/** The client the screens call the operations with, written by the check and never by hand. */
const CLIENT = 'src/conexus/api.gen.ts'

const CLIENT_SOURCE = `// Written by the Conexus check from ${OPERATIONS} on every check; changes here are lost.
import { createApi } from '@conexus/app'
import { operations } from '../../shared/operations'

export const api = createApi(operations)
`

/**
 * What the program writes to its answer file: each part of an operation JSON cannot carry, and the migrations
 * `server/handlers.ts` exports, for the manifest.
 */
const Answer = z.strictObject({
  notJson: z.array(
    z.strictObject({
      operation: z.string(),
      side: z.enum(['input', 'output']),
      path: z.string(),
      message: z.string(),
    }),
  ),
  migrations: z.unknown(),
  roles: z.record(z.string(), z.unknown()).optional(),
  connectors: z.record(z.string(), z.unknown()).optional(),
})

const BuildErrors = z.array(
  z.object({
    text: z.string(),
    location: z.object({ file: z.string(), line: z.int(), column: z.int() }).nullable(),
  }),
)

/**
 * The lines that bring the app's `operations`, its `roles` and its `connectors` (an app without
 * them exports none) into a generated module, which the manifest's program and the Worker's entry share.
 */
export function sharedOf(operations: boolean): string[] {
  return operations
    ? [
        `import * as shared from '../../${OPERATIONS}'`,
        'const { operations, roles, connectors } = shared',
      ]
    : ['const operations = {}', 'const roles = undefined', 'const connectors = undefined']
}

/**
 * A program that imports the app's operations and handlers as the Worker will and starts the
 * contract's runtime on them, which refuses an operation without its handler, a handler without its
 * operation, a name `/api` cannot say, or, in an app with roles, an operation without them. It writes what of the operations JSON cannot carry, and the
 * migrations the manifest lists, to a file: the app's own prints never mix with the answer.
 */
function entryOf(operations: boolean, handlers: boolean, answerPath: string): string {
  return [
    "import { writeFileSync } from 'node:fs'",
    "import { serveApp } from '@conexus/app-contract'",
    "import { notJson } from '@conexus/app/json'",
    ...sharedOf(operations),
    handlers ? `import * as server from '../../${HANDLERS}'` : 'const server = {}',
    'serveApp({ operations, handlers: server.handlers ?? {}, roles })',
    'const answer = { notJson: notJson(operations), migrations: server.migrations ?? [], roles, connectors }',
    `writeFileSync(${JSON.stringify(answerPath)}, JSON.stringify(answer))`,
  ].join('\n')
}

/** What the model reads to fix an operation that does not travel. */
const TRAVELS =
  'An operation sends and answers JSON: a date is z.iso.date(), or a z.codec to a Date; a number, not a BigInt; an object or an array, not a Map or a Set.'

/** The manifest's answer, read from the file the program wrote it to. */
function answerOf(path: string): z.infer<typeof Answer> | Readonly<{ unreadable: string }> {
  try {
    const parsed = Answer.safeParse(JSON.parse(readFileSync(path, 'utf8')))
    return parsed.success ? parsed.data : { unreadable: parsed.error.message }
  } catch (error) {
    return { unreadable: String(error) }
  }
}

async function bundle(ctx: CheckContext, entry: string, out: string): Promise<Outcome> {
  const tsconfig = join(ctx.root, 'tsconfig.json')
  try {
    await build({
      entryPoints: [entry],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'esm',
      absWorkingDir: ctx.root,
      logLevel: 'silent',
      ...(existsSync(tsconfig) ? { tsconfig } : {}),
    })
  } catch (error) {
    const errors = BuildErrors.safeParse(Reflect.get(Object(error), 'errors'))
    if (!errors.success) throw error
    const problems = errors.data.map(({ text, location }) =>
      problem({
        code: 'MANIFEST_IMPORT_FAILED',
        message: text,
        ...(location === null
          ? {}
          : { file: location.file, line: location.line, column: location.column + 1 }),
      }),
    )
    return { state: 'failed', problems }
  }
  return PASSED
}

/**
 * The manifest of the app, its migrations from `server/handlers.ts` (none without it), kept for the
 * `worker` step, and the generated client the screens import from `shared/operations.ts`.
 */
export async function manifesto(ctx: CheckContext): Promise<Outcome> {
  const operations = existsSync(join(ctx.root, OPERATIONS))
  const handlers = existsSync(join(ctx.root, HANDLERS))
  mkdirSync(workOf(ctx), { recursive: true })
  const entry = workOf(ctx, 'manifest-entry.ts')
  const out = workOf(ctx, 'manifest-entry.mjs')
  const answerPath = workOf(ctx, 'manifest-answer.json')
  writeFileSync(entry, entryOf(operations, handlers, answerPath))
  const bundled = await bundle(ctx, entry, out)
  if (bundled.state !== 'passed') return bundled
  const ran = await ctx.run(process.execPath, [out], {
    cwd: ctx.root,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('manifesto', ran)
  if (late !== undefined) return late
  const file = handlers ? HANDLERS : OPERATIONS
  const answer = ran.code === 0 ? answerOf(answerPath) : undefined
  if (answer === undefined || 'unreadable' in answer) {
    return { state: 'failed', problems: [{ ...outputProblem('MANIFEST_INVALID', ran), file }] }
  }
  if (answer.notJson.length > 0) {
    const problems = answer.notJson.map(({ operation, side, path, message }) =>
      problem({
        code: 'OPERATION_NOT_JSON',
        file: OPERATIONS,
        message: `${operation} ${side}${path === '' ? '' : ` ${path}`}: ${message}. ${TRAVELS}`,
      }),
    )
    return { state: 'failed', problems }
  }
  const { migrations, roles, connectors } = answer
  const listed =
    roles === undefined
      ? {}
      : { roles: Object.entries(roles).map(([name, label]) => ({ name, label })) }
  const used =
    connectors === undefined
      ? {}
      : {
          connectors: Object.entries(connectors).map(([connector, operations]) => ({
            connector,
            operations,
          })),
        }
  const manifest = Manifest.safeParse({
    contract: 1,
    entry: 'worker.js',
    ...listed,
    ...used,
    migrations,
    assets: [],
  })
  if (!manifest.success) {
    const message = z.prettifyError(manifest.error)
    return { state: 'failed', problems: [problem({ code: 'MANIFEST_INVALID', file, message })] }
  }
  writeFileSync(workOf(ctx, 'manifest.json'), JSON.stringify(manifest.data))
  const client = join(ctx.root, CLIENT)
  rmSync(client, { force: true })
  if (operations) {
    mkdirSync(join(ctx.root, 'src/conexus'), { recursive: true })
    writeFileSync(client, CLIENT_SOURCE)
  }
  return PASSED
}
