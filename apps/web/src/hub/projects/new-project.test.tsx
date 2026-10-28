import { createProject, FAILURES, ProjectSummary } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  PEDIDOS_ADDRESS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const HOME = `/companies/${COMPANY.id}`
const NOVO = ProjectSummary.parse({
  id: 'q'.repeat(32),
  name: 'Estoque',
  createdAt: '2026-10-28T12:00:00.000Z',
})

/** The company's Projects as `projects`; the Projeto written is `NOVO`, unless `answer` says otherwise. */
function hub(answer?: () => Response) {
  const sent: unknown[] = []
  server.use(
    conversationsNone,
    ...projectsRead({
      projects: [PEDIDOS, NOVO],
      databaseReady: true,
      mayDelete: true,
      role: 'member',
    }),
    http.post(`*/api/companies/${COMPANY.id}/projects`, async ({ request }) => {
      sent.push(await request.json())
      return (
        answer?.() ??
        HttpResponse.json(
          createProject.success.body.parse({
            project: {
              ...NOVO,
              mayDelete: true,
              mayManageVersions: true,
              address: PEDIDOS_ADDRESS,
              appVersion: null,
            },
          }),
          { status: 201 },
        )
      )
    }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [`${HOME}/projects`] }))
  render(<Conexus conexus={conexus} />)
  return { sent, router: conexus.router }
}

async function openDialog() {
  const nav = within(await screen.findByRole('navigation', { name: 'Navegação' }))
  fireEvent.click(await nav.findByRole('button', { name: 'Novo projeto' }))
  return within(await screen.findByRole('dialog', { name: 'Novo projeto' }))
}

function name(dialog: ReturnType<typeof within>, text: string) {
  fireEvent.change(dialog.getByLabelText('Nome do projeto'), { target: { value: text } })
}

test('o +: abre o diálogo, o nome cria o Projeto e a pessoa chega na página dele', async () => {
  const { sent, router } = hub()
  const dialog = await openDialog()
  expect(
    dialog.getByText('Um Projeto precisa só de um nome, por enquanto. O endereço do app sai dele.'),
  ).toBeTruthy()
  name(dialog, 'Estoque')
  expect(await dialog.findByText('estoque--empresa-teste.apps.example.test')).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: 'Criar projeto' }))
  await waitFor(() => expect(router.state.location.pathname).toBe(`${HOME}/projects/${NOVO.id}`))
  expect(sent).toEqual([{ name: 'Estoque' }])
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Novo projeto' })).toBeNull())
})

test('um nome já usado: a frase no campo do nome, e o diálogo fica aberto', async () => {
  const { router } = hub(() => refusal('PROJECT_NAME_TAKEN'))
  const dialog = await openDialog()
  name(dialog, 'Pedidos')
  fireEvent.click(dialog.getByRole('button', { name: 'Criar projeto' }))
  expect(await dialog.findByText(FAILURES.PROJECT_NAME_TAKEN.phrase, { exact: false })).toBeTruthy()
  await waitFor(() =>
    expect(dialog.getByLabelText('Nome do projeto').getAttribute('aria-invalid')).toBe('true'),
  )
  expect(router.state.location.pathname).toBe(`${HOME}/projects`)
})

test('Cancelar fecha o diálogo sem criar', async () => {
  const { sent } = hub()
  const dialog = await openDialog()
  fireEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Novo projeto' })).toBeNull())
  expect(sent).toEqual([])
})
