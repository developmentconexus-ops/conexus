import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { empresas, firstEmpresaPage } from './cadastros.ts'
import { Code, DateTime, get, maybe, Page } from './shared.ts'

/** Both routes send the end of the list as text or as a boolean, and may leave it out. */
const Paginacao = maybe(z.object({ hasMore: maybe(z.union([z.string(), z.boolean()])) }))

const Transportadoras = z.object({
  transportadoras: z.array(
    z.object({
      codigoTransportadora: Code,
      nome: z.string(),
      cnpj: z.string(),
      ativo: maybe(z.boolean()),
      email: maybe(z.string()),
      telefone: maybe(z.string()),
      endereco: maybe(z.object({ cidade: maybe(z.string()), uf: maybe(z.string()) })),
    }),
  ),
  pagination: Paginacao,
})

export const transportadoras = defineOperation({
  id: 'transportadoras',
  class: 'read' as const,
  subject: 'logistica',
  idempotent: true,
  summary:
    'Lista as transportadoras (código, nome, CNPJ, cidade); a página começa em 1 e `pagination.hasMore` diz se há outra. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Transportadoras',
  input: z.object({ page: Page(1), modifiedSince: DateTime.optional() }),
  output: Transportadoras,
  probe: () => ({ page: 1 }),
  request: (input) => get('/v1/parceiros/transportadoras', input),
  answer: (answer) => restAnswer(answer, Transportadoras),
})

const OrdensCarga = z.object({
  ordensCarga: z.array(
    z.object({
      codigoOrdemCarga: Code,
      codigoEmpresa: maybe(Code),
      nomeEmpresa: maybe(z.string()),
      dataInicio: maybe(z.string()),
      dataPrevistaSaida: maybe(z.string()),
      codigoVeiculo: maybe(Code),
      codigoRegiao: maybe(Code),
      nomeRegiao: maybe(z.string()),
      codigoTransportadora: maybe(Code),
      nomeTransportadora: maybe(z.string()),
      codigoMotorista: maybe(Code),
      nomeMotorista: maybe(z.string()),
      tipo: maybe(z.number().int()),
      situacao: maybe(z.number().int()),
    }),
  ),
  pagination: Paginacao,
})

export const ordensCarga = defineOperation({
  id: 'ordensCarga',
  class: 'read' as const,
  subject: 'logistica',
  idempotent: true,
  summary:
    'Lista as ordens de carga de uma empresa (veículo, motorista, transportadora, situação); a página começa em 1 e `pagination.hasMore` diz se há outra.',
  label: 'Ordens de carga',
  input: z.object({ codigoEmpresa: Code, page: Page(1) }),
  output: OrdensCarga,
  from: [empresas.id],
  probe: firstEmpresaPage,
  request: (input) => get('/v1/logistica/ordens-carga', input),
  answer: (answer) => restAnswer(answer, OrdensCarga),
})
