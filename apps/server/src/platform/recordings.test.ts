import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { DataResult, ReadCut } from '@conexus/hub-api'
import { z } from 'zod'
import {
  LEAK,
  NATIVE_RECORDINGS,
  nativeRecording,
  RECORDINGS,
  Recording,
  toolResultsOf,
} from './test-recordings.ts'

// Claude's four cases and Gemini's interruption, reasoning and automation proposal, as `record-provider.ts` names them,
// and the ChatGPT subscription's calls of a refused write and a refused read, with the closing of the write turn only,
// as `openai-failure.eval.test.ts` records them.
const EXPECTED = [
  'anthropic-abort',
  'anthropic-cited',
  'anthropic-thinking',
  'anthropic-tool-error',
  'google-abort',
  'google-propose-automation-weekly-no-days',
  'google-propose-automation',
  'google-thinking',
  'openai-refused-read-call',
  'openai-refused-write-call',
  'openai-refused-write-closing',
]

test('cada gravação tem fornecedor, API, versão do SDK e data, e nenhum cabeçalho, token ou e-mail (T24, S40)', () => {
  const files = readdirSync(RECORDINGS)
    .filter(
      (file) => !file.endsWith('.list.json') && !file.endsWith('-models.json') && file !== 'mastra',
    )
    .sort()
  const bodies = files.filter((file) => file.endsWith('.sse')).map((file) => file.slice(0, -4))
  assert.deepEqual(bodies, EXPECTED)
  assert.deepEqual(
    files,
    bodies.flatMap((name) => [`${name}.json`, `${name}.sse`]),
  )
  for (const name of bodies) {
    const recording = Recording.parse(
      JSON.parse(readFileSync(join(RECORDINGS, `${name}.json`), 'utf8')),
    )
    assert.equal(recording.provider, name.split('-')[0])
    for (const file of [`${name}.sse`, `${name}.json`]) {
      const text = readFileSync(join(RECORDINGS, file), 'utf8')
      assert.equal(LEAK.test(text), false, `${file} carries an address or a credential`)
      assert.doesNotMatch(text, /^(authorization|x-api-key|cookie|set-cookie):/im, file)
    }
  }
})

// The native flow's scenarios, as `scripts/record.ts` names them: one per provider recording it replays,
// and `plan`, `files`, `tasks`, `reads`, `data-query`, `research`, `research-failed`, `title` and `title-observer`, whose model calls are streamed by the test double's Messages API stream.
const NATIVE = [
  'abort',
  'approval',
  'approval-declined',
  'approval-interrupted',
  'approval-refused',
  'approval-stopped',
  'cited',
  'data-query',
  'files',
  'handoff',
  'plan',
  'reads',
  'research',
  'research-failed',
  'tasks',
  'thinking',
  'title',
  'title-observer',
]
const STREAMED = new Set([
  'plan',
  'files',
  'tasks',
  'reads',
  'data-query',
  'research',
  'research-failed',
  'handoff',
  'approval',
  'approval-declined',
  'approval-interrupted',
  'approval-refused',
  'approval-stopped',
  'title',
  'title-observer',
])

test('cada gravação do fluxo nativo diz a biblioteca, a versão e a gravação do fornecedor que tocou, e não guarda endereço nem credencial (T24, S40)', () => {
  assert.deepEqual(
    readdirSync(NATIVE_RECORDINGS)
      .map((file) => file.replace(/\.jsonl$/, ''))
      .sort(),
    NATIVE,
  )
  for (const scenario of NATIVE) {
    const { header, events } = nativeRecording(scenario)
    assert.equal(header.library, '@mastra/core')
    assert.equal(
      header.source,
      STREAMED.has(scenario) ? 'test-anthropic-stream.ts' : `anthropic-${scenario}.sse`,
    )
    assert.equal(events[0]?.type, 'agent_start')
    assert.ok(events.some((event) => event.type === 'agent_end'))
    const text = readFileSync(join(NATIVE_RECORDINGS, `${scenario}.jsonl`), 'utf8')
    assert.equal(LEAK.test(text), false, `${scenario}.jsonl carries an address or a credential`)
  }
})

const Versions = z.object({ version: z.string() })
test('as gravações desta etapa são da Mastra instalada e guardam o resultado das ferramentas de dado', () => {
  const installed = Versions.parse(
    JSON.parse(
      readFileSync(
        join(import.meta.dirname, '../../../../node_modules/@mastra/core/package.json'),
        'utf8',
      ),
    ),
  ).version
  for (const scenario of ['data-query', 'reads'])
    assert.equal(nativeRecording(scenario).header.version, installed, scenario)

  const data = toolResultsOf('data-query').map(({ result }) => DataResult.parse(result))
  assert.deepEqual(
    data.map(({ kind }) => kind),
    ['CATALOG', 'TABLE', 'ROWS'],
  )
  const [, table, rows] = data
  assert.equal(table?.kind === 'TABLE' && table.origin.table, 'vendas')
  assert.equal(rows?.kind === 'ROWS' && rows.origin.length > 0, true)

  const [read] = toolResultsOf('reads')
  assert.equal(read?.tool, 'connector_read')
  assert.ok(ReadCut.parse(read.result).at, 'the recorded live read carries the time it came back')
})
