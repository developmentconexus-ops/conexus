import { listModelAccounts, listModelProviders, ModelAccount } from '@conexus/hub-api'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { MEMBER, OWNER } from './sweep-replies.ts'

const SETTINGS = `/companies/${COMPANY.id}/settings`
const SONNET = 'anthropic/claude-sonnet-4'
const GPT = 'openai/gpt-5'
const CLAUDE_DA_EMPRESA = ModelAccount.parse({
  id: '00000000-0000-4000-8000-000000000001',
  owner: 'company',
  kind: 'api_key',
  provider: 'anthropic',
  label: 'Claude da empresa',
  position: 0,
  state: 'ready',
  limitedUntil: null,
  kindOff: false,
  hint: 'x7Qa',
  linkedBy: 'Ana Lima',
  linkedAt: '2026-10-19T12:00:00.000Z',
  assignees: [],
  revision: 1,
})

/** The company's accounts with the defaults the 12.3 script sets: GPT 5 for the company. */
function withDefaults(base: typeof OWNER, mayManage: boolean, mine: boolean) {
  const company = { model: GPT, effort: 'medium' } as const
  const own = { model: SONNET, effort: 'high' } as const
  return {
    ...base,
    [`GET /api/companies/${COMPANY.id}/model-accounts`]: ok(listModelAccounts, {
      company: [CLAUDE_DA_EMPRESA],
      mine: [],
      order: [{ provider: 'anthropic', accounts: [CLAUDE_DA_EMPRESA.id] }],
      kinds: [],
      defaults: {
        company,
        mine: mine ? own : null,
        start: mine
          ? { ...own, from: 'mine', account: CLAUDE_DA_EMPRESA.label }
          : { ...company, from: 'company', account: CLAUDE_DA_EMPRESA.label },
        companyStart: { ...company, from: 'company', account: CLAUDE_DA_EMPRESA.label },
      },
      connected: { mine: ['anthropic', 'openai'], company: ['anthropic', 'openai'] },
      fallback: { enabled: false, chain: [], revision: 0 },
      usableProviders: ['anthropic', 'openai'],
      mayManage,
    }),
    'GET /api/model-providers': ok(listModelProviders, {
      providers: [
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: [{ id: SONNET, efforts: ['off', 'low', 'high'] }],
        },
        { id: 'openai', name: 'OpenAI', models: [{ id: GPT, efforts: ['low', 'medium', 'high'] }] },
      ],
    }),
  }
}

// The screens step 12.3 brings: Meus padrões and Padrões da empresa.
export const DEFAULT_STATES: State[] = [
  {
    name: 'Configurações, meus padrões com padrão próprio',
    path: `${SETTINGS}/my-defaults`,
    replies: withDefaults(MEMBER, false, true),
    settle: (p) => waitFor(p, 'Conta usada primeiro (Anthropic): Claude da empresa'),
  },
  {
    name: 'Configurações, meus padrões sem padrão próprio',
    path: `${SETTINGS}/my-defaults`,
    replies: withDefaults(MEMBER, false, false),
    settle: (p) => waitFor(p, 'Você segue o padrão da empresa.'),
  },
  {
    name: 'Configurações, padrões da empresa do dono',
    path: `${SETTINGS}/defaults`,
    replies: withDefaults(OWNER, true, false),
    settle: (p) => waitFor(p, 'Salvar padrão'),
  },
  {
    name: 'Configurações, padrões da empresa do membro',
    path: `${SETTINGS}/defaults`,
    replies: withDefaults(MEMBER, false, false),
    settle: (p) => waitFor(p, 'Só o dono ou um administrador muda os padrões da empresa.'),
  },
]
