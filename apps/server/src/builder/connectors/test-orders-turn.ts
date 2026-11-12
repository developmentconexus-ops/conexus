import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import {
  linkMercadoLivre,
  mercadoLivreServed,
  testOf,
} from '../../hub/connectors/test-connections.ts'
import { STORE_A } from '../../hub/copies/test-sources.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { conversing, endOf, sent, started, streamOf } from '../conversation/test-conversation.ts'

/**
 * A conversation on Empresa Teste whose Mercado Livre is the kit's double: the store Loja A linked
 * and tested, released to the Projeto by `release`, and each turn's calls to the model kept.
 */
export async function ordersConversing(t: TestContext, answer: Anthropic['answer']) {
  const { fake, change } = await mercadoLivreServed(t)
  const calls: Sent[] = []
  const on = await conversing(
    t,
    (asked) => {
      if (asked.stream) calls.push(asked)
      return answer(asked)
    },
    change,
  )
  fake.switches.account = STORE_A
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId, {
    connector: 'mercado-livre',
    name: 'Loja A',
  })
  assert.equal(Object(linked.json()).result, 'LINKED', linked.body)
  const connectionId = String(Object(linked.json()).connection.id)
  const base = `/api/companies/${on.companyId}/connections`
  const tested = await testOf(on.hub, on.ana, base, connectionId)
  assert.equal(Object(tested.json()).connection?.state, 'ACTIVE', tested.body)
  async function release() {
    const url = `/api/companies/${on.companyId}/projects/${on.projectId}/connections/${connectionId}`
    assert.equal((await call(on.hub, on.ana, 'PUT', url)).statusCode, 200)
  }
  /** One turn of a new conversation: the calls it made to the model, and the conversation's url. */
  async function turn(text: string) {
    const before = calls.length
    const url = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
    const stream = await streamOf(on.hub, on.ana, url)
    const events = stream.turn()
    assert.equal((await sent(on.hub, on.ana, url, text)).statusCode, 200)
    assert.equal(endOf(await events), 'complete')
    await stream.close()
    return { calls: calls.slice(before), url }
  }
  return { ...on, fake, connectionId, release, turn }
}
