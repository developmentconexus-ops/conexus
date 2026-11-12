import type { CompanyMemoryPage } from '@conexus/hub-api'
import { readCompanyMemoryPage } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { HttpResponseResolver } from 'msw'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PATH = `*/api/companies/${COMPANY.id}/assistant/company-memory`
const DAY = '2026-11-11T15:00:00.000Z'
const Page = readCompanyMemoryPage.success.body.shape.page

const INSTRUCTIONS = Page.parse({
  pageId: '01M77190XASM4QGT4DFDJ6K1Y4',
  name: 'Instruções da empresa',
  updatedAt: DAY,
  author: null,
  body: '',
  version: 1,
  notes: [],
})

const OPERATION = Page.parse({
  pageId: '01M771918E4B2GA6D4KYHGY5TW',
  name: 'CODTIPOPER 1100',
  updatedAt: DAY,
  author: 'Ana Lima',
  body: 'O campo CODTIPOPER 1100 é a venda de balcão.',
  version: 1,
  notes: [
    { id: '01M77191AKD9SG2VNWW30X2HE9', body: 'Vale desde 2026.', updatedAt: DAY, author: null },
  ],
})

/** What the Hub holds and what reached it: how often the list was read, and every write. */
type Held = {
  instructions: CompanyMemoryPage
  pages: CompanyMemoryPage[]
  lists: number
  writes: { method: string; path: string; body: unknown }[]
}

type Answers = {
  list?: HttpResponseResolver
  page?: HttpResponseResolver
  remove?: HttpResponseResolver
}

