import { setCompanyNickname } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const SETUP = `/companies/${COMPANY.id}/setup`
const PROJECTS = `/companies/${COMPANY.id}/projects`

/**
 * The Hub for a company that chose no nickname; saving is answered by `answer`, and once the company
 * has the nickname (`view`), its read returns it.
 */
function hub(role: string, answer: () => Response | Promise<Response> = saved) {
  const view: { nickname: string | null } = { nickname: null }
  const sent: unknown[] = []
  server.use(
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json({
        company: { ...COMPANY, nickname: view.nickname },
        role,
        mayInviteAs: [],
      }),
    ),
    http.put(`*/api/companies/${COMPANY.id}/nickname`, async ({ request }) => {
      sent.push(await request.json())
      const response = await answer()
      if (response.status === 200) view.nickname = 'empresa-a'
      return response
    }),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, role }),
  )
  return { sent, view }
}

function saved() {
  return HttpResponse.json(
    setCompanyNickname.success.body.parse({ company: { ...COMPANY, nickname: 'empresa-a' } }),
  )
}

function open(path = SETUP) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function save(nickname: string) {
  fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: nickname } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('o dono de uma empresa sem apelido, em qualquer página dela, abre a configuração', async () => {
  hub('owner')
  const router = open(PROJECTS)
  expect(await screen.findByRole('heading', { name: 'Configurar a empresa' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(SETUP)
  expect(screen.queryByRole('heading', { name: 'Projetos' })).toBeNull()
})

test('vazio: o apelido sugerido do nome e o endereço que ele dá, que acompanha o que se digita', async () => {
  hub('owner')
  open()
  const field = await screen.findByLabelText('Apelido')
  expect(field).toHaveProperty('value', 'empresa-teste')
  expect(screen.getByText('pedidos--empresa-teste.apps.example.test')).toBeTruthy()
  fireEvent.change(field, { target: { value: 'Empresa A' } })
  await waitFor(() => expect(screen.queryByText(/Exemplo de endereço:/)).toBeNull())
  fireEvent.change(field, { target: { value: 'empresa-a' } })
  expect(await screen.findByText('pedidos--empresa-a.apps.example.test')).toBeTruthy()
})

for (const role of ['admin', 'member']) {
  test(`${role}: uma empresa sem apelido é "não encontrado", na configuração e nas páginas`, async () => {
    hub(role)
    for (const path of [SETUP, PROJECTS]) {
      const view = render(
        <Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />,
      )
      expect(
        await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
      ).toBeTruthy()
      expect(screen.queryByLabelText('Apelido')).toBeNull()
      view.unmount()
    }
  })
}

test('uma empresa com apelido não abre a configuração: vai aos Projetos', async () => {
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  const router = open()
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECTS)
})

test('salvar: "Salvando…", leva o apelido e abrem os Projetos', async () => {
  const held = Promise.withResolvers<void>()
  const { sent } = hub('owner', async () => {
    await held.promise
    return saved()
  })
  const router = open()
  await screen.findByLabelText('Apelido')
  save('empresa-a')
  expect(await screen.findByRole('button', { name: 'Salvando…' })).toHaveProperty('disabled', true)
  held.resolve()
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECTS)
  expect(sent).toEqual([{ nickname: 'empresa-a' }])
})

for (const [code, phrase] of [
  ['COMPANY_NICKNAME_TAKEN', 'Esse apelido já é usado por outra empresa. Escolha outro.'],
  ['COMPANY_NICKNAME_RESERVED', 'Esse apelido é reservado. Escolha outro.'],
] as const) {
  test(`${code}: a frase no campo, e a configuração segue aberta`, async () => {
    hub('owner', () => refusal(code))
    const router = open()
    await screen.findByLabelText('Apelido')
    save('conexus')
    expect((await screen.findByText(phrase)).getAttribute('role')).toBe('alert')
    await waitFor(() =>
      expect(screen.getByLabelText('Apelido').getAttribute('aria-invalid')).toBe('true'),
    )
    expect(router.state.location.pathname).toBe(SETUP)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

test('um apelido que não é da forma: a frase da tela, sem pedido ao Hub', async () => {
  const { sent } = hub('owner')
  open()
  await screen.findByLabelText('Apelido')
  save('Empresa A')
  expect(
    await screen.findByText('Use de 3 a 30 letras minúsculas, números ou hífens.'),
  ).toBeTruthy()
  expect(sent).toHaveLength(0)
})

test('COMPANY_NICKNAME_SET: relê a empresa e abre os Projetos', async () => {
  // Another tab chose the nickname first.
  const { view } = hub('owner', () => {
    view.nickname = 'empresa-a'
    return refusal('COMPANY_NICKNAME_SET')
  })
  const router = open()
  await screen.findByLabelText('Apelido')
  save('empresa-b')
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECTS)
})

test('503: a frase da linha, que não pede "Tentar de novo"; Salvar manda o pedido outra vez', async () => {
  let refuse = true
  const { sent } = hub('owner', () => (refuse ? refusal('DATABASE_UNAVAILABLE') : saved()))
  open()
  await screen.findByLabelText('Apelido')
  save('empresa-a')
  expect(
    await screen.findByText(
      'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  refuse = false
  save('empresa-a')
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(sent).toEqual([{ nickname: 'empresa-a' }, { nickname: 'empresa-a' }])
})

test('404 ao salvar: a empresa deixa de ser achada', async () => {
  hub('owner', () => refusal('NOT_FOUND'))
  open()
  await screen.findByLabelText('Apelido')
  server.use(http.get(`*/api/companies/${COMPANY.id}`, () => refusal('NOT_FOUND')))
  save('empresa-a')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})
