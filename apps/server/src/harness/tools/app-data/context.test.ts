import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AGENT_TOOL, APP_DATA_TOOL, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { z } from 'zod'
import { assisting, talking } from '../../../agents/assistant/test-assistant.ts'
import { endOf, started } from '../../routes/test-conversation.ts'
import type { AppDataPort } from '../public.ts'
import { appDataReadAndCheckTools, appDataTools } from '../public.ts'

const ID = {
  company: CompanyId.parse('c'.repeat(32)),
  person: PersonId.parse('a'.repeat(32)),
  project: ProjectId.parse('d'.repeat(32)),
}

const UNUSED_PORT: AppDataPort = {
  hasApp: () => Promise.reject(new Error('the description is read, nothing is called')),
  tables: () => Promise.reject(new Error('the description is read, nothing is called')),
  read: () => Promise.reject(new Error('the description is read, nothing is called')),
}

test('o mesmo app_data_read: o Builder e o agente oferecem a mesma descrição e o mesmo esquema', () => {
  const agent = Object(
    appDataTools({
      appData: UNUSED_PORT,
      scope: { companyId: ID.company, personId: ID.person },
      projectId: ID.project,
      thread: null,
    }),
  )[AGENT_TOOL.appDataRead]
  const builder = Object(
    appDataReadAndCheckTools({
      data: {
        access: () => Promise.reject(new Error('nothing is called')),
        read: () => Promise.reject(new Error('nothing is called')),
        check: () => Promise.reject(new Error('nothing is called')),
      },
      ids: { companyId: ID.company, personId: ID.person, projectId: ID.project },
      thread: null,
    }),
  )[APP_DATA_TOOL.read]
  assert.equal(builder.id, agent.id)
  assert.equal(builder.description, agent.description)
  assert.deepEqual(z.toJSONSchema(builder.inputSchema), z.toJSONSchema(agent.inputSchema))
})

test('sem cópia: o texto de app_data_read e as instruções do Builder num Projeto não falam de sync nem de cópia liberada', async (t) => {
  const described = Object(
    appDataTools({
      appData: UNUSED_PORT,
      scope: { companyId: ID.company, personId: ID.person },
      projectId: ID.project,
      thread: null,
    }),
  )[AGENT_TOOL.appDataRead].description
  assert.doesNotMatch(described, /\bsync\b|released|copies|copy/i)

  const on = await assisting(t)
  const url = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const call = on.calls.at(0)
  assert.ok(call, 'the turn reached the model')
  assert.doesNotMatch(call.system, /\bsync\b|company copies|released cop(?:y|ies)|^## Data/im)
  assert.doesNotMatch(
    String(call.descriptions[APP_DATA_TOOL.read]),
    /\bsync\b|released|copy|copies/i,
  )
})
