// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: `grep` and its three engines (source :755-1044). Changed: functions that take the
// filesystem (`Host`) in place of methods; no `any` (a Zod schema reads the ripgrep event) and no `!`;
// the `${` of a shell line is escaped in a template string;
// `grepWithGnuGrep` split into its script and its reader.

import { posix as posixPath } from 'node:path'
import type {
  FilesystemGrepMatch,
  FilesystemGrepOptions,
  FilesystemGrepResult,
} from '@mastra/core/workspace'
import { UnsupportedGrepPatternError } from '@mastra/core/workspace'
import { z } from 'zod'
import type { GrepFileLines, Host, SearchTools } from './shell.ts'
import {
  describeGrepFailure,
  fileLines,
  isInsideNodeModules,
  shellQuote,
  toGrepResults,
} from './shell.ts'

/** The fields of a ripgrep `--json` event that the reader uses. */
const RipgrepEvent = z.object({
  type: z.string().optional(),
  data: z
    .object({
      path: z.object({ text: z.string().optional() }).optional(),
      line_number: z.number().optional(),
      lines: z.object({ text: z.string().optional() }).optional(),
      submatches: z.array(z.object({ start: z.number().optional() })).optional(),
    })
    .optional(),
})

/** One line of ripgrep's output read as an event; a line that is not one is skipped. */
function parseEvent(line: string): z.ZodSafeParseResult<z.infer<typeof RipgrepEvent>> {
  try {
    return RipgrepEvent.safeParse(JSON.parse(line))
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return RipgrepEvent.safeParse(undefined)
  }
}

function applyTotalCap(results: FilesystemGrepResult[], maxTotal?: number): FilesystemGrepResult[] {
  if (maxTotal === undefined) return results
  const capped: FilesystemGrepResult[] = []
  let total = 0
  for (const file of results) {
    if (total >= maxTotal) break
    const remaining = maxTotal - total
    const matches = file.matches.slice(0, remaining)
    total += matches.length
    capped.push({ path: file.path, matches })
  }
  return capped
}

async function grepWithRipgrep(
  host: Host,
  abs: string,
  options: FilesystemGrepOptions,
): Promise<FilesystemGrepResult[]> {
  const args = [
    // --no-require-git applies .gitignore files outside a git checkout too
    // (e.g. a multi-repo root). A path passed explicitly is searched even
    // when ignored, so targeting `dist/` or `node_modules/x` still works.
    'rg --json --hidden --no-require-git',
    // .git is filtered host-side too; exclude it here so its object files
    // don't inflate the response.
    `-g ${shellQuote('!.git/**')}`,
    isInsideNodeModules(abs) ? '' : `-g ${shellQuote('!**/node_modules/**')}`,
    options.caseSensitive ? '' : '-i',
    options.maxCountPerFile !== undefined
      ? `-m ${Math.max(1, Math.floor(options.maxCountPerFile))}`
      : '',
    options.contextLines ? `-C ${Math.max(0, Math.floor(options.contextLines))}` : '',
    `-e ${shellQuote(options.pattern)}`,
    shellQuote(abs),
  ]
    .filter(Boolean)
    .join(' ')
  const result = await host.exec(args)
  // rg exits 1 when there are no matches, 2 on any error. A bad pattern
  // produces no output at all, but a per-file error (e.g. an unreadable
  // file) also yields exit 2 while still emitting matches for every other
  // file. Keep those partial results; only treat "error with no matches"
  // as an unsupported pattern so the caller falls back to the host walk.
  if (result.exitCode === 1) return []
  const results = parseRipgrepJson(result.stdout, abs, options)
  if (result.exitCode !== 0 && results.length === 0) {
    throw new UnsupportedGrepPatternError(options.pattern, describeGrepFailure(result))
  }
  return results
}

