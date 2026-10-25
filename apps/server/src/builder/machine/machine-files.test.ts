import assert from 'node:assert/strict'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { STARTER_DIR } from '@conexus/app/starter'
import { CONVERSATION, sandboxOf, world } from './test-machine.ts'

const starter = new Set(readdirSync(STARTER_DIR))

test('máquina: ../fora.ts e um link para fora do app não abrem nem escrevem nada', async (t) => {
  const { open, folder } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs)
  await fs.writeFile('dentro.ts', 'ok\n')
  await (await sandboxOf(workspace)).executeCommand('sh', [
    '-c',
    `ln -s ${folder} ${join(folder, 'app', 'saida')}`,
  ])
  for (const path of ['../fora.ts', '/etc/passwd', 'saida/fora.ts', 'saida']) {
    await assert.rejects(
      fs.writeFile(path, 'x'),
      (e: unknown) => e instanceof Error && e.name === 'PermissionError',
      path,
    )
    await assert.rejects(
      fs.readFile(path),
      (e: unknown) => e instanceof Error && e.name === 'PermissionError',
      path,
    )
  }
  const refused = [
    () => fs.stat('saida/x'),
    () => fs.exists('saida'),
    () => fs.readdir('saida'),
    () => fs.mkdir('saida/novo'),
    () => fs.deleteFile('saida/x'),
    () => fs.copyFile('dentro.ts', 'saida/c.ts'),
    () => fs.moveFile('dentro.ts', 'saida/m.ts'),
    () => fs.copyFile('saida', 'copia', { recursive: true }),
  ]
  for (const [index, operation] of refused.entries()) {
    await assert.rejects(
      operation(),
      (e: unknown) => e instanceof Error && e.name === 'PermissionError',
      String(index),
    )
  }
  assert.deepEqual(readdirSync(folder).sort(), ['app', 'git'])
  assert.equal(await fs.readFile('dentro.ts', { encoding: 'utf8' }), 'ok\n')
})

test('máquina: as operações das ferramentas fazem o que dizem dentro do app, e um arquivo grande cruza em pedaços', async (t) => {
  const { open } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs)
  const big = Buffer.alloc(200 * 1024, 'abc')
  await fs.writeFile('src/grande.txt', big)
  assert.deepEqual(await fs.readFile('src/grande.txt'), big)
  await fs.appendFile('src/a.ts', 'um\n')
  await fs.appendFile('src/a.ts', 'dois\n')
  assert.equal(await fs.readFile('src/a.ts', { encoding: 'utf8' }), 'um\ndois\n')
  await assert.rejects(fs.writeFile('src/a.ts', 'x', { overwrite: false }), {
    name: 'FileExistsError',
  })
  await assert.rejects(fs.writeFile('src', 'x'), { name: 'IsDirectoryError' })
  await fs.copyFile('src', 'copia', { recursive: true })
  await fs.moveFile('copia/a.ts', 'b.ts')
  assert.equal((await fs.stat('b.ts')).size, 8)
  assert.equal((await fs.stat('copia')).type, 'directory')
  assert.deepEqual(
    (await fs.readdir('copia'))
      .filter((entry) => entry.name === 'grande.txt')
      .map((entry) => [entry.name, entry.type]),
    [['grande.txt', 'file']],
  )
  await assert.rejects(fs.rmdir('copia'), { name: 'DirectoryNotEmptyError' })
  await fs.rmdir('copia', { recursive: true })
  await fs.mkdir('vazia/dentro')
  await fs.deleteFile('b.ts')
  assert.deepEqual(
    await Promise.all(['copia', 'b.ts', 'vazia/dentro'].map((path) => fs.exists(path))),
    [false, false, true],
  )
  await assert.rejects(fs.readFile('nada.ts'), { name: 'FileNotFoundError' })
  const listed = (await fs.readdir('.'))
    .map((entry) => entry.name)
    .filter((name) => name !== '.git' && (name === 'src' || !starter.has(name)))
  assert.deepEqual(listed.sort(), ['src', 'vazia'])
})

test('máquina: uma pasta trocada por um link para fora entre dois passos do Hub não leva a escrita nem a leitura para fora', async (t) => {
  const { open, folder, control } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs)
  await fs.writeFile('d/a.ts', 'um\n')
  const outside = join(folder, 'fora')
  mkdirSync(outside)
  writeFileSync(join(outside, 'a.ts'), 'segredo\n')
  const inside = join(folder, 'app', 'd')
  let swaps = 0
  control.afterCommand = () => {
    if (swaps > 0) return
    swaps += 1
    renameSync(inside, `${inside}.x`)
    symlinkSync(outside, inside)
  }
  function restore() {
    rmSync(inside, { force: true })
    renameSync(`${inside}.x`, inside)
    swaps = 0
  }
  await fs.writeFile('d/a.ts', 'dois\n')
  restore()
  assert.equal(readFileSync(join(outside, 'a.ts'), 'utf8'), 'segredo\n')
  assert.equal(readFileSync(join(inside, 'a.ts'), 'utf8'), 'dois\n')
  const read = await fs.readFile('d/a.ts', { encoding: 'utf8' })
  restore()
  assert.equal(read, 'dois\n')
})

test('máquina: um arquivo maior que 64 MiB não entra no Hub, nem pelas ferramentas nem pelo pacote do turno', async (t) => {
  const { open, folder, machines, base, control } = await world(t)
  const workspace = await open()
  const fs = workspace.filesystem
  assert.ok(fs)
  await fs.writeFile('a.ts', 'um\n')
  const big = join(folder, 'app', 'grande.bin')
  writeFileSync(big, '')
  truncateSync(big, 65 * 1024 * 1024)
  await assert.rejects(
    fs.readFile('grande.bin'),
    (e: unknown) => e instanceof Error && Reflect.get(e, 'code') === 'EFBIG',
  )
  rmSync(big)
  control.beforeRead = (path) => truncateSync(path, 65 * 1024 * 1024)
  const collected = await machines.collect({ conversationId: CONVERSATION, base })
  assert.equal(typeof collected === 'object' ? 'a bundle' : collected, 'too-large')
})
