import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, ConnectorId, ConversationId, WorkflowRunId } from '@conexus/hub-api'
import { mustAsk } from './public.ts'
import { LANCAR, writing } from './test-write.ts'

/** `mustAsk` for a write in Faz sozinho by the draft, over the real record of sends. */
async function asking(t: Parameters<typeof writing>[0]) {
  const on = await writing(t)
  const target = {
    connectionId: on.matriz,
    connectorId: ConnectorId.parse('sankhya'),
    operationId: LANCAR,
  }
  function ask(where: Parameters<typeof mustAsk>[1]['where']) {
    return mustAsk(
      {
        database: on.hub.test.database,
        identity: { mayUse: async () => true, mayPublishUnattended: async () => true },
        openWrites: (key) => on.hub.connectors.assistant.openWrites(key),
      },
      {
        companyId: CompanyId.parse(on.companyId),
        choice: 'AUTO',
        author: { kind: 'DRAFT' },
        scope: on.scopeOf(on.ana.id),
        where,
        target,
      },
    )
  }
  return { on, ask }
}

test('mustAsk numa execução: uma escrita aberta da mesma ligação e operação na execução pergunta (OPEN_WRITE), e uma aberta numa conversa não', async (t) => {
  const { on, ask } = await asking(t)
  const run = { kind: 'RUN', runId: on.runId } as const
  const conversation = { kind: 'CONVERSATION', threadId: on.thread } as const
  assert.deepEqual(await ask(run), { kind: 'DO' })
  await on.ask(on.byWorkflow())
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'UNCERTAIN', answer = null",
  )
  assert.deepEqual(await ask(run), { kind: 'ASK', reason: 'OPEN_WRITE' })
  assert.deepEqual(await ask(conversation), { kind: 'DO' })
  const other = { kind: 'RUN', runId: WorkflowRunId.parse(randomUUID()) } as const
  assert.deepEqual(await ask(other), { kind: 'DO' })
  assert.deepEqual(
    await ask({ kind: 'CONVERSATION', threadId: ConversationId.parse(randomUUID()) }),
    {
      kind: 'DO',
    },
  )
})
