import { deleteProject } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
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
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const ABOUT = `${PROJECT}?lens=project`
const UNCONFIRMED = 'Não confirmamos a exclusão. Veja a lista.'

beforeEach(() => server.use(conversationsNone))

/** The Hub with Pedidos; the delete is answered by `answer`, and a 204 takes Pedidos out. */
function hub(answer: () => Response | Promise<Response>, mayDelete = true) {
  const view = { projects: [PEDIDOS], databaseReady: true, mayDelete }
  const sent: unknown[] = []
  server.use(
    ...projectsRead(view),
    http.delete(`*/api/companies/${COMPANY.id}/projects/:projectId`, async ({ request }) => {
      sent.push(await request.json())
      const response = await answer()
      if (response.status === 204) view.projects = []
      return response
    }),
  )
  return sent
}

async function open() {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [ABOUT] }))
  render(<Conexus conexus={conexus} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar Projeto' }))
  await screen.findByRole('alertdialog')
  return conexus.router
}

function confirm(name = PEDIDOS.name) {
  fireEvent.change(screen.getByLabelText('Digite o nome do Projeto'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Apagar Projeto' }))
}

function done() {
  return new HttpResponse(null, { status: 204 })
}

test('o Projeto mostra o nome e a data, e o dono vê "Apagar Projeto"', async () => {
  hub(done)
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ABOUT] }))} />)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(screen.getByText('Criado em 17/10/2026')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Apagar Projeto' })).toBeTruthy()
})

test('o nome do Projeto está uma vez só, na linha de cima, com o nome inteiro no title, em cada aba', async () => {
  hub(done)
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))} />)
  const title = await screen.findByRole('heading', { name: 'Pedidos' })
  expect(title.getAttribute('title')).toBe('Pedidos')
  expect(title.nextElementSibling?.getAttribute('aria-label')).toBe('Projeto')
  fireEvent.click(screen.getByRole('tab', { name: 'Projeto' }))
  expect(await screen.findByText('Criado em 17/10/2026')).toBeTruthy()
  expect(screen.getAllByRole('heading', { name: 'Pedidos' })).toHaveLength(1)
})

test('o membro vê o Sobre sem "Apagar Projeto", e quem pode apagar', async () => {
  hub(done, false)
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ABOUT] }))} />)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Apagar Projeto' })).toBeNull()
  expect(
    screen.getByText('Só o dono ou quem administra a empresa pode apagar o Projeto.'),
  ).toBeTruthy()
})

for (const role of ['owner', 'admin', 'member'] as const) {
  test(`${role}: o endereço e "Abrir app", um link para https://<endereço>/`, async () => {
    server.use(
      ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
    )
    render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ABOUT] }))} />)
    expect(await screen.findByText(PEDIDOS_ADDRESS)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Abrir app' }).getAttribute('href')).toBe(
      `https://${PEDIDOS_ADDRESS}/`,
    )
  })
}

test('um Projeto sem endereço, feito na 7.x: nem o endereço nem "Abrir app"', async () => {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, address: null }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ABOUT] }))} />)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(screen.queryByText(/Endereço do app:/)).toBeNull()
  expect(screen.queryByRole('link', { name: 'Abrir app' })).toBeNull()
})

test('um Projeto que o Hub não acha: a página de "não encontrado"', async () => {
  hub(done)
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({
          initialEntries: [`/companies/${COMPANY.id}/projects/${'z'.repeat(32)}`],
        }),
      )}
    />,
  )
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('vazio: "Apagar Pedidos?", "Isto não se desfaz.", o campo com o foco e Apagar Projeto desligado', async () => {
  hub(done)
  await open()
  const dialog = screen.getByRole('alertdialog')
  expect(screen.getByRole('heading', { name: 'Apagar Pedidos?' })).toBeTruthy()
  expect(dialog.textContent).toContain('Isto não se desfaz.')
  const field = screen.getByLabelText('Digite o nome do Projeto')
  await waitFor(() => expect(document.activeElement).toBe(field))
  expect(screen.getByRole('button', { name: 'Apagar Projeto' })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

test('um nome diferente não confirma, nem com Enter', async () => {
  const sent = hub(done)
  await open()
  const field = screen.getByLabelText('Digite o nome do Projeto')
  fireEvent.change(field, { target: { value: 'pedidos' } })
  expect(screen.getByRole('button', { name: 'Apagar Projeto' })).toHaveProperty('disabled', true)
  const form = field.closest('form')
  if (form === null) throw new Error('the confirmation form is missing')
  fireEvent.submit(form)
  await screen.findByText('O nome não confere.')
  expect(sent).toHaveLength(0)
})

test('204: leva o nome, vai à lista e diz "Projeto apagado."', async () => {
  const sent = hub(done)
  const router = await open()
  confirm()
  expect(await screen.findByText('Projeto apagado.')).toBeTruthy()
  expect(sent).toEqual([deleteProject.input.body.parse({ name: 'Pedidos' })])
  expect(screen.getByText('Nenhum Projeto ainda.')).toBeTruthy()
  expect(screen.queryByRole('alertdialog')).toBeNull()
  await waitFor(() => expect(router.state.location.search).toEqual({}))
})

test('na espera: "Apagando…", o diálogo aberto e Cancelar desligado', async () => {
  const held = Promise.withResolvers<void>()
  hub(async () => {
    await held.promise
    return refusal('PROJECT_NAME_MISMATCH')
  })
  await open()
  confirm()
  expect(await screen.findByRole('button', { name: 'Apagando…' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  held.resolve()
  await screen.findByText('O nome não confere.')
})

for (const [name, answer] of [
  ['corte', () => HttpResponse.error()],
  ['502 da borda', () => new HttpResponse('<html></html>', { status: 502 })],
  ['503 do banco', () => refusal('DATABASE_UNAVAILABLE')],
] as const) {
  test(`${name}: o diálogo fica e diz que não confirmou`, async () => {
    hub(answer)
    await open()
    confirm()
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByLabelText('Digite o nome do Projeto')).toHaveProperty('value', 'Pedidos')
  })
}

test('422: "O nome não confere." no campo', async () => {
  hub(() => refusal('PROJECT_NAME_MISMATCH'))
  await open()
  confirm()
  expect(await screen.findByText('O nome não confere.')).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('Digite o nome do Projeto').getAttribute('aria-invalid')).toBe(
      'true',
    ),
  )
})

test('404: fecha e vai à lista, sem "Projeto apagado."', async () => {
  hub(() => refusal('NOT_FOUND'))
  const router = await open()
  confirm()
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(screen.queryByText('Projeto apagado.')).toBeNull()
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}/projects`)
})

test('o aviso de apagar diz que o app, o banco e as versões vão junto', async () => {
  hub(done)
  await open()
  expect(screen.getByRole('alertdialog').textContent).toContain(
    'O app, o banco dele e as versões vão junto com o Projeto.',
  )
})
