import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { Id, maybe, Paging, readOf, sellerOf } from './shared.ts'

const Promocoes = z.object({
  results: z.array(
    z.object({
      id: Id,
      type: maybe(z.string()),
      status: maybe(z.string()),
      name: maybe(z.string()),
      start_date: maybe(z.string()),
      finish_date: maybe(z.string()),
    }),
  ),
  paging: maybe(Paging),
})

export const promocoes = readOf({
  id: 'promocoes',
  subject: 'promocoes',
  docs: 'gerenciar-promocoes',
  summary:
    'Lista as promoções e campanhas a que o vendedor pode aderir: tipo, status, nome e datas.',
  label: 'Promoções',
  input: z.object({}),
  output: Promocoes,
  probe: () => ({}),
  request: (_input, account) =>
    get(`/seller-promotions/users/${sellerOf(account)}`, { app_version: 'v2' }),
})
