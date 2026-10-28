import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { refusal, sessionRead } from '../../platform/test-hub.tsx'
import { bodyRows, hub, open, sectionOf, server } from './test-people.tsx'

test('dono: os membros com o papel, os convites pendentes e o formulário "Convidar pessoa"', async () => {
  hub({ role: 'owner', mayInviteAs: ['owner', 'admin', 'member'] })
  open()
  expect(await screen.findByRole('heading', { name: 'Pessoas e convites' })).toBeTruthy()
  const people = within(sectionOf(screen.getByRole('heading', { name: 'Pessoas' })))
  expect(bodyRows(people).map((row) => row.textContent)).toEqual([
    'Ana Limaana@example.testDono',
    'Davi Costadavi@example.testMembroMudar papelTirar da empresa',
  ])
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(bodyRows(pending).map((row) => row.textContent)).toEqual([
    'bia@example.testVence em 17/10/2026, 09:00AdministradorReenviarCancelar',
  ])
  expect(screen.getByRole('heading', { name: 'Convidar pessoa' })).toBeTruthy()
})

test('membro: só as pessoas; sem convites pendentes, sem formulário e sem pedir a lista de convites', async () => {
  const { reads } = hub({ role: 'member', mayInviteAs: [] })
  open()
  expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeTruthy()
  expect(screen.getByText('Só o dono ou um administrador convida pessoas.')).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Convites pendentes' })).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Convidar pessoa' })).toBeNull()
  expect(reads).toEqual(['members'])
})

test('a página dos membros fica no endereço: "Ver mais" pede a que segue', async () => {
  const { reads } = hub({
    role: 'owner',
    mayInviteAs: ['admin'],
    membersNext: { kind: 'MORE', page: 'm'.repeat(32) },
  })
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Pessoas' }))
  await waitFor(() => expect(router.state.location.search).toEqual({ members: 'm'.repeat(32) }))
  expect(await screen.findByRole('link', { name: 'Primeira página: Pessoas' })).toBeTruthy()
  expect(reads).toContain(`members?page=${'m'.repeat(32)}`)
})

for (const gone of ['people', 'setup']) {
  test(`/companies/$id/${gone}, que não existe mais: "não encontrado" na área da empresa (critério 17)`, async () => {
    hub({ role: 'owner', mayInviteAs: ['owner', 'admin', 'member'] })
    const conexus = createConexus(
      createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/${gone}`] }),
    )
    render(<Conexus conexus={conexus} />)
    expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Pessoas e convites' })).toBeNull()
  })
}

test('um id que não tem 32 letras e dígitos: a frase de "não encontrado"', async () => {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/curto'] }))
  server.use(sessionRead(() => ANA))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByText(/Não encontramos o que você procurou/)).toBeTruthy()
})

test('/companies/new, a página que criava empresa, não existe mais: a frase de "não encontrado"', async () => {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/new'] }))
  server.use(sessionRead(() => ANA))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByText(/Não encontramos o que você procurou/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar empresa' })).toBeNull()
})

test('uma empresa que o Hub responde 404: a página de "não encontrado", não a de erro', async () => {
  server.use(
    sessionRead(() => ANA),
    http.get(`*/api/companies/${COMPANY.id}`, () => refusal('NOT_FOUND')),
  )
  open()
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  expect(screen.queryByText('Não foi possível abrir o Conexus')).toBeNull()
})

test('no celular, o papel desce para baixo do nome e a tabela perde a coluna de papel', async () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    hub({ role: 'owner', mayInviteAs: ['admin'] })
    open()
    const people = within(sectionOf(await screen.findByRole('heading', { name: 'Pessoas' })))
    expect(people.queryByRole('columnheader', { name: 'Papel' })).toBeNull()
    expect(people.getAllByRole('columnheader').length).toBe(2)
    expect(bodyRows(people).map((row) => row.textContent)).toEqual([
      'Ana Limaana@example.testDono',
      'Davi Costadavi@example.testMembroMudar papelTirar da empresa',
    ])
  } finally {
    phone.mockRestore()
  }
})
