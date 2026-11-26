import { ConnectionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, LIST, lakeTable, openData } from './test-hub.tsx'

// Dados: the systems of the connections and the empty sentence; the layers as tabs are in the second block.
const server = hubServer()

/** The main of Dados, once its title is up and the opening screen is gone. */
async function page() {
  await screen.findByRole('heading', { name: 'Dados' })
  return within(screen.getByRole('main'))
}

const LOJA = connection({
  id: ConnectionId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  connector: 'mercado-livre',
  name: 'Loja A',
})

test('Dados sem cópias: cada sistema com a frase da matriz, sem lista nem página de uma cópia (critério 73)', async () => {
  const asked: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/copies')) asked.push(request.url)
  })
  openData(
    server,
    { connections: [connection(), connection({ ...LOJA, connector: 'sankhya' })] },
    LIST,
  )
  expect(await screen.findByText('Matriz · Lago')).toBeTruthy()
  const main = within(screen.getByRole('main'))
  expect(main.getByText('Loja A · Lago')).toBeTruthy()
  expect(
    main.getAllByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toHaveLength(2)
  const body = main.getByRole('heading', { name: 'Dados' }).parentElement?.parentElement
  if (!(body instanceof HTMLElement)) throw new Error('the page under the title')
  expect(body.textContent).toBe(
    [
      'Dados',
      'O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é.',
      'Negócio 0',
      'Bruto 0',
      'Apps',
      'Matriz · Lago',
      'Nenhuma tabela copiada. Escolha o que copiar na página da ligação.',
      'Loja A · Lago',
      'Nenhuma tabela copiada. Escolha o que copiar na página da ligação.',
    ].join(''),
  )
  expect(within(body).queryAllByRole('button')).toEqual([])
  expect(within(body).queryAllByRole('link')).toEqual([])
  expect(
    screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.startsWith(`${LIST}/`)),
  ).toEqual([])
  expect(asked).toEqual([])
})

