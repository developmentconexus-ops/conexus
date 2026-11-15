import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { queryRequest } from '../door.ts'
import { Codes, Extra, foundIn, NonNegativeCode, Number_, Text, Whole } from '../search-read.ts'
import { inList, pageSql } from '../search-sql.ts'

/** The most lines one stock read returns; the list of codes is the cut, so there is no cursor. */
const STOCK_LINES = 200

const Saldo = z
  .object({
    CODPROD: Whole,
    CODEMP: Whole,
    CODLOCAL: Whole,
    CONTROLE: Text,
    TIPO: Text,
    CODPARC: Whole.nullable(),
    ESTOQUE: Number_,
    RESERVADO: Number_,
    DISPONIVEL: Number_,
    EXTRA: Extra,
  })
  .transform((row) => ({
    codigoProduto: row.CODPROD,
    codigoEmpresa: row.CODEMP,
    codigoLocal: row.CODLOCAL,
    controle: row.CONTROLE,
    tipo: row.TIPO,
    codigoParceiro: row.CODPARC,
    estoque: row.ESTOQUE,
    reservado: row.RESERVADO,
    disponivel: row.DISPONIVEL,
    extra: row.EXTRA,
  }))

const EstoqueInput = z.strictObject({
  codigos: Codes(50),
  codigoEmpresa: NonNegativeCode.optional(),
  codigoLocal: NonNegativeCode.optional(),
})

export const estoqueDosProdutos = defineOperation({
  id: 'estoqueDosProdutos',
  class: 'read' as const,
  subject: 'estoque',
  idempotent: true,
  summary:
    'Lê o saldo de estoque de vários produtos de uma vez (até 50 códigos), por empresa, local e controle, com o reservado e o disponível; `codigoEmpresa` e `codigoLocal` restringem. Cada linha traz `tipo` e `codigoParceiro`, que dizem se o saldo é próprio ou de terceiros. Devolve até 200 linhas em ordem de produto, empresa, local, controle, tipo e parceiro, e `temMais`; se houver mais, peça menos produtos.',
  label: 'Estoque de vários produtos',
  input: EstoqueInput,
  ...foundIn(Saldo),
  probe: (): z.infer<typeof EstoqueInput> => ({ codigos: [11] }),
  request: (input) =>
    queryRequest(
      pageSql({
        select: [
          'E.CODPROD',
          'E.CODEMP',
          'E.CODLOCAL',
          'E.CONTROLE',
          'E.TIPO',
          'E.CODPARC',
          'E.ESTOQUE',
          'COALESCE(E.RESERVADO, 0) AS RESERVADO',
          'E.ESTOQUE - COALESCE(E.RESERVADO, 0) AS DISPONIVEL',
        ],
        from: 'TGFEST E',
        where: [
          inList('E.CODPROD', input.codigos),
          input.codigoEmpresa === undefined ? undefined : `E.CODEMP = ${input.codigoEmpresa}`,
          input.codigoLocal === undefined ? undefined : `E.CODLOCAL = ${input.codigoLocal}`,
        ],
        order: 'E.CODPROD, E.CODEMP, E.CODLOCAL, E.CONTROLE, E.TIPO, E.CODPARC',
        limit: STOCK_LINES,
      }),
    ),
})
