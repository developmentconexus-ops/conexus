import { z } from 'zod'
import { defineOperation } from '../../kernel/operation.ts'
import { queryRequest } from '../door.ts'
import {
  Codes,
  Cursor,
  DEFAULT_LIMIT,
  Extra,
  Flag,
  foundIn,
  Limit,
  Text,
  Whole,
} from '../search-read.ts'
import { between, containing, digits, flag, inList, pageSql, SearchText } from '../search-sql.ts'

const Parceiro = z
  .object({
    CODPARC: Whole,
    NOMEPARC: Text,
    RAZAOSOCIAL: Text,
    CGC_CPF: Text,
    TIPPESSOA: Text,
    ATIVO: Flag,
    CLIENTE: Flag,
    FORNECEDOR: Flag,
    EXTRA: Extra,
  })
  .transform((row) => ({
    codigoParceiro: row.CODPARC,
    nome: row.NOMEPARC,
    razaoSocial: row.RAZAOSOCIAL,
    documento: row.CGC_CPF,
    tipoPessoa: row.TIPPESSOA,
    ativo: row.ATIVO,
    cliente: row.CLIENTE,
    fornecedor: row.FORNECEDOR,
    extra: row.EXTRA,
  }))

const ParceiroInput = z.strictObject({
  nome: SearchText.optional(),
  documento: z
    .string()
    .regex(/^(?:\d{11}|\d{14})$/, 'O documento tem só os 11 dígitos do CPF ou os 14 do CNPJ.')
    .optional(),
  codigos: Codes(100).optional(),
  deCodigo: Cursor,
  ateCodigo: Cursor,
  papel: z.enum(['cliente', 'fornecedor']).optional(),
  ativo: z.boolean().optional(),
  depoisDe: Cursor,
  limite: Limit,
})

export const buscarParceiros = defineOperation({
  id: 'buscarParceiros',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Busca parceiros (clientes e fornecedores) do Sankhya por parte do nome ou da razão social, sem diferença de maiúscula nem de acento, por CPF/CNPJ, por lista ou faixa de códigos, por papel (cliente ou fornecedor) e por ativo, tudo combinável. Devolve até 20 linhas em ordem de código (`limite` até 100) e `temMais`; para as próximas, passe o último código lido em `depoisDe`.',
  label: 'Buscar parceiros',
  input: ParceiroInput,
  ...foundIn(Parceiro),
  personal: [
    { path: 'documento', kind: 'documento' },
    { path: 'nome', kind: 'contato' },
    { path: 'razaoSocial', kind: 'contato' },
  ],
  probe: (): z.infer<typeof ParceiroInput> => ({ limite: 1 }),
  request: (input) =>
    queryRequest(
      pageSql({
        select: [
          'CODPARC',
          'NOMEPARC',
          'RAZAOSOCIAL',
          'CGC_CPF',
          'TIPPESSOA',
          'ATIVO',
          'CLIENTE',
          'FORNECEDOR',
        ],
        from: 'TGFPAR',
        where: [
          input.nome && containing(['NOMEPARC', 'RAZAOSOCIAL'], input.nome),
          input.documento && digits('CGC_CPF', input.documento),
          input.codigos && inList('CODPARC', input.codigos),
          ...between('CODPARC', input.deCodigo, input.ateCodigo),
          input.papel && flag(input.papel === 'cliente' ? 'CLIENTE' : 'FORNECEDOR', true),
          input.ativo === undefined ? undefined : flag('ATIVO', input.ativo),
          input.depoisDe === undefined ? undefined : `CODPARC > ${input.depoisDe}`,
        ],
        order: 'CODPARC',
        limit: input.limite ?? DEFAULT_LIMIT,
      }),
    ),
})

const Produto = z
  .object({
    CODPROD: Whole,
    DESCRPROD: Text,
    REFERENCIA: Text,
    CODGRUPOPROD: Whole.nullable(),
    DESCRGRUPOPROD: Text,
    CODVOL: Text,
    MARCA: Text,
    ATIVO: Flag,
    EXTRA: Extra,
  })
  .transform((row) => ({
    codigoProduto: row.CODPROD,
    nome: row.DESCRPROD,
    referencia: row.REFERENCIA,
    codigoGrupo: row.CODGRUPOPROD,
    grupo: row.DESCRGRUPOPROD,
    unidade: row.CODVOL,
    marca: row.MARCA,
    ativo: row.ATIVO,
    extra: row.EXTRA,
  }))

