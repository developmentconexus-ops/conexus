import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { defineOperation } from '../../kernel/operation.ts'
import { restAnswer } from '../answers.ts'
import { Code, DateTime, get, maybe, Page } from './shared.ts'

const Empresas = z.object({
  empresas: z.array(
    z.object({
      codigoEmpresa: Code,
      nomeFantasia: maybe(z.string()),
      razaoSocial: maybe(z.string()),
    }),
  ),
})

export const empresas = defineOperation({
  id: 'empresas',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista as empresas do Sankhya (código e nome), uma página por chamada; a página começa em 0.',
  label: 'Empresas',
  input: z.object({ page: Page(0) }),
  output: Empresas,
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/empresas', { page }),
  answer: (answer) => restAnswer(answer, Empresas),
})

/** The first company an earlier probe read: the operations that need a company code start from it. */
function firstEmpresa(earlier: ReadonlyMap<OperationId, unknown>) {
  return Empresas.safeParse(earlier.get(empresas.id)).data?.empresas[0]
}

/** The probe of every read that needs a company: the first one `empresas` read, on page 1. */
export function firstEmpresaPage(earlier: ReadonlyMap<OperationId, unknown>) {
  const first = firstEmpresa(earlier)
  return first ? { codigoEmpresa: first.codigoEmpresa, page: 1 } : null
}

const Clientes = z.object({
  clientes: z.array(
    z.object({
      codigoCliente: Code,
      tipo: maybe(z.enum(['PF', 'PJ'])),
      cnpjCpf: maybe(z.string()),
      nome: maybe(z.string()),
      razao: maybe(z.string()),
      email: maybe(z.string()),
      endereco: maybe(z.object({ cidade: maybe(z.string()), uf: maybe(z.string()) })),
      camposAdicionais: maybe(z.record(z.string(), z.string())),
    }),
  ),
  temMaisRegistros: z.boolean(),
})

export const clientes = defineOperation({
  id: 'clientes',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os clientes do Sankhya (documento, nome, cidade e os campos AD_ da empresa), uma página por chamada; a página começa em 1.',
  label: 'Clientes',
  input: z.object({ page: Page(1), dataHoraAlteracao: DateTime.optional() }),
  output: Clientes,
  probe: () => ({ page: 1 }),
  request: (input) =>
    get('/v1/parceiros/clientes', { ...input, sort_by: 'codigoCliente', sort_order: 'ASC' }),
  answer: (answer) => restAnswer(answer, Clientes, { clientes: [], temMaisRegistros: false }),
})

const Vendedores = z.object({
  vendedores: z.array(
    z.object({
      codigoVendedor: Code,
      nome: maybe(z.string()),
      ativo: maybe(z.boolean()),
      tipo: maybe(z.number().int()),
      email: maybe(z.string()),
      codigoEmpresa: maybe(Code),
      codigoParceiro: maybe(Code),
      codigoGerente: maybe(Code),
      nomeGerente: maybe(z.string()),
      comissaoVenda: maybe(z.number()),
      comissaoGerencia: maybe(z.number()),
    }),
  ),
})

export const vendedores = defineOperation({
  id: 'vendedores',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os vendedores (nome, gerente, comissões); a página começa em 0 e a lista não diz quando acaba. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Vendedores',
  input: z.object({ page: Page(0), modifiedSince: DateTime.optional() }),
  output: Vendedores,
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/vendedores', input),
  answer: (answer) => restAnswer(answer, Vendedores),
})

const TipoOperacao = z.object({
  codigoTipoOperacao: Code,
  nome: maybe(z.string()),
  tipoMovimento: maybe(z.number().int()),
  ativo: maybe(z.boolean()),
})
/** The documentation shows one object where the other lists send an array: both come back as a list. */
const TiposOperacao = z
  .union([z.array(TipoOperacao), TipoOperacao])
  .transform((value) => ({ tiposOperacao: Array.isArray(value) ? value : [value] }))

export const tiposOperacao = defineOperation({
  id: 'tiposOperacao',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os tipos de operação (TOP: código, nome, tipo de movimento); a página começa em 1 e a lista não diz quando acaba. `tipoMovimento` filtra por um tipo.',
  label: 'Tipos de operação',
  input: z.object({ page: Page(1), tipoMovimento: z.number().int().optional() }),
  output: TiposOperacao,
  probe: () => ({ page: 1 }),
  request: (input) => get('/v1/tipos-operacao', input),
  answer: (answer) => restAnswer(answer, TiposOperacao),
})

const Naturezas = z
  .array(
    z.object({
      codigoNatureza: Code,
      nome: z.string(),
      analitica: maybe(z.boolean()),
      grau: maybe(Code),
      ativo: maybe(z.boolean()),
      codigoCentroResultado: maybe(Code),
      codigoNaturezaPai: maybe(Code),
      tipoNatureza: maybe(z.number().int()),
    }),
  )
  .transform((naturezas) => ({ naturezas }))

export const naturezas = defineOperation({
  id: 'naturezas',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista as naturezas financeiras (código, nome, natureza pai); a página começa em 1 e a lista não diz quando acaba.',
  label: 'Naturezas',
  input: z.object({ page: Page(1) }),
  output: Naturezas,
  probe: () => ({ page: 1 }),
  request: ({ page }) => get('/v1/naturezas', { page }),
  answer: (answer) => restAnswer(answer, Naturezas),
})

const CentrosResultado = z
  .array(
    z.object({
      codigoCentroResultado: Code,
      nome: z.string(),
      analitico: maybe(z.boolean()),
      grau: maybe(Code),
      ativo: z.boolean(),
      codigoCentroResultadoPai: maybe(Code),
    }),
  )
  .transform((centrosResultado) => ({ centrosResultado }))

export const centrosResultado = defineOperation({
  id: 'centrosResultado',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os centros de resultado (código, nome, centro pai); a página começa em 1 e a lista não diz quando acaba.',
  label: 'Centros de resultado',
  input: z.object({ page: Page(1) }),
  output: CentrosResultado,
  probe: () => ({ page: 1 }),
  request: ({ page }) => get('/v1/centros-resultado', { page }),
  answer: (answer) => restAnswer(answer, CentrosResultado, []),
})
