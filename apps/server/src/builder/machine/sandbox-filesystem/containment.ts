// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: the containment checks and `execOk` (source :299-390). Changed: functions that take the
// filesystem (`Host`) in place of private methods; no `!`; `PathEscapesError` for a path that leaves the root.

import { posix as posixPath } from 'node:path'
import type { Host, SandboxCommandResult } from './shell.ts'
import { EXIT_NOT_FOUND, shellQuote } from './shell.ts'

/** A path that leaves the workspace root, by `..`, another root or a symlink: a guard's refusal, not a failure of the machine. */
export class PathEscapesError extends Error {}

export type ContainmentCheck = 'target' | 'dest' | 'parent'

/** The filesystem as the native-path check needs it: the symlink switch and what already passed. */
export type Contained = Host & {
  readonly verifySymlinks: boolean
  /** `check:absolutePath` keys that passed while the entry existed. */
  readonly verified: Set<string>
}

/**
 * Lexical guard catches `..` traversal, but a symlink inside the workdir can
 * still point outside it. After resolving a path that refers to an existing
 * entry, verify its realpath is still contained in the workdir.
 *
 * Canonicalization tries `realpath`, then `readlink -f` (GNU/busybox), then
 * `cd && pwd -P` for directories — covering GNU hosts, macOS/BSD, and
 * busybox. If the path exists but cannot be canonicalized we fail CLOSED:
 * returning without a check would let a symlink bypass containment.
 */
export async function assertContainedRealpath(
  host: Host,
  abs: string,
  inputPath: string,
): Promise<boolean> {
  const result = await host.exec(
    [
      `p=${shellQuote(abs)}`,
      `if [ ! -e "$p" ] && [ ! -L "$p" ]; then exit ${EXIT_NOT_FOUND}; fi`,
      // The workdir itself may contain symlinked components (/tmp on macOS),
      // so canonicalize it as the comparison root.
      `root=$(cd ${shellQuote(host.basePath)} 2>/dev/null && pwd -P)`,
      `[ -n "$root" ] || exit 1`,
      `rp=$(realpath "$p" 2>/dev/null) || rp=$(readlink -f "$p" 2>/dev/null) || { [ -d "$p" ] && rp=$(cd "$p" 2>/dev/null && pwd -P); }`,
      `[ -n "$rp" ] || exit 1`,
      `printf '%s\\n%s' "$root" "$rp"`,
    ].join('\n'),
  )
  // Path doesn't exist yet: nothing to canonicalize (writes to a fresh leaf
  // are covered by assertContainedDest checking the parent directory).
  if (result.exitCode === EXIT_NOT_FOUND) return false
  const [root, real] = result.stdout.split('\n').map((s) => s.trim())
  if (result.exitCode !== 0 || !root || !real) {
    throw new Error(`Unable to verify path stays within workspace root: ${inputPath}`)
  }
  if (real !== root && !real.startsWith(`${root}/`)) {
    throw new PathEscapesError(`Path escapes workspace root (symlink): ${inputPath}`)
  }
  return true
}

/**
 * Guard for write destinations. The lexical guard catches `..`, but a symlink
 * inside the workdir can redirect a write outside it. For an existing target
 * we check its realpath; for a not-yet-existing target we check the realpath
 * of its nearest existing ancestor directory, since a symlinked parent is the
 * escape vector (e.g. `link -> /etc` then writing `link/passwd`).
 */
export async function assertContainedDest(
  host: Host,
  abs: string,
  inputPath: string,
): Promise<boolean> {
  // First check the target itself (covers overwriting an existing symlink).
  const exists = await assertContainedRealpath(host, abs, inputPath)
  // Then check the parent directory's realpath; readlink -f resolves the
  // nearest existing ancestor when the leaf doesn't exist yet.
  const parent = posixPath.dirname(abs)
  if (parent && parent !== abs) {
    await assertContainedRealpath(host, parent, inputPath)
  }
  return exists
}

/**
 * Before a native filesystem call, run the containment check the shell path
 * runs for that operation, when `verifySymlinks` is on. A pass is remembered
 * only for an entry that exists: a missing path may later appear as a
 * symlink that leads outside the workdir.
 */
export async function verifyNative(
  fs: Contained,
  check: ContainmentCheck,
  abs: string,
  inputPath: string,
): Promise<void> {
  if (!fs.verifySymlinks) return
  const key = `${check}:${abs}`
  if (fs.verified.has(key)) return
  const existed =
    check === 'dest'
      ? await assertContainedDest(fs, abs, inputPath)
      : await assertContainedRealpath(
          fs,
          check === 'parent' ? posixPath.dirname(abs) : abs,
          inputPath,
        )
  if (existed) fs.verified.add(key)
}

export async function execOk(
  host: Host,
  script: string,
  context: string,
): Promise<SandboxCommandResult> {
  const result = await host.exec(script)
  if (result.exitCode !== 0) {
    throw new Error(
      `${context} failed (exit ${result.exitCode}): ${result.stderr.trim() || result.stdout.trim()}`,
    )
  }
  return result
}
