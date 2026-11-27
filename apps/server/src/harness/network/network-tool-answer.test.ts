import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { NetworkOpened } from '@conexus/hub-api'
import { CompanyId, ConversationId, PersonId, Role } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { nativeRecording, toolResultsOf } from '../../platform/test-recordings.ts'
import type { RunScope } from '../spec/public.ts'
import { askingByRole, requestNetworkTool } from './public.ts'
import { BOTH, failed, notOpen, REASON, REQUEST } from './test-network-tool.ts'

const OWNER = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  personId: PersonId.parse(randomUUID()),
}

function run(attended: boolean): RunScope {
  return {
    kind: 'assistant',
    owner: OWNER,
    place: { kind: 'COMPANY' },
    conversation: { kind: 'THREAD', id: ConversationId.parse(randomUUID()) },
    choice: { kind: 'CHOSEN', connections: [] },
    ceiling: { kind: 'PERSON' },
    attended,
  }
}

/** The role table the doubles answer with: a developer opens in the conversation alone. */
const HELD: Readonly<Record<string, readonly string[]>> = {
  owner: ['openConversationNetwork', 'manageNetwork'],
  developer: ['openConversationNetwork'],
}

/** The tool over a doubled store, so what it records is the tool's own decision. */
function toolWithDoubles(as: {
  role: string
  attended?: boolean
  opened?: () => Promise<NetworkOpened>
  refuses?: Error
}) {
  const grants: unknown[] = []
  const suspended: unknown[] = []
  const identity = {
    allows: (role: Role, action: string) => HELD[role]?.includes(action) ?? false,
  }
  async function speakersOf() {
    return { role: Role.parse(as.role) }
  }
  const made = requestNetworkTool({
    store: {
      opened: as.opened ?? (async () => ({ kind: 'LIST', hosts: [] })),
      grant: async (grant) => {
        if (as.refuses !== undefined) throw as.refuses
        grants.push(grant)
      },
    },
    machines: { reopen: async () => true },
    asking: () => askingByRole({ identity, speakersOf }, run(as.attended ?? true)),
  })
  function execute(agent: object = {}) {
    const context = {
      requestContext: new RequestContext(),
      agent: { suspend: async (card: unknown) => suspended.push(card), ...agent },
    }
    return Object(made).execute({ domains: ['loja.example.com'], reason: REASON }, context)
  }
  return { execute, grants, suspended }
}

const Suspension = z.object({
  type: z.literal('tool_suspended'),
  toolName: z.literal(REQUEST),
  suspendPayload: z.unknown(),
})

function recordedCard() {
  const found = nativeRecording('network').events.flatMap((event) => {
    const suspension = Suspension.safeParse(event)
    return suspension.success ? [suspension.data] : []
  })
  assert.equal(found.length, 1)
  return found[0]?.suspendPayload
}

test('o cartão e as três respostas: o Mastra instalado suspende com os domínios, o motivo e os alcances, e a volta com a resposta guarda o resultado (14)', async () => {
  const card = recordedCard()
  assert.deepEqual(card, { domains: ['loja.example.com'], reason: 'ler os preços', scopes: BOTH })
  const on = toolWithDoubles({ role: 'owner' })
  const result = await on.execute({ resumeData: { scope: 'CONVERSATION' }, suspendPayload: card })
  assert.deepEqual(toolResultsOf('network'), [{ tool: REQUEST, result }])
})

test('o papel é lido de novo na resposta: o alcance que o cartão ofereceu e o papel de agora não tem não é gravado (15)', async () => {
  for (const role of ['developer', 'member'] as const) {
    const on = toolWithDoubles({ role })
    const result = await on.execute({
      resumeData: { scope: 'COMPANY' },
      suspendPayload: recordedCard(),
    })
    assert.deepEqual(result, notOpen('ROLE'), role)
    assert.deepEqual(on.grants, [], role)
  }
})

test('o papel é lido de novo na resposta: o papel perdido entre a leitura e a gravação responde NOT_OPEN com ROLE (15)', async () => {
  const on = toolWithDoubles({ role: 'owner', refuses: failed('NOT_IN_ROLE') })
  const result = await on.execute({
    resumeData: { scope: 'COMPANY' },
    suspendPayload: recordedCard(),
  })
  assert.deepEqual(result, notOpen('ROLE'))
})

test('sem cartão para membro e automação: a execução sem ninguém olhando não suspende, mesmo com o dono (16)', async () => {
  const on = toolWithDoubles({ role: 'owner', attended: false })
  assert.deepEqual(await on.execute(), notOpen('AUTOMATION'))
  assert.deepEqual(on.suspended, [])
})

test('com o banco fora, a ferramenta responde NOT_OPEN com DATABASE e não suspende (14)', async () => {
  const on = toolWithDoubles({
    role: 'owner',
    opened: async () => {
      throw failed('DATABASE_UNAVAILABLE')
    },
  })
  assert.deepEqual(await on.execute(), notOpen('DATABASE'))
  assert.deepEqual(on.suspended, [])
})
