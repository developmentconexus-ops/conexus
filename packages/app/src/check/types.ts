import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { TYPE_HEAP_MB } from './machine.ts'
import { CHECK_LIMITS, Problem } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { overran, PASSED, workOf } from './step.ts'

const PROGRAM = join(import.meta.dirname, 'program.ts')

// The child's words are whole; `firstProblems` clips them when the report is made.
const Problems = z.array(Problem.extend({ message: z.string() }))

/**
 * Each program runs in a child with the heap `TYPE_HEAP_MB` gives it, so a program that does not
 * fit is this step's outcome, never a dead check.
 */
async function diagnosticsOf(
  ctx: CheckContext,
  name: 'screens' | 'server',
): Promise<Problem[] | Outcome> {
  mkdirSync(workOf(ctx), { recursive: true })
  const result = workOf(ctx, `tipos-${name}.json`)
  const ran = await ctx.run(
    process.execPath,
    [`--max-old-space-size=${TYPE_HEAP_MB}`, PROGRAM, name, ctx.root, result],
    { cwd: ctx.root, timeoutMs: CHECK_LIMITS.stepMs },
  )
  const late = overran('tipos', ran)
  if (late !== undefined) return late
  // The child's one verdict is its result file, written before it exits 0: a child that ended
  // without it (spent heap, killed, a TypeScript crash) gave none, and that is the platform's.
  if (ran.code !== 0) {
    return {
      state: 'platform',
      reason: `tipos ended without its diagnostics: code ${ran.code ?? 'none'}: ${ran.output.trim()}`,
    }
  }
  return Problems.parse(JSON.parse(readFileSync(result, 'utf8')))
}

export async function tipos(ctx: CheckContext): Promise<Outcome> {
  const serverSide = ['server', 'shared'].some((folder) => existsSync(join(ctx.root, folder)))
  const names = serverSide ? (['screens', 'server'] as const) : (['screens'] as const)
  const problems: Problem[] = []
  for (const name of names) {
    const found = await diagnosticsOf(ctx, name)
    if (!Array.isArray(found)) return found
    problems.push(...found)
  }
  return problems.length > 0 ? { state: 'failed', problems } : PASSED
}
