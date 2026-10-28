import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import type { View } from './test-hub.tsx'
import { accountOf, modelHub } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/model-accounts`
const SENTENCE = 'Só o dono ou um administrador muda as contas de modelo da empresa.'

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
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
  expect(screen.getAllByRole('button', { name: 'Ligar conta' })).toHaveLength(2)
  expect(screen.getByRole('region', { name: 'Troca automática' })).toBeTruthy()
  expect(screen.queryByText(SENTENCE)).toBeNull()
})

test('o membro lê as filas e a troca, vê a frase, sem link para outra página nem controles de escrita', async () => {
  const { sent } = open(
    view({
      company: [accountOf({ label: 'Time 1' })],
      mayManage: false,
    }),
  )
  expect(await screen.findByText(/Só o dono ou um administrador muda/)).toBeTruthy()
  expect(screen.getByText(SENTENCE, { exact: false })).toBeTruthy()
  expect(screen.getByText('Time 1')).toBeTruthy()
  expect(screen.getByText('Desligada')).toBeTruthy()
  expect(screen.getAllByRole('button', { name: 'Ligar conta' })).toHaveLength(1)
  expect(screen.queryByRole('button', { name: 'Salvar troca automática' })).toBeNull()
  expect(screen.queryByRole('region', { name: 'Troca automática' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pausar Time 1' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Remover Time 1' })).toBeNull()
  expect(screen.queryByRole('button', { name: /^Dar / })).toBeNull()

  expect(within(screen.getByRole('main')).queryByRole('link')).toBeNull()
  expect(sent).toHaveLength(0)
})

test('o administrador também muda as contas da empresa', async () => {
  open(view({ mayManage: true, role: 'admin' }))
  expect(await screen.findAllByRole('button', { name: 'Ligar conta' })).toHaveLength(2)
  expect(screen.queryByText(SENTENCE, { exact: false })).toBeNull()
})
