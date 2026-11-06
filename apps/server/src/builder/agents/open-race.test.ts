import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AgentId, CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import pg from 'pg'
import { agentsOn, publishedAgent } from './test-agents.ts'

test('abrir: a linha que a varredura levou depois do fio devolve AGENT_NOT_FOUND e mata a máquina da conversa (17)', async (t) => {
  const on = await agentsOn(t)
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda.',
    machine: true,
  })
  const agentId = AgentId.parse(agent.id)
  const scope = {
    companyId: CompanyId.parse(on.companyId),
    projectId: ProjectId.parse(on.projectId),
    personId: PersonId.parse(on.ana.id),
  }
  const frozen = await on.hub.agents.draftOf(scope, agentId)
  const { mastraPool } = on.hub.test
  // The open stops where the thread takes its model, after the session read the row, until the test lets it go.
  const holder = new pg.Client({ connectionString: on.hub.test.mastraUrl.reveal() })
  await holder.connect()
  await holder.query('begin')
  await holder.query('select pg_advisory_xact_lock(7441)')
  await mastraPool.query(
    `create function mastra.hold_model() returns trigger language plpgsql as
      $$ begin perform pg_advisory_xact_lock(7441); return null; end $$`,
  )
  await mastraPool.query(
    `create trigger hold_model after insert or update on mastra.mastra_threads
      for each row when (new.metadata::text like '%currentModelId%')
      execute function mastra.hold_model()`,
  )
  // The holder leaves with the test, even when an assertion fails: the database drops only once nobody is in it.
  const id = ConversationId.parse(randomUUID())
  let opening: Promise<unknown>
  try {
    opening = on.hub.agents.open({ scope, agentId, draft: false, frozen, id }).then(
      (made) => made,
      (error: unknown) => error,
    )
    const deadline = Date.now() + 10_000
    for (;;) {
      const waiting = await mastraPool.query(
        `select 1 from pg_locks where locktype = 'advisory' and objid = 7441 and not granted`,
      )
      if ((waiting.rowCount ?? 0) > 0) break
      assert.ok(Date.now() < deadline, 'the open never reached the thread taking its model')
      await new Promise((done) => setTimeout(done, 20))
    }
    // The sweep of the deletion that ran while the open waited.
    await on.hub.test.asOwner('delete from builder.agent_conversation where id = $1', [id])
    await holder.query('commit')
  } finally {
    await holder.end()
  }
  assert.deepEqual(Object(await opening).code, 'AGENT_NOT_FOUND')
  assert.ok(
    on.hub.assistantMachines.killed.includes(id),
    'the machine of the lost conversation was killed',
  )
  const threads = await on.hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  assert.equal(Object(threads.rows[0]).n, 0)
})
