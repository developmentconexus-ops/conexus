import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, refusal, sessionRead } from '../../platform/test-hub.tsx'
import {
  CARLA,
  COMPANY_ACCESS_NONE,
  carlaOfCompany,
  companyAppAccessRead,
} from '../../platform/test-hub-access.tsx'
import { bodyRows, hub, open, sectionOf, server } from './test-people.tsx'
import * as roles from './test-roles.tsx'

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

test('Quem usa os apps: a pessoa de fora com o app e o papel, o app leva à seção do Projeto e a dona tira de todos', async () => {
  hub({ role: 'owner', mayInviteAs: ['owner', 'admin', 'member'] })
  const deleted: string[] = []
  server.use(
    http.delete(`*/api/companies/${COMPANY.id}/app-access/:personId`, ({ params }) => {
      deleted.push(String(params.personId))
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  expect(bodyRows(apps).map((row) => row.textContent)).toEqual([
    'Carla Souzacarla@example.testPedidos · GerenteTirar de todos',
  ])
  expect(apps.getByRole('link', { name: 'Pedidos · Gerente' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/projects/${PEDIDOS.id}/access`,
  )
  fireEvent.click(apps.getByRole('button', { name: 'Tirar de todos os apps: Carla Souza' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog.textContent).toContain('Tirar Carla Souza de todos os apps?')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar de todos' }))
  await waitFor(() => expect(deleted).toEqual([CARLA.personId]))
})

test('Quem usa os apps: o membro lê a lista e não vê "Tirar de todos"', async () => {
  hub({ role: 'member', mayInviteAs: [] })
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  expect(await apps.findByText('Carla Souza')).toBeTruthy()
  expect(apps.queryByRole('button', { name: /Tirar de todos/ })).toBeNull()
  expect(apps.getByText('Só o dono ou um administrador dá ou tira acesso aos apps.')).toBeTruthy()
})

test('Quem usa os apps: quem pode tirar não lê a frase de quem pode', async () => {
  hub({ role: 'admin', mayInviteAs: ['member'] })
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  expect(await apps.findByRole('button', { name: /Tirar de todos/ })).toBeTruthy()
  expect(apps.queryByText(/Só o dono ou um administrador dá ou tira/)).toBeNull()
})

test('Quem usa os apps: um app sem papéis aparece só com o nome', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'] })
  const [app] = carlaOfCompany().apps
  server.use(
    companyAppAccessRead([
      { ...carlaOfCompany(), apps: [{ ...app, role: null, roleLabel: null }] },
    ]),
  )
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  expect((await apps.findByRole('link', { name: 'Pedidos' })).textContent).toBe('Pedidos')
})

test('Quem usa os apps: o papel que a versão publicada não tem mais é dito, não o código', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'] })
  const [app] = carlaOfCompany().apps
  server.use(
    companyAppAccessRead([
      { ...carlaOfCompany(), apps: [{ ...app, role: 'caixa', roleLabel: null }] },
    ]),
  )
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  expect(await apps.findByText(/Papel que a versão publicada não tem mais/)).toBeTruthy()
  expect(apps.queryByText(/caixa/)).toBeNull()
})

test('Quem usa os apps: sem ninguém de fora, a frase', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'] })
  server.use(COMPANY_ACCESS_NONE)
  open()
  expect(await screen.findByText('Ninguém de fora da empresa usa os apps.')).toBeTruthy()
})

test('Quem usa os apps: tirar de quem o Hub já não encontra fecha a confirmação', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'] })
  server.use(
    http.delete(`*/api/companies/${COMPANY.id}/app-access/:personId`, () => refusal('NOT_FOUND')),
  )
  open()
  const apps = within(sectionOf(await screen.findByRole('heading', { name: 'Quem usa os apps' })))
  fireEvent.click(await apps.findByRole('button', { name: 'Tirar de todos os apps: Carla Souza' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Tirar de todos' }),
  )
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

async function pickOption(name: string) {
  const option = await screen.findByRole('option', { name })
  for (const event of [
    fireEvent.pointerDown,
    fireEvent.mouseDown,
    fireEvent.pointerUp,
    fireEvent.mouseUp,
    fireEvent.click,
  ]) {
    event(option)
  }
}

test('papel próprio: a troca e o convite listam "Atendente" pelo rótulo, e a lista o mostra na linha (critério 14)', async () => {
  roles.hub({
    as: 'owner',
    roles: [...roles.FIXED, roles.ATENDENTE],
    mayInviteAs: ['admin', 'member', 'atendente'],
    people: [
      { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' },
      {
        personId: 'person-bruno',
        name: 'Bruno Souza',
        email: 'bruno@example.test',
        role: 'atendente',
        mayChangeTo: ['member'],
        mayRemove: true,
      },
    ],
  })
  roles.open('/settings/people')
  const people = within(sectionOf(await screen.findByRole('heading', { name: 'Pessoas' })))
  await waitFor(() =>
    expect(bodyRows(people).map((row) => row.textContent)).toContain(
      'Bruno Souzabruno@example.testAtendenteMudar papelTirar da empresa',
    ),
  )
  fireEvent.click(people.getByRole('button', { name: 'Mudar papel: Bruno Souza' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  fireEvent.click(dialog.getByLabelText('Papel'))
  expect((await screen.findAllByRole('option')).map((one) => one.textContent)).toEqual([
    'Membro',
    'Atendente',
  ])
  await pickOption('Membro')
  fireEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const invite = within(sectionOf(screen.getByRole('heading', { name: 'Convidar pessoa' })))
  fireEvent.click(invite.getByLabelText('Papel'))
  expect((await screen.findAllByRole('option', { name: 'Atendente' })).length).toBeGreaterThan(0)
})

test('papel próprio com acento: quem lê os papéis vê o rótulo; quem não lê vê o nome guardado em palavras (o Hub ainda não leva o rótulo)', async () => {
  const sao = roles.customRole('Atendente São Paulo', 'atendente-sao-paulo', ['pedidos'], 1)
  const people = [
    { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'developer' },
    {
      personId: 'person-bruno',
      name: 'Bruno Souza',
      email: 'bruno@example.test',
      role: 'atendente-sao-paulo',
    },
  ]
  for (const [as, shown] of [
    ['owner', 'Atendente São Paulo'],
    ['developer', 'Atendente sao paulo'],
  ] as const) {
    roles.hub({ as, roles: [...roles.FIXED, sao], people })
    const { unmount } = roles.open('/settings/people')
    const list = within(sectionOf(await screen.findByRole('heading', { name: 'Pessoas' })))
    await waitFor(() =>
      expect(bodyRows(list).map((row) => row.textContent)).toContain(
        `Bruno Souzabruno@example.test${shown}`,
      ),
    )
    unmount()
  }
})
