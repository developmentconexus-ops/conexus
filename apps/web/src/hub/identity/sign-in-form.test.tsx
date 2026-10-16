import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, homeHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()

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

test('entrar a caminho de outra página leva o foco ao título dela, não ao corpo (#32-4)', async () => {
  const state = { signedIn: false }
  server.use(...homeHub(state))
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({ initialEntries: ['/login?redirect=%2Fcompanies%2Fnew'] }),
      )}
    />,
  )
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  const title = await screen.findByRole('heading', { name: 'Nova empresa' })
  await waitFor(() => expect(document.activeElement).toBe(title))
})
