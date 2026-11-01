// Copyright (c) 2025 Kepler Software, Inc. Licensed under the Apache License, Version 2.0; a copy is
// in THIRD_PARTY_LICENSE.txt beside this file.
// From @mastra/code-sdk 1.15.0, src/agents/sandbox-filesystem.ts (mastra-ai/mastra), split by
// concern: the class (source :1-45, 201-298, 391-482, 575-614, 755-784, 1045-1116). Changed: `type` for
// `interface`; no `!` and no assignment in an expression; the shell parts are in the files beside
// this one and take the class as `Host`; `exec` and the symlink fields are public for them; a path that leaves the root throws
// `PathEscapesError`.

import { posix as posixPath } from 'node:path'
import type {
  CopyOptions,
  FileContent,
  FileEntry,
  FileStat,
  FilesystemGrepOptions,
  FilesystemGrepResult,
  FilesystemInfo,
  ListOptions,
  ProviderStatus,
  ReadOptions,
  RemoveOptions,
  WalkEntry,
  WalkOptions,
  WorkspaceFilesystem,
  WriteOptions,
} from '@mastra/core/workspace'
import {
  assertContainedDest,
  assertContainedRealpath,
  execOk,
  PathEscapesError,
  verifyNative,
} from './containment.ts'
import { copyShell, moveShell } from './copy.ts'
import { deleteShell, probeSearchTools, readShell, statShell, writeShell } from './files.ts'
import { grep } from './grep.ts'
import { readdirShell, walk } from './listing.ts'
import type { Host, SandboxCommandResult, SandboxExec, SearchTools } from './shell.ts'
import { COMMAND_TIMEOUT_MS, shellQuote, toBuffer } from './shell.ts'

export type { SandboxCommandResult, SandboxExec } from './shell.ts'

export type SandboxFilesystemOptions = {
  /** Live sandbox to run commands in. */
  sandbox: SandboxExec
  /**
   * Absolute path inside the sandbox that is the workspace root — or a lazy
   * resolver for it. The resolver form exists for sandboxes whose workspace
   * root is only knowable once the VM is running (e.g. `$HOME/<repo>` under
   * a provider-chosen home dir): it is awaited on the first file operation
   * (which itself may lazily start the VM) and the result is memoized.
   */
  workdir: string | (() => Promise<string> | string)
  /** Optional stable id; defaults to a sandbox-derived id. */
  id?: string
  /**
   * Check that symlinks don't lead outside the workdir when using the
   * sandbox's native filesystem. Off by default: native file APIs follow
   * symlinks, and inside a sandbox the agent can read anything with a command
   * anyway. Turn it on when files are served to someone other than the agent.
   *
   * Each path is checked once per instance, so keep such instances
   * short-lived. Without a native filesystem the shell path always checks.
   */
  verifySymlinks?: boolean
}

export class SandboxFilesystem implements WorkspaceFilesystem, Host {
  readonly id: string
  readonly name = 'SandboxFilesystem'
  readonly provider = 'sandbox'
  status: ProviderStatus = 'ready'
  readonly verifySymlinks: boolean
  /** `check:absolutePath` keys that passed while the entry existed. */
  readonly verified = new Set<string>()

  private readonly sandbox: SandboxExec
  private readonly workdirSource: string | (() => Promise<string> | string)
  private resolvedBase?: string
  private resolvingBase?: Promise<string>
  private toolsCheck: Promise<SearchTools> | undefined

  constructor(options: SandboxFilesystemOptions) {
    this.sandbox = options.sandbox
    this.workdirSource = options.workdir
    this.verifySymlinks = options.verifySymlinks ?? false
    if (typeof options.workdir === 'string') this.resolvedBase = options.workdir
    // Include the workdir when known: one sandbox can back several
    // filesystems rooted at different checkouts, and each needs a distinct
    // id. Lazy-workdir callers pass an explicit id.
    this.id =
      options.id ??
      (typeof options.workdir === 'string'
        ? `sandbox-fs:${options.sandbox.id}:${options.workdir}`
        : `sandbox-fs:${options.sandbox.id}`)
  }

  /** The resolved workspace root; empty until a lazy workdir first resolves. */
  get basePath(): string {
    return this.resolvedBase ?? ''
  }

