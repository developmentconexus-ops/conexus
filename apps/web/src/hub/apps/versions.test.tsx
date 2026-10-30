import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import {
  PUBLISHED_PATH,
  publishedVersion,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'

const server = hubServer()
beforeEach(() => server.use(conversationsNone))
const SETTINGS = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}/about?part=versions`

async function open(view: { versions: ReturnType<typeof versionView>[] }, mayDelete = true) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete }),
    versionsRead(view),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))
  render(<Conexus conexus={conexus} />)
  await screen.findByRole('heading', { name: 'Versões' })
  return conexus
}

const EMPTY =
  'Nenhuma versão ainda. Cada versão que o Builder monta aparece aqui, e o app abre no endereço depois do primeiro Publicar.'

test('vazio: de onde vêm as versões e o app de exemplo no endereço, sem "Enviar versão" (35)', async () => {
  await open({ versions: [] })
  expect(await screen.findByText(EMPTY)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})

test('carregando: o Skeleton até a lista chegar', async () => {
  const held = Promise.withResolvers<void>()
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/versions`, async () => {
      await held.promise
      return HttpResponse.json({ versions: [] })
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />)
  expect(await screen.findByText('Carregando as versões…')).toBeTruthy()
  held.resolve()
  await screen.findByText(EMPTY)
  expect(screen.queryByText('Carregando as versões…')).toBeNull()
})

test('as marcas e o Publicar esta: Na Prévia, Publicada e as duas numa só; sem "Voltar para esta"', async () => {
  await open({
    versions: [
      versionView(6, { state: 'sending' }),
      versionView(5, { state: 'failed', failure: 'APP_MIGRATION_FAILED' }),
      versionView(4, { live: true }),
      versionView(3, { published: true, sentByName: null }),
      versionView(2),
    ],
  })
  const rows = await within(screen.getByRole('main')).findAllByRole('listitem')
  expect(rows).toHaveLength(5)
  expect(rows[0]?.textContent).toContain('Enviando…')
  expect(rows[1]?.textContent).toContain('Falhou: Uma migração do app falhou no banco.')
  expect(rows[2]?.textContent).toContain('Versão 4 · Na Prévia')
  expect(rows[2]?.textContent).toContain('18/10/2026')
  expect(rows[2]?.textContent).toContain(' · Ana Lima')
  expect(rows[3]?.textContent).toContain('Versão 3 · Publicada')
  // One who left the company is no longer named.
  expect(rows[3]?.textContent).not.toContain(' · Ana')
  expect(screen.getAllByRole('button', { name: 'Publicar esta' })).toHaveLength(2)
  expect(rows[3]?.querySelector('button')).toBeNull()
  expect(rows[2]?.textContent).toContain('Publicar esta')
  expect(rows[4]?.textContent).toContain('Publicar esta')
  expect(screen.queryByText('Voltar para esta')).toBeNull()
  expect(screen.queryByText(/Só o dono ou quem administra/)).toBeNull()
})

test('a mesma versão na Prévia e publicada tem as duas marcas e nenhum botão', async () => {
  await open({ versions: [versionView(2, { live: true, published: true }), versionView(1)] })
  const [row] = await within(screen.getByRole('main')).findAllByRole('listitem')
  expect(row?.textContent).toContain('Versão 2 · Na Prévia · Publicada')
  expect(row?.querySelector('button')).toBeNull()
})

test('503: a frase e "Tentar de novo", que lê de novo', async () => {
  const view = { versions: [versionView(1, { live: true })], failing: true }
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/versions`, () =>
      view.failing
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ versions: view.versions }),
    ),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />)
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  view.failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText(/Versão 1/)).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('o Hub não acha o Projeto na lista: a página de "não encontrado"', async () => {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/versions`, () =>
      refusal('NOT_FOUND'),
    ),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

/** Pedidos with version 2 in the Prévia and 1 published; a put is answered by `answer`. */
async function withPut(answer: () => Response | Promise<Response>) {
  const view = { versions: [versionView(2, { live: true }), versionView(1, { published: true })] }
  const sent: unknown[] = []
  server.use(
    http.put(PUBLISHED_PATH, async ({ request }) => {
      sent.push(await request.json())
      return answer()
    }),
  )
  const conexus = await open(view)
  await screen.findByText(/Versão 2/)
  fireEvent.click(screen.getByRole('button', { name: 'Publicar esta' }))
  await screen.findByRole('alertdialog')
  return { view, sent, conexus }
}

test('Publicar esta: a pergunta e o aviso "Quem abrir o app passa a ver esta versão."; Cancelar não envia', async () => {
  const { sent } = await withPut(() => refusal('NOT_FOUND'))
  const dialog = screen.getByRole('alertdialog')
  expect(dialog.textContent).toContain('Publicar a versão 2?')
  expect(dialog.textContent).toContain('Quem abrir o app passa a ver esta versão.')
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toHaveLength(0)
})

test('Publicar esta: "Publicando…" na espera; 200 fecha e a lista mostra a Publicada', async () => {
  const held = Promise.withResolvers<void>()
  const { view, sent } = await withPut(async () => {
    await held.promise
    view.versions = [versionView(2, { live: true, published: true }), versionView(1)]
    return publishedVersion(versionView(2, { live: true, published: true }))
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 2' }))
  expect(await screen.findByRole('button', { name: 'Publicando…' })).toHaveProperty(
    'disabled',
    true,
  )
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  held.resolve()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([{ number: 2 }])
  await waitFor(() =>
    expect(within(screen.getByRole('main')).getByRole('list').textContent).toContain(
      'Versão 2 · Na Prévia · Publicada',
    ),
  )
})

test('404, a versão sumiu: fecha, diz a frase e lê a lista de novo', async () => {
  const { view } = await withPut(() => refusal('APP_VERSION_NOT_FOUND'))
  view.versions = [versionView(1, { live: true, published: true })]
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 2' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Essa versão não existe mais.')
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  await waitFor(() => expect(screen.queryByText(/Versão 2/)).toBeNull())
})

test('503: o diálogo fica e diz a frase; confirmar de novo vale', async () => {
  const { view } = await withPut(() => refusal('DATABASE_UNAVAILABLE'))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 2' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  expect(view.versions).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Publicar a versão 2' })).toHaveProperty(
    'disabled',
    false,
  )
})

test('reabrir o diálogo apaga a frase da falha de antes', async () => {
  await withPut(() => refusal('DATABASE_UNAVAILABLE'))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 2' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Publicar esta' }))
  await screen.findByRole('alertdialog')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('404 do Projeto ao publicar: o roteador lê o Projeto de novo', async () => {
  const { conexus } = await withPut(() => refusal('NOT_FOUND'))
  const invalidate = vi.spyOn(conexus.router, 'invalidate')
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 2' }))
  await waitFor(() => expect(invalidate).toHaveBeenCalled())
})
