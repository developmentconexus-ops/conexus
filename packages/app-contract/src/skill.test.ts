import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import type { AppProps, Db } from './index.ts'
import { APP_SKILL, Manifest } from './index.ts'

function blockOf(language: string): string {
  const match = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``).exec(APP_SKILL.instructions)
  assert.ok(match?.[1], `the skill carries a ${language} example`)
  return match[1]
}

test('o exemplo de manifesto da skill passa no analisador do contrato', () => {
  const manifest = Manifest.parse(JSON.parse(blockOf('json')))
  assert.deepEqual(Object.keys(manifest.operations), ['listarRecados', 'escreverRecado'])
})

test('a skill diz o import exato de serveApp e que a máquina não roda o app', () => {
  assert.ok(APP_SKILL.instructions.includes("import { serveApp } from '@conexus/app-contract'"))
  assert.match(APP_SKILL.instructions, /no database/)
  assert.match(APP_SKILL.instructions, /do not search/)
  assert.doesNotMatch(APP_SKILL.instructions, /check them with commands/)
})

test('o exemplo de entrada da skill, com o manifesto dela, atende as duas operações', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-skill-example-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const contract = pathToFileURL(join(import.meta.dirname, 'index.ts')).href
  writeFileSync(join(dir, 'manifest.json'), blockOf('json'))
  writeFileSync(
    join(dir, 'worker.js'),
    blockOf('js').replace("'@conexus/app-contract'", JSON.stringify(contract)),
  )
  const { default: app } = await import(pathToFileURL(join(dir, 'worker.js')).href)
  const db: Db = {
    query: async () => ({ rows: [{ id: 1, texto: 'olá' }] }),
    batch: async () => ({ results: [{ rows: [{ id: 2 }] }] }),
  }
  const props: AppProps = {
    caller: { personId: 'p', personName: 'Ana', projectId: 'j', projectName: 'Pedidos' },
    db,
  }
  async function call(operation: string, body: unknown) {
    const request = new Request(`https://app.example/api/${operation}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const response = await app.fetch(request, {}, { props })
    return { status: response.status, body: await response.json() }
  }
  assert.deepEqual(await call('listarRecados', {}), {
    status: 200,
    body: [{ id: 1, texto: 'olá' }],
  })
  assert.deepEqual(await call('escreverRecado', { texto: 'oi' }), { status: 200, body: { id: 2 } })
})