  /** Await (and memoize) the workspace root, resolving a lazy workdir once. */
  private async base(): Promise<string> {
    if (this.resolvedBase) return this.resolvedBase
    const source = this.workdirSource
    if (typeof source === 'string') {
      this.resolvedBase = source
      return source
    }
    this.resolvingBase ??= Promise.resolve()
      .then(source)
      .then((resolved) => {
        if (!resolved) throw new Error('Sandbox workspace root resolution returned an empty path')
        this.resolvedBase = resolved
        return resolved
      })
      .finally(() => {
        this.resolvingBase = undefined
      })
    return this.resolvingBase
  }

  // ── Path handling ──────────────────────────────────────────────────────

  /**
   * Resolve a workspace path to an absolute path inside the sandbox, enforcing
   * that it stays within the workdir. Awaits the workspace root first, which
   * for a lazy workdir may start the VM.
   */
  private async resolveAsync(inputPath: string): Promise<string> {
    return this.resolveAgainst(await this.base(), inputPath)
  }

  /**
   * Resolve a workspace path against a known base, enforcing that it stays
   * within the workdir.
   *
   * Accepts both workspace-relative paths (`src/foo.ts`, `/src/foo.ts`) and
   * absolute sandbox paths that already live under the workdir — the agent's
   * prompt advertises the workdir as its working directory, so tools are
   * routinely called with fully-qualified paths like `<workdir>/src/foo.ts`.
   */
  private resolveAgainst(basePath: string, inputPath: string): string {
    const base = posixPath.normalize(basePath)
    const normalizedInput = posixPath.normalize(inputPath)
    const rel =
      normalizedInput === base
        ? ''
        : normalizedInput.startsWith(`${base}/`)
          ? normalizedInput.slice(base.length + 1)
          : inputPath.startsWith('/')
            ? inputPath.slice(1)
            : inputPath
    const resolved = posixPath.normalize(posixPath.join(base, rel))
    if (resolved !== base && !resolved.startsWith(`${base}/`)) {
      throw new PathEscapesError(`Path escapes workspace root: ${inputPath}`)
    }
    return resolved
  }

  resolveAbsolutePath(inputPath: string): string | undefined {
    // Sync interface: a lazy workdir that has not resolved yet has no
    // absolute form to offer.
    if (!this.resolvedBase) return undefined
    return this.resolveAgainst(this.resolvedBase, inputPath)
  }

  // ── Command helper ─────────────────────────────────────────────────────

  async exec(script: string): Promise<SandboxCommandResult> {
    // File reads come back as base64 on stdout and listings/grep are parsed
    // line by line, so dropping the oldest output would corrupt results.
    return this.sandbox.executeCommand('sh', ['-c', script], {
      timeout: COMMAND_TIMEOUT_MS,
      maxRetainedBytes: Infinity,
    })
  }

  // ── File operations ────────────────────────────────────────────────────

