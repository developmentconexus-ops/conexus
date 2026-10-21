/** A path below the app folder, one name per step; no steps is the folder itself. */
type Steps = string[]

/** One file operation, as the Hub sends it to the machine. */
export type Operation =
  | { op: 'read'; path: Steps }
  | { op: 'stat'; path: Steps }
  | { op: 'list'; path: Steps; depth: number }
  | { op: 'delete'; path: Steps; force: boolean }
  | { op: 'mkdir'; path: Steps; recursive: boolean }
  | { op: 'rmdir'; path: Steps; recursive: boolean }
  | {
      op: 'put'
      path: Steps
      /** The bytes of this piece, as base64. */
      data: string
      staging: string
      first: boolean
      last: boolean
      parents: boolean
      exclusive: boolean
    }
  | {
      op: 'copy' | 'move'
      path: Steps
      to: Steps
      staging: string
      recursive: boolean
      overwrite: boolean
    }

type Request = Operation & { root: string; max: number }
type On<K extends Operation['op']> = Extract<Request, { op: K }>
type Fs = typeof import('node:fs')

function at(dir: number, name: string): string {
  return `/proc/self/fd/${dir}/${name}`
}

function fail(code: string): Error {
  return Object.assign(new Error(code), { code })
}

/** The folder at `steps` below the root, each step opened from the last without following a link. */
function folder(fs: Fs, root: string, steps: Steps, make: boolean): number {
  const { O_RDONLY, O_DIRECTORY, O_NOFOLLOW } = fs.constants
  let dir = fs.openSync(root, O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
  for (const step of steps) {
    if (step === '' || step === '.' || step === '..' || step.includes('/')) throw fail('OUTSIDE')
    if (make && fs.lstatSync(at(dir, step), { throwIfNoEntry: false }) === undefined) {
      fs.mkdirSync(at(dir, step))
    }
    let next: number
    try {
      next = fs.openSync(at(dir, step), O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
    } catch (error) {
      if (fs.lstatSync(at(dir, step), { throwIfNoEntry: false })?.isSymbolicLink()) {
        throw fail('OUTSIDE')
      }
      throw error
    }
    fs.closeSync(dir)
    dir = next
  }
  return dir
}

/** The last step of a path, and the folder that holds it. */
function parentOf(fs: Fs, request: Request, steps: Steps, make = false): [number, string] {
  const name = steps.at(-1)
  if (name === undefined) throw fail('OUTSIDE')
  return [folder(fs, request.root, steps.slice(0, -1), make), name]
}

/** What `name` is in `dir`, refusing a link. */
function entry(fs: Fs, dir: number, name: string) {
  const found = fs.lstatSync(at(dir, name), { throwIfNoEntry: false })
  if (found?.isSymbolicLink()) throw fail('OUTSIDE')
  return found
}

function readOp(fs: Fs, request: On<'read'>): string {
  const { O_RDONLY, O_NOFOLLOW, O_NONBLOCK } = fs.constants
  const [dir, name] = parentOf(fs, request, request.path)
  const file = fs.openSync(at(dir, name), O_RDONLY | O_NOFOLLOW | O_NONBLOCK)
  const found = fs.fstatSync(file)
  if (found.isDirectory()) throw fail('EISDIR')
  if (!found.isFile()) throw fail('EINVAL')
  if (found.size > request.max) throw fail('TOO_LARGE')
  const bytes = Buffer.alloc(found.size)
  let length = 0
  while (length < bytes.byteLength) {
    const read = fs.readSync(file, bytes, length, bytes.byteLength - length, length)
    if (read === 0) break
    length += read
  }
  return bytes.subarray(0, length).toString('base64')
}

function statOp(fs: Fs, request: On<'stat'>) {
  const name = request.path.at(-1)
  const dir = folder(fs, request.root, request.path.slice(0, -1), false)
  const found = name === undefined ? fs.fstatSync(dir) : entry(fs, dir, name)
  if (found === undefined) throw fail('ENOENT')
  return {
    directory: found.isDirectory(),
    size: found.size,
    born: found.birthtimeMs,
    changed: found.mtimeMs,
  }
}

/** Runs `command` inside the folder `dir` holds open, so no path of it passes a link above. */
function within(dir: number, command: string, args: string[], maxBuffer: number): string {
  process.chdir(`/proc/self/fd/${dir}`)
  const done = process.getBuiltinModule('node:child_process').spawnSync(command, args, {
    maxBuffer,
  })
  if (done.error !== undefined) throw done.error
  if (done.status !== 0) throw new Error(done.stderr.toString())
  return done.stdout.toString()
}

function listOp(fs: Fs, request: On<'list'>): string {
  const dir = folder(fs, request.root, request.path, false)
  const format = ['-printf', '%y\\t%s\\t%P\\n']
  return within(
    dir,
    'find',
    ['.', '-mindepth', '1', '-maxdepth', String(request.depth), ...format],
    request.max,
  )
}

function deleteOp(fs: Fs, request: On<'delete'>): boolean {
  const [dir, name] = parentOf(fs, request, request.path)
  const found = fs.lstatSync(at(dir, name), { throwIfNoEntry: false })
  if (found === undefined) {
    if (request.force) return true
    throw fail('ENOENT')
  }
  if (found.isDirectory()) throw fail('EISDIR')
  fs.unlinkSync(at(dir, name))
  return true
}

function mkdirOp(fs: Fs, request: On<'mkdir'>): boolean {
  if (request.recursive) {
    folder(fs, request.root, request.path, true)
    return true
  }
  const [dir, name] = parentOf(fs, request, request.path)
  fs.mkdirSync(at(dir, name))
  return true
}

function rmdirOp(fs: Fs, request: On<'rmdir'>): boolean {
  const [dir, name] = parentOf(fs, request, request.path)
  if (!fs.lstatSync(at(dir, name), { throwIfNoEntry: false })?.isDirectory()) throw fail('ENOENT')
  if (request.recursive) within(dir, 'rm', ['-rf', '--', name], request.max)
  else fs.rmdirSync(at(dir, name))
  return true
}

/**
 * One piece of a write, into a staging file beside the target that only this write creates; the
 * last piece renames it over the target, which replaces a link there instead of following it.
 */
function putOp(fs: Fs, request: On<'put'>): boolean {
  const { O_WRONLY, O_APPEND, O_CREAT, O_EXCL, O_NOFOLLOW } = fs.constants
  const [dir, name] = parentOf(fs, request, request.path, request.first && request.parents)
  const staging = at(dir, request.staging)
  try {
    const found = request.first ? entry(fs, dir, name) : undefined
    if (found?.isDirectory()) throw fail('EISDIR')
    if (found !== undefined && request.exclusive) throw fail('EEXIST')
    const flags = request.first ? O_CREAT | O_EXCL : O_APPEND
    const file = fs.openSync(staging, O_WRONLY | O_NOFOLLOW | flags)
    if (found?.isFile()) fs.fchmodSync(file, found.mode & 0o7777)
    fs.writeFileSync(file, Buffer.from(request.data, 'base64'))
    fs.closeSync(file)
    if (!request.last) return true
    if (request.exclusive) {
      fs.linkSync(staging, at(dir, name))
      fs.unlinkSync(staging)
    } else {
      fs.renameSync(staging, at(dir, name))
    }
    return true
  } catch (error) {
    fs.rmSync(staging, { force: true })
    throw error
  }
}

/** `source`'s tree into the new folder `target`, links copied as links. */
function copyTree(fs: Fs, source: number, target: number) {
  const { O_RDONLY, O_DIRECTORY, O_NOFOLLOW, O_NONBLOCK } = fs.constants
  for (const item of fs.readdirSync(`/proc/self/fd/${source}`, { withFileTypes: true })) {
    if (item.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(at(source, item.name)), at(target, item.name))
    } else if (item.isDirectory()) {
      fs.mkdirSync(at(target, item.name))
      copyTree(
        fs,
        fs.openSync(at(source, item.name), O_RDONLY | O_DIRECTORY | O_NOFOLLOW),
        fs.openSync(at(target, item.name), O_RDONLY | O_DIRECTORY | O_NOFOLLOW),
      )
    } else if (item.isFile()) {
      const file = fs.openSync(at(source, item.name), O_RDONLY | O_NOFOLLOW | O_NONBLOCK)
      fs.copyFileSync(`/proc/self/fd/${file}`, at(target, item.name), fs.constants.COPYFILE_EXCL)
    }
  }
}

function transferOp(fs: Fs, request: On<'copy' | 'move'>): boolean {
  const { O_RDONLY, O_DIRECTORY, O_NOFOLLOW, O_NONBLOCK, COPYFILE_EXCL } = fs.constants
  const [from, name] = parentOf(fs, request, request.path)
  const found = entry(fs, from, name)
  if (found === undefined) throw fail('ENOENT')
  if (found.isDirectory() && request.op === 'copy' && !request.recursive) throw fail('EISDIR')
  const [into, target] = parentOf(fs, request, request.to, true)
  if (entry(fs, into, target) !== undefined && !request.overwrite) throw fail('EEXIST')
  if (request.op === 'move') {
    fs.renameSync(at(from, name), at(into, target))
    return true
  }
  const staging = at(into, request.staging)
  try {
    if (found.isDirectory()) {
      fs.mkdirSync(staging)
      const source = fs.openSync(at(from, name), O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
      copyTree(fs, source, fs.openSync(staging, O_RDONLY | O_DIRECTORY | O_NOFOLLOW))
    } else {
      const file = fs.openSync(at(from, name), O_RDONLY | O_NOFOLLOW | O_NONBLOCK)
      fs.copyFileSync(`/proc/self/fd/${file}`, staging, COPYFILE_EXCL)
    }
    fs.renameSync(staging, at(into, target))
    return true
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true })
    throw error
  }
}

