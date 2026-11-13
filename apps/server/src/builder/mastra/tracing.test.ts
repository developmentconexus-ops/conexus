import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import type { MastraPool } from '../../platform/database.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { agentsOn, madeAgent, talkedTo } from '../agents/test-agents.ts'
import { created } from '../assistant/test-assistant.ts'
import {
  answeredOf,
  asked,
  conversing,
  hubBeside,
  messagesOf,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

type Row = Record<string, unknown>

/** Spans of `threadId` in `mastra_span_events`, ordered by start time. */
async function spansOf(pool: MastraPool, threadId: string): Promise<Row[]> {
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

  const cases: { kind: string; url: string; poolToUse: MastraPool; prefix: string }[] = [
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
  const { url } = await asked(t, { hub, person: ana, conversations })
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

test('a loja nova sobe sobre o banco de hoje', async (t) => {
  const on = await conversing(t, (each: Sent) => title(each) ?? { kind: 'text', text: 'Olá!' })
  const { hub, ana, conversations } = on

  await hub.mastra.getStorage()?.init()
  const { url } = await asked(t, { hub, person: ana, conversations })

  // Confirm messages exist before reinit.
  const before = await answeredOf(hub, ana, url)
  assert.ok(before.length >= 2, 'messages exist before reinit')

  await hub.close()

  // A second Hub opens on the same databases and calls init() again.
  const hub2 = await hubBeside(t, hub)
  await hub2.mastra.getStorage()?.init()

  const pool = hub2.test.mastraPool

  // The span tables were created by the first init and still exist.
  const tableCheck = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'mastra' AND table_name = 'mastra_span_events'
     ) AS exists`,
  )
  assert.ok(tableCheck.rows[0]?.exists, 'mastra_span_events table exists after second init')

  // Existing conversations are still readable.
  const after = await messagesOf(hub2, ana, url)
  assert.ok(after.length >= 2, 'conversations are still readable after second init')

  // Spans from the first run are still in the database.
  const spans = await spansOf(pool, idOf(url))
  assert.ok(spans.length > 0, 'spans from first run survive reinit')
})
