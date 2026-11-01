import type { Sha } from '../git/public.ts'
import { MAX_BYTES, MAX_FILES } from '../git/public.ts'
import type { Conflicts } from './kit.ts'

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

const BASE_REF = 'refs/conexus/base'
const IDENTITY = `-c user.name='Conexus Builder' -c user.email='builder@conexus.invalid'`

/**
 * A new machine's app folder holds `main` as the Hub has it: fetched from the seed bundle and
 * checked out. The plans make no version on their own, so a plan the person has still to approve
 * stays for the turn their answer opens.
 */
export function seedScript(workdir: string, tmp: string): string {
  const seed = seedFile(tmp)
  return [
    'set -e',
    `mkdir -p ${quoted(workdir)}`,
    `cd ${quoted(workdir)}`,
    'test -d .git || git init --quiet -b main',
    `git fetch --quiet --no-tags ${quoted(seed)} '+refs/heads/main:${BASE_REF}'`,
    `git checkout --quiet --force -B main ${BASE_REF}`,
    `git clean -fdq -e node_modules -e ${PLAN_DIR}`,
    `rm -f ${quoted(seed)}`,
    ...markedFiles(),
  ].join('\n')
}

/**
 * Every tracked file that holds the three lines Git writes around a conflict (`<<<<<<< `, `=======`,
 * `>>>>>>> `), printed as `MARKERS <path>`, whichever start or turn left it there: a file the
 * Builder resolved drops out, and one with a lone line that only looks like a marker never enters.
 */
function markedFiles(): string[] {
  return [
    // Exit 1 is no file found; any other failure ends the script.
    `marked=$(git -c core.quotePath=false grep -l -I --all-match -e '^<<<<<<< ' -e '^=======$' -e '^>>>>>>> ') || test $? -eq 1`,
    `test -z "$marked" || printf '%s\\n' "$marked" | sed 's/^/MARKERS /'`,
  ]
}

/** What the commit of work the Hub has not saved says, on the machine where it is brought onto `main`. */
const UNSAVED_MESSAGE = 'Conexus Builder (not saved)'

/**
 * A reconnected machine keeps its folder and brings the Hub's `main` into it. A tree equal to its
 * base moves to `main`. A tree that differs is work the Hub has not saved (a turn that never ended,
 * or one whose save the Hub refused): it becomes a commit on its base, merged onto `main`, conflicts
 * and their markers included, and `TOO_MANY_FILES` or `TOO_LARGE` is printed when the merged tree is
 * past what the Hub takes in a version (the rule of `inspectTree`), which the next save would refuse
 * again. A conflicted file
 * with no markers is printed as `DELETED <path>` when `main` deleted it and the turn's copy stays,
 * else as `REPLACED <path>`, `main`'s copy kept over the turn's change. `main` is the base after,
 * and the files with markers are printed. A folder whose seed never finished prints UNSEEDED and is
 * left to the seed.
 */
export function syncScript(workdir: string, tmp: string): string {
  const seed = seedFile(tmp)
  const main = 'refs/conexus/main'
  const unsaved = 'refs/conexus/unsaved'
  return [
    'set -e',
    `if ! { cd ${quoted(workdir)} 2>/dev/null && test -d .git && git rev-parse --quiet --verify ${BASE_REF} >/dev/null; }; then echo UNSEEDED; exit 0; fi`,
    // No git of an earlier turn lives at a start: a lock one left (killed on its timeout) would fail every checkout below, for ever.
    'rm -f .git/index.lock',
    `git fetch --quiet --no-tags ${quoted(seed)} '+refs/heads/main:${main}'`,
    `rm -f ${quoted(seed)}`,
    ...treeIn(BASE_REF, 'conexus-sync-index'),
    `target=${main}`,
    'conflicted=',
    `if ! ${sameTree(BASE_REF)}; then`,
    `  git update-ref ${unsaved} "$(git ${IDENTITY} commit-tree "$tree" -p ${BASE_REF} -m ${quoted(UNSAVED_MESSAGE)})"`,
    // Exit 1 is a merge with conflicts; any other failure ends the script.
    `  merged=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages ${main} ${unsaved}) || test $? -eq 1`,
    `  conflicted=$(printf '%s\\n' "$merged" | tail -n +2)`,
    `  target=$(git ${IDENTITY} commit-tree "$(printf '%s\\n' "$merged" | head -n 1)" -p ${main} -m ${quoted(UNSAVED_MESSAGE)})`,
    // The tree's size and count as the Hub reads them: a tree it refuses stays refused until it is smaller.
    `  git ls-tree -r -l "$target" | awk -v files=${MAX_FILES} -v bytes=${MAX_BYTES} '{ n++; size += $4 } END { if (n > files) print "TOO_MANY_FILES"; if (size > bytes) print "TOO_LARGE" }'`,
    'fi',
    'git checkout --quiet --force -B main "$target"',
    `git update-ref ${BASE_REF} ${main}`,
    ...markedFiles(),
    `printf '%s\\n' "$conflicted" | while IFS= read -r path; do`,
    '  test -n "$path" || continue',
    `  ! printf '%s\\n' "$marked" | grep -qxF -- "$path" || continue`,
    `  if git cat-file -e "${main}:$path" 2>/dev/null; then echo "REPLACED $path"; else echo "DELETED $path"; fi`,
    'done',
  ].join('\n')
}