/** The Hub's answers to the company's memory, as its routes give them; `answers` replaces one. */
function memoryHandlers(held: Held, mayManage: boolean, answers: Answers) {
  function found(pageId: unknown) {
    return held.pages.find((page) => page.pageId === pageId)
  }
  async function wrote(method: string, request: Request) {
    const url = new URL(request.url)
    const body = method === 'PUT' ? await request.clone().json() : url.search
    held.writes.push({ method, path: url.pathname.replace(/^.*company-memory/, ''), body })
  }
  return [
    http.get(PATH, (info) => {
      held.lists += 1
      if (answers.list !== undefined) return answers.list(info)
      const pages = held.pages.map(({ pageId, name, updatedAt, author }) => ({
        ...{ pageId, name, updatedAt, author },
      }))
      return HttpResponse.json({ instructions: held.instructions, pages, mayManage })
    }),
    http.get(`${PATH}/pages/:pageId`, (info) => {
      if (answers.page !== undefined) return answers.page(info)
      const page = found(info.params.pageId)
      return page === undefined ? refusal('NOT_FOUND') : HttpResponse.json({ page })
    }),
    http.put(`${PATH}/pages/:pageId`, async ({ request, params }) => {
      await wrote('PUT', request)
      const { name, body } = Object(await request.json())
      const page =
        params.pageId === held.instructions.pageId ? held.instructions : found(params.pageId)
      if (page === undefined) return refusal('NOT_FOUND')
      Object.assign(page, { name, body, version: page.version + 1 })
      return HttpResponse.json({ page })
    }),
    http.delete(`${PATH}/pages/:pageId`, async (info) => {
      await wrote('DELETE', info.request)
      if (answers.remove !== undefined) return answers.remove(info)
      held.pages = held.pages.filter((page) => page.pageId !== info.params.pageId)
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${PATH}/notes/:noteId`, async ({ request, params }) => {
      await wrote('PUT', request)
      const { body } = Object(await request.json())
      return HttpResponse.json({
        note: { id: params.noteId, body, updatedAt: DAY, author: ANA.name },
      })
    }),
    http.delete(`${PATH}/notes/:noteId`, async ({ request }) => {
      await wrote('DELETE', request)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/** Memória da empresa as a person of `role` opens it; an owner or an administrator may change it. */
function openMemory(
  options: { role?: string; pages?: CompanyMemoryPage[]; body?: string } & Answers = {},
) {
  const role = options.role ?? 'owner'
  const held: Held = {
    instructions: { ...INSTRUCTIONS, body: options.body ?? '' },
    pages: (options.pages ?? []).map((page) => structuredClone(page)),
    lists: 0,
    writes: [],
  }
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role }),
    ...memoryHandlers(held, role === 'owner' || role === 'admin', options),
  )
  const entries = [`/companies/${COMPANY.id}/settings/company-memory`]
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: entries }))} />)
  return held
}

/** The page, once its first section is drawn: the frame around it holds nothing these tests look for. */
async function memorySection() {
  await screen.findByRole('region', { name: 'Instruções da empresa' })
  return screen
}

const SUMMARY = 'As instruções e as páginas que o Assistente segue em toda conversa da empresa.'
const NO_PAGES = 'Nenhuma página guardada ainda.'
const ONLY_MANAGERS = 'Só o dono ou um administrador muda a memória da empresa.'
const RULE = 'Valores em reais com duas casas.'

async function box(name = INSTRUCTIONS.name): Promise<HTMLTextAreaElement> {
  const found = await (await memorySection()).findByRole('textbox', { name })
  if (!(found instanceof HTMLTextAreaElement)) throw new Error(`${name} is not a text box`)
  return found
}

async function opened(name = OPERATION.name) {
  const shown = await memorySection()
  fireEvent.click(await shown.findByRole('button', { name: `Ver ${name}` }))
  return shown
}

test('primeira vez e vazio: a frase da página, as instruções vazias com a contagem e "Nenhuma página guardada ainda."', async () => {
  openMemory()
  const shown = await memorySection()
  expect(shown.getAllByText(SUMMARY).length).toBeGreaterThan(0)
  expect((await box()).value).toBe('')
  expect(shown.getByText('0 / 2.000')).toBeTruthy()
  expect(await shown.findByText(NO_PAGES)).toBeTruthy()
  expect(shown.getByRole('button', { name: 'Salvar' })).toBeTruthy()
  expect(shown.queryByText(ONLY_MANAGERS)).toBeNull()
})

test('carregando: a lista carregando no lugar das instruções', async () => {
  const { promise: held, resolve: release } = Promise.withResolvers<void>()
  openMemory({
    list: async () => {
      await held
      return HttpResponse.json({ instructions: INSTRUCTIONS, pages: [], mayManage: true })
    },
  })
  const shown = await memorySection()
  expect(await shown.findByRole('status', { name: 'Carregando' })).toBeTruthy()
  expect(shown.queryByRole('textbox')).toBeNull()
  release()
  expect(await shown.findByText(NO_PAGES)).toBeTruthy()
})

test('erro na leitura: "Não foi possível ler a memória da empresa." com Tentar de novo, que relê', async () => {
  let failing = true
  const held = openMemory({
    list: () =>
      failing
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ instructions: INSTRUCTIONS, pages: [], mayManage: true }),
  })
  const shown = await memorySection()
  expect(await shown.findByText('Não foi possível ler a memória da empresa.')).toBeTruthy()
  failing = false
  fireEvent.click(shown.getByRole('button', { name: 'Tentar de novo' }))
  expect(await shown.findByText(NO_PAGES)).toBeTruthy()
  expect(held.lists).toBeGreaterThan(1)
})

test('com páginas: o nome e "Ana · 11/11/2026"; Ver abre o texto e as notas, com quem escreveu', async () => {
  openMemory({ pages: [OPERATION], body: RULE })
  expect((await box()).value).toBe(RULE)
  const shown = await opened()
  expect(shown.getByText('Ana Lima · 11/11/2026')).toBeTruthy()
  expect(await shown.findByText(OPERATION.body)).toBeTruthy()
  const notes = within(shown.getByRole('list', { name: `Notas de ${OPERATION.name}` }))
  expect(notes.getByText('Vale desde 2026.')).toBeTruthy()
  expect(notes.getByText('Assistente · 11/11/2026')).toBeTruthy()
  fireEvent.click(shown.getByRole('button', { name: `Fechar ${OPERATION.name}` }))
  await waitFor(() => expect(shown.queryByText(OPERATION.body)).toBeNull())
})

test('sem permissão: o membro lê as instruções, as páginas e as notas, com a frase de quem pode, e nenhum botão de mudar', async () => {
  openMemory({ role: 'member', pages: [OPERATION], body: RULE })
  const shown = await memorySection()
  expect(await shown.findByText(ONLY_MANAGERS)).toBeTruthy()
  expect((await box()).readOnly).toBe(true)
  await opened()
  expect(await shown.findByText(OPERATION.body)).toBeTruthy()
  expect(shown.getByText('Vale desde 2026.')).toBeTruthy()
  for (const name of ['Salvar', 'Editar', 'Apagar', 'Corrigir']) {
    expect(shown.queryByRole('button', { name: new RegExp(`^${name}`) })).toBeNull()
  }
})

test('salvar as instruções: o PUT leva o nome, o texto e a versão lida, e a caixa mostra o que ficou', async () => {
  const held = openMemory()
  fireEvent.change(await box(), { target: { value: RULE } })
  const shown = await memorySection()
  expect(shown.getByText(`${RULE.length} / 2.000`)).toBeTruthy()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(held.writes).toHaveLength(1))
  expect(held.writes[0]).toEqual({
    method: 'PUT',
    path: `/pages/${INSTRUCTIONS.pageId}`,
    body: { name: INSTRUCTIONS.name, body: RULE, version: 1 },
  })
  await waitFor(() => expect(held.lists).toBeGreaterThan(1))
  expect((await box()).value).toBe(RULE)
})

test('acima de 2.000 caracteres: a frase do campo com a contagem, e nada é enviado', async () => {
  const held = openMemory()
  fireEvent.change(await box(), { target: { value: 'a'.repeat(2001) } })
  const shown = await memorySection()
  expect(shown.getByText('2.001 / 2.000')).toBeTruthy()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByText('Escreva até 2.000 caracteres.')).toBeTruthy()
  expect(held.writes).toEqual([])
})

test('não encontrado: a página que outro apagou diz "Esta página não existe mais."', async () => {
  openMemory({ pages: [OPERATION], page: () => refusal('NOT_FOUND') })
  const shown = await opened()
  expect(await shown.findByText('Esta página não existe mais.')).toBeTruthy()
})

test('apagar com outra gravação no meio: "A página mudou enquanto você apagava." e a lista relida', async () => {
  const held = openMemory({
    pages: [OPERATION],
    remove: () => refusal('COMPANY_MEMORY_CHANGED'),
  })
  const shown = await opened()
  fireEvent.click(await shown.findByRole('button', { name: `Apagar ${OPERATION.name}` }))
  const dialog = within(await screen.findByRole('alertdialog'))
  const before = held.lists
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar' }))
  expect(await dialog.findByText('A página mudou enquanto você apagava.')).toBeTruthy()
  await waitFor(() => expect(held.lists).toBeGreaterThan(before))
  expect(held.writes).toEqual([
    { method: 'DELETE', path: `/pages/${OPERATION.pageId}`, body: '?version=1' },
  ])
})

test('apagar uma página: confirmada, o DELETE leva a versão lida e a página sai da lista', async () => {
  const held = openMemory({ pages: [OPERATION] })
  const shown = await opened()
  fireEvent.click(await shown.findByRole('button', { name: `Apagar ${OPERATION.name}` }))
  const dialog = within(await screen.findByRole('alertdialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar' }))
  expect(await shown.findByText(NO_PAGES)).toBeTruthy()
  expect(held.writes.map((each) => each.body)).toEqual(['?version=1'])
})

test('editar uma página: o PUT leva o nome, o texto e a versão, e a página mostra o que ficou', async () => {
  const held = openMemory({ pages: [OPERATION] })
  const shown = await opened()
  fireEvent.click(await shown.findByRole('button', { name: `Editar ${OPERATION.name}` }))
  const corrected = 'O campo CODTIPOPER 1100 é a venda à vista no balcão.'
  fireEvent.change(await box('Texto'), { target: { value: corrected } })
  fireEvent.click(shown.getByRole('button', { name: `Salvar ${OPERATION.name}` }))
  expect(await shown.findByText(corrected)).toBeTruthy()
  expect(held.writes.at(-1)).toEqual({
    method: 'PUT',
    path: `/pages/${OPERATION.pageId}`,
    body: { name: OPERATION.name, body: corrected, version: 1 },
  })
})

test('as notas: corrigir leva o texto novo, apagar pede a confirmação e leva a nota', async () => {
  const held = openMemory({ pages: [OPERATION] })
  const [note] = OPERATION.notes
  const shown = await opened()
  fireEvent.click(await shown.findByRole('button', { name: `Corrigir a nota: ${note?.body}` }))
  fireEvent.change(await box('Nota'), { target: { value: 'Vale desde março.' } })
  fireEvent.click(shown.getByRole('button', { name: 'Salvar a nota' }))
  await waitFor(() => expect(held.writes).toHaveLength(1))
  expect(held.writes[0]).toEqual({
    method: 'PUT',
    path: `/notes/${note?.id}`,
    body: { body: 'Vale desde março.' },
  })
  fireEvent.click(await shown.findByRole('button', { name: `Apagar a nota: ${note?.body}` }))
  const dialog = within(await screen.findByRole('alertdialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar' }))
  await waitFor(() => expect(held.writes).toHaveLength(2))
  expect(held.writes[1]).toEqual({ method: 'DELETE', path: `/notes/${note?.id}`, body: '' })
})
