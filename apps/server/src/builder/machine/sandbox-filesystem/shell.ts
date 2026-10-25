// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: the shell vocabulary (source :46-199). Changed: `type` for `interface`; no `!`; the
// `Host` type is new, for the files that were class methods.

import { posix as posixPath } from 'node:path'
import type {
  FileContent,
  FilesystemGrepMatch,
  FilesystemGrepResult,
  WorkspaceFilesystem,
} from '@mastra/core/workspace'

/**
 * Sentinel exit codes used by guard clauses that run before the real command,
 * so shell failures can be mapped to typed filesystem errors.
 */
export const EXIT_NOT_FOUND = 20
export const EXIT_IS_DIRECTORY = 21
export const EXIT_EXISTS = 22
export const EXIT_NOT_DIRECTORY = 23

/** Minimal command result shape we depend on. */
export type SandboxCommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}

/** Minimal sandbox surface the filesystem needs. */
export type SandboxExec = {
  readonly id: string
  /**
   * The sandbox's own file API, when it has one (`WorkspaceSandbox.filesystem`).
   * File operations go through it instead of shell commands.
   */
  readonly filesystem?: WorkspaceFilesystem
  executeCommand(
    command: string,
    args?: string[],
    options?: { timeout?: number; maxRetainedBytes?: number },
  ): Promise<SandboxCommandResult>
}

/** What the files that were the class's methods need of it: a shell in the sandbox and the root. */
export type Host = {
  exec(script: string): Promise<SandboxCommandResult>
  readonly basePath: string
}

/** Default per-command deadline so a hung sandbox can't block file tools forever. */
export const COMMAND_TIMEOUT_MS = 30_000

/**
 * Explain why a native grep command failed so callers can tell a timeout or
 * broken toolchain apart from a pattern the engine cannot express.
 */
export function describeGrepFailure(result: SandboxCommandResult): string {
  if (result.exitCode === 124) return `timed out after ${COMMAND_TIMEOUT_MS / 1000}s`
  const stderrLine = result.stderr
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  const detail = stderrLine
    ? `: ${stderrLine.length > 200 ? `${stderrLine.slice(0, 200)}…` : stderrLine}`
    : ''
  return `exit code ${result.exitCode}${detail}`
}

/** Single-quote a string for safe POSIX shell interpolation. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export type SearchTools = {
  rg: boolean
  gnuGrep: boolean
  git: boolean
  /** `grep -P` works, and so does `git grep -P` when git is present. */
  pcre: boolean
}

/** One command that reports which search tools the sandbox has, one name per line. */
export const SEARCH_TOOLS_PROBE =
  'command -v rg >/dev/null 2>&1 && echo rg; ' +
  "grep --version 2>/dev/null | head -n 1 | grep -q 'GNU grep' && echo gnu-grep; " +
  "printf 'a1\\n' | grep -qP '\\d(?=)' 2>/dev/null && echo grep-pcre; " +
  'if command -v git >/dev/null 2>&1; then echo git; ' +
  // git can be built without PCRE; check it on a throwaway repository.
  'd=$(mktemp -d 2>/dev/null) && { ' +
  "(cd \"$d\" && git init -q && printf 'a1\\n' >f && git grep -q --untracked -P -e '\\d(?=)') >/dev/null 2>&1 && echo git-pcre; " +
  'rm -rf "$d"; }; fi; true'

export function isInsideNodeModules(path: string): boolean {
  return path.split('/').includes('node_modules')
}

/** Lines a grep engine printed for one file: matches plus surrounding context. */
export type GrepFileLines = {
  matches: FilesystemGrepMatch[]
  linesByNumber: Map<number, string>
}

export function fileLines(files: Map<string, GrepFileLines>, filePath: string): GrepFileLines {
  let state = files.get(filePath)
  if (!state) {
    state = { matches: [], linesByNumber: new Map() }
    files.set(filePath, state)
  }
  return state
}

/** Turn per-file lines into results relative to `abs`, attaching before/after context. */
export function toGrepResults(
  files: Map<string, GrepFileLines>,
  abs: string,
  contextLines: number,
): FilesystemGrepResult[] {
  const results: FilesystemGrepResult[] = []
  for (const [filePath, state] of files) {
    if (state.matches.length === 0) continue
    const rel = posixPath.relative(abs, filePath) || posixPath.basename(filePath)
    const matches = state.matches.map((match) => {
      if (contextLines <= 0) return match
      const before: string[] = []
      for (let n = match.line - 1; n >= Math.max(1, match.line - contextLines); n--) {
        const text = state.linesByNumber.get(n)
        if (text === undefined) break
        before.unshift(text)
      }
      const after: string[] = []
      for (let n = match.line + 1; n <= match.line + contextLines; n++) {
        const text = state.linesByNumber.get(n)
        if (text === undefined) break
        after.push(text)
      }
      return { ...match, before, after }
    })
    results.push({ path: rel, matches })
  }
  return results
}

export function toBuffer(content: FileContent): Buffer {
  if (typeof content === 'string') return Buffer.from(content, 'utf8')
  return Buffer.from(content)
}
