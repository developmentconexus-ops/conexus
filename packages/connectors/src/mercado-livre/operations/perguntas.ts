import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { Limit, Offset, readOf, sellerOf } from './shared.ts'

export const perguntas = readOf({
  id: 'perguntas',
  subject: 'perguntas',
  docs: 'gerenciamento-perguntas-respostas',
  summary:
    'Lista as perguntas feitas nos anúncios do vendedor, com a resposta quando há, uma página por chamada (até 50). As sem resposta aparecem por 7 meses. Com `scan` a busca é uma varredura que passa de mil: a primeira página manda `scan`, e a resposta traz o `seguinte` (o `scrollId` da próxima, que vale 5 minutos).',
  label: 'Perguntas',
  input: z.object({
    status: z
      .enum([
        'UNANSWERED',
        'ANSWERED',
        'CLOSED_UNANSWERED',
        'UNDER_REVIEW',
        'BANNED',
        'DELETED',
        'DISABLED',
      ])
      .optional(),
    offset: Offset.optional(),
    scan: z.literal(true).optional(),
    scrollId: z.string().min(1).max(4000).optional(),
    limit: Limit(50),
  }),
  list: 'questions',
  omit: ['from'], // the asker: the question route adds their name and contact
  probe: () => ({ offset: 0, limit: 5 }),
  request: (input, account) =>
    get('/questions/search', {
      seller_id: sellerOf(account),
      api_version: 4,
      status: input.status,
      search_type: input.scan === true || input.scrollId !== undefined ? 'scan' : undefined,
      scroll_id: input.scrollId,
      offset: input.offset,
      limit: input.limit,
    }),
})

export const tempoDeResposta = readOf({
  id: 'tempoDeResposta',
  subject: 'perguntas',
  docs: 'gerenciamento-perguntas-respostas',
  summary: 'Mostra o tempo médio, em minutos, que o vendedor leva para responder as perguntas.',
  label: 'Tempo de resposta',
  input: z.object({}),
  list: null,
  // gerenciamento-perguntas-respostas: a seller with no questions on their items gets this 404
  emptyNotFound: 'Response time not found for user id',
  probe: () => ({}),
  request: (_input, account) => get(`/users/${sellerOf(account)}/questions/response_time`),
})
