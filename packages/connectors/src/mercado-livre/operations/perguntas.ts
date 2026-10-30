import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { Id, Limit, maybe, Offset, readOf, sellerOf } from './shared.ts'

/** A question on a listing. The asker is left out: the route's `from` is the buyer, and the single question route adds their name and contact. */
const Pergunta = z.object({
  id: Id,
  text: z.string(),
  status: maybe(z.string()),
  date_created: maybe(z.string()),
  item_id: maybe(Id),
  answer: maybe(
    z.object({
      text: maybe(z.string()),
      status: maybe(z.string()),
      date_created: maybe(z.string()),
    }),
  ),
})

const Perguntas = z.object({
  total: z.number().int(),
  limit: maybe(z.number().int()),
  questions: z.array(Pergunta),
})

export const perguntas = readOf({
  id: 'perguntas',
  subject: 'perguntas',
  docs: 'gerenciamento-perguntas-respostas',
  summary:
    'Lista as perguntas feitas nos anúncios do vendedor, com a resposta quando há, uma página por chamada (até 50). As sem resposta aparecem por 7 meses.',
  label: 'Perguntas',
  input: z.object({
    status: z
      .enum(['UNANSWERED', 'ANSWERED', 'CLOSED_UNANSWERED', 'UNDER_REVIEW', 'BANNED', 'DELETED'])
      .optional(),
    offset: Offset,
    limit: Limit(50),
  }),
  output: Perguntas,
  probe: () => ({ offset: 0, limit: 5 }),
  request: (input, account) =>
    get('/questions/search', {
      seller_id: sellerOf(account),
      api_version: 4,
      status: input.status,
      offset: input.offset,
      limit: input.limit,
    }),
})

const TempoDeResposta = z.object({
  user_id: maybe(Id),
  total: maybe(z.object({ response_time: maybe(z.number()), sales: maybe(z.number()) })),
})

export const tempoDeResposta = readOf({
  id: 'tempoDeResposta',
  subject: 'perguntas',
  docs: 'gerenciamento-perguntas-respostas',
  summary: 'Mostra o tempo médio, em minutos, que o vendedor leva para responder as perguntas.',
  label: 'Tempo de resposta',
  input: z.object({}),
  output: TempoDeResposta,
  probe: () => ({}),
  request: (_input, account) => get(`/users/${sellerOf(account)}/questions/response_time`),
})
