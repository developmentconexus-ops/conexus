import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { answerUrl, ask, conversingWith, untilCard } from './test-questions.ts'

const LIBRARY = {
  question: 'Preciso do calendário das entregas.',
  library: { name: 'react-big-calendar', version: '1.19.4' },
}

test('biblioteca: Permitir grava {nome, versão} no Projeto; Não não grava nada; uma pré-aprovada é recusada ao modelo', async (t) => {
  const { hub, ana, url, stream, send, projectId } = await conversingWith(t, [
    [ask(LIBRARY)],
    [ask({ question: 'Posso usar o react?', library: { name: 'react', version: '19.2.8' } })],
    [ask(LIBRARY)],
  ])
  function grants() {
    return hub.test.asOwner('select project_id, name, version from builder.package_grant')
  }
  assert.equal((await send()).statusCode, 202)
  const first = await untilCard(stream, 'question')
  assert.deepEqual(
    first.card.type === 'question' && first.card.questions.map((each) => each.kind),
    ['library'],
  )
  const deny = { kind: 'answers', answers: ['Não, faça sem ela'] }
  assert.equal((await post(hub, ana, answerUrl(url, first.card.toolCallId), deny)).statusCode, 202)
  const second = await untilCard(stream, 'question')
  assert.deepEqual(await grants(), [])
  const allow = { kind: 'answers', answers: ['Permitir'] }
  assert.equal(
    (await post(hub, ana, answerUrl(url, second.card.toolCallId), allow)).statusCode,
    202,
  )
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(await grants(), [
    { project_id: projectId, name: 'react-big-calendar', version: '1.19.4' },
  ])
})
