import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import type { View } from './test-hub.tsx'
import { accountOf, modelHub } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/model-accounts`
const MINE = `/companies/${COMPANY.id}/settings/my-model-accounts`
const SENTENCE = 'Só o dono ou um administrador muda as contas de modelo da empresa.'

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    defaultModel: null,
    mayManage: false,
    ...fields,
  }
}

function open(shown: View, path = PAGE) {
  const hub = modelHub(shown)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

test('o dono abre Contas de modelo em Configurações, com o título e os controles de escrita', async () => {
  const { router } = open(view({ mayManage: true }))
  expect(await screen.findByRole('heading', { name: 'Contas de modelo' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PAGE)
  expect(screen.getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Salvar modelo padrão' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Troca automática' })).toBeTruthy()
  expect(screen.queryByText(SENTENCE)).toBeNull()
})

test('o membro lê as filas, vê a frase e o link a Minhas contas de modelo, sem controles de escrita', async () => {
  const { sent, router } = open(
    view({ company: [accountOf({ label: 'Time 1' })], mayManage: false }),
  )
  expect(await screen.findByText(/Só o dono ou um administrador muda/)).toBeTruthy()
  expect(screen.getByText(SENTENCE, { exact: false })).toBeTruthy()
  expect(screen.getByText('Time 1')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar conta' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Salvar modelo padrão' })).toBeNull()
  expect(screen.queryByRole('region', { name: 'Troca automática' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pausar Time 1' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Remover Time 1' })).toBeNull()
  expect(screen.queryByRole('button', { name: /^Dar / })).toBeNull()

  const main = screen.getByRole('main')
  const link = Array.from(main.querySelectorAll('a')).find(
    (one) => one.textContent === 'Minhas contas de modelo',
  )
  expect(link?.getAttribute('href')).toBe(MINE)
  if (link) fireEvent.click(link)
  expect(await screen.findByRole('heading', { name: 'Minhas contas de modelo' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(MINE)
  expect(sent).toHaveLength(0)
})

test('o administrador também muda as contas da empresa', async () => {
  open(view({ mayManage: true, role: 'admin' }))
  expect(await screen.findByRole('button', { name: 'Ligar conta' })).toBeTruthy()
  expect(screen.queryByText(SENTENCE, { exact: false })).toBeNull()
})
