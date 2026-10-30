import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import {
  fromEarlier,
  Id,
  Limit,
  maybe,
  Offset,
  Paging,
  PathId,
  readOf,
  sellerOf,
} from './shared.ts'

const Reclamacao = z.object({
  id: Id,
  resource_id: maybe(Id),
  resource: maybe(z.string()),
  status: maybe(z.string()),
  type: maybe(z.string()),
  stage: maybe(z.string()),
  reason_id: maybe(z.string()),
  date_created: maybe(z.string()),
  last_updated: maybe(z.string()),
})

const Reclamacoes = z.object({ data: z.array(Reclamacao), paging: Paging })

export const reclamacoes = readOf({
  id: 'reclamacoes',
  subject: 'reclamacoes',
  docs: 'gerenciar-reclamacoes',
  summary:
    'Lista as reclamações em que o vendedor é o reclamado, por status (abertas por padrão), uma página por chamada (até 30).',
  label: 'Reclamações',
  input: z.object({
    status: z.enum(['opened', 'closed']).default('opened'),
    offset: Offset,
    limit: Limit(30),
  }),
  output: Reclamacoes,
  probe: () => ({ status: 'opened' as const, offset: 0, limit: 5 }),
  request: (input, account) =>
    get('/post-purchase/v1/claims/search', {
      'players.user_id': sellerOf(account),
      'players.role': 'respondent',
      status: input.status,
      offset: input.offset,
      limit: input.limit,
    }),
})

const Detalhe = Reclamacao.extend({
  resolution: maybe(z.object({ reason: maybe(z.string()), date_created: maybe(z.string()) })),
})

export const reclamacao = readOf({
  id: 'reclamacao',
  subject: 'reclamacoes',
  docs: 'gerenciar-reclamacoes',
  summary: 'Mostra uma reclamação pelo id: tipo, etapa, motivo, datas e a resolução quando há.',
  label: 'Reclamação',
  input: z.object({ claimId: PathId }),
  output: Detalhe,
  from: [reclamacoes.id],
  probe: (earlier) =>
    fromEarlier(earlier, reclamacoes, ({ data }) => (data[0] ? { claimId: data[0].id } : null)),
  request: (input) => get(`/post-purchase/v1/claims/${input.claimId}`),
})

const Devolucao = z.object({
  id: maybe(Id),
  claim_id: maybe(Id),
  status: maybe(z.string()),
  subtype: maybe(z.string()),
  date_created: maybe(z.string()),
  date_closed: maybe(z.string()),
})

export const devolucao = readOf({
  id: 'devolucao',
  subject: 'reclamacoes',
  docs: 'gerenciar-devolucoes',
  summary: 'Mostra a devolução ligada a uma reclamação: status, tipo e datas.',
  label: 'Devolução',
  input: z.object({ claimId: PathId }),
  output: Devolucao,
  from: [reclamacoes.id],
  probe: (earlier) =>
    fromEarlier(earlier, reclamacoes, ({ data }) => (data[0] ? { claimId: data[0].id } : null)),
  request: (input) => get(`/post-purchase/v2/claims/${input.claimId}/returns`),
})
