import { ASSISTANT_TOOL, createProject } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, PEDIDOS_ADDRESS } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  toolSaid,
} from './test-hub.tsx'

// Criar app: the summary the Assistant proposed becomes a Projeto and its Builder's conversation (step 24.1, criterion 28).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const SUMMARY = 'Um app de encomendas'

function proposing() {
  return at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [toolSaid(ASSISTANT_TOOL.proposeApp, { summary: SUMMARY }, { summary: SUMMARY })],
      }),
    ],
  })
}

test('Criar app abre o nome do Projeto com o pedido resumido, e Cancelar fecha sem criar nada', async () => {
  const { writes } = proposing()
  fireEvent.click(await screen.findByRole('button', { name: 'Criar app' }))
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByText(SUMMARY)).toBeTruthy()
  expect(within(dialog).getByLabelText('Nome do projeto')).toBeTruthy()
  // The dialog is the frame: the naming does not draw a second one inside it (K28).
  expect(dialog.querySelector('.rounded-composer')).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByLabelText('Nome do projeto')).toBeNull())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(writes()).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  expect(await screen.findByLabelText('Nome do projeto')).toBeTruthy()
})

test('Criar e começar cria o Projeto e abre o Builder com o pedido resumido enviado uma vez', async () => {
  const created: unknown[] = []
  const handed: { path: string; body: unknown }[] = []
  const { conexus, writes } = proposing()
  server.use(
    http.post('*/agent-controller/builder/sessions/:id/messages', async ({ request }) => {
      handed.push({ path: new URL(request.url).pathname, body: await request.json() })
      return HttpResponse.json({ ok: true })
    }),
    http.post('*/api/companies/:companyId/projects', async ({ request }) => {
      created.push(await request.json())
      return HttpResponse.json(
        createProject.success.body.parse({
          project: {
            ...PEDIDOS,
            mayDelete: true,
            address: PEDIDOS_ADDRESS,
            appVersion: null,
            publishedVersion: null,
          },
        }),
        { status: 201 },
      )
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Criar app' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar e começar' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(
      `/projects/${PEDIDOS.id}/conversations/`,
    ),
  )
  expect(created).toHaveLength(1)
  await waitFor(() => expect(handed).toHaveLength(1))
  expect(JSON.stringify(handed[0]?.body)).toContain(SUMMARY)
  // The Assistant's own conversation, opened directly, is still mounted while the navigation
  // loads: the summary goes to the new Builder conversation alone, never to it (QA F5).
  expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(0)
  expect(handed[0]?.path).not.toContain(ASKED)
})