  async readFile(path: string, options?: ReadOptions): Promise<string | Buffer> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'target', abs, path)
      return native.readFile(abs, options)
    }
    return readShell(this, abs, path, options)
  }

  async writeFile(path: string, content: FileContent, options?: WriteOptions): Promise<void> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'dest', abs, path)
      return native.writeFile(abs, content, options)
    }
    return writeShell(this, abs, path, content, options)
  }

  async appendFile(path: string, content: FileContent): Promise<void> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'dest', abs, path)
      return native.appendFile(abs, content)
    }
    await assertContainedDest(this, abs, path)
    const b64 = toBuffer(content).toString('base64')
    await execOk(
      this,
      `mkdir -p ${shellQuote(posixPath.dirname(abs))} && printf %s ${shellQuote(b64)} | base64 -d >> ${shellQuote(abs)}`,
      `appendFile ${path}`,
    )
  }

  async deleteFile(path: string, options?: RemoveOptions): Promise<void> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'parent', abs, path)
      return native.deleteFile(abs, options)
    }
    return deleteShell(this, abs, path, options)
  }

  async copyFile(src: string, dest: string, options?: CopyOptions): Promise<void> {
    const srcAbs = await this.resolveAsync(src)
    const destAbs = await this.resolveAsync(dest)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'target', srcAbs, src)
      await verifyNative(this, 'dest', destAbs, dest)
      return native.copyFile(srcAbs, destAbs, options)
    }
    return copyShell(this, { src, dest, srcAbs, destAbs }, options)
  }

  async moveFile(src: string, dest: string, options?: CopyOptions): Promise<void> {
    const srcAbs = await this.resolveAsync(src)
    const destAbs = await this.resolveAsync(dest)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'target', srcAbs, src)
      await verifyNative(this, 'dest', destAbs, dest)
      return native.moveFile(srcAbs, destAbs, options)
    }
    return moveShell(this, { src, dest, srcAbs, destAbs }, options)
  }

  // ── Directory operations ───────────────────────────────────────────────

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'dest', abs, path)
      return native.mkdir(abs, options)
    }
    await assertContainedDest(this, abs, path)
    const flag = options?.recursive === false ? '' : '-p '
    await execOk(this, `mkdir ${flag}${shellQuote(abs)}`, `mkdir ${path}`)
  }

  async rmdir(path: string, options?: RemoveOptions): Promise<void> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'parent', abs, path)
      return native.rmdir(abs, options)
    }
    // Same parent containment as deleteFile — `rm -r` through a symlinked
    // parent would otherwise delete outside the workspace.
    await assertContainedRealpath(this, posixPath.dirname(abs), path)
    if (options?.recursive) {
      const force = options?.force ? '-f ' : ''
      await execOk(this, `rm -r ${force}${shellQuote(abs)}`, `rmdir ${path}`)
      return
    }
    const result = await this.exec(`rmdir ${shellQuote(abs)}`)
    if (result.exitCode !== 0 && !options?.force) {
      throw new Error(`Directory not empty or not found: ${path}`)
    }
  }

  async readdir(path: string, options?: ListOptions): Promise<FileEntry[]> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'target', abs, path)
      return native.readdir(abs, options)
    }
    return readdirShell(this, abs, path, options)
  }

  // ── Native walk / grep capabilities ────────────────────────────────────

  async walk(path: string, options?: WalkOptions): Promise<WalkEntry[]> {
    return walk(this, await this.resolveAsync(path), path, options)
  }

  async grep(options: FilesystemGrepOptions): Promise<FilesystemGrepResult[]> {
    const abs = await this.resolveAsync(options.path)
    await assertContainedRealpath(this, abs, options.path)
    return grep(this, await this.searchTools(), abs, options)
  }

  private searchTools(): Promise<SearchTools> {
    const check = this.toolsCheck ?? probeSearchTools(this)
    this.toolsCheck = check
    // Only a successful probe is cached; a failed one (e.g. the sandbox wasn't
    // ready) is retried on the next search instead of pinning the slow path.
    return check.catch(() => {
      if (this.toolsCheck === check) this.toolsCheck = undefined
      return { rg: false, gnuGrep: false, git: false, pcre: false }
    })
  }

  // ── Path / metadata ────────────────────────────────────────────────────

  async exists(path: string): Promise<boolean> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) return native.exists(abs)
    const result = await this.exec(`test -e ${shellQuote(abs)}`)
    return result.exitCode === 0
  }

  async stat(path: string): Promise<FileStat> {
    const abs = await this.resolveAsync(path)
    const native = this.sandbox.filesystem
    if (native) {
      await verifyNative(this, 'target', abs, path)
      const info = await native.stat(abs)
      return {
        ...info,
        name: posixPath.basename(abs),
        path: `/${posixPath.relative(this.basePath, abs)}`,
      }
    }
    return statShell(this, abs, path)
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  async init(): Promise<void> {
    await execOk(this, `mkdir -p ${shellQuote(await this.base())}`, 'init workdir')
  }

  async destroy(): Promise<void> {
    // The sandbox lifecycle is owned by the caller; nothing to tear down here.
  }

  async isReady(): Promise<boolean> {
    const result = await this.exec(`test -d ${shellQuote(await this.base())}`)
    return result.exitCode === 0
  }

  getInfo(): FilesystemInfo {
    return {
      id: this.id,
      name: this.name,
      provider: this.provider,
      status: this.status,
      metadata: { basePath: this.basePath, sandboxId: this.sandbox.id },
    }
  }

  getInstructions(): string {
    return `Files are stored in a remote sandbox at ${this.basePath}. Use absolute workspace paths like /src/index.ts. All reads, writes and commands run inside the same sandbox.`
  }
}
