import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  LEAK,
  NATIVE_RECORDINGS,
  nativeRecording,
  RECORDINGS,
  Recording,
} from './test-recordings.ts'

// Claude's four cases and Gemini's interruption and reasoning, as `record-provider.ts` names them.
const EXPECTED = [
  'anthropic-abort',
  'anthropic-cited',
  'anthropic-thinking',
  'anthropic-tool-error',
  'google-abort',
  'google-thinking',
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
// and `plan`, `files`, `tasks` and `reads`, whose model calls are streamed by the test double's Messages API stream.
const NATIVE = ['abort', 'cited', 'files', 'plan', 'reads', 'tasks', 'thinking']
const STREAMED = new Set(['plan', 'files', 'tasks', 'reads'])

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
