import type { ModelFallback as Fallback, ProviderOrder, SignInKind } from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, ModelAccount } from '@conexus/hub-api'
import { ANA, COMPANY } from '../../platform/fixtures.ts'

type Chosen = { model: string; effort: string }

/** What the Hub holds of the company's model accounts; a write changes it, a read shows it. */
export type View = {
  company: ModelAccount[]
  mine: ModelAccount[]
  order: ProviderOrder[]
  kinds: SignInKind[]
  defaults?: {
    company: Chosen | null
    mine: Chosen | null
    start: (Chosen & { from: 'mine' | 'company' | 'starter' }) | null
  }
  connected?: { mine: string[]; company: string[] }
  fallback?: Fallback
  mayManage: boolean
  /** The viewer's role in the company; an owner when they manage, a member when not. */
  role?: 'owner' | 'admin' | 'member'
  /** More members of the company besides Ana and Diego, listed in pages as the Hub lists them. */
  crowd?: number
}

export type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

/** A reply that replaces the Hub's usual answer to a write; nothing is kept when it is a failure. */
export type Answers = Partial<
  Record<
    | 'connect'
    | 'change'
    | 'assign'
    | 'default'
    | 'fallback'
    | 'order'
    | 'remove'
    | 'start'
    | 'complete'
    | 'kinds',
    () => Response | undefined
  >
>

export const BASE = `*/api/companies/${COMPANY.id}`

export function replace(view: View, id: string, change: (one: ModelAccount) => ModelAccount) {
  for (const key of ['company', 'mine'] as const) {
    view[key] = view[key].map((one) => (one.id === id ? change(one) : one))
  }
}

/** Records a write as the Hub received it, and gives its JSON body. */
export function noter(sent: Sent[]) {
  return async function note(request: Request): Promise<Record<string, unknown>> {
    const text = await request.text()
    const body: Record<string, unknown> | undefined = text === '' ? undefined : JSON.parse(text)
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body,
      attemptKey: request.headers.get(ATTEMPT_KEY_HEADER),
    })
    return body ?? {}
  }
}

let made = 0

/** An account of the company's Anthropic queue, ready and for all, unless `fields` say otherwise. */
export function accountOf(fields: Partial<ModelAccount> & { label: string }): ModelAccount {
  made += 1
  return ModelAccount.parse({
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    owner: 'company',
    kind: 'api_key',
    provider: 'anthropic',
    position: 0,
    state: 'ready',
    kindOff: false,
    hint: 'x7Qa',
    linkedBy: ANA.name,
    limitedUntil: null,
    linkedAt: '2026-10-19T12:00:00.000Z',
    assignees: [],
    revision: 0,
    ...fields,
  })
}
