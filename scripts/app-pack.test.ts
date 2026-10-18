import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import type { AppProps, Db } from '@conexus/app-contract'
import { Manifest, versionFiles } from '@conexus/app-contract'

const ROOT = resolve(import.meta.dirname, '..')
const dir = mkdtempSync(join(tmpdir(), 'conexus-pack-'))
after(() => rmSync(dir, { recursive: true, force: true }))

function pack(name: string, ...extra: string[]) {
  const out = join(dir, name)
  const run = spawnSync(
    process.execPath,
    ['scripts/app-pack.ts', 'tests/apps/recados', out, ...extra],
    { cwd: ROOT, encoding: 'utf8', timeout: 120_000 },
  )
  assert.equal(run.status, 0, run.stderr)
  return out
}

const one = pack('recados-1')
const two = pack('recados-2', 'tests/apps/recados/cor-2')

/** A database double that answers Recados's two statements from a list in memory. */
function fakeDb(): Db {
  const recados: { id: number; texto: string }[] = []
  return {
    async query(text, values = []) {
      if (text.startsWith('INSERT')) {
        const id = recados.length + 1
        recados.push({ id, texto: String(values[0]) })
        return { rows: [{ id }] }
      }
      return { rows: [...recados].reverse() }
    },
    async batch() {
      return { error: { code: '0A000' } }
    },
  }
}

async function run(folder: string) {
  const worker = await import(pathToFileURL(join(folder, 'worker.js')).href)
  const props: AppProps = {
    caller: { personId: 'p', personName: 'Ana', projectId: 'j', projectName: 'Pedidos' },
    db: fakeDb(),
  }
  function call(operation: string, input: unknown): Promise<Response> {
    return worker.default.fetch(
      new Request(`https://app.example/api/${operation}`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
      {},
      { props },
    )
  }
  return { call }
}

test('app:pack monta a pasta que o manifesto diz, e nada mais', () => {
  for (const folder of [one, two]) {
    const manifest = Manifest.parse(JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8')))
    for (const path of versionFiles(manifest))
      assert.ok(readFileSync(join(folder, path)).length > 0)
  }
})

test('recados-2 muda só a cor', () => {
  function style(folder: string) {
    return readFileSync(join(folder, 'assets/style.css'), 'utf8')
  }
  assert.match(style(one), /--cor: #0b6e4f/)
  assert.match(style(two), /--cor: #6b2fa3/)
  assert.equal(style(one).replace('#0b6e4f', ''), style(two).replace('#6b2fa3', ''))
  for (const path of ['manifest.json', 'worker.js', 'assets/index.html', 'assets/recados.js']) {
    assert.deepEqual(readFileSync(join(one, path)), readFileSync(join(two, path)), path)
  }
})

test('o Worker montado escreve e lista recados com um db falso', async () => {
  const app = await run(one)
  const written = await app.call('escreverRecado', { texto: 'Comprar café' })
  assert.equal(written.status, 200)
  assert.deepEqual(await written.json(), { id: 1 })
  const listed = await app.call('listarRecados', {})
  assert.deepEqual(await listed.json(), [{ id: 1, texto: 'Comprar café' }])
  assert.equal((await app.call('escreverRecado', { texto: '' })).status, 400)
})
