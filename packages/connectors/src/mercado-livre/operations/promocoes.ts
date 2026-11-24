import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { defineRoute, sellerOf } from './route.ts'

export const promocoes = defineRoute({
  id: 'promocoes',
  subject: 'promocoes',
  docs: 'gerenciar-ofertas',
  summary:
    'Lista as promoções e campanhas a que o vendedor pode aderir: tipo, status, nome e datas.',
  label: 'Promoções',
  input: z.object({}),
  rowsAt: 'results',
  probe: () => ({}),
  request: (_input, account) =>
    get(`/seller-promotions/users/${sellerOf(account)}`, { app_version: 'v2' }),
})
