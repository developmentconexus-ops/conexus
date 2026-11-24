import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { companyProbe, empresas } from './cadastros.ts'
import { Code, DayAndTime, defineRoute, Page } from './route.ts'

export const transportadoras = defineRoute({
  id: 'transportadoras',
  subject: 'logistica',
  summary:
    'Lista as transportadoras (código, nome, CNPJ, cidade); a página começa em 0. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Transportadoras',
  input: z.strictObject({ page: Page(0), modifiedSince: DayAndTime.optional() }),
  rowsAt: 'transportadoras',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/parceiros/transportadoras', input),
})

export const ordensCarga = defineRoute({
  id: 'ordensCarga',
  subject: 'logistica',
  summary:
    'Lista as ordens de carga de uma empresa (veículo, motorista, transportadora, situação); a página começa em 0.',
  label: 'Ordens de carga',
  input: z.strictObject({ codigoEmpresa: Code, page: Page(0) }),
  rowsAt: 'ordensCarga',
  from: [empresas.id],
  probe: companyProbe(0),
  request: (input) => get('/v1/logistica/ordens-carga', input),
})
