import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { NetworkAnswer } from '@conexus/hub-api'
import { DEVELOPMENT_HOSTS, MACHINE_TOOL } from '@conexus/hub-api'
import { assisting, created, talking } from '../../agents/assistant/test-assistant.ts'
import type { Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { Failure } from '../../platform/failure.ts'
import type { StreamEvent } from '../routes/test-conversation.ts'
import { sessionUrl } from '../routes/test-conversation.ts'
import { tool } from '../routes/test-questions.ts'

export const REQUEST = MACHINE_TOOL.requestNetwork
export const REASON = 'ler os produtos e os preços'
export const BOTH = ['CONVERSATION', 'COMPANY']

export function request(domains: string[], extra: object = {}) {
  return tool(REQUEST, { domains, reason: REASON, ...extra })
}

export const WRITE = tool('mastra_workspace_write_file', { path: 'a.txt', content: 'um' })

export function cardsIn(events: StreamEvent[]) {
  return events.flatMap((event) =>
    event.type === 'tool_suspended' && event.toolName === REQUEST ? [event] : [],
  )
}

export function cardIn(events: StreamEvent[]) {
  const [card] = cardsIn(events)
  assert.ok(card, 'the card came')
  return card
}

export function notOpen(reason: string, domains = ['loja.example.com']) {
  return { kind: 'NOT_OPEN', domains, reason }
}

export function resultIn(events: StreamEvent[]) {
  return events.flatMap((event) => (event.type === 'tool_end' ? [event] : [])).at(-1)
}

export async function opening(t: TestContext, steps: ReturnType<typeof tool>[][]) {
  const on = await assisting(t, steps)
  const network = `/api/companies/${on.companyId}/network`
  const { control } = on.hub.conversationMachines
  async function allow(domain: string) {
    const body = { domain, reason: 'Ler o catálogo' }
    const added = await post(on.hub, on.ana, `${network}/domains`, body)
    assert.equal(added.statusCode, 200, added.body)
  }
  async function openAll() {
    const opened = await call(on.hub, on.ana, 'PUT', `${network}/open-all`)
    assert.equal(opened.statusCode, 200, opened.body)
  }
  async function lists() {
    const company = await on.hub.test.asOwner(
      'select domain from builder.company_network_domain order by domain collate "C"',
    )
    const conversation = await on.hub.test.asOwner(
      'select conversation_id, domain from builder.conversation_network_domain order by domain collate "C"',
    )
    return { company, conversation }
  }
  function applied() {
    const last = control.networkApplied.at(-1)?.hosts
    return last === 'ALL' || last === undefined ? last : [...last].sort()
  }
  function modelRead() {
    return on.calls.at(-1)?.toolResults.at(-1)?.text ?? ''
  }
  async function conversation(person: Person = on.ana) {
    const url = await created(on.hub, person, on.assistant, { connections: [] })
    const { say, stream } = await talking(t, on.hub, person, url)
    async function answer(toolCallId: string, scope: NetworkAnswer['scope']) {
      const body = { toolCallId, resumeData: { scope } }
      const answered = await post(on.hub, person, `${sessionUrl(url)}/tool-suspension`, body)
      assert.equal(answered.statusCode, 200, answered.body)
      return stream.turn()
    }
    return { url, id: url.slice(url.lastIndexOf('/') + 1), say, answer }
  }
  return { ...on, control, allow, openAll, lists, applied, modelRead, conversation }
}

export function withBase(...domains: string[]) {
  return [...DEVELOPMENT_HOSTS, ...domains].sort()
}

export function failed(code: ConstructorParameters<typeof Failure>[0]) {
  return new Failure(code)
}
