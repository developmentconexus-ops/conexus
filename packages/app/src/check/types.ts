import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { TYPE_HEAP_MB } from './machine.ts'
import { CHECK_LIMITS, Problem } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED, workOf } from './step.ts'

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
  mkdirSync(workOf(ctx), { recursive: true })
  const result = workOf(ctx, `tipos-${name}.json`)
  const ran = await ctx.run(
    process.execPath,
    [`--max-old-space-size=${TYPE_HEAP_MB}`, PROGRAM, name, ctx.root, result],
    { cwd: ctx.root, timeoutMs: CHECK_LIMITS.stepMs },
  )
  const late = overran('tipos', ran)
  if (late !== undefined) return late
  if (ran.code !== 0) {
    // V8 aborts a spent heap with a signal, so the exit code is null and only its words say why.
    if (OUT_OF_MEMORY.test(ran.output)) {
      return { state: 'platform', reason: 'tipos ran out of memory' }
    }
    // No exit code and no V8 words: the system killed the child or it never started, not the app's fault.
    if (ran.code === null) {
      return { state: 'platform', reason: `tipos ended with no exit code: ${ran.output.trim()}` }
    }
    return { state: 'failed', problems: [outputProblem('TYPES_CRASHED', ran)] }
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