function parseRipgrepJson(
  stdout: string,
  abs: string,
  options: FilesystemGrepOptions,
): FilesystemGrepResult[] {
  const files = new Map<string, GrepFileLines>()
  for (const line of stdout.split('\n')) {
    if (!line) continue
    const parsed = parseEvent(line)
    if (!parsed.success) continue
    const event = parsed.data
    if (event.type !== 'match' && event.type !== 'context') continue
    const filePath = event.data?.path?.text
    const lineNumber = event.data?.line_number
    if (!filePath || !lineNumber) continue
    const state = fileLines(files, filePath)
    const text = (event.data?.lines?.text ?? '').replace(/\r?\n$/, '')
    state.linesByNumber.set(lineNumber, text)
    if (event.type === 'match') {
      // rg submatch offsets are byte offsets into the line; convert to a
      // UTF-16 (JS string) index for the capability contract.
      const byteStart = event.data?.submatches?.[0]?.start ?? 0
      const column = Buffer.from(text, 'utf8').subarray(0, byteStart).toString('utf8').length
      state.matches.push({ line: lineNumber, column, text })
    }
  }
  return applyTotalCap(
    toGrepResults(files, abs, options.contextLines ?? 0),
    options.maxTotalMatches,
  )
}

/**
 * Patterns whose meaning differs between POSIX ERE and JS RegExp. The grep
 * runs with ERE but match columns are recomputed with JS, so anything that
 * only one side understands (PCRE classes, lookarounds, lazy quantifiers,
 * POSIX bracket classes, GNU word anchors) must fall back to the host walk.
 */
const ERE_UNSUPPORTED = /\\[dDwWsSbB<>]|\(\?|[*+?}]\?|\[:[a-z]+:\]/

/**
 * Escapes that `grep -P` (PCRE) and JS RegExp (without the `u` flag) both
 * accept but read differently, e.g. `\A` is "start of subject" in PCRE and
 * a literal `A` in JS, plus POSIX bracket classes. PCRE-only syntax that JS
 * rejects (inline flags, possessive quantifiers, atomic groups) already
 * fails the JS compile below.
 */
const PCRE_UNSUPPORTED = /\\[AzZGKQEhHvVRXNCpPe]|\[:[a-z]+:\]/

/** Reject patterns grep can't run with the same meaning as JS; return the JS regex used for columns. */
function grepRegex(options: FilesystemGrepOptions, pcre = false): RegExp {
  if (pcre ? PCRE_UNSUPPORTED.test(options.pattern) : ERE_UNSUPPORTED.test(options.pattern)) {
    throw new UnsupportedGrepPatternError(
      options.pattern,
      pcre
        ? 'grep -P reads this syntax differently from JavaScript'
        : 'POSIX ERE cannot express this syntax',
    )
  }
  try {
    return new RegExp(options.pattern, options.caseSensitive ? '' : 'i')
  } catch {
    throw new UnsupportedGrepPatternError(options.pattern, 'invalid regular expression')
  }
}

