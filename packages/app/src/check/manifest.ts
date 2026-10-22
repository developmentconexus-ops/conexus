import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
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

/** What the program prints last: the migrations `server/handlers.ts` exports, for the manifest. */
const Answer = z.strictObject({ migrations: z.unknown() })

const BuildErrors = z.array(
  z.object({
    text: z.string(),
    location: z.object({ file: z.string(), line: z.int(), column: z.int() }).nullable(),
  }),
)

/**
 * A program that imports the app's operations and handlers as the Worker will and starts the
 * contract's runtime on them, which refuses an operation without its handler, a handler without its
 * operation or a name `/api` cannot say. It prints the migrations the manifest lists.
 */
function entryOf(operations: boolean, handlers: boolean): string {
  return [
    "import { serveApp } from '@conexus/app-contract'",
    operations ? `import { operations } from '../../${OPERATIONS}'` : 'const operations = {}',
    handlers ? `import * as server from '../../${HANDLERS}'` : 'const server = {}',
    'serveApp({ operations, handlers: server.handlers ?? {} })',
    'console.log(JSON.stringify({ migrations: server.migrations ?? [] }))',
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
 * The manifest of the app, its migrations from `server/handlers.ts` (none without it), kept for the
 * `worker` step, and the generated client the screens import from `shared/operations.ts`.
 */
export async function manifesto(ctx: CheckContext): Promise<Outcome> {
  const operations = existsSync(join(ctx.root, OPERATIONS))
  const handlers = existsSync(join(ctx.root, HANDLERS))
  mkdirSync(workOf(ctx), { recursive: true })
  const entry = workOf(ctx, 'manifest-entry.ts')
  const out = workOf(ctx, 'manifest-entry.mjs')
  writeFileSync(entry, entryOf(operations, handlers))
  const bundled = await bundle(ctx, entry, out)
  if (bundled.state !== 'passed') return bundled
  const ran = await ctx.run(process.execPath, [out], {
    cwd: ctx.root,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('manifesto', ran)
  if (late !== undefined) return late
  const file = handlers ? HANDLERS : OPERATIONS
  const answer = ran.code === 0 ? answerOf(ran.output) : undefined
  if (answer === undefined || 'unreadable' in answer) {
    return { state: 'failed', problems: [{ ...outputProblem(ctx, 'MANIFEST_INVALID', ran), file }] }
  }
  const manifest = Manifest.safeParse({ contract: 1, entry: 'worker.js', ...answer, assets: [] })
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
