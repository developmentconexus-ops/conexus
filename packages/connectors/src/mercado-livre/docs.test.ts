import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { z } from 'zod'
import { revokeRequest } from '../kernel/oauth.ts'
import { mercadoLivre } from './definition.ts'
import { downloadPages, inBrowser, routeInPage } from './docs-source.ts'
import { mercadoLivreFake } from './fake.ts'
import { APP } from './fake-data.ts'
import { docsOf } from './operations/shared.ts'
import { ACCOUNT, probeAll } from './test-session.ts'

// The documentation is read when the check runs and nothing of it is kept. With
// MERCADO_LIVRE_DOCS_ONLINE=1 (`npm run test:docs:mercado-livre -w @conexus/connectors`) every
// read's route is looked for in the page it cites, read through a real browser (the site refuses
// plain HTTP); without it the online check is skipped, and CI never runs it. It lists every read's
// verdict before it fails, and MERCADO_LIVRE_DOCS_SAVE=<folder> keeps the text of each page the
// browser read. The matcher is proven below on invented pages either way.

// The site the connector reads, which the pages write as a placeholder (`$SITE`).
const SITE_ID = 'MLB'

// The reads whose page lists the route in a table that names no method.
const LISTED_WITHOUT_METHOD = new Set(['anunciosDetalhe'])

// biome-ignore lint/style/noProcessEnv: switches of this one check, not the app's configuration
const { MERCADO_LIVRE_DOCS_ONLINE, MERCADO_LIVRE_DOCS_SAVE: SAVE_TO } = process.env
const ONLINE = MERCADO_LIVRE_DOCS_ONLINE === '1'
const SKIP = 'opt-in: sem MERCADO_LIVRE_DOCS_ONLINE: a conferência com a documentação não rodou'

const SELLER = ACCOUNT.ref

// The page the revoke cites (definition.ts), the route Desligar sends.
const REVOKE_PAGE = 'usuarios-e-aplicativos'

function revokeRoute() {
  const auth = mercadoLivre.auth
  assert.equal(auth.kind, 'oauth2_code')
  const request = revokeRequest(auth, { accountRef: SELLER, clientId: APP.clientId })
  assert.ok(request)
  return { method: request.method, path: request.path, variable: [SELLER, APP.clientId] }
}

describe('o conferidor de rotas', () => {
  const page = `Pesquisar\ncurl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/users/$USER_ID/items/search?status=active`

  it('acha o método e o caminho, com a conta como o texto da página a escreve', () => {
    const route = { method: 'GET', path: `/users/${SELLER}/items/search`, variable: [SELLER] }
    assert.equal(routeInPage(page, route), true)
  })

  it('recusa um caminho que a página não traz, um método errado e um trecho a mais no fim', () => {
    const variable = [SELLER]
    assert.equal(
      routeInPage(page, { method: 'GET', path: `/users/${SELLER}/items/find`, variable }),
      false,
    )
    assert.equal(
      routeInPage(page, { method: 'POST', path: `/users/${SELLER}/items/search`, variable }),
      false,
    )
    assert.equal(
      routeInPage(page, { method: 'GET', path: `/users/${SELLER}/items/sear`, variable }),
      false,
    )
  })

  it('uma tabela sem método só vale quando a leitura declara isso, e um valor fixo do site pode ser escrito como o texto da página o nomeia', () => {
    const table = '/items/bulk?ids=$ITEM_IDS'
    const route = { path: '/items/bulk', variable: [] }
    assert.equal(routeInPage(table, { ...route, method: 'GET' }), false)
    assert.equal(routeInPage(table, { ...route, method: null }), true)
    const fee = 'GET https://api.mercadolibre.com/sites/$SITE/listing_prices'
    const fees = { method: 'GET', path: '/sites/MLB/listing_prices' }
    assert.equal(routeInPage(fee, { ...fees, variable: [] }), false)
    assert.equal(routeInPage(fee, { ...fees, variable: ['MLB'] }), true)
  })

  it('uma operação cuja rota não está na página falha', () => {
    assert.equal(
      routeInPage('Outra página', {
        method: 'GET',
        path: `/users/${SELLER}/items/search`,
        variable: [SELLER],
      }),
      false,
    )
  })
})

describe('a rota de revogar', () => {
  it('é achada na página que a escreve com a conta e o aplicativo como ela os nomeia', () => {
    const page = `Revogar permissão\ncurl -X DELETE -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/users/$USER_ID/applications/$APP_ID`
    assert.equal(routeInPage(page, revokeRoute()), true)
    assert.equal(routeInPage(page, { ...revokeRoute(), method: 'GET' }), false)
  })
})

describe('a conferência com a documentação', { skip: ONLINE ? false : SKIP }, () => {
  it('cada leitura tem a sua rota na página que ela cita, baixada na hora', async () => {
    const sent = await probeAll(mercadoLivreFake())
    assert.equal(sent.length, 27)
    const pages = await inBrowser(
      (fetchPage) =>
        downloadPages(
          sent.flatMap(({ operation }) => docsOf(operation) ?? []),
          fetchPage,
        ),
      SAVE_TO,
    )
    const verdicts = sent.map(({ operation, input, request }) => {
      const slug = docsOf(operation)
      const text = slug ? pages.get(slug) : undefined
      const given = Object.values(z.record(z.string(), z.unknown()).parse(input)).flatMap(
        (value) => (typeof value === 'string' || typeof value === 'number' ? [String(value)] : []),
      )
      const variable = [ACCOUNT.ref, SITE_ID, ...given]
      const method = LISTED_WITHOUT_METHOD.has(operation.id) ? null : request.method
      const found =
        text !== undefined && routeInPage(text, { method, path: request.path, variable })
      return `${found ? 'ok  ' : 'MISS'} ${operation.id}: ${request.method} ${request.path} in ${slug}`
    })
    console.log(verdicts.join('\n'))
    assert.deepEqual(
      verdicts.filter((verdict) => verdict.startsWith('MISS')),
      [],
    )
  })

  it('a rota de revogar está na página que a definição cita, baixada na hora', async () => {
    const pages = await inBrowser((fetchPage) => downloadPages([REVOKE_PAGE], fetchPage), SAVE_TO)
    const text = pages.get(REVOKE_PAGE)
    assert.ok(text !== undefined && routeInPage(text, revokeRoute()))
  })
})
