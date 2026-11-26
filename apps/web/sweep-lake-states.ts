import type { ClientLake } from '@conexus/hub-api'
import { getClientLake } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { failure, ok } from './layout-harness.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { CLIENT_ID, central } from './sweep-replies.ts'

const CLIENT = `/operations/clients/${CLIENT_ID}`
const LAKE = `GET /api/clients/${CLIENT_ID}/lake`
const AT = '2026-11-22T10:42:00.000-03:00'

/** The active client with its lake in `lake`'s state. */
function withLake(lake: ClientLake): Replies {
  return { ...central('ACTIVE'), [LAKE]: ok(getClientLake, { lake }) }
}

const READY = {
  state: 'READY',
  bucket: 'conexus-k3x9a0b1c2d3',
  region: 'us-east-2',
  readyAt: AT,
  outdated: false,
} as const

/** The "Lago de dados" block in each of its states, its read refused, and the confirmation (card criterion 66). */
export const LAKE_STATES: State[] = [
  {
    name: 'lago, sem lago',
    path: CLIENT,
    replies: withLake({ state: 'NONE' }),
    settle: (p) => waitFor(p, 'Esta empresa ainda não tem lago.'),
  },
  {
    name: 'lago, criando',
    path: CLIENT,
    replies: withLake({ state: 'CREATING', since: AT }),
    settle: (p) => waitFor(p, 'Criando o lago…'),
  },
  {
    name: 'lago, pronto',
    path: CLIENT,
    replies: withLake(READY),
    settle: (p) => waitFor(p, /está em us-east-2 desde/),
  },
  {
    name: 'lago, pronto de receita anterior',
    path: CLIENT,
    replies: withLake({ ...READY, outdated: true }),
    settle: (p) => waitFor(p, /Este lago é de uma receita anterior\./),
  },
  {
    name: 'lago, não deu para criar',
    path: CLIENT,
    replies: withLake({ state: 'FAILED', code: 'LAKE_CREATE_FAILED', at: AT }),
    settle: (p) => waitFor(p, 'Não deu para criar o lago. A AWS desfez o que tinha começado.'),
  },
  {
    name: 'lago, apagando',
    path: CLIENT,
    replies: withLake({ state: 'DELETING', since: AT }),
    settle: (p) => waitFor(p, 'Apagando o lago…'),
  },
  {
    name: 'lago, não deu para apagar',
    path: CLIENT,
    replies: withLake({ state: 'DELETE_FAILED', at: AT }),
    settle: (p) => waitFor(p, 'Não deu para apagar o lago.'),
  },
  {
    name: 'lago, a leitura falhou',
    path: CLIENT,
    replies: { ...central('ACTIVE'), [LAKE]: failure('DATABASE_UNAVAILABLE') },
    settle: (p) => waitFor(p, 'Não deu para ler o lago agora.'),
  },
  {
    name: 'lago, criar recusado',
    path: CLIENT,
    replies: {
      ...withLake({ state: 'NONE' }),
      [`POST /api/clients/${CLIENT_ID}/lake`]: failure('LAKE_BUSY'),
    },
    settle: async (page) => {
      await page.getByRole('button', { name: 'Criar o lago' }).click()
      await waitFor(page, 'O lago está mudando agora. Espere terminar.')
    },
  },
  {
    name: 'lago, a confirmação de apagar',
    path: CLIENT,
    replies: withLake(READY),
    settle: async (page) => {
      await page.getByRole('button', { name: 'Apagar o lago' }).click()
      await page.getByRole('alertdialog').waitFor()
    },
  },
]
