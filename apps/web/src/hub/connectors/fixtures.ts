import type { Connection as ConnectionOf } from '@conexus/hub-api'
import { Connection, ConnectorEntry, TestCheck, TestResult } from '@conexus/hub-api'
import { ANA } from '../../platform/fixtures.ts'

const KEYS_GUIDE = 'https://developer.example.test/chaves'

/** The Sankhya as the catalog describes it: a logo, what Testar reads, and each field with its help. */
export const SANKHYA = ConnectorEntry.parse({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  category: 'ERP',
  summary: 'O sistema de gestão da empresa: pedidos, estoque, financeiro e cadastros.',
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" rx="6" fill="#66CB66"/></svg>',
  reads: 24,
  auth: 'client_credentials',
  fields: [
    {
      name: 'clientId',
      label: 'Client ID',
      maxLength: 200,
      help: { text: 'Gerado na Área do Desenvolvedor.', url: KEYS_GUIDE },
      visible: true,
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      maxLength: 200,
      help: { text: 'Gerado na Área do Desenvolvedor.', url: KEYS_GUIDE },
      visible: false,
    },
    {
      name: 'xToken',
      label: 'X-Token',
      maxLength: 4096,
      help: { text: 'Gerado na tela Configurações Gateway.', url: `${KEYS_GUIDE}/x-token` },
      visible: false,
    },
  ],
})

let made = 0

/** A connection of the company to the Sankhya, linked by Ana and not yet tested, unless `fields` say otherwise. */
export function connectionOf(fields: Partial<ConnectionOf> = {}): ConnectionOf {
  made += 1
  return Connection.parse({
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    connector: 'sankhya',
    name: 'Comercial',
    connectorVersion: '1.0.0',
    state: 'NEW',
    linkedBy: { id: ANA.id, name: 'Ana' },
    linkedAt: '2026-10-29T12:00:00.000Z',
    testedAt: null,
    testedBy: null,
    account: null,
    ...fields,
  })
}

/** What one Testar reads, by subject and label: the 24 reads of the Sankhya. */
const SUBJECTS: readonly (readonly [string, readonly string[]])[] = [
  ['Porta de leitura', ['Consulta', 'Leitura genérica']],
  [
    'Cadastros',
    [
      'Empresas',
      'Clientes',
      'Vendedores',
      'Tipos de operação',
      'Naturezas',
      'Centros de resultado',
    ],
  ],
  ['Produtos', ['Produtos', 'Grupos de produto']],
  [
    'Vendas',
    ['Pedidos', 'Notas fiscais', 'Nota fiscal com itens', 'Devoluções', 'Notas canceladas'],
  ],
  ['Estoque', ['Estoque por produto', 'Locais de estoque']],
  ['Financeiro', ['Contas a receber', 'Contas a pagar', 'Tipos de pagamento']],
  ['Preços', ['Preços de um produto', 'Preços de uma tabela']],
  ['Logística', ['Transportadoras', 'Ordens de carga']],
]

/** What the provider said, for an item it refused. */
export const REFUSAL = {
  status: 403,
  code: 'SEM_ACESSO',
  message: 'Sem acesso à tela',
  body: { detail: '<b>não</b>' },
}

/** Every read, in the order the Hub sends them; `outcomes` set one by its label, a word or the whole row. */
export function checksOf(outcomes: Record<string, string | Record<string, unknown>> = {}) {
  return SUBJECTS.flatMap(([subject, labels]) =>
    labels.map((label) => {
      const set = outcomes[label] ?? 'READS'
      return TestCheck.parse({
        id: label,
        label,
        subject,
        ...(typeof set === 'string' ? { outcome: set } : set),
      })
    }),
  )
}

/** The test's answer: every part reads, unless `outcomes` name another for a part by its label. */
export function workingOf(
  connection: ConnectionOf,
  outcomes: Record<string, string | Record<string, unknown>> = {},
) {
  return TestResult.parse({
    result: 'WORKING',
    checks: checksOf(outcomes),
    connection: {
      ...connection,
      state: 'ACTIVE',
      testedAt: '2026-10-29T14:02:00.000Z',
      testedBy: connection.linkedBy,
    },
  })
}