const ProdutoInput = z.strictObject({
  nome: SearchText.optional(),
  referencia: SearchText.optional(),
  codigos: Codes(100).optional(),
  deCodigo: Cursor,
  ateCodigo: Cursor,
  grupos: Codes(50).optional(),
  ativo: z.boolean().optional(),
  depoisDe: Cursor,
  limite: Limit,
})

export const buscarProdutos = defineOperation({
  id: 'buscarProdutos',
  class: 'read' as const,
  subject: 'produtos',
  idempotent: true,
  summary:
    'Busca produtos do Sankhya por parte do nome ou da referência, sem diferença de maiúscula nem de acento, por lista ou faixa de códigos, por grupo e por ativo, tudo combinável. Devolve até 20 linhas em ordem de código (`limite` até 100), com o grupo e a unidade, e `temMais`; para as próximas, passe o último código lido em `depoisDe`.',
  label: 'Buscar produtos',
  input: ProdutoInput,
  ...foundIn(Produto),
  probe: (): z.infer<typeof ProdutoInput> => ({ limite: 1 }),
  request: (input) =>
    queryRequest(
      pageSql({
        select: [
          'P.CODPROD',
          'P.DESCRPROD',
          'P.REFERENCIA',
          'P.CODGRUPOPROD',
          'G.DESCRGRUPOPROD',
          'P.CODVOL',
          'P.MARCA',
          'P.ATIVO',
        ],
        from: 'TGFPRO P LEFT JOIN TGFGRU G ON G.CODGRUPOPROD = P.CODGRUPOPROD',
        where: [
          input.nome && containing(['P.DESCRPROD'], input.nome),
          input.referencia && containing(['P.REFERENCIA'], input.referencia),
          input.codigos && inList('P.CODPROD', input.codigos),
          ...between('P.CODPROD', input.deCodigo, input.ateCodigo),
          input.grupos && inList('P.CODGRUPOPROD', input.grupos),
          input.ativo === undefined ? undefined : flag('P.ATIVO', input.ativo),
          input.depoisDe === undefined ? undefined : `P.CODPROD > ${input.depoisDe}`,
        ],
        order: 'P.CODPROD',
        limit: input.limite ?? DEFAULT_LIMIT,
      }),
    ),
})

const Vendedor = z
  .object({ CODVEND: Whole, APELIDO: Text, ATIVO: Flag, EXTRA: Extra })
  .transform((row) => ({
    codigoVendedor: row.CODVEND,
    apelido: row.APELIDO,
    ativo: row.ATIVO,
    extra: row.EXTRA,
  }))

const VendedorInput = z.strictObject({
  nome: SearchText.optional(),
  codigos: Codes(100).optional(),
  ativo: z.boolean().optional(),
  depoisDe: Cursor,
  limite: Limit,
})

export const buscarVendedores = defineOperation({
  id: 'buscarVendedores',
  class: 'read' as const,
  subject: 'cadastros',
  idempotent: true,
  summary:
    'Busca vendedores do Sankhya por parte do apelido, sem diferença de maiúscula nem de acento, por lista de códigos e por ativo, tudo combinável. Devolve até 20 linhas em ordem de código (`limite` até 100) e `temMais`; para as próximas, passe o último código lido em `depoisDe`.',
  label: 'Buscar vendedores',
  input: VendedorInput,
  ...foundIn(Vendedor),
  probe: (): z.infer<typeof VendedorInput> => ({ limite: 1 }),
  request: (input) =>
    queryRequest(
      pageSql({
        select: ['CODVEND', 'APELIDO', 'ATIVO'],
        from: 'TGFVEN',
        where: [
          input.nome && containing(['APELIDO'], input.nome),
          input.codigos && inList('CODVEND', input.codigos),
          input.ativo === undefined ? undefined : flag('ATIVO', input.ativo),
          input.depoisDe === undefined ? undefined : `CODVEND > ${input.depoisDe}`,
        ],
        order: 'CODVEND',
        limit: input.limite ?? DEFAULT_LIMIT,
      }),
    ),
})
