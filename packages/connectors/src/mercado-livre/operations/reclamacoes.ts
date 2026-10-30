import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { chain, Limit, Offset, PathId, readOf, sellerOf } from './shared.ts'

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
  list: 'data',
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

/** What a read of one claim shares: its id, taken from the claim search. */
const ofClaim = {
  input: z.object({ claimId: PathId }),
  list: null,
  from: [reclamacoes.id],
  probe: chain(reclamacoes.id, 'id', (claimId) => ({ claimId })),
}

export const reclamacao = readOf({
  id: 'reclamacao',
  subject: 'reclamacoes',
  docs: 'gerenciar-reclamacoes',
  summary: 'Mostra uma reclamação pelo id: tipo, etapa, motivo, datas e a resolução quando há.',
  label: 'Reclamação',
  ...ofClaim,
  request: (input) => get(`/post-purchase/v1/claims/${input.claimId}`),
})

export const devolucao = readOf({
  id: 'devolucao',
  subject: 'reclamacoes',
  docs: 'gerenciar-devolucoes',
  summary: 'Mostra a devolução ligada a uma reclamação: status, tipo e datas.',
  label: 'Devolução',
  ...ofClaim,
  request: (input) => get(`/post-purchase/v2/claims/${input.claimId}/returns`),
})
