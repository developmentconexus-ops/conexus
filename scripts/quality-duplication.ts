// New clones with a side in the lines a change adds, by jscpd over the code trees.
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { spawnCommand } from './command.ts'
import type { Changed } from './quality-changes.ts'
import { touches } from './quality-changes.ts'

const JSCPD = join(import.meta.dirname, '../node_modules/.bin/jscpd')
const CONFIG = join(import.meta.dirname, '../.jscpd.json')
const Side = z.looseObject({ name: z.string(), start: z.number(), end: z.number() })
const Report = z.looseObject({
  duplicates: z.array(z.looseObject({ firstFile: Side, secondFile: Side, lines: z.number() })),
})

type Side = z.infer<typeof Side>
export type Clone = { a: Side; b: Side; lines: number }

function clonesIn(dir: string, output: string): Clone[] {
  const trees = globSync(['apps/*/src', 'packages/*/src'], { cwd: dir })
  const args = ['--config', CONFIG, '--absolute', '--output', output, ...trees]
  const run = spawnCommand(JSCPD, args, { cwd: dir, deadline: 60_000 })
  if (run.status !== 0) throw new Error(`jscpd failed:\n${run.output}`)
  const report = Report.parse(JSON.parse(readFileSync(join(output, 'jscpd-report.json'), 'utf8')))
  const prefix = `${dir}/`
  function relative(side: Side): Side {
    return { ...side, name: side.name.replace(prefix, '') }
  }
  return report.duplicates.map((d) => ({
    a: relative(d.firstFile),
    b: relative(d.secondFile),
    lines: d.lines,
  }))
}

function pairOf(clone: Clone): string {
  return [clone.a.name, clone.b.name].sort().join(' | ')
}

function inChangedLines(clone: Clone, changed: Changed): boolean {
  return [clone.a, clone.b].some((side) =>
    touches(changed.get(side.name) ?? [], side.start, side.end),
  )
}

/**
 * A clone with a side in the changed lines is new when its two files hold more clones than at the
 * base. `baseDir` is a callback because the base tree is only read when a candidate exists.
 */
export function newClones(args: {
  root: string
  changed: Changed
  baseDir: () => string
  scratch: string
}): Clone[] {
  const { root, changed, baseDir, scratch } = args
  const head = clonesIn(root, join(scratch, 'head-jscpd'))
  const candidates = head.filter((clone) => inChangedLines(clone, changed))
  if (candidates.length === 0) return []
  const base = clonesIn(baseDir(), join(scratch, 'base-jscpd'))
  function count(clones: Clone[], pair: string): number {
    return clones.filter((c) => pairOf(c) === pair).length
  }
  return candidates.filter((clone) => count(head, pairOf(clone)) > count(base, pairOf(clone)))
}
