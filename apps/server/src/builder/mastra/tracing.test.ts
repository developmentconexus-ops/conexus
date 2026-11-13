import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { PostgresStore } from '@mastra/pg'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { createTestDatabase } from '../../platform/test-database.ts'
import { agentsOn, madeAgent, talkedTo } from '../agents/test-agents.ts'
import { created } from '../assistant/test-assistant.ts'
import { createMastraStorage } from '../conversation/public.ts'
import {
  asked,
  conversing,
  endOf,
  messagesOf,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

type Row = Record<string, unknown>

/** Spans of `threadId` in `mastra_span_events`, ordered by start time. */
async function spansOf(pool: Hub['test']['mastraPool'], threadId: string): Promise<Row[]> {
  const result = await pool.query<Row>(
    `SELECT "spanType", "name", "threadId", "resourceId", "error", "input", "attributes", "metadataRaw" AS "metadata"
     FROM mastra.mastra_span_events
     WHERE "traceId" IN (SELECT "traceId" FROM mastra.mastra_span_events WHERE "threadId" = $1)
       AND "endedAt" IS NOT NULL
     ORDER BY "startedAt"`,
    [threadId],
  )
  return result.rows
}

/** Conversation id from the Hub URL's last segment. */
function idOf(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1)
}

test('um turno do Builder deixa o seu rastro', async (t) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'Olá!' })
  const { hub, ana, conversations } = on

  await hub.mastra.getStorage()?.init()
  const { url } = await asked(t, { hub, person: ana, conversations })
  await hub.close()

  const spans = await spansOf(hub.test.mastraPool, idOf(url))

  const agentRun = spans.filter((s) => s.spanType === 'agent_run')
  const modelStep = spans.filter((s) => s.spanType === 'model_step')

  assert.ok(agentRun.length > 0, 'should have agent_run span')
  assert.ok(modelStep.length > 0, 'should have model_step span')

  for (const span of [...agentRun, ...modelStep]) {
    assert.equal(span.threadId, idOf(url), `${String(span.spanType)} threadId`)
    assert.ok(
      typeof span.resourceId === 'string' && span.resourceId.includes('company:'),
      `${String(span.spanType)} resourceId includes company:`,
    )
  }
})

test('um turno do Builder com uma ferramenta deixa o seu tool_call', async (t) => {
  let step = 0
  const on = await conversing(t, (each: Sent) => {
    const titled = title(each)
    if (titled !== undefined) return titled
    step += 1
    return step === 1
      ? {
          kind: 'blocks',
          blocks: [{ type: 'tool_use', name: 'recall', input: { mode: 'messages' } }],
        }
      : { kind: 'text', text: 'Li a conversa.' }
  })
  const { hub, ana, conversations } = on

  const { url } = await asked(t, { hub, person: ana, conversations })
  await hub.close()

  const spans = await spansOf(hub.test.mastraPool, idOf(url))
  const calls = spans.filter((s) => s.spanType === 'tool_call')
  assert.deepEqual(
    calls.map((s) => s.name),
    ["tool: 'recall'"],
  )
  assert.equal(calls[0]?.threadId, idOf(url))
})

