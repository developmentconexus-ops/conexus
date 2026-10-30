import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { empresaPage, empresas } from './cadastros.ts'
import { Code, DateTime, get, Page } from './shared.ts'

export const transportadoras = defineOperation({
  id: 'transportadoras',
  class: 'read' as const,
  subject: 'logistica',
  idempotent: true,
  summary:
    'Lista as transportadoras (código, nome, CNPJ, cidade); a página começa em 0. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Transportadoras',
  input: z.object({ page: Page(0), modifiedSince: DateTime.optional() }),
  ...rows({ list: 'transportadoras' }),
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/parceiros/transportadoras', input),
})

export const ordensCarga = defineOperation({
  id: 'ordensCarga',
  class: 'read' as const,
  subject: 'logistica',
  idempotent: true,
  summary:
    'Lista as ordens de carga de uma empresa (veículo, motorista, transportadora, situação); a página começa em 0.',
  label: 'Ordens de carga',
  input: z.object({ codigoEmpresa: Code, page: Page(0) }),
  ...rows({ list: 'ordensCarga' }),
  from: [empresas.id],
  probe: empresaPage(0),
  request: (input) => get('/v1/logistica/ordens-carga', input),
})
