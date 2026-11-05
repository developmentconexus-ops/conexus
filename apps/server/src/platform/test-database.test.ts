import assert from 'node:assert/strict'
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { MIGRATIONS_FOLDER } from './database.ts'
import { templateNameOf } from './test-database-template.ts'
import { startHub } from './test-hub-process.ts'

function lifetime() {
  const cleanups: (() => Promise<void> | void)[] = []
  return {
    after: (cleanup: () => Promise<void> | void) => cleanups.push(cleanup),
    end: async () => {
      for (const cleanup of cleanups) await cleanup()
    },
  }
}

test('linha crua: um Hub iniciado que imprime fora do formato de registro falha o teste', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-raw-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const printsRaw = join(dir, 'prints-raw.mjs')
  writeFileSync(printsRaw, "process.stderr.write('# SERVER_ERROR: x\\n')\n")
  const hub = lifetime()
  const { exited, lines } = startHub(
    hub,
    { NODE_OPTIONS: `--import=${pathToFileURL(printsRaw)}` },
    ['migrate'],
  )
  assert.equal(await exited, 1)
  assert.equal(lines[0]?.msg, 'CONFIG_INVALID')
  await assert.rejects(hub.end(), /outside the log format/)
})

test('linha crua: um Hub iniciado que só escreve linhas de registro passa', async () => {
  const hub = lifetime()
  const { exited, lines } = startHub(hub, {}, ['migrate'])
  assert.equal(await exited, 1)
  assert.equal(lines[0]?.msg, 'CONFIG_INVALID')
  await hub.end()
})

test('linha crua: um Hub iniciado que escreve uma linha de registro com level aninhado passa', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-raw-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const printsNested = join(dir, 'prints-nested.mjs')
  const lines = [
    '{"level":30,"msg":"PROBE","err":{"level":"nested"}}',
    '{"level" : 30,"msg":"SPACED"}',
  ]
  writeFileSync(printsNested, `process.stderr.write(${JSON.stringify(`${lines.join('\n')}\n`)})\n`)
  const hub = lifetime()
  const { exited, lines: read } = startHub(
    hub,
    { NODE_OPTIONS: `--import=${pathToFileURL(printsNested)}` },
    ['migrate'],
  )
  assert.equal(await exited, 1)
  assert.equal(read[0]?.msg, 'PROBE')
  assert.equal(read[1]?.msg, 'SPACED')
  await hub.end()
})

test('modelo: uma migração mudada, acrescentada ou apagada leva a outro modelo', (t) => {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-migrations-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  cpSync(MIGRATIONS_FOLDER, folder, { recursive: true })
  const shipped = templateNameOf(folder)
  assert.equal(shipped, templateNameOf())
  assert.match(shipped, /^conexus_template_[0-9a-f]{12}$/)
  const [first] = readdirSync(folder).sort()
  assert.ok(first !== undefined)
  appendFileSync(join(folder, first, 'migration.sql'), '\n')
  const changed = templateNameOf(folder)
  mkdirSync(join(folder, '29991231235959_added'))
  writeFileSync(join(folder, '29991231235959_added', 'migration.sql'), 'select 1;\n')
  const added = templateNameOf(folder)
  rmSync(join(folder, first), { recursive: true })
  const removed = templateNameOf(folder)
  assert.equal(new Set([shipped, changed, added, removed]).size, 4)
})