function main(): void {
  const fs = process.getBuiltinModule('node:fs')
  // biome-ignore lint/plugin: filesystem.ts wrote this request from paths it already held inside the root, and the machine has no Zod; folder() still refuses a step that is not one name (C27)
  const request: Request = JSON.parse(process.argv[1] ?? '')
  let reply: { ok: unknown } | { error: string; message: string }
  try {
    if (request.op === 'read') reply = { ok: readOp(fs, request) }
    else if (request.op === 'stat') reply = { ok: statOp(fs, request) }
    else if (request.op === 'list') reply = { ok: listOp(fs, request) }
    else if (request.op === 'delete') reply = { ok: deleteOp(fs, request) }
    else if (request.op === 'mkdir') reply = { ok: mkdirOp(fs, request) }
    else if (request.op === 'rmdir') reply = { ok: rmdirOp(fs, request) }
    else if (request.op === 'put') reply = { ok: putOp(fs, request) }
    else reply = { ok: transferOp(fs, request) }
  } catch (error) {
    const code = error instanceof Error ? Reflect.get(error, 'code') : undefined
    const message = error instanceof Error ? error.message : String(error)
    reply = { error: typeof code === 'string' ? code : 'FAILED', message }
  }
  process.stdout.write(JSON.stringify(reply))
}

/**
 * The program the machine runs, as `node -e` with one request as its argument, printing `{ ok }` or
 * `{ error }` (an errno code, `OUTSIDE` or `TOO_LARGE`). Every step of a path is opened once,
 * without following a link, from the folder the step before opened (through `/proc/self/fd`), and
 * the operation acts on what was opened: a link swapped in at any moment is refused or replaced,
 * never followed, for the check is the use (security S2, card criterion 19). Its functions refer
 * to nothing but each other and Node's own modules.
 */
export const PROGRAM = `${[
  ...[at, fail, folder, parentOf, entry, readOp, statOp, within, listOp, deleteOp, mkdirOp],
  ...[rmdirOp, putOp, copyTree, transferOp, main],
].join('\n')}\nmain()`