test('Dados: nenhum sistema ligado', async () => {
  openData(server, { connections: [] }, LIST)
  const main = await page()
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(
    screen.getByText(
      'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ligar um sistema' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/integrations`,
  )
})

test('Dados: uma ligação que pede reconexão e tem tabela no lago mostra as tabelas dela, com o estado no título', async () => {
  openData(
    server,
    { connections: [connection({ state: 'NEEDS_REAUTH' })], tables: [lakeTable()] },
    LIST,
  )
  const main = await page()
  expect(await main.findByText('Matriz · Lago · 1 tabela · Chaves recusadas')).toBeTruthy()
  expect(main.getByRole('link', { name: /Notas e pedidos/ })).toBeTruthy()
  expect(main.getByText('1 tabela no lago')).toBeTruthy()
})

test('Dados: a ligação por autorização que pede reconexão diz o estado da autorização', async () => {
  const sign = connection({ ...LOJA, state: 'NEEDS_REAUTH' })
  const table = lakeTable({
    connection: { id: sign.id, name: 'Loja A', connector: 'mercado-livre' },
  })
  openData(server, { connections: [sign], tables: [table] }, LIST)
  const main = await page()
  expect(
    await main.findByText('Loja A · Lago · 1 tabela · Pede para conectar de novo'),
  ).toBeTruthy()
})

test('Dados: a ligação sem tabela tem o título da ligação no lago', async () => {
  openData(server, { connections: [connection()] }, LIST)
  const main = await page()
  expect(await main.findByText('Matriz · Lago')).toBeTruthy()
  expect(
    main.getByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toBeTruthy()
})

test('Dados: uma conexão que não está ativa e sem tabela não vira sistema', async () => {
  openData(server, { connections: [connection({ state: 'NEEDS_REAUTH' })] }, LIST)
  const main = await page()
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText(/Nenhuma tabela copiada/)).toBeNull()
})

test('Dados: a falha da leitura das conexões tem Tentar de novo', async () => {
  let fail = true
  openData(server, { answer: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined) }, LIST)
  const main = await page()
  const retry = await main.findByRole('button', { name: 'Tentar de novo' })
  expect(
    main.getByText(
      'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
    ),
  ).toBeTruthy()
  fail = false
  fireEvent.click(retry)
  expect(await main.findByText('Matriz · Lago')).toBeTruthy()
})

test('Dados: o membro vê a frase do papel, sem sistemas', async () => {
  openData(server, {}, LIST, 'member')
  const main = await page()
  expect(
    await main.findByText(
      'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.',
    ),
  ).toBeTruthy()
  expect(main.queryByText('Matriz · Lago')).toBeNull()
})

test('Dados: sem nenhum sistema ligado não manda escolher o que copiar', async () => {
  openData(server, { connections: [] }, LIST)
  const main = await page()
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText(/Escolha o que copiar/)).toBeNull()
})

// The layers as tabs under the title (card R2, U1, criterion 3): the count, the address, the note.

async function tabs() {
  return within(await screen.findByRole('tablist', { name: 'Camadas de Dados' }))
}

const SECOND = lakeTable({
  id: '33333333-3333-4333-8333-333333333333',
  name: 'sankhya_itens',
  label: 'Itens',
})

test('as camadas são abas e a camada fica no endereço', async () => {
  const router = openData(server, { tables: [lakeTable()] }, LIST)
  const list = await tabs()
  expect((await list.findByRole('tab', { name: 'Bruto 1' })).getAttribute('aria-selected')).toBe(
    'true',
  )
  expect(list.getByRole('tab', { name: 'Negócio 0' }).getAttribute('aria-selected')).toBe('false')
  expect(list.getByRole('tab', { name: 'Apps' }).getAttribute('aria-selected')).toBe('false')
  // The tabs are the page's own: no column of Dados beside the rail.
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()

  fireEvent.click(list.getByRole('tab', { name: 'Negócio 0' }))
  expect(await screen.findByText('Nenhum conceito aprovado ainda')).toBeTruthy()
  expect(router.state.location.search).toEqual({ layer: 'business' })
  expect(list.getByRole('tab', { name: 'Negócio 0' }).getAttribute('aria-selected')).toBe('true')

  fireEvent.click(list.getByRole('tab', { name: 'Apps' }))
  await waitFor(() => expect(router.state.location.search).toEqual({ layer: 'apps' }))
  expect(await screen.findByText(/^As tabelas que cada app guarda/)).toBeTruthy()

  fireEvent.click(list.getByRole('tab', { name: 'Bruto 1' }))
  expect(await screen.findByText('Notas e pedidos', { exact: false })).toBeTruthy()
  expect(router.state.location.search).toEqual({})
  expect(router.state.location.searchStr).toBe('')
})

test('o endereço com a camada abre a aba dela', async () => {
  openData(server, {}, `${LIST}?layer=apps`)
  const list = await tabs()
  expect((await list.findByRole('tab', { name: 'Apps' })).getAttribute('aria-selected')).toBe(
    'true',
  )
  expect(await (await page()).findByText(/^As tabelas que cada app guarda/)).toBeTruthy()
  expect(list.getByRole('tab', { name: 'Bruto 0' }).getAttribute('aria-selected')).toBe('false')
})

test('o membro vê Negócio 0 e Bruto 0, sem a aba Apps, e o endereço de Apps abre o Bruto', async () => {
  openData(server, {}, `${LIST}?layer=apps`, 'member')
  const list = await tabs()
  expect(await list.findByRole('tab', { name: 'Negócio 0' })).toBeTruthy()
  expect(list.getByRole('tab', { name: 'Bruto 0', selected: true })).toBeTruthy()
  expect(list.queryByRole('tab', { name: 'Apps' })).toBeNull()
  expect(
    await (await page()).findByText(
      'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.',
    ),
  ).toBeTruthy()
  expect(screen.queryByText(/^As tabelas que cada app guarda/)).toBeNull()
  expect(screen.queryByText(/tabelas? no lago/)).toBeNull()
})

test('a contagem do Bruto entra quando a leitura do lago chega', async () => {
  const held = Promise.withResolvers<void>()
  openData(server, { tables: [lakeTable()] }, LIST)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/lake-tables`, async () => {
      await held.promise
      return HttpResponse.json([lakeTable()])
    }),
  )
  const list = await tabs()
  expect(await list.findByRole('tab', { name: 'Bruto' })).toBeTruthy()
  held.resolve()
  expect(await list.findByRole('tab', { name: 'Bruto 1' })).toBeTruthy()
})

test('a nota do Bruto fica na página', async () => {
  openData(server, { tables: [lakeTable(), SECOND] }, LIST)
  const list = await tabs()
  const note = await within(screen.getByRole('main')).findByText('2 tabelas no lago')
  // The note sits under the tabs, in the page, and not in a column beside the rail.
  expect(
    list.getByRole('tab', { name: 'Bruto 2' }).compareDocumentPosition(note) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()
})

test('a nota do Bruto não aparece em outra camada', async () => {
  openData(server, { tables: [lakeTable()] }, `${LIST}?layer=business`)
  const main = await page()
  expect(await main.findByText('Nenhum conceito aprovado ainda')).toBeTruthy()
  expect(main.queryByText(/tabelas? no lago/)).toBeNull()
})

test('sem tabela copiada o Bruto não tem nota e a frase da ligação aparece uma vez', async () => {
  openData(server, { connections: [connection()] }, LIST)
  const main = await page()
  expect(
    await main.findByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toBeTruthy()
  expect(main.queryByText(/tabelas? no lago/)).toBeNull()
})
