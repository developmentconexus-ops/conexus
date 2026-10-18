import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
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
