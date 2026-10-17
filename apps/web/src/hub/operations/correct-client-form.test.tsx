import { Client } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { awaitingClient, centralHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const CLIENT = awaitingClient()

function hub(answer: () => Response) {
  const sent: unknown[] = []
  server.use(
    http.put('*/api/clients/:companyId', async ({ request }) => {
      sent.push(await request.json())
      return answer()
    }),
    ...centralHub([CLIENT]),
  )
  return sent
}

async function correct(legalName: string) {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/operations/clients/${CLIENT.companyId}`] }),
  )
  render(<Conexus conexus={conexus} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Corrigir dados' }))
  expect(screen.getByLabelText('CNPJ')).toHaveProperty('value', '12.ABC.345/01DE-35')
  fireEvent.change(screen.getByLabelText('Razão social'), { target: { value: legalName } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('200: envia os valores com a revisão lida e volta aos dados', async () => {
  const corrected = Client.parse({ ...CLIENT, legalName: 'Razão Corrigida', revision: 1 })
  const sent = hub(() => HttpResponse.json({ client: corrected }))
  await correct('Razão Corrigida')
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull())
  expect(sent).toEqual([
    { cnpj: '12ABC34501DE35', legalName: 'Razão Corrigida', name: 'Empresa Teste', revision: 0 },
  ])
})

for (const [code, sentence] of [
  ['CLIENT_STALE', 'Este cliente mudou. Recarregue a página.'],
  ['CLIENT_ACTIVE', 'Este cliente já está ativo. Recarregue a página.'],
] as const) {
  test(`${code}: a frase no formulário, os valores ficam`, async () => {
    hub(() => refusal(code))
    await correct('Razão Corrigida')
    expect((await screen.findByRole('alert')).textContent).toBe(sentence)
    expect(screen.getByLabelText('Razão social')).toHaveProperty('value', 'Razão Corrigida')
  })
}

test('CLIENT_EXISTS: a frase no campo CNPJ', async () => {
  hub(() => refusal('CLIENT_EXISTS'))
  await correct('Razão Corrigida')
  expect(await screen.findByText('Já existe um cliente com este CNPJ.')).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('CNPJ').getAttribute('aria-invalid')).toBe('true'),
  )
})

test('enquanto salva, "Salvando…"', async () => {
  const answer = Promise.withResolvers<void>()
  hub(() => refusal('INTERNAL_UNEXPECTED'))
  server.use(
    http.put('*/api/clients/:companyId', async () => {
      await answer.promise
      return refusal('CLIENT_STALE')
    }),
  )
  await correct('Razão Corrigida')
  expect(await screen.findByRole('button', { name: 'Salvando…' })).toHaveProperty('disabled', true)
  answer.resolve()
  await screen.findByRole('alert')
})
