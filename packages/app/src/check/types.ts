import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Problem } from './report.ts'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome, Ran } from './step.ts'
import { outputProblem, overran, PASSED, problem, workOf } from './step.ts'

// The starter's own options (packages/app/starter/tsconfig.json), fixed by the check so the model's
// tsconfig cannot loosen them; `allowImportingTsExtensions` reads the SDK, which ships its sources.
const BASE = {
  strict: true,
  target: 'ES2022',
  module: 'ESNext',
  moduleResolution: 'bundler',
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  allowImportingTsExtensions: true,
}

/**
 * Two programs from the work folder: the screens against the DOM, and the server and its shared
 * operations against the Worker's globals, so a handler that reaches for `document` fails.
 */
const PROGRAMS = {
  screens: {
    compilerOptions: {
      ...BASE,
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      types: ['vite/client'],
      paths: { '@/*': ['../../src/*'] },
    },
    include: ['../../src'],
  },
  server: {
    compilerOptions: { ...BASE, lib: ['ES2022', 'WebWorker'], types: [] },
    include: ['../../server', '../../shared'],
  },
}

const LOCATED = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/
const UNLOCATED = /^error (TS\d+): (.*)$/

/** `tsc --pretty false` lines as problems, a continuation line joined to the one before (Conexus OS `e0353c36` `steps/typecheck.ts:16-30`). */
function tscProblems(ctx: CheckContext, ran: Ran): Problem[] {
  const problems: Problem[] = []
  for (const line of ran.output.split('\n')) {
    const located = LOCATED.exec(line)
    const unlocated = UNLOCATED.exec(line)
    const previous = problems.at(-1)
    if (located !== null) {
      const [, file = '', row, column, code = '', message = ''] = located
      problems.push(problem({ file, line: Number(row), column: Number(column), code, message }))
    } else if (unlocated !== null) {
      problems.push(problem({ code: unlocated[1] ?? '', message: unlocated[2] ?? '' }))
    } else if (/^\s+\S/.test(line) && previous !== undefined) {
      problems[problems.length - 1] = {
        ...previous,
        message: `${previous.message}\n${line.trim()}`,
      }
    }
  }
  return problems.length > 0 ? problems : [outputProblem(ctx, 'TYPES_FAILED', ran)]
}

export async function tipos(ctx: CheckContext): Promise<Outcome> {
  const deadline = Date.now() + CHECK_LIMITS.stepMs
  const serverSide = ['server', 'shared'].some((folder) => existsSync(join(ctx.root, folder)))
  const names = serverSide ? (['screens', 'server'] as const) : (['screens'] as const)
  const problems: Problem[] = []
  for (const name of names) {
    const config = workOf(ctx, `tsconfig.${name}.json`)
    writeFileSync(config, JSON.stringify(PROGRAMS[name]))
    const ran = await ctx.run(join(ctx.tools, '.bin/tsc'), ['-p', config, '--pretty', 'false'], {
      cwd: ctx.root,
      timeoutMs: Math.max(1, deadline - Date.now()),
    })
    const late = overran('tipos', ran)
    if (late !== undefined) return late
    if (ran.code !== 0) problems.push(...tscProblems(ctx, ran))
  }
  return problems.length > 0 ? { state: 'failed', problems } : PASSED
}
