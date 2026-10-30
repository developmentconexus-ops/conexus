import type { TestContext } from 'node:test'
import type { AppKeys } from '@conexus/connectors'
import { mercadoLivreFake, sankhyaFake } from '@conexus/connectors'
import { REDIRECT_PATH } from '@conexus/hub-api'
import type { Config } from '../../platform/config.ts'
import { parseSealKeys } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

/**
 * Empresa Teste on a Hub whose Sankhya is the kit's double on this machine: Ana its owner, Bruno an
 * administrator, Carla a member.
 */
export async function connectionsOn(
  t: TestContext,
  /** The origin the Hub is given for the double, when something stands in front of it. */
  through: (origin: string) => Promise<string> = async (origin) => origin,
) {
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const origin = await through(served.origin)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}/connections`
  return { hub, fake, served, ana, bruno, carla, companyId, base }
}

/** The installation's apps file, as the configuration reads it, with the double's invented app. */
export function appsOf(app: AppKeys): Config['connectorApps'] {
  const clientSecret = new Secret('ConnectorAppSecret', app.clientSecret)
  return new Map([['mercado-livre', { clientId: app.clientId, clientSecret }]])
}

/**
 * Empresa Teste on a Hub whose Mercado Livre is the kit's double on this machine, sending the
 * person back to the Hub's return page, with the double's app keys: Ana its owner, Bruno an
 * administrator, Carla a member.
 */
export async function mercadoLivreOn(t: TestContext, change: (config: Config) => Config = (c) => c) {
  const fake = mercadoLivreFake({ redirectUri: `${TEST_ORIGIN}${REDIRECT_PATH}` })
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubWithLog(t, (config) =>
    change({
      ...config,
      connectorOrigins: new Map([['mercado-livre', served.origin]]),
      connectorApps: appsOf(fake.app),
    }),
  )
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}/connections`
  return { hub, fake, served, ana, bruno, carla, companyId, base }
}

export function startOf(hub: Hub, person: Person, companyId: string, body: object) {
  return post(hub, person, `/api/companies/${companyId}/connection-sign-ins`, body)
}

/** The person at the double's authorization page: where it sends them back, read. */
export async function consentAt(url: string) {
  const page = await fetch(url, { redirect: 'manual' })
  const back = new URL(page.headers.get('location') ?? '')
  const state = back.searchParams.get('state') ?? ''
  return {
    back,
    code: back.searchParams.get('code'),
    error: back.searchParams.get('error'),
    signInId: state.split('.')[1] ?? '',
    companyId: state.split('.')[0] ?? '',
  }
}

export function completeOf(
  hub: Hub,
  person: Person,
  companyId: string,
  signInId: string,
  body: object,
) {
  return post(hub, person, `/api/companies/${companyId}/connection-sign-ins/${signInId}`, body)
}

/** Ligar on Mercado Livre all the way: start, the double's page, and the return with its code. */
export async function linkMercadoLivre(
  hub: Hub,
  person: Person,
  companyId: string,
  body: object = { connector: 'mercado-livre', name: 'Loja 1' },
) {
  const started = await startOf(hub, person, companyId, body)
  const back = await consentAt(Object(started.json()).url)
  return completeOf(hub, person, companyId, back.signInId, { code: back.code })
}

export function linkSankhya(
  hub: Hub,
  person: Person,
  base: string,
  credential: Record<string, string>,
  key?: string,
  name = 'Matriz',
) {
  return post(hub, person, base, { connector: 'sankhya', name, credential }, key)
}

/** Testar: a POST with no body. */
export function testOf(hub: Hub, person: Person, base: string, connectionId: string) {
  return hub.app.inject({
    method: 'POST',
    url: `${base}/${connectionId}/test`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
  })
}

/** A Hub's configuration change: it seals and opens with this key file's lines alone. */
export function sealingWith(...lines: string[]) {
  return (config: Config): Config => ({ ...config, sealKeys: parseSealKeys(lines.join('\n')) })
}

// The two door entries first, then the 22 operations in the definition's order (criterion 10).
export const CHECK_IDS = [
  'consultar',
  'carregar',
  'empresas',
  'clientes',
  'vendedores',
  'tiposOperacao',
  'naturezas',
  'centrosResultado',
  'produtos',
  'gruposProduto',
  'pedidos',
  'notasFiscais',
  'notaFiscal',
  'devolucoes',
  'notasCanceladas',
  'estoque',
  'locaisEstoque',
  'contasAReceber',
  'contasAPagar',
  'tiposPagamento',
  'precosDoProduto',
  'precosDaTabela',
  'transportadoras',
  'ordensCarga',
]
export const ALL_READS = CHECK_IDS.map((id) => [id, 'READS'])

/** ALL_READS with some items' outcomes changed. */
export function reads(changes: Record<string, string>) {
  return CHECK_IDS.map((id) => [id, changes[id] ?? 'READS'])
}

export function outcomes(response: { json(): unknown }) {
  return Object(response.json()).checks.map((check: { id: string; outcome: string }) => [
    check.id,
    check.outcome,
  ])
}
