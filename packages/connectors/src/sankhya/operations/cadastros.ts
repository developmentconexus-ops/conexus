import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { defineOperation, get } from '../../kernel/operation.ts'
import { rows } from '../answers.ts'
import { DateTime, firstCode, Page } from './shared.ts'

export const empresas = defineOperation({
  id: 'empresas',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista as empresas do Sankhya (código e nome), uma página por chamada; a página começa em 0.',
  label: 'Empresas',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'empresas' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/empresas', { page }),
})

/** The probe of every read that needs a company: the first one `empresas` read, on the route's first page. */
export function empresaPage(page: 0 | 1) {
  return (earlier: ReadonlyMap<OperationId, unknown>) => {
    const codigoEmpresa = firstCode(earlier, empresas.id, 'codigoEmpresa')
    return codigoEmpresa === undefined ? null : { codigoEmpresa, page }
  }
}

export const clientes = defineOperation({
  id: 'clientes',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os clientes do Sankhya (documento, nome, endereço e os campos AD_ da empresa), uma página por chamada; a página começa em 0.',
  label: 'Clientes',
  input: z.object({ page: Page(0), dataHoraAlteracao: DateTime.optional() }),
  ...rows({ list: 'clientes' }),
  probe: () => ({ page: 0 }),
  request: (input) =>
    get('/v1/parceiros/clientes', { ...input, sort_by: 'codigoCliente', sort_order: 'ASC' }),
})

export const vendedores = defineOperation({
  id: 'vendedores',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os vendedores (nome, gerente, comissões); a página começa em 0. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Vendedores',
  input: z.object({ page: Page(0), modifiedSince: DateTime.optional() }),
  ...rows({ list: 'vendedores' }),
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/vendedores', input),
})

export const tiposOperacao = defineOperation({
  id: 'tiposOperacao',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Lista os tipos de operação (TOP: código, nome, tipo de movimento); a página começa em 0. `tipoMovimento` filtra por um tipo.',
  label: 'Tipos de operação',
  input: z.object({ page: Page(0), tipoMovimento: z.number().int().optional() }),
  ...rows({ list: 'data' }),
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/tipos-operacao', input),
})

export const naturezas = defineOperation({
  id: 'naturezas',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary: 'Lista as naturezas financeiras (código, nome, natureza pai); a página começa em 0.',
  label: 'Naturezas',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'data' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/naturezas', { page }),
})

export const centrosResultado = defineOperation({
  id: 'centrosResultado',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary: 'Lista os centros de resultado (código, nome, centro pai); a página começa em 0.',
  label: 'Centros de resultado',
  input: z.object({ page: Page(0) }),
  ...rows({ list: 'data' }),
  probe: () => ({ page: 0 }),
  request: ({ page }) => get('/v1/centros-resultado', { page }),
})
