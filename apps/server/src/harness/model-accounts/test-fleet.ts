import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { StreamEvent } from '../routes/test-conversation.ts'
import { asked, conversing, KEY } from '../routes/test-conversation.ts'

export const EXHAUSTED =
  'As contas Anthropic que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.'

/** The notices the stream said live, as the screen draws them before the answer is saved. */
export function saidLive(events: readonly StreamEvent[]): string[] {
  return events.flatMap((event) => (event.type === 'info' ? [event.message] : []))
}

function keyOf(label: string): string {
  return label === 'Time 1' ? KEY : `sk-ant-queue-${label.replaceAll(' ', '-')}-key-0001`
}

/** A company whose accounts answer as `plan` says by label; the others answer with text. */
export async function fleet(t: TestContext, plan: Record<string, Reply> = {}) {
  const labels = new Map([[KEY, 'Time 1']])
  const base = await conversing(t, (call) => {
    if (!call.stream) return { kind: 'text', text: 'Apps de encomenda' }
    return plan[labels.get(String(call.key)) ?? ''] ?? { kind: 'text', text: 'Pronto.' }
  })
  const { hub, ana, companyId } = base
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function add(label: string, owner = 'company', who = ana) {
    labels.set(keyOf(label), label)
    const body = { owner, provider: 'anthropic', label, key: keyOf(label) }
    const linked = await base.hub.app.inject({
      method: 'POST',
      url: accounts,
      headers: {
        origin: TEST_ORIGIN,
        cookie: who.cookie,
        'content-type': 'application/json',
        'idempotency-key': crypto.randomUUID(),
      },
      payload: JSON.stringify(body),
    })
    assert.equal(linked.statusCode, 201, linked.body)
    const { account } = Object(linked.json())
    return { id: String(account.id), revision: Number(account.revision) }
  }
  /** The streamed calls by account label, in order: the titles' calls are left out. */
  function calls(): string[] {
    return base.anthropic.sent
      .filter((each) => each.stream)
      .map((each) => labels.get(String(each.key)) ?? '?')
  }
  async function states(): Promise<Record<string, { state: string; limitedUntil: number | null }>> {
    const rows = await hub.test.asOwner(
      'select label, state, limited_until from builder.model_account',
    )
    return Object.fromEntries(
      rows.map((row) => [
        String(row.label),
        {
          state: String(row.state),
          limitedUntil: row.limited_until instanceof Date ? row.limited_until.getTime() : null,
        },
      ]),
    )
  }
  async function listed() {
    const read = await call(hub, ana, 'GET', accounts)
    const company: { label: string; state: string }[] = Object(read.json()).company
    return Object.fromEntries(company.map((each) => [each.label, each.state]))
  }
  function ask(between?: () => Promise<void>) {
    return asked(t, { hub, person: ana, conversations: base.conversations, between })
  }
  return { ...base, accounts, add, calls, states, listed, ask }
}
