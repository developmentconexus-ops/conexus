import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { z } from 'zod'
import { LEAK, RECORDINGS, Recording } from '../../platform/test-recordings.ts'
import { AnthropicPage, GooglePage, OpenAiList } from './public.ts'

const LISTS = new Map<string, z.ZodType>([
  ['anthropic', AnthropicPage],
  ['openai', OpenAiList],
  ['google', GooglePage],
])

test('cada lista de modelos gravada é lida pelo esquema que o Hub usa, e não guarda e-mail nem credencial (T24, S40)', () => {
  const lists = readdirSync(RECORDINGS).filter((file) => file.endsWith('.list.json'))
  for (const file of lists) {
    const name = file.slice(0, -'.list.json'.length)
    const text = readFileSync(join(RECORDINGS, file), 'utf8')
    assert.equal(LEAK.test(text), false, `${file} carries an address or a credential`)
    const schema = LISTS.get(
      name.startsWith('google-cliproxy') ? 'openai' : (name.split('-')[0] ?? ''),
    )
    assert.ok(schema, `${file} names a provider with no reader`)
    schema.parse(JSON.parse(text))
    Recording.parse(JSON.parse(readFileSync(join(RECORDINGS, `${name}.json`), 'utf8')))
  }
})
