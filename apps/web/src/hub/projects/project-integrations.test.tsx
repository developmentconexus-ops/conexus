import type { ProjectConnections } from '@conexus/hub-api'
import { ConnectionList, ConnectorEntry, ProjectConnections as ListShape } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const API = `*/api/companies/${COMPANY.id}`
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>'
const ASK = 'Peça ao dono ou a um administrador.'

const catalog = [
  { id: 'sankhya', name: 'Sankhya', category: 'ERP', auth: 'client_credentials' },
  { id: 'mercado-livre', name: 'Mercado Livre', category: 'Marketplace', auth: 'oauth2_code' },
].map((one) =>
  ConnectorEntry.parse({ ...one, version: '1.0.0', summary: 'Resumo.', logo: LOGO, fields: [] }),
)

const LineShape = ListShape.shape.connectors.element.shape.connections.element
type Line = ProjectConnections['connectors'][number]['connections'][number]
let made = 0
function line(name: string, fields: Partial<Line> = {}): Line {
  made += 1
  return LineShape.parse({
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    name,
    state: 'ACTIVE',
    account: null,
    grant: null,
    ...fields,
  })
}
const GRANT = { by: 'Ana', at: '2026-10-30T12:00:00.000Z' }

type View = { sankhya: Line[]; ml: Line[]; mayManage: boolean }
const sent: { method: string; path: string }[] = []

function hub(view: View) {
  function lines() {
    return [...view.sankhya, ...view.ml]
  }
  return [
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json(
        ListShape.parse({
          connectors: [
            { connector: catalog[0], perProject: 'one', connections: view.sankhya },
            { connector: catalog[1], perProject: 'many', connections: view.ml },
          ],
        }),
      ),
    ),
    http.get(`${API}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({ connectors: catalog, connections: [], mayManage: view.mayManage }),
      ),
    ),
    http.put(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, ({ params, request }) => {
      sent.push({ method: request.method, path: new URL(request.url).pathname })
      const found = lines().find((one) => one.id === params.connectionId)
      if (found) found.grant = GRANT
      return HttpResponse.json({ grant: GRANT })
    }),
    http.delete(
      `${API}/projects/${PEDIDOS.id}/connections/:connectionId`,
      ({ params, request }) => {
        sent.push({ method: request.method, path: new URL(request.url).pathname })
        const found = lines().find((one) => one.id === params.connectionId)
        if (found) found.grant = null
        return new HttpResponse(null, { status: 204 })
      },
    ),
  ]
}

function open(view: View) {
  sent.length = 0
  const role = view.mayManage ? 'owner' : 'member'
  server.use(
    ...hub(view),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
  )
  render(
    <Conexus
      conexus={createConexus(createMemoryHistory({ initialEntries: [`${PROJECT}/integrations`] }))}
    />,
  )
}

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

async function row(name: string) {
  const heading = await screen.findByText(name)
  const item = heading.closest('li')
  if (item === null) throw new Error(`sem linha para ${name}`)
  return within(item)
}

test('a dona libera a ligação certa e a linha passa a ler', async () => {
  const loja = line('Loja 2')
  open({ sankhya: [], ml: [line('Loja 1', { grant: GRANT }), loja], mayManage: true })
  expect(await screen.findByRole('heading', { name: 'Integrações deste Projeto' })).toBeTruthy()
  expect((await row('Loja 1')).getByRole('button', { name: 'Tirar: Loja 1' })).toBeTruthy()
  fireEvent.click((await row('Loja 2')).getByRole('button', { name: 'Liberar para ler: Loja 2' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(
    within(dialog).getByText(
      'O app e o Builder poderão ler o Mercado Livre da empresa. Quem usa o app vê o que o app mostrar.',
    ),
  ).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Liberar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([
    {
      method: 'PUT',
      path: `/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/connections/${loja.id}`,
    },
  ])
  expect(await (await row('Loja 2')).findByRole('button', { name: 'Tirar: Loja 2' })).toBeTruthy()
})

test('Tirar tira a liberação e a linha volta a "não liberado"', async () => {
  const matriz = line('Matriz', { grant: GRANT })
  open({ sankhya: [matriz], ml: [], mayManage: true })
  fireEvent.click((await row('Matriz')).getByRole('button', { name: 'Tirar: Matriz' }))
  expect(
    await (await row('Matriz')).findByRole('button', { name: 'Liberar para ler: Matriz' }),
  ).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['DELETE'])
})

test('num conector de uma ligação por Projeto, as outras linhas dizem qual tirar e não liberam', async () => {
  open({
    sankhya: [line('Matriz', { grant: GRANT }), line('Filial')],
    ml: [line('Loja 1'), line('Loja 2')],
    mayManage: true,
  })
  const filial = await row('Filial')
  expect(
    filial.getByText('O Sankhya lê uma ligação por Projeto. Tire a Matriz antes.'),
  ).toBeTruthy()
  expect(filial.queryByRole('button')).toBeNull()
  for (const name of ['Loja 1', 'Loja 2']) {
    expect(
      (await row(name)).getByRole('button', { name: `Liberar para ler: ${name}` }),
    ).toBeTruthy()
  }
})

test('o membro vê o estado e a frase, sem botões', async () => {
  open({ sankhya: [line('Matriz', { grant: GRANT })], ml: [line('Loja 1')], mayManage: false })
  expect(await screen.findByText(ASK)).toBeTruthy()
  expect((await row('Matriz')).getByText('lê')).toBeTruthy()
  expect((await row('Loja 1')).getByText('não liberado')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Liberar|Tirar/ })).toBeNull()
})

test('uma ligação que pede para conectar de novo mostra o selo e o caminho', async () => {
  const matriz = line('Matriz', { state: 'NEEDS_REAUTH' })
  open({ sankhya: [matriz], ml: [], mayManage: true })
  const item = await row('Matriz')
  expect(item.getByText('Chaves recusadas')).toBeTruthy()
  const way = item.getByRole('link', { name: 'Conectar de novo em Integrações da empresa' })
  expect(way.getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations/${matriz.id}`)
})