test('cada controlador é rastreado pelo registro único', async (t) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'Olá!' })
  const { hub, ana, companyId, projectId } = on

  await hub.mastra.getStorage()?.init()

  // Builder (covered by the test above; included here for the full table).
  const builderUrl = `${on.conversations}/${await started(hub, ana, on.conversations)}`
  const builderStream = await streamOf(hub, ana, builderUrl)
  t.after(() => builderStream.close())
  assert.equal((await sent(hub, ana, builderUrl, 'Compare dois apps')).statusCode, 200)
  await builderStream.turn()

  // Assistant
  const assistantPath = `/api/companies/${companyId}/assistant/conversations`
  const assistantUrl = await created(hub, ana, assistantPath, { connections: [] })
  const assistantStream = await streamOf(hub, ana, assistantUrl)
  t.after(() => assistantStream.close())
  assert.equal((await sent(hub, ana, assistantUrl, 'Olá')).statusCode, 200)
  await assistantStream.turn()

  // Construtor
  const constPath = `/api/companies/${companyId}/projects/${projectId}/construtor/conversations`
  const constMade = await post(hub, ana, constPath, {}, randomUUID())
  assert.equal(constMade.statusCode, 201, constMade.body)
  const constUrl = `${constPath}/${String(Object(constMade.json()).conversation.id)}`
  const constStream = await streamOf(hub, ana, constUrl)
  t.after(() => constStream.close())
  assert.equal((await sent(hub, ana, constUrl, 'Olá')).statusCode, 200)
  await constStream.turn()

  // Agents (needs agentsOn; reuses the same Hub's databases via the same test database)
  const agentsHub = await agentsOn(t)
  await agentsHub.hub.mastra.getStorage()?.init()
  const agent = await madeAgent(agentsHub.hub, agentsHub.ana, agentsHub.agents)
  const agentUrl = await talkedTo(agentsHub.hub, agentsHub.ana, agentsHub.agents, agent.id, {
    draft: true,
  })
  const agentStream = await streamOf(agentsHub.hub, agentsHub.ana, agentUrl)
  t.after(() => agentStream.close())
  assert.equal((await sent(agentsHub.hub, agentsHub.ana, agentUrl, 'Olá')).statusCode, 200)
  await agentStream.turn()
  await agentsHub.hub.close()

  await hub.close()

  const pool = hub.test.mastraPool

  const cases: {
    kind: string
    url: string
    poolToUse: Hub['test']['mastraPool']
    prefix: string
  }[] = [
    { kind: 'builder', url: builderUrl, poolToUse: pool, prefix: 'company:' },
    { kind: 'assistant', url: assistantUrl, poolToUse: pool, prefix: 'assistant:company:' },
    { kind: 'construtor', url: constUrl, poolToUse: pool, prefix: 'construtor:company:' },
    {
      kind: 'agents',
      url: agentUrl,
      poolToUse: agentsHub.hub.test.mastraPool,
      prefix: 'agents:company:',
    },
  ]

  for (const { kind, url, poolToUse, prefix } of cases) {
    const spans = await spansOf(poolToUse, idOf(url))
    const agentRun = spans.filter((s) => s.spanType === 'agent_run')
    assert.ok(agentRun.length > 0, `${kind}: should have agent_run span`)
    assert.equal(agentRun[0]?.threadId, idOf(url), `${kind}: agent_run threadId`)
    assert.ok(
      typeof agentRun[0]?.resourceId === 'string' && agentRun[0].resourceId.startsWith(prefix),
      `${kind}: resourceId starts with '${prefix}', got '${String(agentRun[0]?.resourceId)}'`,
    )
  }
})

test('a recusa do provedor fica no rastro com o corpo', async (t) => {
  const on = await conversing(t, (each: Sent) => {
    const titled = title(each)
    if (titled !== undefined) return titled
    return { kind: 'refuse', status: 400 }
  })
  const { hub, ana, conversations } = on

  await hub.mastra.getStorage()?.init()
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const told = (await messagesOf(hub, ana, url)).flatMap((message) =>
    message.parts.flatMap((part) => (part.type === 'error' ? [part] : [])),
  )
  assert.equal(endOf(events), 'error', 'the turn ends in an error, as without the trace')
  assert.deepEqual(
    told.map((part) => ({ ...Object(part.error), createdAt: undefined })),
    [
      {
        name: 'AI_APICallError',
        message: 'planted refusal SECRET-PLANTED-TEXT',
        statusCode: 400,
        responseBody: JSON.stringify({
          type: 'error',
          error: { type: 'invalid_request_error', message: 'planted refusal SECRET-PLANTED-TEXT' },
        }),
        modelId: 'claude-sonnet-4-6',
        codes: ['invalid_request_error'],
        createdAt: undefined,
      },
    ],
    'what the client reads of the refusal is what it read before the trace',
  )
  await hub.close()

  const spans = await spansOf(hub.test.mastraPool, idOf(url))
  const failing = spans.filter(
    (s) => (s.spanType === 'model_step' || s.spanType === 'model_inference') && s.error !== null,
  )

  assert.ok(failing.length > 0, 'should have a failing model span')

  for (const span of failing) {
    const details = Object(Object(span.error).details)
    assert.equal(details.statusCode, 400, `${String(span.spanType)}: the status`)
    assert.deepEqual(
      Object(details.responseBody).error,
      { type: 'invalid_request_error', message: 'planted refusal SECRET-PLANTED-TEXT' },
      `${String(span.spanType)}: the provider's body`,
    )
    if (span.spanType === 'model_step') {
      assert.ok(
        Array.isArray(span.input) && span.input.length > 0,
        "model_step: the step's messages",
      )
    }
  }

  const sentPrompt = spans.find(
    (s) => s.name === 'llm request processor: provider-history-compat' && s.input !== null,
  )
  assert.ok(
    Array.isArray(Object(sentPrompt?.input).prompt),
    'the prompt as converted for the provider is on the request processor span',
  )
  const picked = spans.find((s) => s.name === 'input step processor: conexus-account-pick')
  assert.deepEqual(
    { kind: Object(picked?.metadata).accountKind, model: Object(picked?.metadata).modelId },
    { kind: 'api_key', model: 'anthropic/claude-sonnet-4-6' },
    'the account that took the step',
  )
})

