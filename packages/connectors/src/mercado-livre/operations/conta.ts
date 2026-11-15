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
  probe: () => ({}),
  request: () => get('/users/me'),
})
