// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: the shell path of `readFile`, `writeFile`, `deleteFile` and `stat`, and the search-tool
// probe (source :270-282, 391-482, 1000-1030). Changed: functions that take the filesystem
// (`Host`) in place of the halves of methods; the probe is a function, its cache stays in the class.

import { posix as posixPath } from 'node:path'
import type {
  FileContent,
  FileStat,
  ReadOptions,
  RemoveOptions,
  WriteOptions,
} from '@mastra/core/workspace'
import { FileExistsError, FileNotFoundError, IsDirectoryError } from '@mastra/core/workspace'
import { assertContainedDest, assertContainedRealpath, execOk } from './containment.ts'
import type { Host, SearchTools } from './shell.ts'
import {
  EXIT_EXISTS,
  EXIT_IS_DIRECTORY,
  EXIT_NOT_FOUND,
  SEARCH_TOOLS_PROBE,
  shellQuote,
  toBuffer,
} from './shell.ts'

export async function readShell(
  host: Host,
  abs: string,
  path: string,
  options?: ReadOptions,
): Promise<string | Buffer> {
  await assertContainedRealpath(host, abs, path)
  // Guard clauses first: redirecting from a directory "succeeds" with empty
  // output on some shells, so classify before reading.
  const result = await host.exec(
    `if [ -d ${shellQuote(abs)} ]; then exit ${EXIT_IS_DIRECTORY}; elif [ ! -e ${shellQuote(abs)} ]; then exit ${EXIT_NOT_FOUND}; fi; base64 < ${shellQuote(abs)}`,
  )
  if (result.exitCode === EXIT_IS_DIRECTORY) throw new IsDirectoryError(path)
  if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(path)
  if (result.exitCode !== 0) {
    throw new Error(`readFile ${path} failed (exit ${result.exitCode}): ${result.stderr.trim()}`)
  }
  const buffer = Buffer.from(result.stdout.replace(/\s/g, ''), 'base64')
  if (options?.encoding) {
    return buffer.toString(options.encoding)
  }
  return buffer
}

export async function writeShell(
  host: Host,
  abs: string,
  path: string,
  content: FileContent,
  options?: WriteOptions,
): Promise<void> {
  await assertContainedDest(host, abs, path)
  const b64 = toBuffer(content).toString('base64')
  const dir = posixPath.dirname(abs)
  const mkdir = options?.recursive === false ? '' : `mkdir -p ${shellQuote(dir)} && `
  if (options?.overwrite === false) {
    // `set -C` (noclobber) makes the redirect itself the exclusivity check —
    // no exists() pre-check that could race with a concurrent writer.
    const result = await host.exec(
      `${mkdir}{ (set -C; printf %s ${shellQuote(b64)} | base64 -d > ${shellQuote(abs)}) 2>/dev/null || { [ -e ${shellQuote(abs)} ] && exit ${EXIT_EXISTS} || exit 1; }; }`,
    )
    if (result.exitCode === EXIT_EXISTS) throw new FileExistsError(path)
    if (result.exitCode !== 0) {
      throw new Error(`writeFile ${path} failed (exit ${result.exitCode}): ${result.stderr.trim()}`)
    }
    return
  }
  await execOk(
    host,
    `${mkdir}printf %s ${shellQuote(b64)} | base64 -d > ${shellQuote(abs)}`,
    `writeFile ${path}`,
  )
}

export async function deleteShell(
  host: Host,
  abs: string,
  path: string,
  options?: RemoveOptions,
): Promise<void> {
  // Contain the parent's realpath: deleting `link/file` where `link` points
  // outside the workdir must fail, while deleting a symlink entry itself
  // (which lives inside the workdir) stays allowed.
  await assertContainedRealpath(host, posixPath.dirname(abs), path)
  if (options?.force) {
    // `rm -f` already succeeds for a missing file, but still fails for
    // directories and permission errors — surface those.
    await execOk(host, `rm -f ${shellQuote(abs)}`, `deleteFile ${path}`)
    return
  }
  const result = await host.exec(
    `if [ ! -e ${shellQuote(abs)} ]; then exit ${EXIT_NOT_FOUND}; fi; rm ${shellQuote(abs)}`,
  )
  if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(path)
  if (result.exitCode !== 0) {
    throw new Error(`deleteFile ${path} failed (exit ${result.exitCode}): ${result.stderr.trim()}`)
  }
}

export async function statShell(host: Host, abs: string, path: string): Promise<FileStat> {
  await assertContainedRealpath(host, abs, path)
  // GNU stat: %F=type, %s=size, %Y=mtime (epoch seconds), %W=birth (or -1).
  // BSD/macOS stat (local sandbox hosts) rejects `-c`; fall back to its
  // `-f` format with the same field order (%HT=type, %z=size, %m=mtime,
  // %B=birth). Delimit with `|` — neither stat interprets `\t` escapes in
  // its format string.
  const result = await host.exec(
    `stat -c '%F|%s|%Y|%W' ${shellQuote(abs)} 2>/dev/null || stat -f '%HT|%z|%m|%B' ${shellQuote(abs)}`,
  )
  if (result.exitCode !== 0) {
    throw new FileNotFoundError(path)
  }
  const [kind, sizeStr, mtimeStr, ctimeStr] = result.stdout.trim().split('|')
  const type = kind?.toLowerCase().includes('directory') ? 'directory' : 'file'
  const size = Number(sizeStr) || 0
  const mtime = Number(mtimeStr) || 0
  const ctime = Number(ctimeStr)
  return {
    name: posixPath.basename(abs),
    path: `/${posixPath.relative(host.basePath, abs)}`,
    type,
    size: type === 'directory' ? 0 : size,
    modifiedAt: new Date(mtime * 1000),
    createdAt: new Date((ctime > 0 ? ctime : mtime) * 1000),
  }
}

/** Runs the probe once: which search tools the sandbox has. */
export async function probeSearchTools(host: Host): Promise<SearchTools> {
  const result = await host.exec(SEARCH_TOOLS_PROBE)
  if (result.exitCode !== 0) throw new Error(`search tool probe exited with ${result.exitCode}`)
  const found = new Set(result.stdout.split('\n').map((line) => line.trim()))
  const git = found.has('git')
  return {
    rg: found.has('rg'),
    gnuGrep: found.has('gnu-grep'),
    git,
    pcre: found.has('grep-pcre') && (!git || found.has('git-pcre')),
  }
}
