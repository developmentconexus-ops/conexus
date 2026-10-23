import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { LEAK, RECORDINGS, Recording } from './test-recordings.ts'

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
    .filter((file) => !file.endsWith('.list.json') && !file.endsWith('-models.json'))
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
