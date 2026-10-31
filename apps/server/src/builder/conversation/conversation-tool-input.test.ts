import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { InMemoryStore } from '@mastra/core/storage'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import { conexusCheck } from './processors.ts'
import {
  answeredOf,
  conversing,
  endOf,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'
import { WHO } from './test-questions.ts'

/** The model's JSON for `ask_user`, cut short, as an unvalidated tool stream may deliver it. */
const TRUNCATED = JSON.stringify({ questions: [WHO] }).slice(0, -12)

test('uma chamada de ferramenta que o Mastra guardou sem argumentos não quebra a conversa: os dois turnos seguintes terminam', async (t) => {
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    return calls.length === 1
      ? { kind: 'blocks', blocks: [{ type: 'tool_use', name: 'ask_user', input: TRUNCATED }] }
      : { kind: 'text', text: 'Pronto.' }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const content of ['Crie o app', 'Segunda', 'Terceira']) {
    assert.equal((await sent(hub, ana, url, content)).statusCode, 200)
    const events = await stream.turn()
    assert.equal(endOf(events), 'complete', content)
    assert.deepEqual(failuresOf(events), [], content)
  }
  const stored = (await answeredOf(hub, ana, url)).flatMap((message) => message.parts)
  const asked = stored.flatMap((part) =>
    part.type === 'tool-invocation' && part.toolInvocation.toolName === 'ask_user'
      ? [part.toolInvocation]
      : [],
  )
  assert.equal(asked.length, 1)
  assert.equal(asked[0]?.state, 'output-error')
  assert.ok(
    !('args' in (asked[0] ?? {})) || asked[0]?.args === undefined,
    'the stored call is not edited: it still holds no arguments',
  )
})

test('o turno que a fila encerrou não volta ao modelo: a conferência dá o turno por terminado sem ler as tarefas', async (t) => {
  const { hub } = await conversing(t, () => ({ kind: 'text', text: 'Pronto.' }))
  const turn = new Turn({
    companyId: CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA'),
    personId: PersonId.parse(crypto.randomUUID()),
  })
  const storage = new InMemoryStore()
  const read = t.mock.method(storage, 'getStore')
  const requestContext = Object.fromEntries(turnContext(turn).entries())
  const scorer = conexusCheck({ runs: hub.runs, storage })
  turn.finish('failed')
  const { score } = await scorer.run({
    input: [],
    output: [],
    requestContext: { ...requestContext, controller: { threadId: 'conversa' } },
  })
  assert.equal(score, 1)
  assert.equal(read.mock.callCount(), 0, 'a turn the queue ended is not read for open tasks')
})
