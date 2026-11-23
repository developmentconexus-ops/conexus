import { ConnectionId } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, LIST, openData } from './test-hub.tsx'

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
  openData(server, { connections: [connection(), LOJA] }, LIST)
  expect(await screen.findByText('Sankhya · Matriz')).toBeTruthy()
  const main = within(screen.getByRole('main'))
  expect(main.getByText('Mercado Livre · Loja A')).toBeTruthy()
  expect(main.getAllByText('Nenhuma tabela copiada')).toHaveLength(2)
  expect(main.queryByRole('table')).toBeNull()
  expect(main.queryByRole('link', { name: /Ligar uma cópia/ })).toBeNull()
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

test('Dados: uma conexão que não está ativa não vira sistema', async () => {
  openData(server, { connections: [connection({ state: 'NEEDS_REAUTH' })] }, LIST)
  const main = await page()
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText('Nenhuma tabela copiada')).toBeNull()
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
  expect(await main.findByText('Sankhya · Matriz')).toBeTruthy()
})

test('Dados: o membro vê a frase do papel, sem sistemas', async () => {
  openData(server, {}, LIST, 'member')
  const main = await page()
  expect(
    await main.findByText(
      'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.',
    ),
  ).toBeTruthy()
  expect(main.queryByText('Sankhya · Matriz')).toBeNull()
})

test('Dados: o grupo Negócio abre a camada Negócio', async () => {
  openData(server, {}, LIST)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  fireEvent.click(await nav.findByRole('link', { name: 'Negócio 0' }))
  const main = await page()
  expect(await main.findByText('Nenhum conceito aprovado ainda')).toBeTruthy()
  expect(screen.queryByRole('tablist')).toBeNull()
})

test('Dados: a camada fica no endereço', async () => {
  openData(server, {}, `${LIST}?layer=apps`)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  expect((await nav.findByRole('link', { name: 'Apps' })).getAttribute('aria-current')).toBe('page')
  expect(await (await page()).findByText(/^As tabelas que cada app guarda/)).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Negócio 0' }).getAttribute('aria-current')).toBeNull()
})
