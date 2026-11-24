import {
  getAccountKinds,
  listMembers,
  listModelAccounts,
  listModelProviders,
  PAGE_SIZE,
} from '@conexus/hub-api'
import { fireEvent, screen } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import { ANA } from '../../platform/fixtures.ts'
import { companyRead, memberView, sessionRead } from '../../platform/test-hub.tsx'
import type { Answers, Sent, View } from './test-view.ts'
import { BASE } from './test-view.ts'
import { writes } from './test-writes.tsx'

const DIEGO = { personId: 'person-diego', name: 'Diego', email: 'diego@example.test' }

/** Sonnet takes every level, Mistral Large never "off", the others only "off". */
function effortsOfFake(name: string) {
  if (name === 'claude-sonnet-4') return ['off', 'low', 'high']
  return name === 'mistral-large' ? ['low', 'high'] : ['off']
}

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4', 'claude-opus-4'] },
  { id: 'mistral', name: 'Mistral', models: ['mistral-large'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-5'] },
].map((provider) => ({
  ...provider,
  models: provider.models.map((name) => ({
    id: `${provider.id}/${name}`,
    efforts: effortsOfFake(name),
  })),
}))

export type { Answers, View } from './test-view.ts'
export { accountOf } from './test-view.ts'

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

/** What the Hub offers each picker: the providers a test says are connected, with all their models. */
function choicesFor(view: View) {
  const connected = view.connected ?? { mine: [], company: [] }
  return {
    mine: PROVIDERS.filter((one) => connected.mine.includes(one.id)),
    company: PROVIDERS.filter((one) => connected.company.includes(one.id)),
  }
}

function reads(view: View): HttpHandler[] {
  return [
    sessionRead(() => ANA),
    membersPages(view),
    ...companyRead({ role: view.role ?? (view.mayManage ? 'owner' : 'member') }),
    http.get(`${BASE}/model-accounts`, () =>
      HttpResponse.json(
        listModelAccounts.success.body.parse({
          defaults: { company: null, mine: null, start: null, companyStart: null },
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: [],
          choices: choicesFor(view),
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

/** The Hub as Ana sees the company's model accounts; `sent` lists the writes it received. */
export function modelHub(view: View, answers: Answers = {}) {
  const sent: Sent[] = []
  return {
    sent,
    handlers: [...reads(view), ...writes(view, sent, answers)],
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

/** The "…" menu of the account named `label`, opened, and its item `item` chosen. */
export async function pickFromMenu(label: string, item: string) {
  fireEvent.click(await screen.findByRole('button', { name: `Mais ações para ${label}` }))
  fireEvent.click(await screen.findByRole('menuitem', { name: item }))
}
