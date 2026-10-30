import { TEST_DEADLINE_MS } from '@conexus/hub-api'
import { fireEvent, screen } from '@testing-library/react'
import { delay, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf, workingOf } from './fixtures.ts'
import { EDGE_CUT_MS, TEST_WAIT_MS } from './queries.ts'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const TESTED = '2026-10-29T14:02:00.000Z'

afterEach(() => vi.restoreAllMocks())

test.each([
  ['WORKING', 'Lê 8 de 8 assuntos inteiros'],
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
        await delay(TEST_DEADLINE_MS / 100 + 50)
        return undefined
      }),
      ...hub.handlers,
    )
    mount(pageOf(connection))
    fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
    expect(await screen.findByText(sentence, {}, { timeout: 4000 })).toBeTruthy()
  },
)

test('o navegador espera o Testar além do prazo do Hub e responde antes da borda da Cloudflare', () => {
  expect(TEST_WAIT_MS).toBeGreaterThan(TEST_DEADLINE_MS)
  expect(TEST_WAIT_MS).toBeLessThan(EDGE_CUT_MS)
})

test.each([
  [
    'o Sankhya respondeu 503',
    { status: 503, code: null, message: null, body: null },
    'O Sankhya respondeu com erro. Tente de novo em alguns minutos.',
    'Sankhya respondeu 503',
  ],
  [
    'o Sankhya não respondeu',
    null,
    'O Sankhya não respondeu. Tente de novo em alguns minutos.',
    undefined,
  ],
] as const)(
  'Testar com %s: a frase certa, e só o 503 leva a linha do que ele disse',
  async (_name, native, sentence, line) => {
    const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
    const hub = connectionsHub(viewOf({ connections: [connection] }), {}, (one) => ({
      result: 'UNREACHABLE',
      native,
      connection: one,
    }))
    server.use(...hub.handlers)
    mount(pageOf(connection))
    fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
    expect(await screen.findByText(sentence)).toBeTruthy()
    if (line) expect(screen.getByText(line)).toBeTruthy()
    else expect(screen.queryByText(/respondeu \d/)).toBeNull()
    const other = sentence.includes('não respondeu')
      ? 'O Sankhya respondeu com erro. Tente de novo em alguns minutos.'
      : 'O Sankhya não respondeu. Tente de novo em alguns minutos.'
    expect(screen.queryByText(other)).toBeNull()
  },
)
