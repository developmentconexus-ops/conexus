import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Reply } from '../../platform/test-anthropic.ts'
import type { Sent } from '../../platform/test-anthropic-body.ts'
import type { StreamEvent } from '../conversation/test-conversation.ts'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { madeTool, ordersOf } from './test-agents.ts'
import {
  ASKED,
  answer,
  approvalsIn,
  approving,
  askedOf,
  untilAsked,
  WRITE,
} from './test-approval.ts'

const CONVERSATIONS = 20
const ROUNDS = 10
const READ = 'tool_pedidos_matriz'
const ALONE = 'tool_lancar_sozinho'
const ROUND = 'rodada '

/**
 * The model of every conversation at once, each by its own history: after the person's message a
 * read, after the read the write that runs alone, after it the one that asks, then the text.
 */
function rounds(asked: Sent): Reply {
  if (!asked.stream) return { kind: 'text', text: 'Título' }
  const last = asked.toolUses.at(-1)?.name
  if (asked.texts.at(-1)?.startsWith(ROUND)) {
    return { kind: 'blocks', blocks: [tool(READ, { page: 1 })] }
  }
  if (last === READ) return { kind: 'blocks', blocks: [tool(ALONE, ASKED)] }
  if (last === ALONE) return { kind: 'blocks', blocks: [tool(WRITE, ASKED)] }
  return { kind: 'text', text: 'Feito.' }
}

test('a carga: 20 conversas ao mesmo tempo no PostgresStore, 10 rodadas, cada uma com uma leitura, uma escrita em Faz sozinho e uma em Pergunta antes respondida 1,5 s depois do cartão; as 600 chamadas terminam, cada escrita uma vez, nenhuma retomada perdida (11)', {
  timeout: 600_000,
}, async (t) => {
  const on = await approving(t, rounds)
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const alone = await madeTool(on.hub, on.ana, on.tools, {
    slug: 'lancar_sozinho',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1 sem perguntar.',
    bound: { notaModelo: 12 },
    open: ['codigoCliente', 'itens'],
  })
  const agent = await on.writer(
    'ASK',
    { approvals: { [on.write.id]: 'ASK', [alone.id]: 'AUTO' } },
    [orders.latest.id, alone.latest.id],
  )

  const seen: StreamEvent[] = []
  async function talked() {
    const { url, stream } = await on.opened(agent.id)
    for (let round = 1; round <= ROUNDS; round += 1) {
      assert.equal((await sent(on.hub, on.ana, url, `${ROUND}${round}`)).statusCode, 200)
      const before = await untilAsked(stream)
      seen.push(...before)
      const card = askedOf(before)
      assert.equal(card.toolName, WRITE)
      assert.deepEqual(await answer(on.hub, on.ana, url, card.toolCallId, true), { ok: true })
      const after = await stream.turn()
      seen.push(...after)
      assert.equal(endOf(after), 'complete')
    }
  }
  await Promise.all(Array.from({ length: CONVERSATIONS }, talked))

  const ended = seen.filter((event) => event.type === 'tool_end')
  assert.equal(ended.length, CONVERSATIONS * ROUNDS * 3, 'every call ended')
  assert.equal(approvalsIn(seen).length, CONVERSATIONS * ROUNDS, 'only the write that asks asked')
  assert.deepEqual(
    seen.filter((event) => event.type === 'error'),
    [],
  )
  assert.equal(on.reads.length, CONVERSATIONS * ROUNDS, 'each read reached the door')
  assert.equal(on.fake.orders().length, CONVERSATIONS * ROUNDS * 2, 'each write ran once')
  const ledger = await on.hub.test.asOwner(
    'select state, count(*)::int as n from connectors.connector_write group by state',
  )
  assert.deepEqual(ledger, [{ state: 'DONE', n: CONVERSATIONS * ROUNDS * 2 }])
  assert.ok(!JSON.stringify(on.hub.lines).includes('ALREADY_CLAIMED'))
})
