import { ConnectionId, TreatedTables } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, LIST, lakeTable, openData } from './test-hub.tsx'

// Dados: the systems of the connections, the empty sentence, the layers in the address.
const server = hubServer()

/** The main of Dados, once the frame with its tree is up and the opening screen is gone. */
async function page() {
  await screen.findByRole('navigation', { name: 'Dados' })
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
  expect(screen.getByRole('navigation', { name: 'Dados' })).toBeTruthy()
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
  expect(
    within(screen.getByRole('navigation', { name: 'Dados' })).getByText('1 tabela no lago'),
  ).toBeTruthy()
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

test('Dados: o grupo Negócio abre a camada Negócio, sem o aviso dos conceitos', async () => {
  openData(server, {}, LIST)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  fireEvent.click(await nav.findByRole('link', { name: 'Negócio' }))
  const main = await page()
  expect(await main.findByText('Nenhum tratamento ainda')).toBeTruthy()
  expect(screen.queryByText(/Nenhum conceito aprovado/)).toBeNull()
  expect(screen.queryByText(/Um conceito é o significado/)).toBeNull()
})

test.each([['owner'], ['admin']])(
  'Dados: %s vê Copiado, Tratado e Negócio, e abre cada camada',
  async (role) => {
    openData(server, {}, LIST, role)
    const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
    expect(await nav.findByRole('link', { name: 'Copiado 0' })).toBeTruthy()
    fireEvent.click(nav.getByRole('link', { name: 'Tratado' }))
    expect(
      await (await page()).findByText(/^Nenhuma tabela tratada\. As tabelas de um sistema/),
    ).toBeTruthy()
    fireEvent.click(nav.getByRole('link', { name: 'Negócio' }))
    expect(await (await page()).findByText('Nenhum tratamento ainda')).toBeTruthy()
    expect((await page()).queryByText(/^Seu papel ainda não lê/)).toBeNull()
  },
)

test.each([
  ['treated', 'Tratado'],
  ['business', 'Negócio'],
])('Dados: outro papel vê em %s a frase do papel, sem pedir os tratamentos', async (layer) => {
  const asked: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/data/treated')) asked.push(request.url)
  })
  openData(server, {}, `${LIST}?layer=${layer}`, 'member')
  const main = await page()
  expect(
    await main.findByText(
      'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.',
    ),
  ).toBeTruthy()
  expect(asked).toEqual([])
})

test('Dados: com o lago numa receita anterior, Tratado diz para apagar e criar de novo na Central', async () => {
  openData(
    server,
    { treated: TreatedTables.parse({ lake: 'OUTDATED', lastRun: null, tables: [] }) },
    `${LIST}?layer=treated`,
  )
  const main = await page()
  expect(await main.findByText('Apague e crie o lago de novo na Central para tratar')).toBeTruthy()
  expect(main.queryByText(/^Nenhuma tabela tratada/)).toBeNull()
})

test('Dados: a camada fica no endereço', async () => {
  openData(server, {}, `${LIST}?layer=apps`)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  expect((await nav.findByRole('link', { name: 'Apps' })).getAttribute('aria-current')).toBe('page')
  expect(await (await page()).findByText(/^As tabelas que cada app guarda/)).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Negócio' }).getAttribute('aria-current')).toBeNull()
})

test('Dados: sem nenhum sistema ligado não manda escolher o que copiar', async () => {
  openData(server, { connections: [] }, LIST)
  const main = await page()
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText(/Escolha o que copiar/)).toBeNull()
})
