import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import type { AppProps, Db } from '@conexus/app-contract'
import { Manifest, versionFiles } from '@conexus/app-contract'

const ROOT = resolve(import.meta.dirname, '..')
const dir = mkdtempSync(join(tmpdir(), 'conexus-pack-'))
after(() => rmSync(dir, { recursive: true, force: true }))

function packing(out: string, ...extra: string[]) {
  return spawnSync(process.execPath, ['scripts/app-pack.ts', 'tests/apps/recados', out, ...extra], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120_000,
  })
}

function pack(name: string, ...extra: string[]) {
  const out = join(dir, name)
  const run = packing(out, ...extra)
  assert.equal(run.status, 0, run.stderr)
  return out
}

function manifestOf(folder: string) {
  return JSON.parse(readFileSync(join(ROOT, folder, 'manifest.json'), 'utf8'))
}

const one = pack('recados-1')
const two = pack('recados-2', 'tests/apps/recados/cor-2')
const defeito = pack('recados-defeito', 'tests/apps/recados-defeito')
const naoInicia = pack('recados-nao-inicia', 'tests/apps/recados-nao-inicia')
const laco = pack('recados-laco', 'tests/apps/recados-laco')

/**
 * A database double that answers Recados's statements from a list in memory, and refuses a write in
 * `query` as the read-only transaction does (decision 0045).
 */
function fakeDb(): Db {
  const recados: { id: number; texto: string }[] = []
  return {
    async query(text) {
      if (!text.startsWith('SELECT')) return { error: { code: '25006' } }
      return { rows: [...recados].reverse() }
    },
    async batch(statements) {
      const results = statements.map(({ values = [] }) => {
        const id = recados.length + 1
        recados.push({ id, texto: String(values[0]) })
        return { rows: [{ id }] }
      })
      return { results }
    },
  }
}

async function run(folder: string) {
  const worker = await import(pathToFileURL(join(folder, 'worker.js')).href)
  const props: AppProps = {
    caller: {
      personId: 'p',
      personName: 'Ana',
      projectId: 'j',
      projectName: 'Pedidos',
      access: { kind: 'BUILDER' },
    },
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
  for (const folder of [one, two, defeito, naoInicia, laco]) {
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

test('recados-defeito grava com db.query: 500 HANDLER_FAILED, e nada gravado', async () => {
  const app = await run(defeito)
  const written = await app.call('escreverRecado', { texto: 'Comprar café' })
  assert.equal(written.status, 500)
  assert.deepEqual(await written.json(), { code: 'HANDLER_FAILED' })
  assert.deepEqual(await (await app.call('listarRecados', {})).json(), [])
})

test('recados-nao-inicia lança ao carregar; recados-laco tem Travar e o resto do Recados', async () => {
  await assert.rejects(import(pathToFileURL(join(naoInicia, 'worker.js')).href), {
    message: 'Recados não inicia',
  })
  // The laco's manifest is Recados's own plus Travar's screen: a change to Recados's must reach it too.
  const manifest = manifestOf('tests/apps/recados-laco')
  assert.deepEqual(
    { ...manifest, assets: manifest.assets.filter((asset: string) => asset !== 'travar.js') },
    manifestOf('tests/apps/recados'),
  )
  const app = await run(laco)
  assert.equal((await app.call('escreverRecado', { texto: 'Comprar café' })).status, 200)
  // Travar is an operation of its Worker, refused here at its input so its loop never runs.
  assert.deepEqual(await (await app.call('travar', { a_mais: 1 })).json(), {
    code: 'INPUT_INVALID',
  })
})

test('app-pack recusa um arquivo da sobreposição que não substitui nenhum e o manifesto não nomeia', () => {
  const overlay = join(dir, 'erro-de-digitacao')
  mkdirSync(join(overlay, 'assets'), { recursive: true })
  writeFileSync(join(overlay, 'assets', 'stlye.css'), 'body {}')
  const run = packing(join(dir, 'recados-erro'), overlay)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /the folder holds .*assets\/stlye\.css/)
})
