import { ProjectSummary } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { choose } from '../conversation/test-hub.tsx'
import { agent, OTHER_AGENT, PROJECT_ROOT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A página Agentes do Início (step 24.3.1, U9, criterion 36, the founder's V1).
const server = hubServer()
const { at } = agentScreens(server)
const HOME_AGENTS = `/companies/${COMPANY.id}/agents`
const ESTOQUE = ProjectSummary.parse({
  id: 'e'.repeat(32),
  name: 'Estoque',
  createdAt: '2026-10-18T12:00:00.000Z',
  appVersion: null,
  publishedVersion: null,
})
const THERE = agent({
  id: OTHER_AGENT,
  projectId: ESTOQUE.id,
  name: 'Resumo de estoque',
  state: { kind: 'PUBLISHED', version: 2, changed: false },
  lastRunAt: new Date(Date.now() - 3 * 60_000).toISOString(),
})
const HERE = agent({ state: { kind: 'DRAFT' } })

test('a página lista os agentes de todos os Projetos com o Projeto, o estado e a última execução, sem botão de mudar', async () => {
  at(HOME_AGENTS, { agents: [HERE, THERE] }, { projects: [PEDIDOS, ESTOQUE] })
  const link = await screen.findByRole('link', { name: /Resumo de estoque/ })
  expect(link.getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/projects/${ESTOQUE.id}/agents/${OTHER_AGENT}`,
  )
  expect(await within(link).findByText('Estoque')).toBeTruthy()
  expect(within(link).getByText(/Rodou há 3 min/)).toBeTruthy()
  expect(within(link).getByText('Versão 2 · publicada')).toBeTruthy()
  const here = screen.getByRole('link', { name: /Conferente de metas/ })
  expect(await within(here).findByText('Pedidos')).toBeTruthy()
  expect(within(here).getByText(/Nunca rodou/)).toBeTruthy()
  expect(within(here).getByText('Rascunho')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Publicar|Apagar|Salvar/ })).toBeNull()
})

test('a última execução diz "Rodou ontem" e, mais antiga, "Rodou em" com o dia', async () => {
  const day = 24 * 3_600_000
  const old = new Date(Date.now() - 20 * day)
  at(
    HOME_AGENTS,
    {
      agents: [
        agent({ name: 'Ontem', lastRunAt: new Date(Date.now() - day - 3_600_000).toISOString() }),
        agent({ id: OTHER_AGENT, name: 'Antigo', lastRunAt: old.toISOString() }),
      ],
    },
    { projects: [PEDIDOS] },
  )
  const yesterday = await screen.findByRole('link', { name: /Ontem/ })
  expect(within(yesterday).getByText(/Rodou ontem/)).toBeTruthy()
  const older = screen.getByRole('link', { name: /Antigo/ })
  expect(within(older).getByText(/^Rodou em \d{2}\/\d{2}$/)).toBeTruthy()
})

test('o filtro por Projeto troca a lista e o endereço; sem agentes ali, a frase do filtro', async () => {
  const { conexus } = at(HOME_AGENTS, { agents: [HERE] }, { projects: [PEDIDOS, ESTOQUE] })
  await screen.findByRole('link', { name: /Conferente de metas/ })
  await choose(screen.getByRole('combobox', { name: 'Projeto' }), 'Estoque')
  expect(await screen.findByText('Nenhum agente neste Projeto.')).toBeTruthy()
  expect(conexus.router.state.location.search).toEqual({ projectId: ESTOQUE.id })
  expect(screen.queryByRole('link', { name: /Conferente de metas/ })).toBeNull()
})

test('o endereço que nomeia um Projeto fora das páginas lidas mostra o nome dele no filtro, não o id', async () => {
  at(
    `${HOME_AGENTS}?projectId=${ESTOQUE.id}`,
    { agents: [THERE] },
    { projects: [PEDIDOS, ESTOQUE] },
  )
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json({ projects: [PEDIDOS], next: { kind: 'END' }, databaseReady: true }),
    ),
  )
  const filter = await screen.findByRole('combobox', { name: 'Projeto' })
  await waitFor(() => expect(filter.textContent).toBe('Estoque'))
})

test('sem agentes, a frase de que eles nascem num Projeto', async () => {
  at(HOME_AGENTS, { agents: [] })
  expect(
    await screen.findByText('Nenhum agente ainda. Os agentes nascem num Projeto.'),
  ).toBeTruthy()
})

test('Novo agente pergunta o Projeto e abre a área Agentes dele', async () => {
  const { conexus } = at(HOME_AGENTS, { agents: [] }, { projects: [PEDIDOS, ESTOQUE] })
  fireEvent.click(await screen.findByRole('button', { name: 'Novo agente' }))
  expect(await screen.findByText('Em qual Projeto?')).toBeTruthy()
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Estoque' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(
      `/companies/${COMPANY.id}/projects/${ESTOQUE.id}/agents`,
    ),
  )
})

test('o membro: a página dá não encontrado e a entrada não aparece', async () => {
  at(HOME_AGENTS, { agents: [], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Agentes' })).toBeNull()
})

test('a entrada Agentes do Início leva à página, para quem não é membro', async () => {
  at(PROJECT_ROOT, { agents: [] })
  const links = await screen.findAllByRole('link', { name: 'Agentes' })
  expect(links.map((one) => one.getAttribute('href'))).toContain(`/companies/${COMPANY.id}/agents`)
})
