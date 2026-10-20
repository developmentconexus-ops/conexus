import type { ModelFallback as Fallback, ProviderOrder, SignInKind } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  getAccountKinds,
  listMembers,
  listModelAccounts,
  listModelProviders,
  ModelAccount,
  ModelFallback,
  PAGE_SIZE,
  ProviderId,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import { fireEvent, screen } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, memberView, sessionRead } from '../../platform/test-hub.tsx'

const DIEGO = { personId: 'person-diego', name: 'Diego', email: 'diego@example.test' }

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4', 'claude-opus-4'] },
  { id: 'mistral', name: 'Mistral', models: ['mistral-large'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-5'] },
].map((provider) => ({
  ...provider,
  models: provider.models.map((name) => ({ id: `${provider.id}/${name}`, efforts: ['off'] })),
}))

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

/** What the Hub holds of the company's model accounts; a write changes it, a read shows it. */
export type View = {
  company: ModelAccount[]
  mine: ModelAccount[]
  order: ProviderOrder[]
  kinds: SignInKind[]
  defaultModel: string | null
  fallback?: Fallback
  mayManage: boolean
  /** The viewer's role in the company; an owner when they manage, a member when not. */
  role?: 'owner' | 'admin' | 'member'
  /** More members of the company besides Ana and Diego, listed in pages as the Hub lists them. */
  crowd?: number
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

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

const BASE = `*/api/companies/${COMPANY.id}`

/** The company's members in the Hub's pages: a page token names the offset it starts at. */
function membersPages(view: View): HttpHandler {
  const everyone = [
    memberView({ ...ANA, personId: ANA.id, role: 'owner' }),
    memberView({ ...DIEGO, role: 'member' }),
    ...Array.from({ length: view.crowd ?? 0 }, (_, index) =>
      memberView({
        personId: `person-extra-${index + 1}`,
        name: `Pessoa ${index + 1}`,
        email: `pessoa${index + 1}@example.test`,
        role: 'member',
      }),
    ),
  ]
  return http.get(`${BASE}/members`, ({ request }) => {
    const page = new URL(request.url).searchParams.get('page')
    const from = page === null ? 0 : Number(page.slice(1))
    const to = from + PAGE_SIZE
    return HttpResponse.json(
      listMembers.success.body.parse({
        members: everyone.slice(from, to),
        next: to < everyone.length ? { kind: 'MORE', page: `p${to}` } : { kind: 'END' },
      }),
    )
  })
}

function reads(view: View): HttpHandler[] {
  return [
    sessionRead(() => ANA),
    membersPages(view),
    ...companyRead({ role: view.role ?? (view.mayManage ? 'owner' : 'member') }),
    http.get(`${BASE}/model-accounts`, () =>
      HttpResponse.json(
        listModelAccounts.success.body.parse({
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: [],
          ...view,
        }),
      ),
    ),
    http.get('*/api/model-providers', () =>
      HttpResponse.json(listModelProviders.success.body.parse({ providers: PROVIDERS })),
    ),
    http.get('*/api/clients/:companyId/account-kinds', () =>
      HttpResponse.json(getAccountKinds.success.body.parse({ kinds: view.kinds })),
    ),
  ]
}

function replace(view: View, id: string, change: (one: ModelAccount) => ModelAccount) {
  for (const key of ['company', 'mine'] as const) {
    view[key] = view[key].map((one) => (one.id === id ? change(one) : one))
  }
}

/** Records a write as the Hub received it, and gives its JSON body. */
function noter(sent: Sent[]) {
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

function accountsWrites(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const note = noter(sent)
  return [
    http.post(`${BASE}/model-accounts`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.connect?.()
      if (replaced) return replaced
      const key = String(body.key)
      const owner = body.owner === 'me' ? 'mine' : 'company'
      const account = accountOf({
        label: String(body.label),
        owner: body.owner === 'me' ? 'me' : 'company',
        provider: ProviderId.parse(body.provider),
        hint: key.slice(-4),
        position: view[owner].length,
      })
      view[owner].push(account)
      return HttpResponse.json({ account }, { status: 201 })
    }),
    http.patch(`${BASE}/model-accounts/:accountId`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.change?.()
      if (replaced) return replaced
      replace(view, String(params.accountId), (one) => ({
        ...one,
        ...body,
        revision: one.revision + 1,
      }))
      return HttpResponse.json({
        account: [...view.company, ...view.mine].find((one) => one.id === params.accountId),
      })
    }),
    http.delete(`${BASE}/model-accounts/:accountId`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.remove?.()
      if (replaced) return replaced
      view.company = view.company.filter((one) => one.id !== params.accountId)
      view.mine = view.mine.filter((one) => one.id !== params.accountId)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

function settingsWrites(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const note = noter(sent)
  return [
    http.put(`${BASE}/model-accounts/:accountId/assignees`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.assign?.()
      if (replaced) return replaced
      const personIds = Array.isArray(body.personIds) ? body.personIds : []
      replace(view, String(params.accountId), (one) => ({ ...one, assignees: personIds }))
      return HttpResponse.json({ account: view.company.find((one) => one.id === params.accountId) })
    }),
    http.put(`${BASE}/default-model`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.default?.()
      if (replaced) return replaced
      view.defaultModel = String(body.model)
      return HttpResponse.json({ defaultModel: view.defaultModel })
    }),
    http.put(`${BASE}/model-fallback`, async ({ request }) => {
      const body = ModelFallback.parse(await note(request))
      const replaced = answers.fallback?.()
      if (replaced) return replaced
      view.fallback = { ...body, revision: body.revision + 1 }
      return HttpResponse.json(view.fallback)
    }),
    http.put(`${BASE}/model-account-orders/:owner/:provider`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.order?.()
      if (replaced) return replaced
      const ids = Array.isArray(body.ids) ? body.ids : []
      const key = params.owner === 'me' ? 'mine' : 'company'
      view[key] = view[key].map((one) =>
        ids.includes(one.id) ? { ...one, position: ids.indexOf(one.id) } : one,
      )
      return HttpResponse.json({ accounts: view[key] })
    }),
    http.put('*/api/clients/:companyId/account-kinds', async ({ request }) => {
      const body = await note(request)
      const replaced = answers.kinds?.()
      if (replaced) return replaced
      view.kinds = getAccountKinds.success.body.parse(body).kinds
      return HttpResponse.json({ kinds: view.kinds })
    }),
  ]
}

function signIns(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const started = { kind: 'claude_subscription', owner: 'company', label: '' }
  return [
    http.post(`${BASE}/model-account-sign-ins`, async ({ request }) => {
      const body = startModelAccountSignIn.input.body.parse(await request.json())
      sent.push({ method: 'POST', path: new URL(request.url).pathname, body, attemptKey: null })
      const replaced = answers.start?.()
      if (replaced) return replaced
      Object.assign(started, body)
      return HttpResponse.json(
        {
          signInId: '00000000-0000-4000-8000-0000000000aa',
          url: 'https://claude.example.test/oauth/authorize?state=abc',
          expiresAt: '2026-10-19T12:10:00.000Z',
        },
        { status: 201 },
      )
    }),
    http.post(`${BASE}/model-account-sign-ins/:signInId`, async ({ request }) => {
      sent.push({
        method: 'POST',
        path: new URL(request.url).pathname,
        body: await request.json(),
        attemptKey: null,
      })
      const replaced = answers.complete?.()
      if (replaced) return replaced
      const owner = started.owner === 'me' ? 'mine' : 'company'
      const account = accountOf({
        label: started.label,
        owner: started.owner === 'me' ? 'me' : 'company',
        kind: started.kind === 'google_cliproxy' ? 'google_cliproxy' : 'claude_subscription',
        hint: null,
        position: view[owner].length,
      })
      view[owner].push(account)
      return HttpResponse.json({ account }, { status: 201 })
    }),
  ]
}

/** The Hub as Ana sees the company's model accounts; `sent` lists the writes it received. */
export function modelHub(view: View, answers: Answers = {}) {
  const sent: Sent[] = []
  return {
    sent,
    handlers: [
      ...reads(view),
      ...accountsWrites(view, sent, answers),
      ...settingsWrites(view, sent, answers),
      ...signIns(view, sent, answers),
    ],
  }
}

/** Opens a select of the UI by its trigger and picks the option named `name`. */
export async function choose(trigger: HTMLElement, name: string) {
  fireEvent.click(trigger)
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
}
