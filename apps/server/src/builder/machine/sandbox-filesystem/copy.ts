// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: the shell path of `copyFile` and `moveFile` (source :483-574). Changed: functions that
// take the filesystem (`Host`) in place of the halves of two methods.

import { posix as posixPath } from 'node:path'
import type { CopyOptions } from '@mastra/core/workspace'
import { FileExistsError, FileNotFoundError } from '@mastra/core/workspace'
import { assertContainedDest, assertContainedRealpath } from './containment.ts'
import type { Host } from './shell.ts'
import { EXIT_EXISTS, EXIT_NOT_FOUND, shellQuote } from './shell.ts'

type Paths = { src: string; dest: string; srcAbs: string; destAbs: string }

export async function copyShell(host: Host, paths: Paths, options?: CopyOptions): Promise<void> {
  const { src, dest, srcAbs, destAbs } = paths
  await assertContainedRealpath(host, srcAbs, src)
  await assertContainedDest(host, destAbs, dest)
  const recursive = options?.recursive ? '-r ' : ''
  if (options?.overwrite === false) {
    // Atomic no-clobber: directories claim the destination with an exclusive
    // mkdir; files copy to a temp name then hardlink into place (link(2)
    // fails if the destination exists). No racy exists() pre-check.
    const result = await host.exec(
      [
        `src=${shellQuote(srcAbs)}`,
        `dest=${shellQuote(destAbs)}`,
        `if [ ! -e "$src" ] && [ ! -L "$src" ]; then exit ${EXIT_NOT_FOUND}; fi`,
        `mkdir -p ${shellQuote(posixPath.dirname(destAbs))} || exit 1`,
        `if [ -d "$src" ]; then`,
        `  mkdir "$dest" 2>/dev/null || exit ${EXIT_EXISTS}`,
        `  cp -R "$src"/. "$dest"/`,
        `else`,
        `  tmp="$dest.__cptmp$$"`,
        `  cp "$src" "$tmp" || exit 1`,
        `  ln "$tmp" "$dest" 2>/dev/null || { rm -f "$tmp"; [ -e "$dest" ] && exit ${EXIT_EXISTS} || exit 1; }`,
        `  rm -f "$tmp"`,
        `fi`,
      ].join('\n'),
    )
    if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(src)
    if (result.exitCode === EXIT_EXISTS) throw new FileExistsError(dest)
    if (result.exitCode !== 0) {
      throw new Error(
        `copyFile ${src} -> ${dest} failed (exit ${result.exitCode}): ${result.stderr.trim()}`,
      )
    }
    return
  }
  const result = await host.exec(
    `if [ ! -e ${shellQuote(srcAbs)} ]; then exit ${EXIT_NOT_FOUND}; fi; mkdir -p ${shellQuote(posixPath.dirname(destAbs))} && cp ${recursive}${shellQuote(srcAbs)} ${shellQuote(destAbs)}`,
  )
  if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(src)
  if (result.exitCode !== 0) {
    throw new Error(
      `copyFile ${src} -> ${dest} failed (exit ${result.exitCode}): ${result.stderr.trim()}`,
    )
  }
}

export async function moveShell(host: Host, paths: Paths, options?: CopyOptions): Promise<void> {
  const { src, dest, srcAbs, destAbs } = paths
  await assertContainedRealpath(host, srcAbs, src)
  await assertContainedDest(host, destAbs, dest)
  if (options?.overwrite === false) {
    // `mv -n` exits 0 even when it skips, so detect a skipped move by the
    // source surviving. The no-clobber rename itself is atomic; no racy
    // exists() pre-check.
    const result = await host.exec(
      [
        `src=${shellQuote(srcAbs)}`,
        `dest=${shellQuote(destAbs)}`,
        `if [ ! -e "$src" ] && [ ! -L "$src" ]; then exit ${EXIT_NOT_FOUND}; fi`,
        `mkdir -p ${shellQuote(posixPath.dirname(destAbs))} || exit 1`,
        `mv -n "$src" "$dest" 2>/dev/null || exit 1`,
        `if [ -e "$src" ] || [ -L "$src" ]; then exit ${EXIT_EXISTS}; fi`,
      ].join('\n'),
    )
    if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(src)
    if (result.exitCode === EXIT_EXISTS) throw new FileExistsError(dest)
    if (result.exitCode !== 0) {
      throw new Error(
        `moveFile ${src} -> ${dest} failed (exit ${result.exitCode}): ${result.stderr.trim()}`,
      )
    }
    return
  }
  const result = await host.exec(
    `if [ ! -e ${shellQuote(srcAbs)} ]; then exit ${EXIT_NOT_FOUND}; fi; mkdir -p ${shellQuote(posixPath.dirname(destAbs))} && mv ${shellQuote(srcAbs)} ${shellQuote(destAbs)}`,
  )
  if (result.exitCode === EXIT_NOT_FOUND) throw new FileNotFoundError(src)
  if (result.exitCode !== 0) {
    throw new Error(
      `moveFile ${src} -> ${dest} failed (exit ${result.exitCode}): ${result.stderr.trim()}`,
    )
  }
}
