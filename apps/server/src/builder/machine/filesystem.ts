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
  IsDirectoryError,
  PermissionError,
} from '@mastra/core/workspace'

/** How bytes cross to the machine, which the shell cannot carry safely: the provider's own upload. */
export type Transport = {
  write(path: string, bytes: Uint8Array): Promise<void>
  read(path: string): Promise<Buffer>
}
export type Exec = (script: string) => Promise<{ exitCode: number; stdout: string; stderr: string }>

const OUTSIDE = 77
const IS_DIRECTORY = 78
const MISSING = 79
const EXISTS = 80
const NOT_EMPTY = 81

function quoted(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

/**
 * The file tools' filesystem over the machine (decision 0051, Z2): the 11 operations the tools need,
 * each one shell call, every path held inside `root` by its real path, so a link out of the app
 * folder opens nothing (security S2, card criterion 19).
 */
export class MachineFilesystem implements WorkspaceFilesystem {
  readonly name = 'MachineFilesystem'
  readonly provider = 'conexus-machine'
  readonly status = 'ready'

  readonly id: string
  private readonly root: string
  private readonly exec: Exec
  private readonly transport: Transport

  constructor(input: { id: string; root: string; exec: Exec; transport: Transport }) {
    this.id = input.id
    this.root = input.root
    this.exec = input.exec
    this.transport = input.transport
  }

  private place(path: string, operation: string): string {
    const absolute = posix.resolve(this.root, path)
    if (absolute !== this.root && !absolute.startsWith(`${this.root}/`))
      throw new PermissionError(path, operation)
    return absolute
  }

  /** Runs `body` once `absolute`'s real path is known to lie inside the root; maps the exit codes. */
  private async inside(absolute: string, path: string, operation: string, body: string) {
    const guard = `real=$(realpath -m -- ${quoted(absolute)}) && case "$real" in ${quoted(this.root)}|${quoted(this.root)}/*) ;; *) exit ${OUTSIDE};; esac`
    const result = await this.exec(`${guard}\n${body}`)
    if (result.exitCode === OUTSIDE) throw new PermissionError(path, operation)
    if (result.exitCode === IS_DIRECTORY) throw new IsDirectoryError(path)
    if (result.exitCode === MISSING) throw new FileNotFoundError(path)
    if (result.exitCode === EXISTS) throw new FileExistsError(path)
    if (result.exitCode === NOT_EMPTY) throw new DirectoryNotEmptyError(path)
    if (result.exitCode !== 0) throw new Error(`${operation} ${path}: ${result.stderr.trim()}`)
    return result.stdout
  }

  async readFile(path: string, options?: ReadOptions): Promise<string | Buffer> {
    const absolute = this.place(path, 'read')
    const target = quoted(absolute)
    await this.inside(
      absolute,
      path,
      'read',
      `[ -d ${target} ] && exit ${IS_DIRECTORY}; [ -e ${target} ] || exit ${MISSING}`,
    )
    const bytes = await this.transport.read(absolute)
    return options?.encoding ? bytes.toString(options.encoding) : bytes
  }

  async writeFile(path: string, content: FileContent, options?: WriteOptions) {
    const absolute = this.place(path, 'write')
    const target = quoted(absolute)
    const parent =
      options?.recursive === false ? '' : `mkdir -p ${quoted(posix.dirname(absolute))}; `
    const exclusive = options?.overwrite === false ? `[ -e ${target} ] && exit ${EXISTS}; ` : ''
    await this.inside(
      absolute,
      path,
      'write',
      `[ -d ${target} ] && exit ${IS_DIRECTORY}; ${exclusive}${parent}true`,
    )
    await this.transport.write(
      absolute,
      typeof content === 'string' ? Buffer.from(content) : content,
    )
  }

  async appendFile(path: string, content: FileContent) {
    const before = (await this.exists(path)) ? await this.readFile(path) : Buffer.alloc(0)
    await this.writeFile(path, Buffer.concat([Buffer.from(before), Buffer.from(content)]))
  }

  async deleteFile(path: string, options?: RemoveOptions) {
    const absolute = this.place(path, 'delete')
    const target = quoted(absolute)
    const force = options?.force
      ? 'true'
      : `[ -e ${target} ] || [ -L ${target} ] || exit ${MISSING}`
    await this.inside(
      posix.dirname(absolute),
      path,
      'delete',
      `[ -d ${target} ] && [ ! -L ${target} ] && exit ${IS_DIRECTORY}; ${force}; rm -f -- ${target}`,
    )
  }

  private async transfer(
    src: string,
    dest: string,
    options: CopyOptions | undefined,
    verb: 'cp' | 'mv',
  ) {
    const [from, to] = [this.place(src, verb), this.place(dest, verb)]
    const [source, target] = [quoted(from), quoted(to)]
    const flag = verb === 'cp' && options?.recursive ? '-R' : ''
    const clobber = options?.overwrite === false ? `[ -e ${target} ] && exit ${EXISTS}; ` : ''
    await this.inside(
      to,
      dest,
      verb,
      `real=$(realpath -m -- ${source}); case "$real" in ${quoted(this.root)}/*) ;; *) exit ${OUTSIDE};; esac; [ -e ${source} ] || exit ${MISSING}; ${clobber}mkdir -p ${quoted(posix.dirname(to))}; ${verb} ${flag} -- ${source} ${target}`,
    )
  }

  async mkdir(path: string, options?: { recursive?: boolean }) {
    const absolute = this.place(path, 'mkdir')
    await this.inside(
      absolute,
      path,
      'mkdir',
      `mkdir ${options?.recursive === false ? '' : '-p'} -- ${quoted(absolute)}`,
    )
  }

  async rmdir(path: string, options?: RemoveOptions) {
    const absolute = this.place(path, 'rmdir')
    const target = quoted(absolute)
    const remove = options?.recursive
      ? `rm -rf -- ${target}`
      : `[ -z "$(ls -A -- ${target})" ] || exit ${NOT_EMPTY}; rmdir -- ${target}`
    await this.inside(absolute, path, 'rmdir', `[ -d ${target} ] || exit ${MISSING}; ${remove}`)
  }

  async readdir(path: string, options?: ListOptions): Promise<FileEntry[]> {
    const absolute = this.place(path, 'readdir')
    const depth = options?.recursive ? (options.maxDepth ?? 8) : 1
    const listed = await this.inside(
      absolute,
      path,
      'readdir',
      `[ -d ${quoted(absolute)} ] || exit ${MISSING}; cd ${quoted(absolute)} && find . -mindepth 1 -maxdepth ${depth} -printf '%y\\t%s\\t%P\\n'`,
    )
    return listed
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
    const absolute = this.place(path, 'exists')
    try {
      await this.inside(absolute, path, 'exists', `[ -e ${quoted(absolute)} ] || exit ${MISSING}`)
      return true
    } catch (error) {
      if (error instanceof FileNotFoundError) return false
      throw error
    }
  }

  async stat(path: string): Promise<FileStat> {
    const absolute = this.place(path, 'stat')
    const out = await this.inside(
      absolute,
      path,
      'stat',
      `[ -e ${quoted(absolute)} ] || exit ${MISSING}; stat -c '%F|%s|%W|%Y' -- ${quoted(absolute)}`,
    )
    const [kind = '', size = '0', born = '0', changed = '0'] = out.trim().split('|')
    return {
      name: posix.basename(absolute),
      path: absolute,
      type: kind === 'directory' ? 'directory' : 'file',
      size: Number(size),
      createdAt: new Date(Number(born) * 1000),
      modifiedAt: new Date(Number(changed) * 1000),
    }
  }

  copyFile(src: string, dest: string, options?: CopyOptions) {
    return this.transfer(src, dest, options, 'cp')
  }

  moveFile(src: string, dest: string, options?: CopyOptions) {
    return this.transfer(src, dest, options, 'mv')
  }
}
