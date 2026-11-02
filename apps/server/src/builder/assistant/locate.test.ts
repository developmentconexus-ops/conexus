import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { LocalFilesystem } from '@mastra/core/workspace'
import { SandboxFilesystem } from '../machine/public.ts'
import { locate } from './public.ts'

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
