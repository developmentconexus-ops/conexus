import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { build, loadConfigFromFile } from 'vite'

test('o build emite o favicon sem hash e o resto com hash', async (t) => {
  const outDir = mkdtempSync(join(tmpdir(), 'conexus-web-build-'))
  t.after(() => rmSync(outDir, { recursive: true, force: true }))
  await build({
    root: import.meta.dirname,
    logLevel: 'silent',
    build: { outDir, emptyOutDir: true },
  })
  assert.ok(existsSync(join(outDir, 'favicon.svg')))
  assert.ok(existsSync(join(outDir, 'index.html')))
  const assets = readdirSync(join(outDir, 'assets'))
  assert.ok(assets.length > 0)
  assert.deepEqual(
    assets.filter((name) => !/-[\w-]{8,}\.\w+$/.test(name)),
    [],
  )
})

test('o interruptor jitless vai no mesmo pedaço que o Zod, que roda antes do corpo da entrada', async (t) => {
  const outDir = mkdtempSync(join(tmpdir(), 'conexus-web-zod-'))
  t.after(() => rmSync(outDir, { recursive: true, force: true }))
  await build({ root: import.meta.dirname, logLevel: 'silent', build: { outDir } })
  const chunks = readdirSync(join(outDir, 'assets'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(join(outDir, 'assets', name), 'utf8'))
  const probing = chunks.filter((code) => code.includes('return Function(``),!0'))
  assert.equal(probing.length, 1)
  assert.match(probing[0] ?? '', /jitless:!0/)
})

test('a configuração usa rolldownOptions, a chave do Vite instalado, e não rollupOptions', async () => {
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    join(import.meta.dirname, 'vite.config.ts'),
  )
  assert.equal(loaded?.config.build?.rollupOptions, undefined)
  assert.notEqual(loaded?.config.build?.rolldownOptions, undefined)
})

function namesOf(plugins: unknown): string[] {
  return Array.isArray(plugins) ? plugins.flatMap(namesOf) : [String(Object(plugins).name)]
}

test('a árvore de rotas gravada é a que o plugin do roteador gera, e o plugin vem antes do React', async (t) => {
  const tree = join(import.meta.dirname, 'src', 'routeTree.gen.ts')
  const recorded = readFileSync(tree, 'utf8')
  const outDir = mkdtempSync(join(tmpdir(), 'conexus-web-tree-'))
  t.after(() => rmSync(outDir, { recursive: true, force: true }))
  await build({ root: import.meta.dirname, logLevel: 'silent', build: { outDir } })
  assert.equal(readFileSync(tree, 'utf8'), recorded)
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    join(import.meta.dirname, 'vite.config.ts'),
  )
  const names = namesOf(loaded?.config.plugins)
  assert.ok(
    names.indexOf('tanstack:router-generator') < names.indexOf('vite:react-babel'),
    names.join(),
  )
})
