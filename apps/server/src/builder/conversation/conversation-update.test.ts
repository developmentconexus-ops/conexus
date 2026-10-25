import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { connect, GROQ_MODEL } from '../model-accounts/test-defaults.ts'
import { conversing, endOf, hubBeside, sent, started, streamOf } from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'
import {
  ask,
  SUBMIT,
  stepping,
  tool,
  untilCard,
  WHO,
  WRITE_PLAN,
  within,
} from './test-questions.ts'

const WRITE_A = tool('mastra_workspace_write_file', { path: 'a.ts', content: 'x\n' })

/**
 * A card asked on a copy that is then stopped as an update stops it: the turn writes `a.ts`, asks,
 * its version is saved, and the copy closes without waiting for the answer; `next` is the copy
 * that takes over, its machine still there.
 */
async function parkedThenUpdated(
  t: TestContext,
  type: 'question' | 'plan',
  steps = type === 'question' ? [[WRITE_A], [ask(WHO)]] : [[WRITE_A, WRITE_PLAN], [SUBMIT]],
  choose?: (world: Awaited<ReturnType<typeof conversing>>) => Promise<void>,
) {
  const calls: Sent[] = []
  const world = await conversing(t, stepping(steps, calls))
  const { hub, ana, conversations } = world
  await choose?.(world)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Crie um app de encomendas')).statusCode, 200)
  const { card, events } = await untilCard(stream, type)
  assert.equal(endOf(events), 'suspended', 'the question ends the turn')
  const closed = closing.close().then(() => 'closed')
  assert.equal(await within(5_000, closed), 'closed', 'the close waits for nothing parked')
  await stream.until(() => stream.seen.ended)
  const next = await hubBeside(t, hub)
  next.builder.control.outcome = 'connected'
  const repository = next.builder.repository({
    companyId: CompanyId.parse(world.companyId),
    projectId: ProjectId.parse(world.projectId),
  })
  return { ...world, url, card, calls, next, version: () => repository.version() }
}

for (const type of ['question', 'plan'] as const) {
  test(`atualizar com ${type === 'question' ? 'uma pergunta' : 'o plano'} aberto: a versão já está guardada, o cartão some e a próxima mensagem funciona, sem erro do fornecedor (47)`, {
    timeout: 60_000,
  }, async (t) => {
    const { ana, url, calls, next, version } = await parkedThenUpdated(t, type)
    assert.equal(await version(), 1, 'the version was saved when the Builder asked')
    const stream = await streamOf(next, ana, url)
    t.after(() => stream.close())
    assert.deepEqual((await stream.seed()).pendingSuspensions, {}, 'no card after the restart')
    assert.equal((await sent(next, ana, url, 'Melhor: só eu cadastro.')).statusCode, 200)
    const events = await within(15_000, stream.turn())
    assert.equal(endOf(events), 'complete')
    assert.deepEqual(failuresOf(events ?? []), [])
    assert.ok(calls.at(-1)?.texts.some((text) => text.includes('Melhor: só eu cadastro.')))
  })
}

const LONG = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
const OBSERVED = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria.',
  '</observations>',
  '<thread-title>Encomendas da padaria</thread-title>',
].join('\n')

test('a mensagem na cópia nova lê a escolha da empresa: o Observador chama o dublê do Groq (14.2, 35)', {
  timeout: 60_000,
}, async (t) => {
  const groq = GROQ_MODEL
  const where = await parkedThenUpdated(
    t,
    'question',
    [[WRITE_A], [ask(WHO)], [{ type: 'text', text: LONG }, WRITE_A]],
    async ({ hub, ana, companyId, anthropic }) => {
      anthropic.chat = () => ({ kind: 'text', text: OBSERVED })
      await connect(hub, ana, `/api/companies/${companyId}/model-accounts`, 'groq')
      const settings = `/api/companies/${companyId}/observational-memory-models`
      const saved = await call(hub, ana, 'PUT', settings, { role: 'observer', model: groq })
      assert.equal(saved.statusCode, 200, saved.body)
    },
  )
  const { ana, url, next, anthropic } = where
  const stream = await streamOf(next, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(next, ana, url, 'Só eu cadastro.')).statusCode, 200)
  const events = await within(30_000, stream.turn())
  assert.equal(endOf(events), 'complete')
  assert.ok(anthropic.chats.length > 0, 'the answered turn’s memory called the Groq double')
})
