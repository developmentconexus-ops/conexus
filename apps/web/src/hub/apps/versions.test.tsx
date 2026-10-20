import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import {
  LIVE_PATH,
  livedVersion,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const SETTINGS = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}/settings`

async function open(view: { versions: ReturnType<typeof versionView>[] }, mayDelete = true) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete }),
    versionsRead(view),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />)
  await screen.findByRole('heading', { name: 'Versões' })
}

test('vazio: o texto do endereço com o app de exemplo', async () => {
  await open({ versions: [] })
  expect(
    await screen.findByText('Nenhuma versão enviada. O endereço mostra o app de exemplo.'),
  ).toBeTruthy()
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
  await screen.findByText('Nenhuma versão enviada. O endereço mostra o app de exemplo.')
  expect(screen.queryByText('Carregando as versões…')).toBeNull()
})

test('cada versão: número, data, quem e estado em palavras; só a guardada tem "Voltar para esta"', async () => {
  await open({
    versions: [
      versionView(5, { state: 'sending' }),
      versionView(4, { state: 'failed', failure: 'APP_MIGRATION_FAILED' }),
      versionView(3, { live: true }),
      versionView(2, { sentByName: null }),
    ],
  })
  const rows = await within(screen.getByRole('main')).findAllByRole('listitem')
  expect(rows).toHaveLength(4)
  expect(rows[0]?.textContent).toContain('Versão 5')
  expect(rows[0]?.textContent).toContain('Enviando…')
  expect(rows[1]?.textContent).toContain('Falhou: Uma migração do app falhou no banco.')
  expect(rows[2]?.textContent).toContain('Versão 3 · no ar')
  expect(rows[2]?.textContent).toContain('18/10/2026')
  expect(rows[2]?.textContent).toContain(' · Ana Lima')
  // One who left the company is no longer named.
  expect(rows[3]?.textContent).not.toContain('·')
  expect(screen.getAllByRole('button', { name: 'Voltar para esta' })).toHaveLength(1)
  expect(rows[3]?.textContent).toContain('Voltar para esta')
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

/** Pedidos with versions 2 (live) and 1 (kept); a put is answered by `answer`. */
async function withPut(answer: () => Response | Promise<Response>) {
  const view = { versions: [versionView(2, { live: true }), versionView(1)] }
  const sent: unknown[] = []
  server.use(
    http.put(LIVE_PATH, async ({ request }) => {
      sent.push(await request.json())
      return answer()
    }),
  )
  await open(view)
  await screen.findByText(/Versão 1/)
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para esta' }))
  await screen.findByRole('alertdialog')
  return { view, sent }
}

test('Voltar para esta: o aviso "Os dados ficam como estão." e Cancelar não envia', async () => {
  const { sent } = await withPut(() => refusal('NOT_FOUND'))
  expect(screen.getByRole('alertdialog').textContent).toContain('Os dados ficam como estão.')
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toHaveLength(0)
})

test('Voltar para esta: "Voltando…" na espera; 200 fecha e a lista mostra a versão no ar', async () => {
  const held = Promise.withResolvers<void>()
  const { view, sent } = await withPut(async () => {
    await held.promise
    view.versions = [versionView(2), versionView(1, { live: true })]
    return livedVersion(versionView(1, { live: true }))
  })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para a Versão 1' }))
  expect(await screen.findByRole('button', { name: 'Voltando…' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  held.resolve()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([{ versionId: versionView(1).id }])
  await waitFor(() =>
    expect(within(screen.getByRole('main')).getByRole('list').textContent).toContain(
      'Versão 1 · no ar',
    ),
  )
})

for (const [name, code, phrase] of [
  ['404, podada', 'APP_VERSION_NOT_FOUND', 'Essa versão não existe mais.'],
  ['409, envio em curso', 'APP_VERSION_SENDING', 'Já tem uma versão sendo enviada neste Projeto.'],
] as const) {
  test(`${name}: fecha, diz a frase e lê a lista de novo`, async () => {
    const { view } = await withPut(() => refusal(code))
    view.versions = [versionView(2, { live: true })]
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para a Versão 1' }))
    expect((await screen.findByRole('alert')).textContent).toContain(phrase)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    await waitFor(() => expect(screen.queryByText(/Versão 1/)).toBeNull())
  })
}

test('503: o diálogo fica e diz a frase; confirmar de novo vale', async () => {
  const { view } = await withPut(() => refusal('DATABASE_UNAVAILABLE'))
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para a Versão 1' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  expect(view.versions).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Voltar para a Versão 1' })).toHaveProperty(
    'disabled',
    false,
  )
})
