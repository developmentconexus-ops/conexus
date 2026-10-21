import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ModelAccountId, ModelId, PersonId } from '@conexus/hub-api'
import { resolveModelConfig } from '@mastra/core/llm'
import { Turn } from './public.ts'

const OWNER = {
  companyId: CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA'),
  personId: PersonId.parse(crypto.randomUUID()),
}

type Picked = NonNullable<Awaited<ReturnType<Parameters<Turn['account']>[0]>>>

async function picked(): Promise<Picked> {
  const id = 'anthropic/claude-sonnet-4-6'
  const model = await resolveModelConfig({ id, apiKey: 'sk-ant-planted' })
  if (model.specificationVersion === 'v1') throw new Error('the planted model is not v1')
  return {
    id: ModelAccountId.parse(crypto.randomUUID()),
    label: 'Time 1',
    kind: 'api_key',
    modelId: ModelId.parse(id),
    model,
  }
}

test('o turno que acabou enquanto uma conta era escolhida continua acabado, e ninguém recebe a conta', async () => {
  const turn = new Turn(OWNER)
  const choice = Promise.withResolvers<Picked | undefined>()
  const asking = turn.account(() => choice.promise)
  turn.finish('exhausted')
  choice.resolve(await picked())
  assert.notEqual(await asking, undefined)
  assert.equal(turn.outcome, 'exhausted')
  assert.equal(turn.calling(), undefined)
  assert.equal(await turn.account(async () => picked()), undefined)
})
