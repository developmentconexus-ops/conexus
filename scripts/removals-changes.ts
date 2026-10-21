// Defect: which removals a pull request must prove depends on what it changed and on what its
// files import, and removals-select.ts decides from the two reads made here: `git diff` against
// the merge base, and the import graph of the repository's dependency law (`npm run deps`).
// Both are proved through removals-base.test.ts.
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { runCommand } from './command.ts'
import type { Imports } from './removals-select.ts'

const DEPCRUISE = join(import.meta.dirname, '../node_modules/.bin/depcruise')
const DEADLINE_MS = 120_000
const Graph = z.object({
  modules: z.array(
    z.object({
      source: z.string(),
      dependencies: z.array(
        z.object({
          resolved: z.string(),
          coreModule: z.boolean().optional(),
          couldNotResolve: z.boolean().optional(),
        }),
      ),
    }),
  ),
})

/** What changed since the merge base with `base`, committed or not, and removals.json as it was there. */
export function changesSince(root: string, base: string): { changed: string[]; manifest: string } {
  function git(...args: string[]): string {
    return runCommand('git', args, { cwd: root })
  }
  const mergeBase = git('merge-base', base, 'HEAD').trim()
  const changed = [
    ...git('diff', '--name-only', '-z', '--merge-base', base).split('\0'),
    ...git('ls-files', '-z', '--others', '--exclude-standard').split('\0'),
  ].filter(Boolean)
  const path = 'scripts/removals.json'
  const existed = git('ls-tree', '--name-only', mergeBase, path).trim() !== ''
  return { changed, manifest: existed ? git('show', `${mergeBase}:${path}`) : '[]' }
}

/** Each file with the files it imports, as dependency-cruiser draws them. */
export function importsOf(root: string): Imports {
  const config = join(root, '.dependency-cruiser.cjs')
  if (!existsSync(config)) return new Map()
  const scratch = mkdtempSync(join(tmpdir(), 'conexus-imports-'))
  try {
    const out = join(scratch, 'graph.json')
    const args = ['.', '--config', config, '--output-type', 'json', '--output-to', out]
    runCommand(DEPCRUISE, args, { cwd: root, deadline: DEADLINE_MS })
    const graph = Graph.parse(JSON.parse(readFileSync(out, 'utf8')))
    return new Map(
      graph.modules.map((module) => [
        module.source,
        module.dependencies
          .filter((use) => use.coreModule !== true && use.couldNotResolve !== true)
          .map((use) => use.resolved),
      ]),
    )
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
