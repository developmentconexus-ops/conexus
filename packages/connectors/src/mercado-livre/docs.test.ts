import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { downloadPages, routeInPage, textOfPage } from './docs-source.ts'
import { mercadoLivreFake } from './fake.ts'
import { docsOf } from './operations/shared.ts'
import { ACCOUNT, probeAll } from './test-session.ts'

// The documentation is read when the check runs and nothing of it is kept. With
// MERCADO_LIVRE_DOCS_ONLINE=1 (`npm run test:docs -w @conexus/connectors`) every read's route is
// looked for in the page it cites; without it the online check is skipped. The matcher is proven
// below on invented pages either way.

const ONLINE =
  // biome-ignore lint/style/noProcessEnv: a switch of this one check, not the app's configuration
  process.env.MERCADO_LIVRE_DOCS_ONLINE === '1'
const SKIP = 'opt-in: sem MERCADO_LIVRE_DOCS_ONLINE: a conferência com a documentação não rodou'

const SELLER = ACCOUNT.ref

describe('o conferidor de rotas', () => {
  const page = textOfPage(
    '<p>Pesquisar</p><pre>curl -X GET -H &#39;Authorization: Bearer $ACCESS_TOKEN&#39; https://api.mercadolibre.com/users/$USER_ID/items/search?status=active</pre>',
  )

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

  it('uma operação cuja rota não está na página falha', () => {
    assert.equal(
      routeInPage(textOfPage('<p>Outra página</p>'), {
        method: 'GET',
        path: `/users/${SELLER}/items/search`,
        variable: [SELLER],
      }),
      false,
    )
  })
})

describe('a conferência com a documentação', { skip: ONLINE ? false : SKIP }, () => {
  it('cada leitura tem a sua rota na página que ela cita, baixada na hora', async () => {
    const sent = await probeAll(mercadoLivreFake())
    assert.equal(sent.length, 27)
    const pages = await downloadPages(sent.flatMap(({ operation }) => docsOf(operation) ?? []))
    for (const { operation, request } of sent) {
      const slug = docsOf(operation)
      const text = slug ? pages.get(slug) : undefined
      assert.ok(text, `${operation.id}: page ${slug}`)
      const variable = [
        ACCOUNT.ref,
        ...Object.values(request.query),
        ...request.path.split('/'),
      ].filter((part) => /^[0-9]{6,}$|^MLB[A-Z0-9]+$|^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(part))
      assert.equal(
        routeInPage(text, { method: request.method, path: request.path, variable }),
        true,
        `${operation.id}: ${request.method} ${request.path} in ${slug}`,
      )
    }
  })
})
