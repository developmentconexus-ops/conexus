import { z } from 'zod'
import { Codes, defineSearch, inList, NonNegative, Num, Text, Whole } from '../search.ts'

/** The most lines one stock read returns; the list of codes is the cut, so there is no cursor. */
const STOCK_LINES = 200

const EstoqueInput = z.strictObject({
  codigos: Codes(50),
  codigoEmpresa: NonNegative.optional(),
  codigoLocal: NonNegative.optional(),
})

export const estoqueDosProdutos = defineSearch({
  id: 'estoqueDosProdutos',
  subject: 'estoque',
  summary:
    'Lê o saldo de estoque de vários produtos de uma vez (até 50 códigos), por empresa, local e controle, com o reservado e o disponível; `codigoEmpresa` e `codigoLocal` restringem. Cada linha traz `tipo` e `codigoParceiro`, que dizem se o saldo é próprio ou de terceiros. Devolve até 200 linhas em ordem de produto, empresa, local, controle, tipo e parceiro, e `temMais`; se houver mais, peça menos produtos.',
  label: 'Estoque de vários produtos',
  input: EstoqueInput,
  row: {
    codigoProduto: Whole,
    codigoEmpresa: Whole,
    codigoLocal: Whole,
    controle: Text,
    tipo: Text,
    codigoParceiro: Whole.nullable(),
    estoque: Num,
    reservado: Num,
    disponivel: Num,
  },
  columns: {
    codigoProduto: 'E.CODPROD',
    codigoEmpresa: 'E.CODEMP',
    codigoLocal: 'E.CODLOCAL',
    controle: 'E.CONTROLE',
    tipo: 'E.TIPO',
    codigoParceiro: 'E.CODPARC',
    estoque: 'E.ESTOQUE',
    reservado: 'COALESCE(E.RESERVADO, 0) AS RESERVADO',
    disponivel: 'E.ESTOQUE - COALESCE(E.RESERVADO, 0) AS DISPONIVEL',
  },
  probe: () => ({ codigos: [11] }),
  page: (input) => ({
    from: 'TGFEST E',
    where: [
      inList('E.CODPROD', input.codigos),
      input.codigoEmpresa !== undefined && `E.CODEMP = ${input.codigoEmpresa}`,
      input.codigoLocal !== undefined && `E.CODLOCAL = ${input.codigoLocal}`,
    ],
    order: 'E.CODPROD, E.CODEMP, E.CODLOCAL, E.CONTROLE, E.TIPO, E.CODPARC',
    limit: STOCK_LINES,
  }),
})
