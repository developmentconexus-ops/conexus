// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: `walk` (source :608-754). Changed: a function that takes the filesystem (`Host`) in place
// of a method; split into its script and its reader.

import { posix as posixPath } from 'node:path'
import type { WalkEntry, WalkOptions } from '@mastra/core/workspace'
import { DirectoryNotFoundError, NotDirectoryError } from '@mastra/core/workspace'
import { assertContainedRealpath } from './containment.ts'
import type { Host } from './shell.ts'
import { EXIT_NOT_DIRECTORY, EXIT_NOT_FOUND, shellQuote } from './shell.ts'

function walkScript(abs: string, options?: WalkOptions): string {
  const maxDepth =
    options?.maxDepth !== undefined && Number.isFinite(options.maxDepth)
      ? `-maxdepth ${Math.max(0, Math.floor(options.maxDepth))} `
      : ''
  // Prune hidden entries in-sandbox when not requested, so a huge hidden
  // tree (e.g. `.git`) doesn't inflate the response. `.gitignore` files
  // still come back when the caller applies them.
  const keepGitignore = options?.includeGitignoreFiles ? `! \\( -type f -name .gitignore \\) ` : ''
  const hiddenPrune = options?.includeHidden ? '' : `\\( -name '.*' ${keepGitignore}\\) -prune -o `
  // Skip directories like node_modules entirely instead of listing them
  // only for the caller to filter them out.
  const skipNames = options?.skipDirectoryNames?.filter(Boolean) ?? []
  const skipPrune = skipNames.length
    ? `\\( -type d \\( ${skipNames.map((name) => `-name ${shellQuote(name)}`).join(' -o ')} \\) \\) -prune -o `
    : ''
  // Emit "flag\tpath[\ttarget]" — flag is d/f for regular entries, D/F for
  // symlinks (with the link target as a third field).
  return (
    `root=${shellQuote(abs)}\n` +
    `[ -e "$root" ] || [ -L "$root" ] || exit ${EXIT_NOT_FOUND}\n` +
    `[ -d "$root" ] || exit ${EXIT_NOT_DIRECTORY}\n` +
    `find "$root" -mindepth 1 ${maxDepth}${hiddenPrune}${skipPrune}-print 2>/dev/null | while IFS= read -r f; do ` +
    `if [ -L "$f" ]; then if [ -d "$f" ]; then t=D; else t=F; fi; printf '%s\\t%s\\t%s\\n' "$t" "$f" "$(readlink "$f")"; ` +
    `elif [ -d "$f" ]; then printf 'd\\t%s\\n' "$f"; else printf 'f\\t%s\\n' "$f"; fi; done`
  )
}

function parseWalk(stdout: string, abs: string): WalkEntry[] {
  const entries: WalkEntry[] = []
  for (const line of stdout.split('\n')) {
    if (!line) continue
    const tab = line.indexOf('\t')
    if (tab < 0) continue
    const flag = line.slice(0, tab)
    const isSymlink = flag === 'D' || flag === 'F'
    let fullPath = line.slice(tab + 1)
    let symlinkTarget: string | undefined
    if (isSymlink) {
      const tab2 = fullPath.lastIndexOf('\t')
      if (tab2 >= 0) {
        symlinkTarget = fullPath.slice(tab2 + 1) || undefined
        fullPath = fullPath.slice(0, tab2)
      }
    }
    const rel = posixPath.relative(abs, fullPath)
    if (!rel || rel.startsWith('..')) continue
    entries.push({
      name: posixPath.basename(rel),
      type: flag === 'd' || flag === 'D' ? 'directory' : 'file',
      ...(isSymlink ? { isSymlink: true, ...(symlinkTarget ? { symlinkTarget } : {}) } : {}),
      path: rel,
    })
  }
  return entries
}

/**
 * Walk the tree in a single sandbox command instead of one readdir round
 * trip per directory. Uses `find` with a portable classification loop
 * (`find -printf` is GNU-only and fails on macOS/BSD hosts). `find` does
 * not follow symlinked directories by default, matching the host-side
 * walker's no-recursion-into-symlinks behavior.
 */
export async function walk(
  host: Host,
  abs: string,
  path: string,
  options?: WalkOptions,
): Promise<WalkEntry[]> {
  await assertContainedRealpath(host, abs, path)
  const result = await host.exec(walkScript(abs, options))
  if (result.exitCode === EXIT_NOT_FOUND) throw new DirectoryNotFoundError(path)
  if (result.exitCode === EXIT_NOT_DIRECTORY) throw new NotDirectoryError(path)
  if (result.exitCode !== 0) {
    throw new Error(`walk ${path} failed (exit ${result.exitCode}): ${result.stderr.trim()}`)
  }
  return parseWalk(result.stdout, abs)
}