test('a chave plantada sai como [REDACTED]', async (t) => {
  // The SensitiveDataFilter scans JSON strings in span data: a JSON-encoded object
  // in the user's message text has its apiKey value redacted in the agent_run span.
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'Ok.' })
  const { hub, ana, conversations } = on

  await hub.mastra.getStorage()?.init()

  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const planted = JSON.stringify({
    apiKey: 'planted-apikey-secret-value',
    action: 'test',
  })
  assert.equal((await sent(hub, ana, url, planted)).statusCode, 200)
  await stream.turn()

  await hub.close()

  const pool = hub.test.mastraPool
  const spans = await spansOf(pool, idOf(url))
  const agentRun = spans.find((s) => s.spanType === 'agent_run')
  assert.ok(agentRun !== undefined, 'should have agent_run span')

  const inputStr = JSON.stringify(agentRun.input)
  assert.ok(inputStr.includes('[REDACTED]'), 'apiKey value is redacted')
  assert.ok(!inputStr.includes('planted-apikey-secret-value'), 'secret value is gone')
  // The other fields survive inside the JSON string the filter parses and re-serializes.
  assert.ok(inputStr.includes('action'), 'other fields are preserved in the contents JSON string')
  assert.ok(inputStr.includes('apiKey'), 'apiKey key is preserved (only value is redacted)')
})

test('fechar o Hub não perde o último turno', async (t) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'Olá!' })
  const { hub, ana, conversations } = on

  await hub.mastra.getStorage()?.init()

  const { url } = await asked(t, { hub, person: ana, conversations })

  // Close immediately after the turn ends, before any batch interval.
  await hub.close()

  const spans = await spansOf(hub.test.mastraPool, idOf(url))
  assert.ok(spans.length > 0, 'spans are in the database after hub.close()')
  assert.ok(
    spans.some((s) => s.spanType === 'agent_run'),
    'agent_run span is flushed',
  )
})

test('a loja nova sobe sobre o banco de hoje: as tabelas novas aparecem e a conversa de antes continua lida', async (t) => {
  const { mastraPool: pool } = await createTestDatabase(t)
  // Today's store, as `main` makes it: one `PostgresStore`, no observability domain.
  const today = new PostgresStore({ id: 'conexus-mastra', pool, schemaName: 'mastra' })
  await today.init()
  const memory = await today.getStore('memory')
  assert.ok(memory !== undefined, "today's store has its memory")
  const threadId = randomUUID()
  await memory.saveThread({
    thread: {
      id: threadId,
      resourceId: 'company:planted',
      title: 'conversa de antes',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  const spansTable = `SELECT to_regclass('mastra.mastra_span_events') AS made`
  assert.equal((await pool.query<{ made: string | null }>(spansTable)).rows[0]?.made, null)

  const next = createMastraStorage(pool)
  t.after(() => next.close())
  await next.init()

  assert.equal(
    (await pool.query<{ made: string | null }>(spansTable)).rows[0]?.made,
    'mastra.mastra_span_events',
  )
  const nextMemory = await next.getStore('memory')
  assert.equal((await nextMemory?.getThreadById({ threadId }))?.title, 'conversa de antes')
})
