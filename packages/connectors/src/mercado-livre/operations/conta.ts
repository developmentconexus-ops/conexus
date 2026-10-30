import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { readOf } from './shared.ts'

export const conta = readOf({
  id: 'conta',
  subject: 'conta',
  docs: 'usuarios-e-aplicativos',
  summary:
    'Mostra a conta do vendedor que autorizou o app: id, apelido, país, tipo e data de cadastro.',
  label: 'Conta',
  input: z.object({}),
  list: null,
  // The owner's own contact data is not what any read needs.
  omit: [
    'email',
    'phone',
    'alternative_phone',
    'first_name',
    'last_name',
    'identification',
    'address',
  ],
  probe: () => ({}),
  request: () => get('/users/me'),
})
