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
  const manifest = JSON.parse(readFileSync(join(outDir, 'manifest.webmanifest'), 'utf8'))
  for (const { src } of manifest.icons) assert.ok(existsSync(join(outDir, src)), src)
  assert.ok(existsSync(join(outDir, 'apple-touch-icon.png')))
  assert.equal(manifest.background_color, '#ffffff')
  const page = readFileSync(join(outDir, 'index.html'), 'utf8')
  assert.match(page, /rel="apple-touch-icon" sizes="180x180"/)
  assert.doesNotMatch(page, /apple-mobile-web-app-(capable|status-bar-style)/)
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

type Chunk = { file: string; isEntry?: boolean; imports?: string[]; dynamicImports?: string[] }

/** The chunks the first page loads: the entry and everything it imports statically. */
function loadedFirst(manifest: Record<string, Chunk>, key: string, seen = new Set<string>()) {
  if (seen.has(key)) return seen
  seen.add(key)
  for (const next of manifest[key]?.imports ?? []) loadedFirst(manifest, next, seen)
  return seen
}

test('o Shiki só chega por import dinâmico', async (t) => {
  const outDir = mkdtempSync(join(tmpdir(), 'conexus-web-shiki-'))
  t.after(() => rmSync(outDir, { recursive: true, force: true }))
  await build({ root: import.meta.dirname, logLevel: 'silent', build: { outDir, manifest: true } })
  const manifest: Record<string, Chunk> = JSON.parse(
    readFileSync(join(outDir, '.vite', 'manifest.json'), 'utf8'),
  )
  const entry = Object.keys(manifest).find((key) => manifest[key]?.isEntry)
  assert.ok(entry, 'the build has no entry chunk')
  const first = [...loadedFirst(manifest, entry)]
  assert.deepEqual(
    first.filter((key) => /shiki/.test(key)),
    [],
  )
  assert.ok(
    Object.values(manifest).some((chunk) => chunk.dynamicImports?.some((key) => /shiki/.test(key))),
    'the Shiki is in no dynamic import',
  )
})
