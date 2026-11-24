import { ConnectionId, ConversationId, ProjectId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import { assistantConversation, assistantScreens, COMPANY_ROOT, SANKHYA } from './test-hub.tsx'

// The blocks of Início under the box: Continuar, Projetos, Ligações (step 13.3, criterion 8).
const server = hubServer()
const { at } = assistantScreens(server)

const PUBLICADO = { ...PEDIDOS, appVersion: 4, publishedVersion: 3 }
const CONSTRUINDO = {
  ...PEDIDOS,
  id: ProjectId.parse('o'.repeat(32)),
  name: 'Estoque',
  appVersion: 2,
}
const SEM_APP = { ...PEDIDOS, id: ProjectId.parse('n'.repeat(32)), name: 'Metas' }

const MATRIZ = ConnectionId.parse('11111111-1111-4111-8111-111111111111')
const FILIAL = ConnectionId.parse('22222222-2222-4222-8222-222222222222')
const NOVA = ConnectionId.parse('33333333-3333-4333-8333-333333333333')

function connection(id: ConnectionId, name: string, state: string, auth = 'client_credentials') {
  return {
    connection: {
      id,
      connector: 'sankhya',
      name,
      connectorVersion: '1',
      state,
      account: null,
      linkedBy: null,
      linkedAt: '2026-10-29T12:00:00.000Z',
      testedAt: null,
      testedBy: null,
    },
    auth,
  }
}

function connections(rows: ReturnType<typeof connection>[]) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({
        connectors: [{ ...SANKHYA, auth: rows[0]?.auth ?? SANKHYA.auth }],
        connections: rows.map((row) => row.connection),
        mayManage: true,
      }),
    ),
  )
}

async function block(name: string) {
  return within(await screen.findByRole('region', { name }))
}

test('Continuar mostra as 5 últimas conversas e o Projeto de cada uma; sem conversa, a frase', async () => {
  const six = Array.from({ length: 6 }, (_, n) =>
    assistantConversation({
      id: ConversationId.parse(`${n}0000000-0000-4000-8000-000000000000`),
      title: `Conversa ${n + 1}`,
    }),
  )
  at(COMPANY_ROOT, { conversations: six })
  const continuar = await block('Continuar')
  await continuar.findByRole('link', { name: /Conversa 1/ })
  expect(continuar.getAllByRole('link')).toHaveLength(5)
  expect(continuar.queryByRole('link', { name: /Conversa 6/ })).toBeNull()
})

test('Continuar sem conversas diz "Nenhuma conversa ainda."', async () => {
  at(COMPANY_ROOT)
  expect(await (await block('Continuar')).findByText('Nenhuma conversa ainda.')).toBeTruthy()
})

test('Projetos mostra o estado em palavras: Publicado · v3, Em construção · v2, Ainda sem app', async () => {
  at(COMPANY_ROOT)
  server.use(
    ...projectsRead({
      projects: [PUBLICADO, CONSTRUINDO, SEM_APP],
      databaseReady: true,
      mayDelete: true,
    }),
  )
  const projetos = await block('Projetos')
  const rows = await projetos.findAllByRole('link', { name: /Pedidos|Estoque|Metas/ })
  expect(rows.map((row) => row.textContent)).toEqual([
    'PedidosPublicado · v3',
    'EstoqueEm construção · v2',
    'MetasAinda sem app',
  ])
})

test('Ligações usa a palavra de stateBadge e nenhuma para uma ainda não testada', async () => {
  at(COMPANY_ROOT)
  connections([
    connection(MATRIZ, 'Matriz', 'ACTIVE'),
    connection(FILIAL, 'Filial', 'NEEDS_REAUTH'),
    connection(NOVA, 'Loja', 'NEW'),
  ])
  const ligacoes = await block('Ligações')
  const rows = await ligacoes.findAllByRole('link', { name: /Matriz|Filial|Loja/ })
  expect(rows.map((row) => row.textContent)).toEqual([
    'MatrizFuncionando',
    'FilialChaves recusadas',
    'Loja',
  ])
})

test('no máximo 5 linhas e "Mais N"; o resto está em Integrações', async () => {
  at(COMPANY_ROOT)
  connections(
    Array.from({ length: 7 }, (_, n) =>
      connection(
        ConnectionId.parse(`${n}1111111-1111-4111-8111-111111111111`),
        `Ligação ${n + 1}`,
        'ACTIVE',
      ),
    ),
  )
  const ligacoes = await block('Ligações')
  await ligacoes.findByRole('link', { name: /Ligação 1/ })
  expect(ligacoes.getAllByRole('link', { name: /^Ligação / })).toHaveLength(5)
  const more = ligacoes.getByRole('link', { name: 'Mais 2 ligações' })
  expect(more.getAttribute('href')).toContain('/integrations')
})

test('cada bloco vazio tem a sua frase', async () => {
  at(COMPANY_ROOT)
  server.use(...projectsRead({ projects: [], databaseReady: false, mayDelete: true }))
  expect(await (await block('Projetos')).findByText('Nenhum projeto ainda.')).toBeTruthy()
  expect(
    await (await block('Ligações')).findByText('Ligue um sistema em Integrações.'),
  ).toBeTruthy()
})

test('uma falha de leitura mostra a frase do código e Tentar de novo, que lê de novo', async () => {
  let failing = true
  at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      failing
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({
            connectors: [SANKHYA],
            connections: [connection(MATRIZ, 'Matriz', 'ACTIVE').connection],
            mayManage: true,
          }),
    ),
  )
  const ligacoes = await block('Ligações')
  const retry = await ligacoes.findByRole('button', { name: 'Tentar de novo' })
  expect(ligacoes.getByRole('alert').textContent).toContain('banco')
  failing = false
  fireEvent.click(retry)
  await waitFor(() => expect(ligacoes.getByRole('link', { name: /Matriz/ })).toBeTruthy())
})
