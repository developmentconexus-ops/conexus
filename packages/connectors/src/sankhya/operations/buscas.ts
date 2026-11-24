import { z } from 'zod'
import type { Filter, Page } from '../search.ts'
import {
  Codes,
  contains,
  defineSearch,
  Flag,
  flag,
  inList,
  Limit,
  NonNegative,
  SEARCH_PAGE_ROWS,
  SearchText,
  Text,
  Whole,
} from '../search.ts'

/** What every search by code takes: a list of codes, whether active, and the page after a code. */
const ByCode = {
  codigos: Codes(100).optional(),
  ativo: z.boolean().optional(),
  depoisDe: NonNegative.optional(),
  limite: Limit.optional(),
}

/** A page of a search by code: its own filters and the shared ones, joined with AND, in the order of `code`. */
function byCode(
  columns: { code: string; active: string },
  input: { codigos?: number[]; ativo?: boolean; depoisDe?: number; limite?: number },
  from: string,
  own: readonly Filter[],
): Page {
  const { code, active } = columns
  return {
    from,
    where: [
      ...own,
      input.codigos && inList(code, input.codigos),
      input.ativo !== undefined && flag(active, input.ativo),
      input.depoisDe !== undefined && `${code} > ${input.depoisDe}`,
    ],
    order: code,
    limit: input.limite ?? SEARCH_PAGE_ROWS,
  }
}

function range(key: string, from: number | undefined, to: number | undefined) {
  return [from !== undefined && `${key} >= ${from}`, to !== undefined && `${key} <= ${to}`]
}

const ParceiroInput = z.strictObject({
  nome: SearchText.optional(),
  documento: z
    .string()
    .regex(/^(?:\d{11}|\d{14})$/, 'O documento tem só os 11 dígitos do CPF ou os 14 do CNPJ.')
    .optional(),
  deCodigo: NonNegative.optional(),
  ateCodigo: NonNegative.optional(),
  papel: z.enum(['cliente', 'fornecedor']).optional(),
  ...ByCode,
})

export const buscarParceiros = defineSearch({
  id: 'buscarParceiros',
  subject: 'cadastros',
  summary: `Busca parceiros (clientes e fornecedores) do Sankhya por parte do nome ou da razão social, sem diferença de maiúscula nem de acento, por CPF/CNPJ, por lista ou faixa de códigos, por papel (cliente ou fornecedor) e por ativo, tudo combinável. Devolve até ${SEARCH_PAGE_ROWS} linhas em ordem de código (\`limite\` até 100) e \`temMais\`; para as próximas, passe o último código lido em \`depoisDe\`.`,
  label: 'Buscar parceiros',
  input: ParceiroInput,
  row: z.object({
    codigoParceiro: Whole,
    nome: Text,
    razaoSocial: Text,
    documento: Text,
    tipoPessoa: Text,
    ativo: Flag,
    cliente: Flag,
    fornecedor: Flag,
  }),
  columns: {
    codigoParceiro: 'CODPARC',
    nome: 'NOMEPARC',
    razaoSocial: 'RAZAOSOCIAL',
    documento: 'CGC_CPF',
    tipoPessoa: 'TIPPESSOA',
    ativo: 'ATIVO',
    cliente: 'CLIENTE',
    fornecedor: 'FORNECEDOR',
  },
  probe: () => ({ limite: 1 }),
  page: (input) =>
    byCode({ code: 'CODPARC', active: 'ATIVO' }, input, 'TGFPAR', [
      input.nome && contains(['NOMEPARC', 'RAZAOSOCIAL'], input.nome),
      input.documento && `CGC_CPF = '${input.documento}'`,
      ...range('CODPARC', input.deCodigo, input.ateCodigo),
      input.papel && flag(input.papel === 'cliente' ? 'CLIENTE' : 'FORNECEDOR', true),
    ]),
})

const ProdutoInput = z.strictObject({
  nome: SearchText.optional(),
  referencia: SearchText.optional(),
  deCodigo: NonNegative.optional(),
  ateCodigo: NonNegative.optional(),
  grupos: Codes(50).optional(),
  ...ByCode,
})

export const buscarProdutos = defineSearch({
  id: 'buscarProdutos',
  subject: 'produtos',
  summary: `Busca produtos do Sankhya por parte do nome ou da referência, sem diferença de maiúscula nem de acento, por lista ou faixa de códigos, por grupo e por ativo, tudo combinável. Devolve até ${SEARCH_PAGE_ROWS} linhas em ordem de código (\`limite\` até 100), com o grupo e a unidade, e \`temMais\`; para as próximas, passe o último código lido em \`depoisDe\`.`,
  label: 'Buscar produtos',
  input: ProdutoInput,
  row: z.object({
    codigoProduto: Whole,
    nome: Text,
    referencia: Text,
    codigoGrupo: Whole.nullable(),
    grupo: Text,
    unidade: Text,
    marca: Text,
    ativo: Flag,
  }),
  columns: {
    codigoProduto: 'P.CODPROD',
    nome: 'P.DESCRPROD',
    referencia: 'P.REFERENCIA',
    codigoGrupo: 'P.CODGRUPOPROD',
    grupo: 'G.DESCRGRUPOPROD',
    unidade: 'P.CODVOL',
    marca: 'P.MARCA',
    ativo: 'P.ATIVO',
  },
  probe: () => ({ limite: 1 }),
  page: (input) =>
    byCode(
      { code: 'P.CODPROD', active: 'P.ATIVO' },
      input,
      'TGFPRO P LEFT JOIN TGFGRU G ON G.CODGRUPOPROD = P.CODGRUPOPROD',
      [
        input.nome && contains(['P.DESCRPROD'], input.nome),
        input.referencia && contains(['P.REFERENCIA'], input.referencia),
        ...range('P.CODPROD', input.deCodigo, input.ateCodigo),
        input.grupos && inList('P.CODGRUPOPROD', input.grupos),
      ],
    ),
})

export const buscarVendedores = defineSearch({
  id: 'buscarVendedores',
  subject: 'cadastros',
  summary: `Busca vendedores do Sankhya por parte do apelido, sem diferença de maiúscula nem de acento, por lista de códigos e por ativo, tudo combinável. Devolve até ${SEARCH_PAGE_ROWS} linhas em ordem de código (\`limite\` até 100) e \`temMais\`; para as próximas, passe o último código lido em \`depoisDe\`.`,
  label: 'Buscar vendedores',
  input: z.strictObject({ nome: SearchText.optional(), ...ByCode }),
  row: z.object({ codigoVendedor: Whole, apelido: Text, ativo: Flag }),
  columns: { codigoVendedor: 'CODVEND', apelido: 'APELIDO', ativo: 'ATIVO' },
  probe: () => ({ limite: 1 }),
  page: (input) =>
    byCode({ code: 'CODVEND', active: 'ATIVO' }, input, 'TGFVEN', [
      input.nome && contains(['APELIDO'], input.nome),
    ]),
})
