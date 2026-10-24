import type { Sha } from '../git/public.ts'
import { MAX_BYTES } from '../git/public.ts'

/** Where the Hub puts the bundle of `main` and where the machine leaves the bundle of its turn. */
export function seedFile(tmp: string): string {
  return `${tmp}/conexus-seed.bundle`
}

export function outFile(tmp: string): string {
  return `${tmp}/conexus-out.bundle`
}

/** The folder of the plans, in the app folder: they travel with the app but make no version on their own. */
export const PLAN_DIR = '.conexus/plans'
const PLANS_OUT = `':(exclude)${PLAN_DIR}'`

const CANDIDATE_REF = 'refs/conexus/candidate'

export function quoted(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

/**
 * The app folder holds `main` as the Hub has it: fetched from the seed bundle and checked out. The
 * plans make no version on their own, so a plan the person has still to approve stays for the turn
 * their answer opens.
 */
export function seedScript(workdir: string, tmp: string): string {
  const seed = seedFile(tmp)
  return [
    'set -e',
    `mkdir -p ${quoted(workdir)}`,
    `cd ${quoted(workdir)}`,
    'test -d .git || git init --quiet -b main',
    `git fetch --quiet --no-tags ${quoted(seed)} '+refs/heads/main:refs/conexus/base'`,
    'git checkout --quiet --force -B main refs/conexus/base',
    `git clean -fdq -e node_modules -e ${PLAN_DIR}`,
    `rm -f ${quoted(seed)}`,
  ].join('\n')
}

/** A turn the server took over keeps the machine's files as they are; it only needs the repository there. */
export function keepScript(workdir: string): string {
  return `cd ${quoted(workdir)} && git rev-parse --git-dir`
}

/**
 * The whole tree as `tree`, whatever `HEAD` is (the Builder may have committed or switched branch),
 * in an index of its own; prints UNCHANGED and ends when it is `base`'s apart from the plans.
 * `node_modules` is left out.
 */
function treeOf(workdir: string, base: string, index: string): string[] {
  return [
    'set -e',
    `cd ${quoted(workdir)}`,
    `export GIT_INDEX_FILE=.git/${index}`,
    'rm -f "$GIT_INDEX_FILE"',
    `git read-tree ${base}`,
    `git add --all -- . ':(exclude,glob)**/node_modules/**'`,
    'tree=$(git write-tree)',
    `if git diff-tree -r --quiet ${base} "$tree" -- . ${PLANS_OUT}; then echo UNCHANGED; exit 0; fi`,
  ]
}

/** Whether the app folder differs from the `main` the machine was seeded with: prints UNCHANGED or CHANGED. */
export function changedScript(workdir: string): string {
  return [...treeOf(workdir, 'refs/conexus/base', 'conexus-changed-index'), 'echo CHANGED'].join(
    '\n',
  )
}

/**
 * One commit of the whole tree on `base`, bundled in the machine. Prints UNCHANGED when the tree is
 * `base`'s, else the bundle's size. `node_modules` never leaves the machine.
 */
export function collectScript(workdir: string, tmp: string, base: Sha): string {
  const out = outFile(tmp)
  const identity = `-c user.name='Conexus Builder' -c user.email='builder@conexus.invalid'`
  return [
    ...treeOf(workdir, base, 'conexus-index'),
    `echo "files=$(git ls-tree -r --name-only "$tree" | wc -l)"`,
    `echo "changed=$(git diff-tree -r --name-only --no-commit-id ${base} "$tree" -- . ${PLANS_OUT} | wc -l)"`,
    `commit=$(git ${identity} commit-tree "$tree" -p ${base} -m 'Conexus Builder')`,
    `git update-ref ${CANDIDATE_REF} "$commit"`,
    `rm -f ${quoted(out)}`,
    `git bundle create --quiet ${quoted(out)} ${CANDIDATE_REF} ^${base}`,
    `echo "size=$(stat -c %s ${quoted(out)})"`,
  ].join('\n')
}

/** What the collect script printed: nothing changed, a bundle past the cap, or a bundle and its file counts. */
export type Collected =
  | { kind: 'unchanged' }
  | { kind: 'too-large' }
  | { kind: 'bundle'; files: number; changedFiles: number }

function counted(stdout: string, name: string): number {
  const value = Number(new RegExp(`^${name}=(\\d+)$`, 'm').exec(stdout)?.[1])
  if (!Number.isSafeInteger(value)) throw new Error(`collect printed no ${name}`)
  return value
}

export function collected(stdout: string): Collected {
  if (stdout.trim().split('\n').at(-1) === 'UNCHANGED') return { kind: 'unchanged' }
  if (counted(stdout, 'size') > MAX_BYTES) return { kind: 'too-large' }
  return {
    kind: 'bundle',
    files: counted(stdout, 'files'),
    changedFiles: counted(stdout, 'changed'),
  }
}
