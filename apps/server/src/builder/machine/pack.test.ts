import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { VERSION_FOLDER } from '@conexus/app/check'
import { APP_LIMITS, Manifest, versionFiles } from '@conexus/app-contract'
import { PROJECT, world } from './test-machine.ts'

const MANIFEST = {
  contract: 1,
  entry: 'worker.js',
  operations: {},
  migrations: [],
  assets: ['index.html', 'assets/app.js'],
}

/** A machine whose app folder holds the version a check left; each entry is a path and its bytes. */
async function machineWith(t: TestContext, files: Readonly<Record<string, string>>) {
  const machine = await world(t)
  const version = join(machine.folder, 'app', VERSION_FOLDER)
  mkdirSync(join(version, 'assets/assets'), { recursive: true })
  for (const [path, text] of Object.entries(files)) writeFileSync(join(version, path), text)
  await machine.open()
  return { ...machine, version }
}

const VALID = {
  'manifest.json': JSON.stringify(MANIFEST),
  'worker.js': 'export default {}',
  'assets/index.html': '<!doctype html><div id="root"></div>',
  'assets/assets/app.js': 'console.log(1)',
}

test('Machines.pack: a pasta da versão passa no Manifest e leva cada arquivo com o seu tipo', async (t) => {
  const { machines } = await machineWith(t, VALID)
  const packed = await machines.pack({ projectId: PROJECT })
  assert.ok(packed.ok)
  const manifest = Manifest.parse(packed.value.manifest)
  const paths = packed.value.files.map(({ path }) => path).sort()
  assert.deepEqual(paths, versionFiles(manifest).sort())
  const page = packed.value.files.find(({ path }) => path === 'assets/index.html')
  assert.equal(page?.mediaType, 'text/html')
  assert.equal(Buffer.from(page?.base64 ?? '', 'base64').toString(), VALID['assets/index.html'])
})

test('Machines.pack: um link ou um arquivo que não é regular é NOT_REGULAR', async (t) => {
  const linked = await machineWith(t, VALID)
  symlinkSync('/etc/hostname', join(linked.version, 'assets/assets/fora.js'))
  assert.deepEqual(await linked.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'NOT_REGULAR',
  })
  const piped = await machineWith(t, VALID)
  assert.equal(spawnSync('mkfifo', [join(piped.version, 'assets/cano')]).status, 0)
  assert.deepEqual(await piped.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'NOT_REGULAR',
  })
})

test('Machines.pack: a pasta da versão trocada por um link é NOT_REGULAR', async (t) => {
  const machine = await world(t)
  const elsewhere = mkdtempSync(join(machine.folder, 'outra-'))
  writeFileSync(join(elsewhere, 'manifest.json'), VALID['manifest.json'])
  mkdirSync(join(machine.folder, 'app/node_modules/.conexus'), { recursive: true })
  symlinkSync(elsewhere, join(machine.folder, 'app', VERSION_FOLDER))
  await machine.open()
  assert.deepEqual(await machine.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'NOT_REGULAR',
  })
})

test('Machines.pack: acima de APP_LIMITS é TOO_LARGE, sem ler o resto', async (t) => {
  const many = await machineWith(t, VALID)
  for (let at = 0; at < APP_LIMITS.files; at += 1) {
    writeFileSync(join(many.version, `assets/assets/${at}.js`), '')
  }
  // Reading this file would fail; the count refuses the version before any file is read.
  writeFileSync(join(many.version, 'assets/fechado.js'), 'x')
  chmodSync(join(many.version, 'assets/fechado.js'), 0)
  assert.deepEqual(await many.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'TOO_LARGE',
  })
  const large = await machineWith(t, VALID)
  writeFileSync(join(large.version, 'assets/grande.bin'), '')
  truncateSync(join(large.version, 'assets/grande.bin'), APP_LIMITS.bytes + 1)
  writeFileSync(join(large.version, 'assets/fechado.js'), 'x')
  chmodSync(join(large.version, 'assets/fechado.js'), 0)
  assert.deepEqual(await large.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'TOO_LARGE',
  })
})

test('Machines.pack: sem versão, ou com um arquivo que o manifesto não nomeia, é VERSION_INVALID', async (t) => {
  const extra = await machineWith(t, { ...VALID, 'assets/sobra.js': '' })
  assert.deepEqual(await extra.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'VERSION_INVALID',
  })
  const none = await world(t)
  await none.open()
  assert.deepEqual(await none.machines.pack({ projectId: PROJECT }), {
    ok: false,
    error: 'VERSION_INVALID',
  })
})
