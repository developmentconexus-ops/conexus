import { PersonId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { accountOf, modelHub, pickFromMenu } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/model-accounts`
const ORDER = `/api/companies/${COMPANY.id}/model-account-orders/company/anthropic`

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    mayManage: true,
    ...fields,
  }
}

function open(shown: View, answers: Answers = {}, path = PAGE) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

/** Four Anthropic accounts in a queue, A to D. */
function queue() {
  return ['A', 'B', 'C', 'D'].map((label, position) => accountOf({ label, position }))
}

function labelsInOrder() {
  return within(screen.getByRole('main'))
    .getAllByRole('row')
    .map((row) => within(row).queryAllByRole('cell')[1]?.textContent?.slice(0, 1))
    .filter((first) => first && 'ABCD'.includes(first))
}

test('as suas em cima, as da empresa embaixo, e a troca por último', async () => {
  open(
    view({
      company: [accountOf({ label: 'Time 1', position: 0 })],
      mine: [accountOf({ label: 'Minha 1', owner: 'me', position: 0 })],
    }),
  )
  await screen.findByText('Time 1')
  const headings = within(screen.getByRole('main'))
    .getAllByRole('heading')
    .map((one) => one.textContent)
  expect(headings.filter((name) => name !== 'Anthropic')).toEqual([
    'Contas de modelo',
    'Suas contas',
    'Contas da empresa',
    'Troca automática',
  ])
  const mine = screen.getByRole('region', { name: 'Suas contas' })
  const company = screen.getByRole('region', { name: 'Contas da empresa' })
  expect(within(mine).getByText('Minha 1')).toBeTruthy()
  expect(within(company).getByText('Time 1')).toBeTruthy()
  expect(within(mine).getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
  expect(within(company).getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Troca automática' })).toBeTruthy()
})

test('o membro lê as da empresa e age nas dele, sem link para outra página, sem setas e sem …', async () => {
  const { sent } = open(
    view({
      mayManage: false,
      company: [accountOf({ label: 'Time 1', position: 0 })],
      mine: [accountOf({ label: 'Minha 1', owner: 'me', position: 0 })],
    }),
  )
  const company = await screen.findByRole('region', { name: 'Contas da empresa' })
  expect(within(company).getByText('Time 1')).toBeTruthy()
  expect(within(company).getByText(/Só o dono ou um administrador muda as contas/)).toBeTruthy()
  expect(within(company).queryByRole('button')).toBeNull()
  expect(within(screen.getByRole('main')).queryByRole('link')).toBeNull()
  await pickFromMenu('Minha 1', 'Pausar')
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(await screen.findByText('pausada')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['PATCH'])
})

test('vazio: "Nenhuma conta ligada" e Ligar conta, para quem pode', async () => {
  open(view())
  const company = await screen.findByRole('region', { name: 'Contas da empresa' })
  expect(within(company).getByText('Nenhuma conta ligada')).toBeTruthy()
  expect(within(company).getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
})

/** The row of the account named `label`: its place, name and origin, state, and actions. */
function rowOf(label: string) {
  const row = screen.getByText(label).closest('tr')
  if (!row) throw new Error(`no row for ${label}`)
  return within(row)
}

test('uma linha por conta, só o que muda: o lugar, o nome, a chave, a etiqueta e, se reservada, para quem', async () => {
  open(
    view({
      company: [
        accountOf({ label: 'Time 1', position: 0 }),
        accountOf({
          label: 'Time 2',
          position: 1,
          assignees: [PersonId.parse(ANA.id), PersonId.parse('person-diego')],
        }),
        accountOf({ label: 'Time 3', position: 2, state: 'paused' }),
        accountOf({ label: 'Time 4', position: 3, state: 'refused' }),
        accountOf({
          label: 'Time 5',
          position: 4,
          kind: 'claude_subscription',
          hint: null,
          kindOff: true,
        }),
      ],
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Anthropic' })).toBeTruthy()
  const first = rowOf('Time 1')
  expect(first.getByText('1ª')).toBeTruthy()
  expect(first.getByText('chave …x7Qa')).toBeTruthy()
  expect(first.getByText('ligada')).toBeTruthy()
  expect(rowOf('Time 1').queryByText(/para todos/)).toBeNull()
  expect(rowOf('Time 1').getAllByText('ligada')).toHaveLength(1)
  expect(rowOf('Time 2').getByText('chave …x7Qa · reservada para Ana Lima, Diego')).toBeTruthy()
  expect(rowOf('Time 2').getByText('2ª')).toBeTruthy()
  expect(rowOf('Time 3').getByText('pausada')).toBeTruthy()
  expect(rowOf('Time 4').getByText('recusada · Ligue de novo')).toBeTruthy()
  expect(rowOf('Time 5').getByText('Assinatura Claude')).toBeTruthy()
  expect(rowOf('Time 5').getByText('desligada pela Conexus')).toBeTruthy()
  const table = within(screen.getByRole('region', { name: 'Contas da empresa' }))
  for (const column of ['Tipo', 'Para quem', 'Ligada por'])
    expect(table.queryByRole('columnheader', { name: column })).toBeNull()
})

test('o cabeçalho do fornecedor diz o nome, a contagem e que o Builder tenta nesta ordem', async () => {
  open(view({ company: queue() }))
  const header = (await screen.findByRole('heading', { name: 'Anthropic' })).closest('td')
  expect(header?.textContent).toContain('Anthropic · 4 contas · o Builder tenta nesta ordem')
})

test('com uma só conta, o cabeçalho diz "1 conta"', async () => {
  open(view({ company: [accountOf({ label: 'Time 1' })] }))
  const header = (await screen.findByRole('heading', { name: 'Anthropic' })).closest('td')
  expect(header?.textContent).toContain('Anthropic · 1 conta · o Builder')
})

function tone(label: string) {
  return rowOf(label).getByText(/ligada|No limite|pausada|recusada/).className
}

test('a etiqueta pinta o estado: verde ligada, laranja no limite ou pausada, vermelha recusada', async () => {
  const until = new Date(Date.now() + 3_600_000)
  open(
    view({
      company: [
        accountOf({ label: 'Time 1', position: 0 }),
        accountOf({ label: 'Time 2', position: 1, limitedUntil: until.toISOString() }),
        accountOf({ label: 'Time 3', position: 2, state: 'paused' }),
        accountOf({ label: 'Time 4', position: 3, state: 'refused' }),
      ],
    }),
  )
  await screen.findByText('Time 1')
  expect(tone('Time 1')).toContain('text-success')
  expect(tone('Time 2')).toContain('text-warning')
  expect(tone('Time 3')).toContain('text-warning')
  expect(tone('Time 4')).toContain('text-danger')
})

test('uma conta no limite diz até que horas, na hora de quem lê', async () => {
  const until = new Date(Date.now() + 3_600_000)
  const hour = `${String(until.getHours()).padStart(2, '0')}h${String(until.getMinutes()).padStart(2, '0')}`
  open(
    view({
      company: [accountOf({ label: 'Time 1', position: 0, limitedUntil: until.toISOString() })],
    }),
  )
  expect(await screen.findByText(`No limite até ${hour}`)).toBeTruthy()
})

test('Ligar conta é de contorno quando a fila tem contas e preta quando está vazia', async () => {
  open(view({ company: [accountOf({ label: 'Time 1' })] }))
  const company = await screen.findByRole('region', { name: 'Contas da empresa' })
  const mine = screen.getByRole('region', { name: 'Suas contas' })
  expect(within(company).getByRole('button', { name: 'Ligar conta' }).className).not.toContain(
    'bg-ink',
  )
  expect(within(company).getByRole('button', { name: 'Ligar conta' }).className).toContain(
    'border-line',
  )
  expect(within(mine).getByRole('button', { name: 'Ligar conta' }).className).toContain('bg-ink')
})

test('as setas ficam nas pontas desabilitadas, mandam a ordem inteira e o foco fica na seta usada', async () => {
  const accounts = queue()
  const { sent } = open(view({ company: accounts }))
  const first = await screen.findByRole('button', { name: 'Subir A' })
  expect(first.hasAttribute('disabled')).toBe(true)
  expect(screen.getByRole('button', { name: 'Descer D' }).hasAttribute('disabled')).toBe(true)
  const [a, b, c, d] = accounts.map((one) => one.id)

  const up = screen.getByRole('button', { name: 'Subir C' })
  up.focus()
  fireEvent.click(up)
  await waitFor(() => expect(labelsInOrder()).toEqual(['A', 'C', 'B', 'D']))
  expect(sent[0]).toMatchObject({ method: 'PUT', path: ORDER, body: { ids: [a, c, b, d] } })
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Subir C' })),
  )
  expect((await screen.findByText('C agora é a 2ª da fila Anthropic.')).getAttribute('role')).toBe(
    'status',
  )

  fireEvent.click(screen.getByRole('button', { name: 'Subir C' }))
  await waitFor(() => expect(labelsInOrder()).toEqual(['C', 'A', 'B', 'D']))
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Descer C' })),
  )
  expect(screen.getByRole('button', { name: 'Subir C' }).hasAttribute('disabled')).toBe(true)
})

test('no celular as setas saem da linha e Subir e Descer ficam no …', async () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    const { sent } = open(view({ company: queue() }))
    await screen.findByRole('button', { name: 'Mais ações para C' })
    expect(screen.queryByRole('button', { name: 'Subir C' })).toBeNull()
    expect(rowOf('C').getAllByText('ligada')).toHaveLength(1)
    await pickFromMenu('C', 'Subir')
    await waitFor(() => expect(labelsInOrder()).toEqual(['A', 'C', 'B', 'D']))
    expect(sent).toHaveLength(1)
    await pickFromMenu('C', 'Descer')
    await waitFor(() => expect(labelsInOrder()).toEqual(['A', 'B', 'C', 'D']))
    expect(sent).toHaveLength(2)
    // The menu of A returns focus to what had it when it opened: let the one of C give it back first.
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Mais ações para C' }),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para A' }))
    await screen.findByRole('menuitem', { name: 'Descer' })
    expect(screen.queryByRole('menuitem', { name: 'Subir' })).toBeNull()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Mais ações para C' }),
      ),
    )
  } finally {
    phone.mockRestore()
  }
})

test('409: a frase da falha, e a fila é lida de novo na ordem que ficou', async () => {
  const accounts = queue()
  const shown = view({ company: accounts })
  open(shown, {
    order: () => {
      shown.company = accounts.map((one, position) => ({ ...one, position: 3 - position }))
      return refusal('MODEL_ACCOUNT_ORDER_STALE')
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Subir B' }))
  expect((await screen.findByText(/A fila mudou enquanto você a ordenava/)).textContent).toBe(
    'A fila mudou enquanto você a ordenava. Recarregue a página.',
  )
  await waitFor(() => expect(labelsInOrder()).toEqual(['D', 'C', 'B', 'A']))
})

test('a leitura das contas falha: a frase e Tentar de novo, e o clique lê de novo', async () => {
  let failing = true
  const hub = modelHub(view({ company: [accountOf({ label: 'Time 1', position: 0 })] }), {})
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/model-accounts`, () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
    ...hub.handlers,
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain('banco do Conexus')
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('Time 1')).toBeTruthy()
})
