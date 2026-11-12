import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { assisting, created, said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { BR_LOCATION, toolsOf } from './model.ts'

const WHERE = { country: 'BR', timezone: 'America/Sao_Paulo', type: 'approximate' }

test('as ferramentas de web do provedor com argumentos', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const search = on.calls[0]?.declared.web_search
  const fetch = on.calls[0]?.declared.web_fetch
  assert.equal(search?.type, 'web_search_20250305')
  assert.deepEqual(search?.user_location, WHERE)
  assert.equal(fetch?.type, 'web_fetch_20250910')
  assert.deepEqual(fetch?.citations, { enabled: true })

  const openai = toolsOf(ModelId.parse('openai/gpt-5'))
  assert.equal(Object(openai.web_search).id, 'openai.web_search')
  assert.deepEqual(Object(Object(openai.web_search).args).userLocation, BR_LOCATION)
  assert.equal(typeof Object(openai.web_fetch).execute, 'function', 'the fetch is Mastra’s')

  const xai = toolsOf(ModelId.parse('xai/grok-4'))
  assert.deepEqual(Object.keys(xai).sort(), ['web_fetch', 'web_search'])
  assert.deepEqual(Object(xai.web_search), Object(toolsOf(ModelId.parse('xai/grok-3')).web_search))
})

test('o Google segue a prova', () => {
  const google = toolsOf(ModelId.parse('google/gemini-2.5-pro'))
  assert.deepEqual(
    Object.keys(google),
    ['web_fetch'],
    'the paid proof has not passed: no search, as today',
  )
})
