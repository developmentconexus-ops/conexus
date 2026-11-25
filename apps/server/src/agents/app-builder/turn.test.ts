import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import {
  conversing,
  holding,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from '../../harness/routes/test-conversation.ts'
import { resourceOf } from '../../harness/spec/public.ts'
import { hubOn } from '../../hub/identity/test-hub.ts'
import { silent } from '../../platform/test-database.ts'
import type { ConversationIndex } from './turn-of.ts'
import { builderRuns, createRefusals, projectOfRun, turnOf } from './turn-of.ts'

const OWNER = {
  companyId: CompanyId.parse('Q2xpZW50ZUV4ZW1wbG9QYXJhVGVzdGUx'),
  personId: PersonId.parse('PessoaDeTesteDoVetorFixo0000001'),
}
const PROJECT = ProjectId.parse('UHJvamV0b0RlVGVzdGVEb1ZldG9yMDAx')
const CONVERSATION = ConversationId.parse('8d0e7f0a-2b1c-4e5f-9a6b-7c8d9e0f1a2b')

/** A run of the Builder's conversation, as the controller leaves it on the context. */
function runContext() {
  const context = new RequestContext()
  context.set('controller', {
    sessionId: CONVERSATION,
    resourceId: resourceOf('builder', OWNER),
  })
  return context
}

/** The Hub's index, counting how many times a run reads it; `none` is a conversation it does not keep. */
function indexOf(kept: boolean) {
  const reads: string[] = []
  const index: ConversationIndex = {
    async projectOf({ conversationId }) {
      reads.push(conversationId)
      return kept ? PROJECT : undefined
    },
  }
  return { index, reads }
}

/** The account queue of a Hub in which the owner has no company: the turn's memory models follow the conversation's. */
async function queueOf(t: TestContext) {
  const hub = await hubOn(t)
  return {
    database: hub.test.database,
    identity: hub.identity,
    sealKeys: hub.config.sealKeys,
    googleCalls: () => Promise.reject(new Error('no Google account in this test')),
    log: silent,
  }
}

async function turnWith(t: TestContext, input: { kept: boolean; holder?: { person?: string } }) {
  const { index, reads } = indexOf(input.kept)
  const taken: string[] = []
  const refusals = createRefusals()
  const projectOf = projectOfRun(
    builderRuns({
      index,
      memory: { getThreadById: () => assert.fail('the Builder reads no thread') },
    }),
  )
  const runs = {
    async take({ conversationId }: { conversationId: string }) {
      taken.push(conversationId)
      return input.holder === undefined
        ? ({ ok: true } as const)
        : ({ ok: false, error: 'busy', ...input.holder } as const)
    },
  }
  const turn = turnOf({ queue: await queueOf(t), runs, projectOf, refusals })
  assert.ok(turn.kind === 'RUN')
  return { turn, reads, taken, refusals }
}

test('o turno acha o Projeto da conversa uma vez, pelo projectOfRun, sem reler o índice do Hub', async (t) => {
  const { turn, reads, taken } = await turnWith(t, { kept: true })
  const answer = await turn.take(runContext())
  assert.equal(answer.kind, 'TAKEN')
  assert.deepEqual(reads, [CONVERSATION])
  assert.deepEqual(taken, [CONVERSATION])
})

test('um turno numa conversa que o índice não tem recusa como hoje: nenhuma execução toma o Projeto', async (t) => {
  const { turn, reads, taken, refusals } = await turnWith(t, { kept: false })
  assert.deepEqual(await turn.take(runContext()), { kind: 'NONE' })
  assert.deepEqual(reads, [CONVERSATION])
  assert.deepEqual(taken, [])
  assert.equal(refusals.read(CONVERSATION), undefined)
})

test('o Projeto ocupado recusa só com o código, e quem segura fica no registro, que o fim do turno lê uma vez', async (t) => {
  const { turn, refusals } = await turnWith(t, { kept: true, holder: { person: 'Ana' } })
  assert.deepEqual(await turn.take(runContext()), { kind: 'REFUSED', reason: 'RUN_BUSY' })
  assert.deepEqual(refusals.read(CONVERSATION), { code: 'RUN_BUSY', person: 'Ana' })
  assert.equal(refusals.read(CONVERSATION), undefined, 'the end of the turn reads it once')
})

test('o Projeto ocupado por quem já saiu: o registro leva o código sem nome', async (t) => {
  const { turn, refusals } = await turnWith(t, { kept: true, holder: {} })
  await turn.take(runContext())
  assert.deepEqual(refusals.read(CONVERSATION), { code: 'RUN_BUSY' })
})

test('uma execução que toma o Projeto não herda a recusa que ficou sem ser lida', async (t) => {
  const { turn, refusals } = await turnWith(t, { kept: true })
  refusals.record(CONVERSATION, { code: 'RUN_BUSY', person: 'Ana' })
  assert.equal((await turn.take(runContext())).kind, 'TAKEN')
  assert.equal(refusals.read(CONVERSATION), undefined)
})

test('o evento error do controlador, na 1.83.0, traz finishReason tripwire e não traz processorId: o registro é de quem recusa', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const [working, refused] = [
    `${conversations}/${await started(hub, ana, conversations)}`,
    `${conversations}/${await started(hub, ana, conversations)}`,
  ]
  const onWorking = await streamOf(hub, ana, working)
  t.after(() => onWorking.close())
  const onRefused = await streamOf(hub, ana, refused)
  t.after(() => onRefused.close())
  assert.equal((await sent(hub, ana, working, 'Primeira')).statusCode, 200)
  assert.equal(await onWorking.text(), PARTIAL)
  assert.equal((await sent(hub, ana, refused, 'Outra')).statusCode, 200)
  const errors = (await onRefused.turn()).filter((event) => event.type === 'error')
  assert.equal(errors.length, 1)
  const [error] = errors
  assert.equal(Object(error).finishReason, 'tripwire')
  assert.equal('processorId' in Object(error), false)
  held.release()
})
