import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { maybe, readOf } from './shared.ts'

/** The seller's own account: no e-mail, phone or address (nothing here needs them). */
const Conta = z.object({
  id: z.union([z.string().min(1), z.number().int()]).transform(String),
  nickname: z.string(),
  site_id: maybe(z.string()),
  country_id: maybe(z.string()),
  user_type: maybe(z.string()),
  permalink: maybe(z.string()),
  registration_date: maybe(z.string()),
})

export const conta = readOf({
  id: 'conta',
  subject: 'conta',
  docs: 'usuarios-e-aplicativos',
  summary:
    'Mostra a conta do vendedor que autorizou o app: id, apelido, país, tipo e data de cadastro.',
  label: 'Conta',
  input: z.object({}),
  output: Conta,
  probe: () => ({}),
  request: () => get('/users/me'),
})
