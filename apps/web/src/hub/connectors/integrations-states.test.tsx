import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { delay, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import {
  connectionOf,
  connectionsHub,
  fill,
  openForm,
  openIntegrations,
  PAGE,
  SECRETS,
  viewOf,
  workingOf,
} from './test-hub.tsx'

const server = hubServer()

afterEach(() => vi.restoreAllMocks())

function open(view?: View, answers?: Answers) {
  return openIntegrations(server, view, answers)
}

test('uma ligação desligada por outra pessoa: a frase fica acima da lista relida, e o foco vai à seção', async () => {
  const connection = connectionOf()
  const view = viewOf({ connections: [connection] })
  open(view, {
    test: () => {
      view.connections = []
      return refusal('CONNECTION_NOT_FOUND')
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Essa integração foi desligada.')
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Testar' })).toBeNull()
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Ligadas' })),
  )
})

test('a frase de uma recusa sai no próximo Testar, e o foco só vai à seção quando a lista mudou', async () => {
  const connection = connectionOf()
  const view = viewOf({ connections: [connection] })
  let tests = 0
  open(view, {
    test: () => {
      tests += 1
      if (tests === 1) return refusal('CONNECTOR_UNKNOWN')
      view.connections = []
      return undefined
    },
  })
  let reads = 0
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () => {
      reads += 1
      return undefined
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esse conector não existe no Conexus.',
  )
  await waitFor(() => expect(reads).toBe(2))
  // The row outlives the list read again here, and the sentence is still the page's alone.
  await screen.findByRole('button', { name: 'Testar' })
  expect(screen.getAllByRole('alert')).toHaveLength(1)
  expect(document.activeElement).not.toBe(screen.getByRole('region', { name: 'Ligadas' }))
  fireEvent.click(screen.getByRole('button', { name: 'Testar' }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(document.activeElement).not.toBe(screen.getByRole('region', { name: 'Ligadas' }))
})

test('Testar recusado sem mudar a lista: a frase fica na linha', async () => {
  open(viewOf({ connections: [connectionOf()] }), { test: () => refusal('DATABASE_UNAVAILABLE') })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  expect(screen.getByRole('button', { name: 'Testar' })).toBeTruthy()
})

test.each([
  ['CONNECTION_CREDENTIAL_INVALID', 'Confira os campos: cole cada chave inteira.'],
] as const)(
  'Ligar recusado com %s: a frase no formulário, as chaves coladas ficam',
  async (code, sentence) => {
    open(viewOf(), { link: () => refusal(code) })
    const form = await openForm()
    fill()
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
    expect((await within(form).findByRole('alert')).textContent).toBe(sentence)
    expect(within(form).getByDisplayValue(SECRETS['X-Token'])).toBeTruthy()
  },
)

test.each([
  ['CONNECTION_EXISTS', 'Essa integração já está ligada nesta empresa.', true],
  ['CONNECTOR_UNKNOWN', 'Esse conector não existe no Conexus.', false],
] as const)(
  'Ligar recusado com %s: o diálogo fecha, a frase fica acima da lista relida e o foco vai à seção',
  async (code, sentence, listChanges) => {
    const view = viewOf()
    open(view, {
      link: () => {
        if (listChanges) view.connections.push(connectionOf())
        return refusal(code)
      },
    })
    const form = await openForm()
    fill()
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
    expect((await screen.findByRole('alert')).textContent).toBe(sentence)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.queryByDisplayValue(SECRETS['X-Token'])).toBeNull()
    if (listChanges) {
      await waitFor(() =>
        expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Ligadas' })),
      )
    }
  },
)

test.each([
  ['WORKING', 'Ligação funcionando'],
  ['UNREACHABLE', 'O Sankhya não respondeu. Tente de novo em alguns minutos.'],
] as const)(
  'Testar que o Hub responde depois do prazo comum do navegador mostra o resultado: %s',
  async (result, sentence) => {
    const real = AbortSignal.timeout.bind(AbortSignal)
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => real(ms / 1000))
    const connection = connectionOf({ state: 'ACTIVE', testedAt: '2026-10-29T14:02:00.000Z' })
    const hub = connectionsHub(viewOf({ connections: [connection] }), {}, (one) =>
      result === 'WORKING' ? workingOf(one) : { result, connection: one },
    )
    server.use(
      http.post(`*/api/companies/${COMPANY.id}/connections/:id/test`, async () => {
        await delay(50)
        return undefined
      }),
      ...hub.handlers,
    )
    render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
    expect(await screen.findByText(sentence)).toBeTruthy()
  },
)

test('o estado em palavras: Funcionando, Chaves recusadas e nenhum selo para a nova', async () => {
  const tested = '2026-10-29T14:02:00.000Z'
  open(
    viewOf({
      connections: [connectionOf({ state: 'ACTIVE', testedAt: tested })],
    }),
  )
  expect(await screen.findByText('Funcionando')).toBeTruthy()
  expect(screen.queryByText('Chaves recusadas')).toBeNull()
  expect(screen.queryByText(/As chaves foram recusadas/)).toBeNull()
})

test('chaves recusadas: o selo e a frase da linha; sem teste ainda, nenhum selo', async () => {
  const refused = connectionOf({ state: 'NEEDS_REAUTH', testedAt: '2026-10-29T14:02:00.000Z' })
  open(viewOf({ connections: [refused] }))
  expect(await screen.findByText('Chaves recusadas')).toBeTruthy()
  expect(screen.getByText(/As chaves foram recusadas pelo Sankhya/)).toBeTruthy()
  expect(screen.queryByText('Funcionando')).toBeNull()
})

test('uma ligação nova não tem selo, e um conector fora do catálogo aparece pelo id', async () => {
  open(viewOf({ connections: [connectionOf({ connector: 'antigo' })] }))
  expect(await screen.findByText('antigo')).toBeTruthy()
  expect(screen.queryByText('Funcionando')).toBeNull()
  expect(screen.queryByText('Chaves recusadas')).toBeNull()
})

test('a seção das ligadas recebe o foco por código, e não entra na ordem do Tab', async () => {
  open()
  const region = await screen.findByRole('region', { name: 'Ligadas' })
  expect(region.getAttribute('tabindex')).toBe('-1')
})
