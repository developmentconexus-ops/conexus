import { listModelAccounts, listModelProviders, ModelAccount } from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER } from './sweep-replies.ts'

const PAGE = `/companies/${COMPANY.id}/settings/model-accounts`
export const LONG_WORD = 'PalavraSemEspacoComQuarentaLetrasAQUI'

function accountOf(n: number, fields: Record<string, unknown>) {
  return ModelAccount.parse({
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    owner: 'company',
    kind: 'api_key',
    provider: 'anthropic',
    position: 0,
    state: 'ready',
    limitedUntil: null,
    kindOff: false,
    hint: 'x7Qa',
    linkedBy: 'Ana Lima',
    linkedAt: '2026-10-19T12:00:00.000Z',
    assignees: [],
    revision: 1,
    ...fields,
  })
}

/** Several accounts in two queues, one of each state, one reserved and one with a name that never breaks. */
function withAccounts(base: typeof OWNER, mayManage: boolean) {
  const company = [
    accountOf(1, { label: 'Claude do financeiro', position: 0 }),
    accountOf(2, { label: 'Claude reserva', position: 1, assignees: ['person-ana'] }),
    accountOf(3, { label: LONG_WORD, position: 2, state: 'paused' }),
    accountOf(4, {
      label: 'Claude da noite',
      position: 3,
      limitedUntil: '2026-10-28T18:30:00.000Z',
    }),
    accountOf(5, { label: 'GPT da empresa', provider: 'openai', hint: 'k3Zp' }),
  ]
  const mine = [accountOf(6, { label: 'Minha Claude', owner: 'me', hint: 'm9Xc' })]
  return {
    ...base,
    [`GET /api/companies/${COMPANY.id}/model-accounts`]: ok(listModelAccounts, {
      company,
      mine,
      order: [],
      kinds: ['claude_subscription'],
      defaults: { company: null, mine: null, start: null, companyStart: null },
      choices: { mine: [], company: [] },
      fallback: { enabled: false, chain: [], revision: 0 },
      usableProviders: ['anthropic', 'openai'],
      mayManage,
    }),
    'GET /api/model-providers': ok(listModelProviders, {
      providers: [
        { id: 'anthropic', name: 'Anthropic', models: [] },
        { id: 'openai', name: 'OpenAI', models: [] },
      ],
    }),
  }
}

// The screens step 13.2 builds for Contas de modelo: the accounts in tables and their menu and panel.
export const ACCOUNT_STATES: State[] = [
  {
    name: 'Configurações, contas de modelo em tabela do dono',
    path: PAGE,
    replies: withAccounts(OWNER, true),
    settle: (p) => waitFor(p, LONG_WORD),
  },
  {
    name: 'Configurações, contas de modelo com o menu aberto',
    path: PAGE,
    replies: withAccounts(OWNER, true),
    settle: async (page) => {
      await waitFor(page, LONG_WORD)
      await page.getByRole('button', { name: 'Mais ações para Claude reserva' }).click()
      await page.getByRole('menuitem', { name: 'Renomear' }).waitFor()
    },
  },
  {
    name: 'Configurações, contas de modelo com Ligar conta aberto',
    path: PAGE,
    replies: withAccounts(OWNER, true),
    settle: async (page) => {
      await waitFor(page, LONG_WORD)
      await page.getByRole('button', { name: 'Ligar conta' }).last().click()
      await page.getByRole('dialog', { name: 'Ligar conta' }).waitFor()
    },
  },
  {
    name: 'Configurações, contas de modelo em tabela do membro',
    path: PAGE,
    replies: withAccounts(MEMBER, false),
    settle: (p) => waitFor(p, 'Só o dono ou um administrador muda as contas de modelo'),
  },
]
