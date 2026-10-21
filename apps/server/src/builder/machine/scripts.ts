import type { Sha } from '../git/public.ts'
import { MAX_BYTES } from '../git/public.ts'

/** Where the Hub puts the bundle of `main` and where the machine leaves the bundle of its turn. */
export function seedFile(tmp: string): string {
  return `${tmp}/conexus-seed.bundle`
}

export function outFile(tmp: string): string {
  return `${tmp}/conexus-out.bundle`
}

const CANDIDATE_REF = 'refs/conexus/candidate'

function quoted(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

/** The app folder holds exactly `main` as the Hub has it: fetched from the seed bundle and checked out. */
export function seedScript(workdir: string, tmp: string): string {
  const seed = seedFile(tmp)
  return [
    'set -e',
    `mkdir -p ${quoted(workdir)}`,
    `cd ${quoted(workdir)}`,
    'test -d .git || git init --quiet -b main',
    `git fetch --quiet --no-tags ${quoted(seed)} '+refs/heads/main:refs/conexus/base'`,
    'git checkout --quiet --force -B main refs/conexus/base',
    'git clean -fdq',
    `rm -f ${quoted(seed)}`,
  ].join('\n')
}

/** A woken machine goes back to the branch the Hub reads, with the files it holds left as they are. */
export function wakeScript(workdir: string): string {
  return `cd ${quoted(workdir)} && git checkout --quiet main`
}

/**
 * One commit of the whole tree on `base`, whatever `HEAD` is (the Builder may have committed or
 * switched branch), bundled in the machine. Prints UNCHANGED when the tree is `base`'s, else the
 * bundle's size. `node_modules` never leaves the machine.
 */
export function collectScript(workdir: string, tmp: string, base: Sha): string {
  const out = outFile(tmp)
  const identity = `-c user.name='Conexus Builder' -c user.email='builder@conexus.invalid'`
  return [
    'set -e',
    `cd ${quoted(workdir)}`,
    'export GIT_INDEX_FILE=.git/conexus-index',
    'rm -f "$GIT_INDEX_FILE"',
    `git read-tree ${base}`,
    `git add --all -- . ':(exclude,glob)**/node_modules/**'`,
    'tree=$(git write-tree)',
    `if [ "$tree" = "$(git rev-parse ${base}^{tree})" ]; then echo UNCHANGED; exit 0; fi`,
    `commit=$(git ${identity} commit-tree "$tree" -p ${base} -m 'Conexus Builder')`,
    `git update-ref ${CANDIDATE_REF} "$commit"`,
    `rm -f ${quoted(out)}`,
    `git bundle create --quiet ${quoted(out)} ${CANDIDATE_REF} ^${base}`,
    `echo "size=$(stat -c %s ${quoted(out)})"`,
  ].join('\n')
}

/** What the collect script printed: `UNCHANGED`, a size within the cap, or a size past it. */
export function collected(stdout: string): 'unchanged' | 'too-large' | 'bundle' {
  const last = stdout.trim().split('\n').at(-1) ?? ''
  if (last === 'UNCHANGED') return 'unchanged'
  const size = Number(/^size=(\d+)$/.exec(last)?.[1])
  if (!Number.isSafeInteger(size)) throw new Error(`collect printed ${last}`)
  return size > MAX_BYTES ? 'too-large' : 'bundle'
}
