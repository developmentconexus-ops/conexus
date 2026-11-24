import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { LocalFilesystem } from '@mastra/core/workspace'
import { locate, SandboxFilesystem } from './public.ts'

const run = promisify(execFile)

/** The conversation's folder on this computer, and a filesystem over it the way E2B has one: a native file API that follows links. */
function folderWith(t: TestContext, verifySymlinks = true) {
  const root = mkdtempSync(join(tmpdir(), 'conexus-locate-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const folder = join(root, 'work')
  mkdirSync(folder)
  writeFileSync(join(root, 'segredo.txt'), 'SECRET OUTSIDE')
  const native = new LocalFilesystem({ basePath: root, contained: false })
  function files() {
    return new SandboxFilesystem({
      id: 'conexus-fs-locate',
      sandbox: {
        id: 'locate',
        filesystem: native,
        executeCommand: async (command, args = []) => {
          try {
            const done = await run(command, args)
            return { exitCode: 0, stdout: done.stdout, stderr: done.stderr, success: true }
          } catch (error) {
            const failed = Object(error)
            return {
              exitCode: Number(failed.code),
              stdout: String(failed.stdout),
              stderr: String(failed.stderr),
              success: false,
            }
          }
        },
      },
      workdir: folder,
      verifySymlinks,
    })
  }
  return { root, folder, files }
}

test('locate: o caminho cai na pasta como as ferramentas de arquivo o põem — /relatorio.md é relatorio.md da pasta —, e o que sai dela é recusado (19, 20)', async (t) => {
  const on = folderWith(t)
  writeFileSync(join(on.folder, 'relatorio.md'), '# Vendas')
  const files = on.files()
  const inside = await locate(files, '/relatorio.md')
  assert.deepEqual(inside, {
    kind: 'FILE',
    path: join(on.folder, 'relatorio.md'),
    name: 'relatorio.md',
    bytes: 8,
  })
  assert.deepEqual(
    await locate(files, join(on.folder, 'relatorio.md')),
    inside,
    'the full path too',
  )
  assert.deepEqual(await locate(files, '../segredo.txt'), { kind: 'OUTSIDE' })
  assert.deepEqual(await locate(files, '/nao-existe.md'), { kind: 'NOT_FOUND' })
  assert.deepEqual(await locate(files, '.'), { kind: 'NOT_FOUND' })
})

test('locate: um link para fora é recusado pelo caminho nativo do E2B, e o link feito depois de um primeiro olhar também, numa instância nova (19)', async (t) => {
  const on = folderWith(t)
  writeFileSync(join(on.folder, 'a.md'), 'dentro')
  assert.equal((await locate(on.files(), 'a.md')).kind, 'FILE')
  rmSync(join(on.folder, 'a.md'))
  symlinkSync(join(on.root, 'segredo.txt'), join(on.folder, 'a.md'))
  // A new instance per serving has checked nothing yet: the link is seen.
  assert.deepEqual(await locate(on.files(), 'a.md'), { kind: 'OUTSIDE' })
})

test('locate: sem a conferência de links o nativo segue o link para fora — é ela que o servir liga (19)', async (t) => {
  const on = folderWith(t, false)
  symlinkSync(join(on.root, 'segredo.txt'), join(on.folder, 'a.md'))
  assert.equal((await locate(on.files(), 'a.md')).kind, 'FILE', 'the check is what refuses it')
})

test('cada operação de arquivo recusa o link para fora pelo caminho nativo, e nenhuma chega ao E2B (19)', async (t) => {
  const on = folderWith(t)
  mkdirSync(join(on.root, 'fora'))
  writeFileSync(join(on.root, 'fora', 'x.txt'), 'SECRET OUTSIDE')
  symlinkSync(join(on.root, 'segredo.txt'), join(on.folder, 'a.md'))
  symlinkSync(join(on.root, 'fora'), join(on.folder, 'pasta'))
  writeFileSync(join(on.folder, 'normal.md'), 'dentro')
  const files = on.files()
  const attempts: [string, () => Promise<unknown>][] = [
    ['readFile', () => files.readFile('a.md')],
    ['writeFile', () => files.writeFile('a.md', 'x')],
    ['appendFile', () => files.appendFile('a.md', 'x')],
    ['copyFile da origem', () => files.copyFile('a.md', 'b.md')],
    ['copyFile de dentro da pasta com link', () => files.copyFile('pasta/x.txt', 'c.md')],
    ['copyFile ao destino', () => files.copyFile('normal.md', 'pasta/y.txt')],
    ['moveFile da origem', () => files.moveFile('a.md', 'b.md')],
    ['moveFile ao destino', () => files.moveFile('normal.md', 'pasta/y.txt')],
    ['stat', () => files.stat('a.md')],
    ['readdir', () => files.readdir('pasta')],
    ['mkdir', () => files.mkdir('pasta/nova')],
    ['deleteFile', () => files.deleteFile('pasta/x.txt')],
    ['rmdir', () => files.rmdir('pasta/nova')],
  ]
  for (const [operation, attempt] of attempts) {
    await assert.rejects(attempt(), { message: /^Path escapes workspace root/ }, operation)
  }
  assert.equal(readFileSync(join(on.root, 'segredo.txt'), 'utf8'), 'SECRET OUTSIDE')
})