function gnuGrepScript(
  abs: string,
  options: FilesystemGrepOptions,
  tools: SearchTools,
  contextLines: number,
): string {
  const mode = tools.pcre ? '-P' : '-E'
  const grepFlags = [
    `-HnI${mode.slice(1)} --null`,
    options.caseSensitive ? '' : '-i',
    options.maxCountPerFile !== undefined
      ? `-m ${Math.max(1, Math.floor(options.maxCountPerFile))}`
      : '',
    contextLines > 0 ? `-C ${contextLines}` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const skipNodeModules = !isInsideNodeModules(abs)
  const nodeModulesPathspec = skipNodeModules
    ? ` ${shellQuote(':(exclude,glob)**/node_modules/**')}`
    : ''
  const pruneNames = skipNodeModules ? '-name .git -o -name node_modules' : '-name .git'
  return [
    `pat=${shellQuote(options.pattern)}`,
    `root=${shellQuote(abs)}`,
    // xargs exit codes can't tell "no match" from "bad pattern"; check first.
    `grep ${mode} -e "$pat" </dev/null >/dev/null 2>&1`,
    'if [ $? -eq 2 ]; then echo "grep: invalid regular expression" >&2; exit 2; fi',
    'tmp=$(mktemp -d) || exit 1',
    `trap 'rm -rf "$tmp"' EXIT`,
    `search_files() { xargs -0 -r grep ${grepFlags} -e "$pat" -- 2>/dev/null; }`,
    // A line starting with NUL names the directory later paths are relative to.
    'search_repo() {',
    `  git -C "$1" grep -l -z -I --untracked ${options.caseSensitive ? '' : '-i '}${mode} -e "$pat" -- .${nodeModulesPathspec} >"$tmp/files" 2>/dev/null`,
    '  [ $? -gt 1 ] && return 1',
    `  printf '\\0%s\\n' "$1"`,
    '  (cd "$1" && search_files) <"$tmp/files"',
    '}',
    ...(tools.git
      ? [
          'if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1 && ! git -C "$root" check-ignore -q . 2>/dev/null; then',
          '  search_repo "$root" && exit 0',
          'fi',
          `find "$root" -mindepth 1 -maxdepth 3 \\( ${skipNodeModules ? '-name node_modules -prune' : '-false'} \\) -o \\( -name .git -prune -print \\) >"$tmp/repos" 2>/dev/null`,
          ': >"$tmp/done"',
          'while IFS= read -r g; do',
          `  d=\${g%/.git}`,
          '  search_repo "$d" && printf \'%s\\n\' "$d" >>"$tmp/done"',
          'done <"$tmp/repos"',
          'set --',
          'while IFS= read -r d; do set -- "$@" -o -path "$d"; done <"$tmp/done"',
        ]
      : ['set --']),
    `printf '\\0%s\\n' "$root"`,
    `find "$root" -mindepth 1 \\( ${pruneNames} "$@" \\) -prune -o -type f -print0 2>/dev/null | search_files`,
    'exit 0',
  ].join('\n')
}

/**
 * GNU grep without ripgrep. Inside a git checkout, `git grep` picks the
 * files (tracked plus untracked, every `.gitignore` applied) and GNU grep
 * prints them with context. Outside a checkout (e.g. a multi-repo root),
 * each child repository is searched the same way and plain grep covers the
 * remaining files, skipping `node_modules`. `--null` ends each file name
 * with NUL, so match (`N:`) and context (`N-`) lines parse unambiguously.
 * When grep and git support it, patterns run as PCRE (`-P`), so `\d`,
 * `\w`, `\s`, `\b`, and lookarounds don't need the host walk.
 */
async function grepWithGnuGrep(
  host: Host,
  abs: string,
  options: FilesystemGrepOptions,
  tools: SearchTools,
): Promise<FilesystemGrepResult[]> {
  const jsRegex = grepRegex(options, tools.pcre)
  const contextLines = Math.max(0, Math.floor(options.contextLines ?? 0))
  const result = await host.exec(gnuGrepScript(abs, options, tools, contextLines))
  if (result.exitCode !== 0) {
    throw new UnsupportedGrepPatternError(options.pattern, describeGrepFailure(result))
  }
  const files = new Map<string, GrepFileLines>()
  let base = abs
  for (const line of result.stdout.split('\n')) {
    if (!line || line === '--') continue
    if (line.startsWith('\0')) {
      base = line.slice(1)
      continue
    }
    const nul = line.indexOf('\0')
    if (nul <= 0) continue
    const parsed = /^(\d+)([:-])(.*)$/s.exec(line.slice(nul + 1))
    if (!parsed) continue
    const lineNumber = Number(parsed[1])
    const text = parsed[3] ?? ''
    const state = fileLines(files, posixPath.resolve(base, line.slice(0, nul)))
    state.linesByNumber.set(lineNumber, text)
    if (parsed[2] !== ':') continue
    const column = jsRegex.exec(text)?.index
    if (column === undefined) {
      throw new UnsupportedGrepPatternError(
        options.pattern,
        'POSIX ERE and JS RegExp disagree on this pattern',
      )
    }
    state.matches.push({ line: lineNumber, column, text })
  }
  return applyTotalCap(toGrepResults(files, abs, contextLines), options.maxTotalMatches)
}

async function grepWithPosixGrep(
  host: Host,
  abs: string,
  options: FilesystemGrepOptions,
): Promise<FilesystemGrepResult[]> {
  const jsRegex = grepRegex(options)
  // Reconstructing per-match context from `grep -C` text output is not
  // reliable (separator lines are ambiguous); let the host walk handle it.
  if (options.contextLines) {
    throw new UnsupportedGrepPatternError(
      options.pattern,
      'context lines are not supported by POSIX grep',
    )
  }
  const args = [
    'grep -rnIE',
    // .git is filtered host-side too; skip it so object files are not scanned.
    '--exclude-dir=.git',
    options.caseSensitive ? '' : '-i',
    options.maxCountPerFile !== undefined
      ? `-m ${Math.max(1, Math.floor(options.maxCountPerFile))}`
      : '',
    '--',
    shellQuote(options.pattern),
    shellQuote(abs),
  ]
    .filter(Boolean)
    .join(' ')
  const result = await host.exec(args)
  if (result.exitCode === 1) return []
  // Like rg, grep exits 2 on per-file errors (e.g. an unreadable file) while
  // still printing matches for the rest; keep those partial results.
  if (result.exitCode !== 0 && !(result.exitCode === 2 && result.stdout.trim())) {
    throw new UnsupportedGrepPatternError(options.pattern, describeGrepFailure(result))
  }
  // grep -n has no column output; recompute with the JS regex host-side so
  // columns are UTF-16 indices, consistent with the fallback implementation.
  const byFile = new Map<string, FilesystemGrepMatch[]>()
  for (const line of result.stdout.split('\n')) {
    if (!line) continue
    const parsed = /^(.*?):(\d+):(.*)$/.exec(line)
    if (!parsed) continue
    const file = parsed[1] ?? ''
    const rel = posixPath.relative(abs, file) || posixPath.basename(file)
    const text = parsed[3] ?? ''
    const column = jsRegex.exec(text)?.index
    // grep matched this line but the JS regex did not: the two dialects
    // disagree on this pattern, so the columns would be wrong. Fall back.
    if (column === undefined) {
      throw new UnsupportedGrepPatternError(
        options.pattern,
        'POSIX ERE and JS RegExp disagree on this pattern',
      )
    }
    let matches = byFile.get(rel)
    if (!matches) {
      matches = []
      byFile.set(rel, matches)
    }
    matches.push({ line: Number(parsed[2]), column, text })
  }
  const results = [...byFile.entries()].map(([path, matches]) => ({ path, matches }))
  return applyTotalCap(results, options.maxTotalMatches)
}

/**
 * Content search executed inside the sandbox in one command, using the best
 * engine the sandbox has: ripgrep, then GNU grep (with git choosing files
 * inside repositories), then POSIX `grep -rnE`. Patterns the grep engines
 * can't express (PCRE-style classes, word boundaries, lookarounds,
 * non-greedy quantifiers) throw {@link UnsupportedGrepPatternError} so
 * callers use their host-side walk.
 *
 * ripgrep and GNU grep apply every `.gitignore` in the tree, relative to the
 * directory that holds it, and skip `node_modules` unless the search path
 * is inside one. Callers still apply their own hidden/glob filtering.
 */
export async function grep(
  host: Host,
  tools: SearchTools,
  abs: string,
  options: FilesystemGrepOptions,
): Promise<FilesystemGrepResult[]> {
  if (tools.rg) return grepWithRipgrep(host, abs, options)
  if (tools.gnuGrep) return grepWithGnuGrep(host, abs, options, tools)
  return grepWithPosixGrep(host, abs, options)
}
