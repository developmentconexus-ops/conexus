import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { homeHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()

function signedIn(signOut: () => Promise<Response> | Response) {
  const state = { signedIn: true }
  server.use(
    ...homeHub(state),
    http.delete('*/api/sessions/current', async () => {
      const answer = await signOut()
      if (answer.ok) state.signedIn = false
      return answer
    }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/'] }))
  render(<Conexus conexus={conexus} />)
  return conexus
}

async function openMenu() {
  fireEvent.click(await screen.findByRole('button', { name: 'Conta de Ana Lima' }))
  return screen.findByRole('menuitem', { name: /Sair do Conexus/ })
}

test('o menu da conta mostra o nome e o e-mail; "Sair do Conexus" leva a /login com "Você saiu do Conexus."', async () => {
  const conexus = signedIn(() => new HttpResponse(null, { status: 204 }))
  const leave = await openMenu()
  expect(screen.getByText('ana@example.test')).toBeTruthy()
  fireEvent.click(leave)
  expect(await screen.findByText('Você saiu do Conexus.')).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe('/login')
  expect(screen.queryByText(/Você entrou como/)).toBeNull()
  expect(conexus.queryClient.getQueryCache().getAll()).toEqual([])
})

test('enquanto sai, "Saindo…"; uma falha fica no menu com a frase', async () => {
  const answer = Promise.withResolvers<void>()
  signedIn(async () => {
    await answer.promise
    return refusal('DATABASE_UNAVAILABLE')
  })
  fireEvent.click(await openMenu())
  expect(await screen.findByRole('menuitem', { name: /Saindo…/ })).toBeTruthy()
  answer.resolve()
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.getByText('Você entrou como Ana Lima.')).toBeTruthy()
})