/**
 * The Hub saved `version`, the commit this machine bundled: the folder is as a seed leaves it, on
 * `main` at that version, which is the base the next start measures its unsaved work from. The files
 * the turn wrote are the version's, so the checkout changes none of them; what it does is let a
 * later checkout remove a file another conversation deleted.
 */
export function savedScript(workdir: string, version: Sha): string {
  return [
    'set -e',
    `cd ${quoted(workdir)}`,
    `git update-ref ${BASE_REF} ${quoted(version)}`,
    `git checkout --quiet --force -B main ${BASE_REF}`,
  ].join('\n')
}

/** A turn the server took over keeps the machine's files as they are; it only needs the repository there. */
export function keepScript(workdir: string): string {
  return `cd ${quoted(workdir)} && git rev-parse --git-dir`
}

/** The whole tree as `tree`, whatever `HEAD` is, in an index of its own; `node_modules` is left out. */
function treeIn(base: string, index: string): string[] {
  return [
    `export GIT_INDEX_FILE=.git/${index}`,
    // A git killed on its timeout leaves the lock of its index, which would fail every later command that builds this tree.
    'rm -f "$GIT_INDEX_FILE" "$GIT_INDEX_FILE.lock"',
    `git read-tree ${base}`,
    `git add --all -- . ':(exclude,glob)**/node_modules/**'`,
    'tree=$(git write-tree)',
    'unset GIT_INDEX_FILE',
  ]
}

/** Whether `tree` is `base`'s apart from the plans. */
function sameTree(base: string): string {
  return `git diff-tree -r --quiet ${base} "$tree" -- . ${PLANS_OUT}`
}

/**
 * The whole tree, whatever `HEAD` is (the Builder may have committed or switched branch); prints
 * UNCHANGED and ends when it is `base`'s apart from the plans.
 */
function treeOf(workdir: string, base: string, index: string): string[] {
  return [
    'set -e',
    `cd ${quoted(workdir)}`,
    ...treeIn(base, index),
    `if ${sameTree(base)}; then echo UNCHANGED; exit 0; fi`,
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
  return [
    ...treeOf(workdir, base, 'conexus-index'),
    `echo "files=$(git ls-tree -r --name-only "$tree" | wc -l)"`,
    `echo "changed=$(git diff-tree -r --name-only --no-commit-id ${base} "$tree" -- . ${PLANS_OUT} | wc -l)"`,
    `commit=$(git ${IDENTITY} commit-tree "$tree" -p ${base} -m 'Conexus Builder')`,
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

/** The conflicts a start script printed, one `MARKERS`, `DELETED` or `REPLACED <path>` per line, and its size verdicts. */
export function conflictsOf(stdout: string): Conflicts {
  const lines = stdout.split('\n')
  function of(kind: string): string[] {
    return lines
      .filter((line) => line.startsWith(`${kind} `))
      .map((line) => line.slice(kind.length + 1))
  }
  return {
    markers: of('MARKERS'),
    deleted: of('DELETED'),
    replaced: of('REPLACED'),
    tooManyFiles: lines.includes('TOO_MANY_FILES'),
    tooLarge: lines.includes('TOO_LARGE'),
  }
}
