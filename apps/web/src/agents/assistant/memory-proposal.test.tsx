import { ASSISTANT_TOOL, ATTEMPT_KEY_HEADER, readCompanyMemoryPage } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  toolSaid,
} from './test-hub.tsx'

// The card of what the Assistant proposed to save in the company's memory (U9, criterion 27).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const MEMORY = `*/api/companies/${COMPANY.id}/assistant/company-memory`
const DAY = '2026-11-11T15:00:00.000Z'
const PAGE_ID = '01M771918E4B2GA6D4KYHGY5TW'
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const PAGE = { kind: 'PAGE', name: 'Valores', body: 'Atendemos no mesmo dia.' }
const NOTE = {
  kind: 'NOTE',
  pageId: PAGE_ID,
  pageName: 'CODTIPOPER 1100',
  body: 'Vale desde 2026.',
}

const INSTRUCTIONS = readCompanyMemoryPage.success.body.shape.page.parse({
  ...{ pageId: '01M77190XASM4QGT4DFDJ6K1Y4', name: 'Instruções da empresa', updatedAt: DAY },
  ...{ author: null, body: '', version: 1, notes: [] },
})

/** The Hub of the company's memory: the list says whether the person may save; each save is noted. */
function memoryHub(mayManage: boolean, answer?: () => Response) {
  const writes: { path: string; key: string | null; body: unknown }[] = []
  async function saved(request: Request) {
    const path = new URL(request.url).pathname.replace(/^.*company-memory/, '')
    writes.push({ path, key: request.headers.get(ATTEMPT_KEY_HEADER), body: await request.json() })
    return answer?.()
  }
  const shown = { pageId: PAGE_ID, updatedAt: DAY, author: 'Ana Lima', version: 1, notes: [] }
  server.use(
    http.get(MEMORY, () => HttpResponse.json({ instructions: INSTRUCTIONS, pages: [], mayManage })),
    http.post(`${MEMORY}/pages`, async ({ request }) => {
      const replaced = await saved(request)
      if (replaced !== undefined) return replaced
      return HttpResponse.json(
        { page: { ...shown, name: 'Valores', body: PAGE.body } },
        { status: 201 },
      )
    }),
    http.post(`${MEMORY}/pages/:pageId/notes`, async ({ request }) => {
      const replaced = await saved(request)
      if (replaced !== undefined) return replaced
      const note = {
        id: '01M77191AKD9SG2VNWW30X2HE9',
        body: NOTE.body,
        updatedAt: DAY,
        author: 'Ana Lima',
      }
      return HttpResponse.json({ note }, { status: 201 })
    }),
  )
  return writes
}

function proposing(proposed: object) {
  return assistantConversation({
    messages: [toolSaid(ASSISTANT_TOOL.proposeCompanyMemory, {}, proposed)],
  })
}

test('o cartão mostra o tipo, o nome e o texto, e nada é salvo antes do toque', async () => {
  const writes = memoryHub(true)
  at(OPEN, { conversations: [proposing(PAGE)] })
  expect(await screen.findByText('Proposta de página para a memória da empresa')).toBeTruthy()
  expect(screen.getByText('Valores')).toBeTruthy()
  expect(screen.getByText('Atendemos no mesmo dia.')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Salvar' })).toBeTruthy()
  expect(writes).toHaveLength(0)
})

test('Salvar grava a página pela rota com uma chave de tentativa, e dois toques gravam uma vez', async () => {
  const writes = memoryHub(true)
  at(OPEN, { conversations: [proposing(PAGE)] })
  const button = await screen.findByRole('button', { name: 'Salvar' })
  fireEvent.click(button)
  fireEvent.click(button)
  expect(await screen.findByText('Salvo na memória da empresa.')).toBeTruthy()
  expect(writes).toEqual([
    { path: '/pages', key: expect.stringMatching(KEY), body: { name: 'Valores', body: PAGE.body } },
  ])
})

test('a nota vai para a página que o Assistente leu, pela rota das notas', async () => {
  const writes = memoryHub(true)
  at(OPEN, { conversations: [proposing(NOTE)] })
  expect(await screen.findByText('Proposta de nota para a memória da empresa')).toBeTruthy()
  expect(screen.getByText('CODTIPOPER 1100')).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Salvo na memória da empresa.')).toBeTruthy()
  expect(writes).toEqual([
    { path: `/pages/${PAGE_ID}/notes`, key: expect.stringMatching(KEY), body: { body: NOTE.body } },
  ])
})

test('quem não tem a permissão lê o texto, sem o botão, com quem pode salvar', async () => {
  const writes = memoryHub(false)
  at(OPEN, { conversations: [proposing(PAGE)] })
  expect(
    await screen.findByText('Só o dono ou um administrador muda a memória da empresa.'),
  ).toBeTruthy()
  expect(screen.getByText('Atendemos no mesmo dia.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
  expect(writes).toHaveLength(0)
})

test('uma recusa do Hub diz a frase dela e o botão volta', async () => {
  memoryHub(true, () => refusal('NOT_IN_ROLE'))
  at(OPEN, { conversations: [proposing(PAGE)] })
  fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy()
  expect(screen.queryByText('Salvo na memória da empresa.')).toBeNull()
})

test('uma resposta perdida diz que não confirmamos se foi salvo', async () => {
  memoryHub(true, () => HttpResponse.error())
  at(OPEN, { conversations: [proposing(PAGE)] })
  fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(screen.getByText('Não confirmamos se foi salvo. Toque de novo.')).toBeTruthy(),
  )
})
