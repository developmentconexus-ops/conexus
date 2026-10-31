import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { TYPE_HEAP_MB } from './machine.ts'
import { CHECK_LIMITS, Problem } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED } from './step.ts'

const PROGRAM = join(import.meta.dirname, 'program.ts')

/** What V8 prints before it aborts a process that spent its heap. */
const OUT_OF_MEMORY = /heap out of memory/

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
  const ran = await ctx.run(
    process.execPath,
    [`--max-old-space-size=${TYPE_HEAP_MB}`, PROGRAM, name, ctx.root],
    { cwd: ctx.root, timeoutMs: CHECK_LIMITS.stepMs },
  )
  const late = overran('tipos', ran)
  if (late !== undefined) return late
  if (OUT_OF_MEMORY.test(ran.output)) {
    return { state: 'platform', reason: 'tipos ran out of memory' }
  }
  if (ran.code !== 0) return { state: 'failed', problems: [outputProblem('TYPES_CRASHED', ran)] }
  return Problems.parse(JSON.parse(ran.output))
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
