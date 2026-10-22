import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Manifest } from '@conexus/app-contract'
import { build } from 'esbuild'
import { z } from 'zod'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED, problem, workOf } from './step.ts'

/** The two files of the contract the manifest comes from (decision 0055). */
const OPERATIONS = 'shared/operations.ts'
const HANDLERS = 'server/handlers.ts'
/** The client the screens call the operations with, written by the check and never by hand. */
const CLIENT = 'src/conexus/api.gen.ts'

const CLIENT_SOURCE = `// Written by the Conexus check from ${OPERATIONS} on every check; changes here are lost.
import { createApi } from '@conexus/app'
import { operations } from '../../shared/operations'

export const api = createApi(operations)
`

const Answer = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: z.unknown() }),
  z.strictObject({
    ok: z.literal(false),
    error: z.looseObject({ code: z.string(), path: z.array(z.string()) }),
  }),
])

const BuildErrors = z.array(
  z.object({
    text: z.string(),
    location: z.object({ file: z.string(), line: z.int(), column: z.int() }).nullable(),
  }),
)

/**
 * A program that imports the app's operations and handlers as the Worker will, makes the manifest
 * with the SDK's `manifestOf`, and starts the contract's runtime on it, which refuses an operation
 * without its handler or a handler without its operation. It prints the manifest's answer.
 */
function entryOf(operations: boolean, handlers: boolean): string {
  return [
    "import { serveApp } from '@conexus/app-contract'",
    "import { manifestOf } from '@conexus/app'",
    operations
      ? `import { operations } from '../../${OPERATIONS}'`
      : 'const operations = undefined',
    handlers ? `import * as server from '../../${HANDLERS}'` : 'const server = {}',
    'const made = manifestOf({ operations, migrations: server.migrations ?? [], assets: [] })',
    'if (made.ok) serveApp({ manifest: made.value, handlers: server.handlers ?? {} })',
    'console.log(JSON.stringify(made))',
  ].join('\n')
}

/** The manifest's answer, the program's last line; the app's own prints come before it. */
function answerOf(output: string): z.infer<typeof Answer> | Readonly<{ unreadable: string }> {
  try {
    const parsed = Answer.safeParse(JSON.parse(output.trim().split('\n').at(-1) ?? ''))
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
 * The manifest of the app from `shared/operations.ts` (zero operations without it), kept for the
 * `worker` step, and the generated client the screens import.
 */
export async function manifesto(ctx: CheckContext): Promise<Outcome> {
  const operations = existsSync(join(ctx.root, OPERATIONS))
  mkdirSync(workOf(ctx), { recursive: true })
  const entry = workOf(ctx, 'manifest-entry.ts')
  const out = workOf(ctx, 'manifest-entry.mjs')
  writeFileSync(entry, entryOf(operations, existsSync(join(ctx.root, HANDLERS))))
  const bundled = await bundle(ctx, entry, out)
  if (bundled.state !== 'passed') return bundled
  const ran = await ctx.run(process.execPath, [out], {
    cwd: ctx.root,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('manifesto', ran)
  if (late !== undefined) return late
  const file = existsSync(join(ctx.root, HANDLERS)) ? HANDLERS : OPERATIONS
  if (ran.code !== 0) {
    return { state: 'failed', problems: [{ ...outputProblem(ctx, 'MANIFEST_INVALID', ran), file }] }
  }
  const answer = answerOf(ran.output)
  if ('unreadable' in answer) {
    return { state: 'failed', problems: [{ ...outputProblem(ctx, 'MANIFEST_INVALID', ran), file }] }
  }
  if (!answer.ok) {
    const { code, path } = answer.error
    const operation = String(Reflect.get(answer.error, 'operation') ?? '')
    const message = `${operation} ${path.join('.')}: this shape cannot be said in the manifest.`
    return { state: 'failed', problems: [problem({ code, file: OPERATIONS, message })] }
  }
  writeFileSync(workOf(ctx, 'manifest.json'), JSON.stringify(Manifest.parse(answer.value)))
  const client = join(ctx.root, CLIENT)
  rmSync(client, { force: true })
  if (operations) {
    mkdirSync(join(ctx.root, 'src/conexus'), { recursive: true })
    writeFileSync(client, CLIENT_SOURCE)
  }
  return PASSED
}
