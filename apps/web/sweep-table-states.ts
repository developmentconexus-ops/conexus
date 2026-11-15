import { listCopyRuns, sampleCopy } from '@conexus/hub-api'
import { failure, ok } from './layout-harness.ts'
import type { RunIn } from './sweep-copies-states.ts'
import {
  CLIENTES,
  COMPANY_API,
  copiesPage,
  copyOf,
  DONE,
  LISTED,
  PAGE,
  RUNNING,
  SOURCE_DOWN,
  VENDAS,
} from './sweep-copies-states.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'

const COLUMNED = copyOf(VENDAS, 'vendas', 'Vendas', {
  shown: {
    ...copyOf(VENDAS, 'vendas', 'Vendas', {}).shown,
    description: 'As notas de venda da Matriz',
    columns: [
      { name: 'NUNOTA', type: 'bigint', description: 'O número da nota', inactiveSince: null },
      { name: 'VLRNOTA', type: 'numeric', description: null, inactiveSince: null },
      {
        name: 'OBS',
        type: 'text',
        description: 'A observação',
        inactiveSince: '2026-11-10T08:00:00.000Z',
      },
    ],
  },
})

function columnedPage() {
  return {
    ...copiesPage([COLUMNED]),
    [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: ok(listCopyRuns, {
      copy: COLUMNED,
      runs: [DONE],
      next: { kind: 'END' },
    }),
  }
}

function detailPage(runs: RunIn[]) {
  return {
    ...copiesPage(LISTED),
    [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: ok(listCopyRuns, {
      copy: copyOf(VENDAS, 'vendas', 'Vendas', {}),
      runs,
      next: { kind: 'END' },
    }),
  }
}

/** The page of one table of Dados: its tabs, the notice of a column that stopped, and the failures. */
export const TABLE_STATES: State[] = [
  {
    name: 'A tabela, a consulta e as rodadas',
    path: `${PAGE}/${VENDAS}?tab=runs`,
    replies: detailPage([RUNNING, SOURCE_DOWN, DONE]),
    settle: (p) => waitFor(p, 'O sistema não respondeu.'),
  },
  {
    name: 'A tabela, sem rodada ainda',
    path: `${PAGE}/${VENDAS}?tab=runs`,
    replies: detailPage([]),
    settle: (p) => waitFor(p, 'A primeira rodada ainda não terminou.'),
  },
  {
    name: 'A tabela, as colunas com uma inativa',
    path: `${PAGE}/${VENDAS}`,
    replies: columnedPage(),
    settle: (p) => waitFor(p, 'Inativa desde 10/11'),
  },
  {
    name: 'A tabela, a amostra',
    path: `${PAGE}/${VENDAS}?tab=sample`,
    replies: {
      ...columnedPage(),
      [`GET ${COMPANY_API}/copies/${VENDAS}/sample`]: ok(sampleCopy, {
        sample: {
          columns: ['NUNOTA', 'CODPARC'],
          rows: [1, 2, 3, 4, 5].map((n) => [n * 100, `P${n}`]),
          complete: false,
        },
      }),
    },
    settle: (p) => waitFor(p, 'A cópia tem mais linhas que estas cinco.'),
  },
  {
    name: 'Uma cópia que não existe',
    path: `${PAGE}/${CLIENTES.replace('2', '9')}`,
    replies: {
      ...copiesPage(LISTED),
      [`GET ${COMPANY_API}/copies/${CLIENTES.replace('2', '9')}/runs`]: failure('COPY_NOT_FOUND'),
    },
    settle: (p) => waitFor(p, 'Não encontramos o que você procurou.'),
  },
  {
    name: 'A tabela, a leitura das rodadas que falhou',
    path: `${PAGE}/${VENDAS}`,
    replies: {
      ...detailPage([]),
      [`GET ${COMPANY_API}/copies/${VENDAS}/runs`]: failure('DATABASE_UNAVAILABLE'),
    },
    settle: (p) => waitFor(p, 'O banco do Conexus não respondeu.'),
  },
]
