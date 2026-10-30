import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { readOf, sellerOf } from './shared.ts'

export const promocoes = readOf({
  id: 'promocoes',
  subject: 'promocoes',
  docs: 'gerenciar-promocoes',
  summary:
    'Lista as promoções e campanhas a que o vendedor pode aderir: tipo, status, nome e datas.',
  label: 'Promoções',
  input: z.object({}),
  list: 'results',
  probe: () => ({}),
  request: (_input, account) =>
    get(`/seller-promotions/users/${sellerOf(account)}`, { app_version: 'v2' }),
})
