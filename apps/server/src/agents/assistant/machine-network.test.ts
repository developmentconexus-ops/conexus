import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEVELOPMENT_HOSTS } from '@conexus/hub-api'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { until } from '../../platform/test-until.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

test('a rede: a máquina do Assistente parte com os domínios da empresa, e remover um pela rota a fecha na hora (8, 10)', async (t) => {
  const on = await assisting(t, [
    [tool('mastra_workspace_write_file', { path: 'a.txt', content: 'um' })],
    [said('Escrevi.')],
  ])
  const domains = `/api/companies/${on.companyId}/network/domains`
  const asked = { domain: 'api.example.com', reason: 'Ler o catálogo de preços' }
  const added = await post(on.hub, on.ana, domains, asked)
  assert.equal(added.statusCode, 200, added.body)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Escreva a.txt')), 'complete')
  const { control } = on.hub.conversationMachines
  function hostsSent() {
    return control.networkApplied.map((each) => each.hosts)
  }
  assert.deepEqual(hostsSent(), [[...DEVELOPMENT_HOSTS, 'api.example.com']])
  const one = Object(added.json()).id
  const removed = await call(on.hub, on.ana, 'DELETE', `${domains}/${one}`)
  assert.equal(removed.statusCode, 204, removed.body)
  await until(() => hostsSent().length === 2, 'the running machine took the shorter list')
  assert.deepEqual(hostsSent().at(-1), DEVELOPMENT_HOSTS)
})
