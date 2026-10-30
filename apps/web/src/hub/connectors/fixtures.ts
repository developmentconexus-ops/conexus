import type { Connection as ConnectionOf } from '@conexus/hub-api'
import { Connection, ConnectorEntry, TestResult } from '@conexus/hub-api'
import { ANA } from '../../platform/fixtures.ts'

const KEYS_GUIDE = 'https://developer.example.test/chaves'

/** The Sankhya as the catalog describes it: a logo and each field with its help. */
export const SANKHYA = ConnectorEntry.parse({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  category: 'ERP',
  summary: 'O sistema de gestão da empresa: pedidos, estoque, financeiro e cadastros.',
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" rx="6" fill="#66CB66"/></svg>',
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

/** A connector that links by a trip to the provider: no fields, and the logo is the symbol alone. */
export const MERCADO_LIVRE = ConnectorEntry.parse({
  id: 'mercado-livre',
  name: 'Mercado Livre',
  version: '1.0.0',
  category: 'Marketplace',
  summary: 'O marketplace da loja: anúncios, vendas, envios e perguntas.',
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#FFE600"/></svg>',
  auth: 'oauth2_code',
  fields: [],
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

/** What the provider said when it refused. */
export const REFUSAL = {
  status: 403,
  code: 'SEM_ACESSO',
  message: 'Sem acesso à tela',
  body: { detail: '<b>não</b>' },
}

/** Testar's answer when its check read worked. */
export function workingOf(connection: ConnectionOf) {
  return TestResult.parse({
    result: 'WORKING',
    connection: {
      ...connection,
      state: 'ACTIVE',
      testedAt: '2026-10-29T14:02:00.000Z',
      testedBy: connection.linkedBy,
    },
  })
}