test('sem nenhuma ligação, a frase e o caminho para a dona; para o membro, quem pede', async () => {
  open({ sankhya: [], ml: [], mayManage: true })
  expect(await screen.findByText('A empresa ainda não ligou nenhum sistema.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ligar em Integrações da empresa' })).toBeTruthy()
})

test('o membro, sem nenhuma ligação, lê a frase de quem pedir', async () => {
  open({ sankhya: [], ml: [], mayManage: false })
  expect(await screen.findByText('A empresa ainda não ligou nenhum sistema.')).toBeTruthy()
  expect(screen.getByText(ASK)).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Ligar em Integrações da empresa' })).toBeNull()
})

test('a liberação recusada porque o Projeto já lê outra ligação diz a frase na janela', async () => {
  open({ sankhya: [], ml: [line('Loja 1')], mayManage: true })
  server.use(
    http.put(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, () =>
      refusal('PROJECT_CONNECTION_TAKEN'),
    ),
  )
  fireEvent.click((await row('Loja 1')).getByRole('button', { name: 'Liberar para ler: Loja 1' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Liberar' }))
  expect(
    await within(dialog).findByText(
      'Este Projeto já lê outra ligação desse sistema. Tire a outra ligação antes de liberar esta.',
    ),
  ).toBeTruthy()
})

test('a leitura das ligações que falha diz a frase com Tentar de novo', async () => {
  open({ sankhya: [], ml: [], mayManage: true })
  server.use(
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByText(sentenceOfCode('DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('a lista da empresa que falha também diz a frase, e não deixa a dona sem saber', async () => {
  open({ sankhya: [line('Matriz')], ml: [], mayManage: true })
  server.use(http.get(`${API}/connections`, () => refusal('DATABASE_UNAVAILABLE')))
  expect(await screen.findByText(sentenceOfCode('DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Liberar|Tirar/ })).toBeNull()
})
