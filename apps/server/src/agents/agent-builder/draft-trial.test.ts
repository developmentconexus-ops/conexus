import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { AgentId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { Agent } from '@mastra/core/agent'
import { APICallError } from 'ai'
import { testDraft } from './public.ts'

const scope = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  projectId: ProjectId.parse(randomUUID().replaceAll('-', '')),
  personId: PersonId.parse(randomUUID().replaceAll('-', '')),
}
const agentId = AgentId.parse(randomUUID())

type Line = { fields: Record<string, unknown>; message: string }

/** `testDraft` over a draft agent that does `generate`, with the lines it logs. */
function testing(generate: () => Promise<unknown>) {
  const lines: Line[] = []
  function keep(fields: Record<string, unknown>, message: string) {
    lines.push({ fields, message })
  }
  const agent: Agent = Object.assign(Object.create(null), { generate })
  const test = testDraft({
    agents: { testable: () => Promise.resolve() },
    draftAgent: () => Promise.resolve(agent),
    log: { info: keep, error: keep },
  })
  return { lines, run: () => test(scope, agentId, 'Quanto vendemos?') }
}

test('testar: um erro que não é nosso Failure é INTERNAL_UNEXPECTED (SYSTEM), com a causa no registro, e não MODEL_CALL_FAILED', async () => {
  const defect = new TypeError('boom')
  const on = testing(async () => {
    throw defect
  })
  await assert.rejects(on.run(), { code: 'INTERNAL_UNEXPECTED', cause: defect })
  const [line] = on.lines
  assert.equal(line?.message, 'INTERNAL_UNEXPECTED')
  assert.equal(line?.fields.causes, 'TypeError')
})

test('testar: uma execução que um processador interrompeu (tripwire) volta recusada, não como resposta vazia', async () => {
  const on = testing(async () => ({
    text: '',
    steps: [],
    tripwire: { reason: 'NO_TURN' },
  }))
  assert.deepEqual(await on.run(), { kind: 'REFUSED', code: 'MODEL_REFUSED' })
})

test('testar: a falha do provedor do modelo (APICallError, também na cadeia de causas) volta recusada como MODEL_CALL_FAILED, sem alarme SYSTEM', async () => {
  const provider = new APICallError({
    message: 'upstream',
    url: 'https://provider.invalid/v1',
    requestBodyValues: {},
    statusCode: 500,
  })
  for (const thrown of [provider, new Error('generate failed', { cause: provider })]) {
    const on = testing(async () => {
      throw thrown
    })
    assert.deepEqual(await on.run(), { kind: 'REFUSED', code: 'MODEL_CALL_FAILED' })
    assert.equal(on.lines[0]?.message, 'MODEL_CALL_FAILED')
  }
})
