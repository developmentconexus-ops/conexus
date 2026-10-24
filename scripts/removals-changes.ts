// Defect: which removals a pull request must prove depends on what it changed, and
// removals-select.ts decides from the read made here: `git diff` against the merge base.
// It is proved through removals-base.test.ts.
import { runCommand } from './command.ts'

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
