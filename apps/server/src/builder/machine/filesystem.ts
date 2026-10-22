import { randomUUID } from 'node:crypto'
import { posix } from 'node:path'
import type {
  CopyOptions,
  FileContent,
  FileEntry,
  FileStat,
  ListOptions,
  ReadOptions,
  RemoveOptions,
  WorkspaceFilesystem,
  WriteOptions,
} from '@mastra/core/workspace'
import {
  DirectoryNotEmptyError,
  FileExistsError,
  FileNotFoundError,
  FilesystemError,
  IsDirectoryError,
  PermissionError,
} from '@mastra/core/workspace'
import { z } from 'zod'
import type { Operation } from './in-machine.ts'
import { PROGRAM } from './in-machine.ts'
import { READ_MAX } from './kit.ts'

export type Exec = (script: string) => Promise<{ exitCode: number; stdout: string; stderr: string }>

/** The bytes of one write that cross in one command, well under the 128 KiB a command line may hold. */
const PIECE = 48 * 1024

const Reply = z.union([
  z.strictObject({ ok: z.unknown() }),
  z.strictObject({ error: z.string(), message: z.string() }),
])
const Stat = z.strictObject({
  directory: z.boolean(),
  size: z.number(),
  born: z.number(),
  changed: z.number(),
})

function quoted(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

/**
 * The file tools' filesystem over the machine (decision 0051, Z2): the 11 operations the tools need,
 * each one command in the machine that opens every step of the path inside `root` without following
 * a link (`in-machine.ts`), so a link opens nothing, even one swapped in while the command runs
 * (security S2, card criterion 19). No read brings more than `READ_MAX` into the Hub.
 */
export class MachineFilesystem implements WorkspaceFilesystem {
  readonly name = 'MachineFilesystem'
  readonly provider = 'conexus-machine'
  readonly status = 'ready'

  readonly id: string
  private readonly root: string
  private readonly exec: Exec

  constructor(input: { id: string; root: string; exec: Exec }) {
    this.id = input.id
    this.root = input.root
    this.exec = input.exec
  }

  /** The file tools' folder as the model is told of it: what `steps` holds them to. */
  getInstructions(): string {
    return `The file tools work in ${this.root}, the app folder: relative paths resolve from it, and a path outside it is refused.`
  }

  private steps(path: string, operation: string): string[] {
    const absolute = posix.resolve(this.root, path)
    if (absolute !== this.root && !absolute.startsWith(`${this.root}/`))
      throw new PermissionError(path, operation)
    return posix.relative(this.root, absolute).split('/').filter(Boolean)
  }

  private async ask(path: string, operation: string, request: Operation): Promise<unknown> {
    const argument = JSON.stringify({ ...request, root: this.root, max: READ_MAX })
    const result = await this.exec(`node -e ${quoted(PROGRAM)} ${quoted(argument)}`)
    if (result.exitCode !== 0) throw new Error(`${operation} ${path}: ${result.stderr.trim()}`)
    const reply = Reply.parse(JSON.parse(result.stdout))
    if ('ok' in reply) return reply.ok
    switch (reply.error) {
      case 'OUTSIDE':
      case 'ELOOP':
        throw new PermissionError(path, operation)
      case 'EISDIR':
        throw new IsDirectoryError(path)
      case 'ENOENT':
      case 'ENOTDIR':
        throw new FileNotFoundError(path)
      case 'EEXIST':
        throw new FileExistsError(path)
      case 'ENOTEMPTY':
        throw new DirectoryNotEmptyError(path)
      case 'TOO_LARGE':
        throw new FilesystemError(`${path}: larger than ${READ_MAX} bytes`, 'EFBIG', path)
      default:
        throw new Error(`${operation} ${path}: ${reply.message}`)
    }
  }

  async readFile(path: string, options?: ReadOptions): Promise<string | Buffer> {
    const read = await this.ask(path, 'read', { op: 'read', path: this.steps(path, 'read') })
    const bytes = Buffer.from(z.string().parse(read), 'base64')
    return options?.encoding ? bytes.toString(options.encoding) : bytes
  }

  async writeFile(path: string, content: FileContent, options?: WriteOptions) {
    const steps = this.steps(path, 'write')
    const bytes = Buffer.from(content)
    const staging = `.conexus-${randomUUID()}`
    for (let start = 0; start === 0 || start < bytes.byteLength; start += PIECE) {
      await this.ask(path, 'write', {
        ...{ op: 'put', path: steps, staging },
        data: bytes.subarray(start, start + PIECE).toString('base64'),
        ...{ first: start === 0, last: start + PIECE >= bytes.byteLength },
        parents: options?.recursive !== false,
        exclusive: options?.overwrite === false,
      })
    }
  }

  async appendFile(path: string, content: FileContent) {
    const before = (await this.exists(path)) ? await this.readFile(path) : Buffer.alloc(0)
    await this.writeFile(path, Buffer.concat([Buffer.from(before), Buffer.from(content)]))
  }

  async deleteFile(path: string, options?: RemoveOptions) {
    const steps = this.steps(path, 'delete')
    await this.ask(path, 'delete', { op: 'delete', path: steps, force: options?.force === true })
  }

  private async transfer(
    src: string,
    dest: string,
    options: CopyOptions | undefined,
    op: 'copy' | 'move',
  ) {
    await this.ask(src, op, {
      ...{ op, path: this.steps(src, op), to: this.steps(dest, op) },
      staging: `.conexus-${randomUUID()}`,
      recursive: options?.recursive === true,
      overwrite: options?.overwrite !== false,
    })
  }

  async mkdir(path: string, options?: { recursive?: boolean }) {
    const steps = this.steps(path, 'mkdir')
    await this.ask(path, 'mkdir', {
      ...{ op: 'mkdir', path: steps },
      recursive: options?.recursive !== false,
    })
  }

  async rmdir(path: string, options?: RemoveOptions) {
    const steps = this.steps(path, 'rmdir')
    await this.ask(path, 'rmdir', {
      ...{ op: 'rmdir', path: steps },
      recursive: options?.recursive === true,
    })
  }

  async readdir(path: string, options?: ListOptions): Promise<FileEntry[]> {
    const depth = options?.recursive ? (options.maxDepth ?? 8) : 1
    const steps = this.steps(path, 'readdir')
    const listed = await this.ask(path, 'readdir', { op: 'list', path: steps, depth })
    return z
      .string()
      .parse(listed)
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [kind = '', size = '0', name = ''] = line.split('\t')
        return {
          name,
          type: kind === 'd' ? 'directory' : 'file',
          size: Number(size),
          isSymlink: kind === 'l',
        }
      })
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path)
      return true
    } catch (error) {
      if (error instanceof FileNotFoundError) return false
      throw error
    }
  }

  async stat(path: string): Promise<FileStat> {
    const steps = this.steps(path, 'stat')
    const found = Stat.parse(await this.ask(path, 'stat', { op: 'stat', path: steps }))
    const absolute = posix.join(this.root, ...steps)
    return {
      name: posix.basename(absolute),
      path: absolute,
      type: found.directory ? 'directory' : 'file',
      size: found.size,
      createdAt: new Date(found.born),
      modifiedAt: new Date(found.changed),
    }
  }

  copyFile(src: string, dest: string, options?: CopyOptions) {
    return this.transfer(src, dest, options, 'copy')
  }

  moveFile(src: string, dest: string, options?: CopyOptions) {
    return this.transfer(src, dest, options, 'move')
  }
}
