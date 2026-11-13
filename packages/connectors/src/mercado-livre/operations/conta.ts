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
  // The seller may be a person: their own contact, address and document.
  personal: [
    { path: 'email', kind: 'contato' },
    { path: 'phone', kind: 'contato' },
    { path: 'alternative_phone', kind: 'contato' },
    { path: 'first_name', kind: 'contato' },
    { path: 'last_name', kind: 'contato' },
    { path: 'address', kind: 'endereco' },
    { path: 'identification', kind: 'documento' },
  ],
  probe: () => ({}),
  request: () => get('/users/me'),
})
