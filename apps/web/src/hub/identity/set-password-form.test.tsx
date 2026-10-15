import { FAILURES, Problem } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function refusal(code: keyof typeof FAILURES) {
  const row = FAILURES[code]
  const body = Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
  return HttpResponse.json(body, { status: row.status })
}

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

async function choose(password: string) {
  const field = await screen.findByLabelText('Senha')
  fireEvent.change(field, { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar a senha' }))
  return field
}

test('o token vem do fragmento do link; 204 leva a /login', async () => {
  const sent: unknown[] = []
  server.use(
    http.put('*/api/passwords', async ({ request }) => {
      sent.push(await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const router = open('/set-password#token=tok-123')
  expect(await screen.findByRole('heading', { name: 'Criar sua senha' })).toBeTruthy()
  await choose('senha-nova-1')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/login')
  expect(sent).toEqual([{ token: 'tok-123', password: 'senha-nova-1' }])
})

test('um token na consulta, e não no fragmento, não vale: a frase do link e nenhum campo', async () => {
  open('/set-password?token=tok-123')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este link já foi usado ou venceu. Peça um link novo a quem cuida do Conexus.',
  )
  expect(screen.queryByLabelText('Senha')).toBeNull()
})

test('senha curta: a frase do Hub fica no campo', async () => {
  server.use(http.put('*/api/passwords', () => refusal('PASSWORD_TOO_SHORT')))
  open('/set-password#token=tok-123')
  const field = await choose('curta')
  expect(
    await screen.findByText(
      'A senha precisa de 8 caracteres ou mais. Escolha uma senha mais longa.',
    ),
  ).toBeTruthy()
  expect(field.getAttribute('aria-invalid')).toBe('true')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('senha vazia: "Escreva a senha." sem pedido ao Hub', async () => {
  open('/set-password#token=tok-123')
  await choose('')
  expect(await screen.findByText('Escreva a senha.')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('422 PASSWORD_LINK_INVALID: "Este link já foi usado ou venceu."', async () => {
  server.use(http.put('*/api/passwords', () => refusal('PASSWORD_LINK_INVALID')))
  const router = open('/set-password#token=tok-usado')
  await choose('senha-nova-1')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este link já foi usado ou venceu. Peça um link novo a quem cuida do Conexus.',
  )
  expect(router.state.location.pathname).toBe('/set-password')
})
