import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf } from '../conversation/test-conversation.ts'
import { dataOf } from '../conversation/test-parts.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

test('a sala do Assistente diz "Ligando a máquina": a primeira ferramenta de arquivo do turno conta a partida na conversa, como no Builder; um turno sem máquina não conta nada (QA F1)', async (t) => {
  const on = await assisting(t, [
    [tool('mastra_workspace_write_file', { path: 'a.csv', content: 'a;b' })],
    [said('Escrevi.')],
    [said('Oi.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  const writing = await say('Escreva a.csv')
  assert.equal(endOf(writing), 'complete')
  assert.deepEqual(dataOf(writing, 'data-conexus-machine'), [{ phase: 'starting' }])
  const talkingOnly = await say('Oi')
  assert.equal(endOf(talkingOnly), 'complete')
  assert.deepEqual(dataOf(talkingOnly, 'data-conexus-machine'), [])
})
