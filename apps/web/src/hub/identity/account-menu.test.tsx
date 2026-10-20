import { listCompanies, listProjects } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

/** Ana inside Empresa Teste; `signOut` answers the DELETE of the session. */
function signedIn(options: { mayOperate?: boolean; signOut?: () => Promise<Response> | Response }) {
  const state = { signedIn: true }
  server.use(
    sessionRead(() => (state.signedIn ? ANA : undefined)),
    http.get('*/api/companies', () =>
      HttpResponse.json(
        listCompanies.success.body.parse({
          companies: [{ company: COMPANY, role: 'owner' }],
          mayOperate: options.mayOperate ?? false,
          next: { kind: 'END' },
        }),
      ),
    ),
    ...companyRead({ role: 'owner' }),
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json(
        listProjects.success.body.parse({
          projects: [],
          next: { kind: 'END' },
          databaseReady: true,
        }),
      ),
    ),
    http.get('*/api/clients', () => HttpResponse.json({ clients: [], next: { kind: 'END' } })),
    http.delete('*/api/sessions/current', async () => {
      const answer = await (options.signOut?.() ?? new HttpResponse(null, { status: 204 }))
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

test('o menu da conta, no pé da barra, mostra o nome e o e-mail; "Sair do Conexus" leva a /login com "Você saiu do Conexus."', async () => {
  const conexus = signedIn({})
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  expect(nav.contains(await screen.findByRole('button', { name: 'Conta de Ana Lima' }))).toBe(true)
  const leave = await openMenu()
  expect(screen.getAllByText('ana@example.test').length).toBeGreaterThan(0)
  fireEvent.click(leave)
  expect(await screen.findByText('Você saiu do Conexus.')).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe('/login')
  expect(conexus.queryClient.getQueryCache().getAll()).toEqual([])
})

test('enquanto sai, "Saindo…"; uma falha fica no menu com a frase e a pessoa segue dentro', async () => {
  const answer = Promise.withResolvers<void>()
  signedIn({
    signOut: async () => {
      await answer.promise
      return refusal('DATABASE_UNAVAILABLE')
    },
  })
  fireEvent.click(await openMenu())
  expect(await screen.findByRole('menuitem', { name: /Saindo…/ })).toBeTruthy()
  answer.resolve()
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.getByRole('button', { name: 'Conta de Ana Lima' })).toBeTruthy()
})

test('"Central de Operação" só aparece para o operador, abre a Central e fecha o menu', async () => {
  const conexus = signedIn({ mayOperate: true })
  await openMenu()
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Central de Operação' }))
  expect(await screen.findByText('Nenhum cliente cadastrado.')).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe('/operations/clients')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
})

test('sem o papel de operador, o menu não oferece a Central', async () => {
  signedIn({})
  await openMenu()
  expect(screen.queryByRole('menuitem', { name: 'Central de Operação' })).toBeNull()
})

test('Tema: Claro, Escuro e Como o sistema; a escolha vale na página e fica lembrada', async () => {
  signedIn({})
  await openMenu()
  expect(
    screen.getByRole('menuitemradio', { name: 'Como o sistema' }).getAttribute('aria-checked'),
  ).toBe('true')
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Escuro' }))
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'))
  expect(localStorage.getItem('conexus-theme')).toBe('dark')
  expect(screen.getByRole('menuitemradio', { name: 'Escuro' }).getAttribute('aria-checked')).toBe(
    'true',
  )
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Claro' }))
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Como o sistema' }))
  await waitFor(() => expect(document.documentElement.dataset.theme).toBeUndefined())
  expect(localStorage.getItem('conexus-theme')).toBeNull()
})
