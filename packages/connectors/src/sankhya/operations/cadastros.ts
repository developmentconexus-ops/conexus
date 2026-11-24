import { z } from 'zod'
import type { OperationId } from '../../kernel/operation.ts'
import { get } from '../../kernel/operation.ts'
import { DayAndTime, defineRoute, FirstPage, firstCode, Page } from './route.ts'

export const empresas = defineRoute({
  id: 'empresas',
  subject: 'cadastros',
  summary:
    'Lista as empresas do Sankhya (código e nome), uma página por chamada; a página começa em 0.',
  label: 'Empresas',
  input: FirstPage,
  rowsAt: 'empresas',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/empresas', input),
})

/** The probe of a read that needs a company: the first one `empresas` read, on the route's first page. */
export function companyProbe(page: 0 | 1) {
  return (earlier: ReadonlyMap<OperationId, unknown>) => {
    const codigoEmpresa = firstCode(earlier, empresas.id, 'codigoEmpresa')
    return codigoEmpresa === undefined ? null : { codigoEmpresa, page }
  }
}

export const clientes = defineRoute({
  id: 'clientes',
  subject: 'cadastros',
  summary:
    'Lista os clientes do Sankhya (documento, nome, endereço e os campos AD_ da empresa), uma página por chamada, em ordem de código; a página começa em 0. Não filtra por nome nem por documento, só por página e data de alteração: para achar por nome, documento ou código, use `buscarParceiros`.',
  label: 'Clientes',
  input: z.strictObject({ page: Page(0), dataHoraAlteracao: DayAndTime.optional() }),
  rowsAt: 'clientes',
  probe: () => ({ page: 0 }),
  request: (input) =>
    get('/v1/parceiros/clientes', { ...input, sort_by: 'codigoCliente', sort_order: 'ASC' }),
})

export const vendedores = defineRoute({
  id: 'vendedores',
  subject: 'cadastros',
  summary:
    'Lista os vendedores (nome, gerente, comissões); a página começa em 0. `modifiedSince` traz só o que mudou depois de uma data.',
  label: 'Vendedores',
  input: z.strictObject({ page: Page(0), modifiedSince: DayAndTime.optional() }),
  rowsAt: 'vendedores',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/vendedores', input),
})

export const tiposOperacao = defineRoute({
  id: 'tiposOperacao',
  subject: 'cadastros',
  summary:
    'Lista os tipos de operação (TOP: código, nome, tipo de movimento); a página começa em 0. `tipoMovimento` filtra por um tipo.',
  label: 'Tipos de operação',
  input: z.strictObject({ page: Page(0), tipoMovimento: z.number().int().optional() }),
  rowsAt: 'data',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/tipos-operacao', input),
})

export const naturezas = defineRoute({
  id: 'naturezas',
  subject: 'cadastros',
  summary: 'Lista as naturezas financeiras (código, nome, natureza pai); a página começa em 0.',
  label: 'Naturezas',
  input: FirstPage,
  rowsAt: 'data',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/naturezas', input),
})

export const centrosResultado = defineRoute({
  id: 'centrosResultado',
  subject: 'cadastros',
  summary: 'Lista os centros de resultado (código, nome, centro pai); a página começa em 0.',
  label: 'Centros de resultado',
  input: FirstPage,
  rowsAt: 'data',
  probe: () => ({ page: 0 }),
  request: (input) => get('/v1/centros-resultado', input),
})
