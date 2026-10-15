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

async function openSignIn() {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: ['/login'] }))} />)
  return {
    email: await screen.findByLabelText('E-mail'),
    password: screen.getByLabelText('Senha'),
    button: screen.getByRole('button', { name: 'Entrar' }),
  }
}

async function fill(email: string, password: string) {
  const form = await openSignIn()
  fireEvent.change(form.email, { target: { value: email } })
  fireEvent.change(form.password, { target: { value: password } })
  fireEvent.click(form.button)
  return form
}

test('campos vazios: os erros em português, sob cada campo, e nenhum pedido ao Hub', async () => {
  let sent = 0
  server.use(
    http.put('*/api/sessions/current', () => {
      sent++
      return HttpResponse.json({})
    }),
  )
  const form = await fill('', '')
  expect(await screen.findByText('Escreva um e-mail.')).toBeTruthy()
  expect(screen.getByText('Escreva a senha.')).toBeTruthy()
  expect(form.email.getAttribute('aria-invalid')).toBe('true')
  expect(form.password.getAttribute('aria-invalid')).toBe('true')
  fireEvent.change(form.email, { target: { value: 'ana' } })
  fireEvent.click(form.button)
  expect(await screen.findByText('Escreva um e-mail.')).toBeTruthy()
  expect(sent).toBe(0)
})

test('401: a recusa fica no formulário, sem dizer qual campo errou', async () => {
  server.use(http.put('*/api/sessions/current', () => refusal('SIGN_IN_REFUSED')))
  const form = await fill('ana@example.test', 'senha-errada')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'E-mail ou senha não conferem. Confira o e-mail e a senha.',
  )
  expect(form.email.getAttribute('aria-invalid')).toBeNull()
  expect(form.password.getAttribute('aria-invalid')).toBeNull()
})

test('429: a frase das tentativas, com a espera', async () => {
  server.use(http.put('*/api/sessions/current', () => refusal('SIGN_IN_ATTEMPTS_EXCEEDED')))
  await fill('ana@example.test', 'senha-certa-1')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Muitas tentativas de entrada deste endereço. Espere um minuto e tente de novo.',
  )
})

test('enquanto envia, o botão fica desabilitado com "Entrando…"', async () => {
  const answer = Promise.withResolvers<void>()
  server.use(
    http.put('*/api/sessions/current', async () => {
      await answer.promise
      return refusal('SIGN_IN_REFUSED')
    }),
  )
  await fill('ana@example.test', 'senha-certa-1')
  const pending = await screen.findByRole('button', { name: 'Entrando…' })
  expect(pending.hasAttribute('disabled')).toBe(true)
  answer.resolve()
  const idle = await screen.findByRole('button', { name: 'Entrar' })
  expect(idle.hasAttribute('disabled')).toBe(false)
})
