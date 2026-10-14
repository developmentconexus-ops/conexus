import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { build } from 'vite'

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
