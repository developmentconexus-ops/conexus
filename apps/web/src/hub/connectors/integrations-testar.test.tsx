import { TEST_LONGEST_MS, TestResult } from '@conexus/hub-api'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { delay, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE, REFUSAL, SANKHYA, workingOf } from './fixtures.ts'
import { EDGE_CUT_MS, TEST_WAIT_MS } from './queries.ts'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const TESTED = '2026-10-29T14:02:00.000Z'
const READ_REFUSED_TEXT =
  'O Sankhya aceitou a ligação, mas não deixou ler Empresas. Peça ao responsável pela conta no Sankhya para liberar.'

afterEach(() => vi.restoreAllMocks())

test.each([
  ['WORKING', 'Ligado e funcionando.'],
  ['UNREACHABLE', 'O Sankhya não respondeu. Tente de novo em alguns minutos.'],
] as const)(
  'Testar que o Hub responde depois do prazo comum do navegador mostra o resultado: %s',
  async (result, sentence) => {
    const real = AbortSignal.timeout.bind(AbortSignal)
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => real(ms / 100))
    const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
    const hub = connectionsHub(viewOf({ connections: [connection] }), {}, (one) =>
      result === 'WORKING' ? workingOf(one) : { result, native: null, connection: one },
    )
    server.use(
      http.post(`*/api/companies/${COMPANY.id}/connections/:id/test`, async () => {
        await delay(TEST_LONGEST_MS / 100 + 50)
        return undefined
      }),
      ...hub.handlers,
    )
    mount(pageOf(connection))
    fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
    expect(await screen.findByText(sentence, {}, { timeout: 12_000 })).toBeTruthy()
  },
  20_000,
)

test('o navegador espera o Testar além do mais longo que ele leva e responde antes da borda da Cloudflare', () => {
  expect(TEST_WAIT_MS).toBeGreaterThan(TEST_LONGEST_MS)
  expect(TEST_WAIT_MS).toBeLessThan(EDGE_CUT_MS)
})

const SAID_401 = { status: 401, code: 'NEGADO', message: null, body: null }

test.each([
  [
    'AUTH_REFUSED, por chaves',
    SANKHYA,
    { result: 'AUTH_REFUSED', native: SAID_401 },
    'As chaves foram recusadas pelo Sankhya.',
    'Sankhya respondeu 401, código NEGADO',
  ],
  [
    'AUTH_REFUSED, por OAuth',
    MERCADO_LIVRE,
    { result: 'AUTH_REFUSED', native: SAID_401 },
    'O Mercado Livre pediu para conectar de novo.',
    'Mercado Livre respondeu 401, código NEGADO',
  ],
  [
    'READ_REFUSED',
    SANKHYA,
    { result: 'READ_REFUSED', read: 'Empresas', native: REFUSAL },
    READ_REFUSED_TEXT,
    'Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela',
  ],
  [
    'BUSY',
    SANKHYA,
    { result: 'BUSY', native: { status: 429, code: null, message: null, body: null } },
    'O Sankhya pediu para esperar. Tente de novo em alguns minutos.',
    'Sankhya respondeu 429',
  ],
  [
    'UNREACHABLE, com o que ele disse',
    SANKHYA,
    { result: 'UNREACHABLE', native: { status: 503, code: null, message: null, body: null } },
    'O Sankhya respondeu com erro. Tente de novo em alguns minutos.',
    'Sankhya respondeu 503',
  ],
  [
    'UNREACHABLE, sem nada dito',
    SANKHYA,
    { result: 'UNREACHABLE', native: null },
    'O Sankhya não respondeu. Tente de novo em alguns minutos.',
    null,
  ],
  [
    'UNREADABLE',
    SANKHYA,
    {
      result: 'UNREADABLE',
      native: {
        status: 200,
        code: null,
        message: null,
        body: null,
        reason: {
          kind: 'SHAPE',
          issues: [{ path: 'data', expected: 'array', received: 'object' }],
        },
      },
    },
    'Resposta que o Conexus não entendeu',
    'Sankhya respondeu 200',
  ],
  [
    'APP_REFUSED',
    MERCADO_LIVRE,
    {
      result: 'APP_REFUSED',
      native: { status: 400, code: 'invalid_client', message: null, body: null },
    },
    'O app do Conexus foi recusado pelo Mercado Livre. Avise o suporte.',
    'Mercado Livre respondeu 400, código invalid_client',
  ],
] as const)(
  'Testar que acaba em %s: uma frase só, e o que o provedor disse',
  async (_name, entry, answer, sentence, said) => {
    const connection = connectionOf({ connector: entry.id, state: 'ACTIVE', testedAt: TESTED })
    const view = viewOf({ connectors: [entry], connections: [connection] })
    const hub = connectionsHub(view, {}, (one) =>
      TestResult.parse({
        ...answer,
        connection: {
          ...one,
          state: answer.result === 'AUTH_REFUSED' ? 'NEEDS_REAUTH' : one.state,
        },
      }),
    )
    server.use(...hub.handlers)
    mount(pageOf(connection))
    fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
    expect(await screen.findByText(sentence)).toBeTruthy()
    expect(screen.getAllByText(sentence)).toHaveLength(1)
    if (said === null) expect(screen.queryByText(/respondeu \d/)).toBeNull()
    else expect(screen.getByText(said)).toBeTruthy()
    if (answer.result === 'AUTH_REFUSED') {
      expect(screen.getByRole('button', { name: 'Conectar de novo' })).toBeTruthy()
    }
    expect(screen.queryByText('Ligado e funcionando.')).toBeNull()
  },
)

test('o que o provedor disse: o código e a mensagem, a resposta inteira fechada e como texto, nunca como HTML', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => ({
    result: 'READ_REFUSED',
    read: 'Empresas',
    native: REFUSAL,
    connection: one,
  }))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(
    await screen.findByText('Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela'),
  ).toBeTruthy()
  // The body stays shut until asked for, and then it is text.
  expect(screen.queryByText(/<b>não<\/b>/)).toBeNull()
  fireEvent.click(screen.getByText('Ver a resposta inteira'))
  expect(await screen.findByText(/<b>não<\/b>/)).toBeTruthy()
  expect(document.querySelector('pre b')).toBeNull()
})

test('depois de recarregar, nada do Testar fica: nem a frase nem o que o provedor disse', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => ({
    result: 'READ_REFUSED',
    read: 'Empresas',
    native: REFUSAL,
    connection: one,
  }))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  await screen.findByText(READ_REFUSED_TEXT)
  cleanup()
  mount(pageOf(connection))
  expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
  expect(screen.getByText(/^testada em/)).toBeTruthy()
  expect(screen.queryByText(READ_REFUSED_TEXT)).toBeNull()
  expect(screen.queryByText(/SEM_ACESSO/)).toBeNull()
})
