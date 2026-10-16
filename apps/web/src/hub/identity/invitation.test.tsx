import {
  acceptInvitation,
  createSession,
  FAILURES,
  getCompany,
  getInvitation,
  listMembers,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const DAVI = { id: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const INVITATION = 'i'.repeat(32)
const server = hubServer()

function received(state: string) {
  const invitation = {
    id: INVITATION,
    company: COMPANY,
    role: 'admin',
    inviterName: 'Ana Lima',
    state,
  }
  return HttpResponse.json(getInvitation.success.body.parse({ invitation }))
}

type Who = { person: typeof DAVI | undefined }

/** The Hub with `who` signed in (or nobody); signing in as Davi signs him in. */
function hub(who: Who, reply: () => Response) {
  server.use(
    sessionRead(() => who.person),
    http.put('*/api/sessions/current', () => {
      who.person = DAVI
      return HttpResponse.json(createSession.success.body.parse({ person: DAVI }))
    }),
    http.get(`*/api/invitations/${INVITATION}`, reply),
    http.put(`*/api/invitations/${INVITATION}/acceptance`, () =>
      HttpResponse.json(acceptInvitation.success.body.parse({ company: COMPANY })),
    ),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({ company: COMPANY, role: 'admin', mayInviteAs: [] }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({
          members: [
            { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' },
            { personId: DAVI.id, name: DAVI.name, email: DAVI.email, role: 'admin' },
          ],
          next: { kind: 'END' },
        }),
      ),
    ),
  )
}

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

const ENTRY = `/invitations/${INVITATION}`

test('sem sessão: "Entrar" leva ao login com o convite de volta, e entrar abre o convite para aceitar', async () => {
  hub({ person: undefined }, () => received('PENDING'))
  const router = open(ENTRY)
  fireEvent.click(await screen.findByRole('link', { name: 'Entrar' }))
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: DAVI.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(
    await screen.findByRole('heading', {
      name: 'Ana Lima convidou você para Empresa Teste como Administrador.',
    }),
  ).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${ENTRY}/acceptance`)
})

test('"Ainda não tenho senha" pede o nome e manda o link para o e-mail do convite', async () => {
  const sent: unknown[] = []
  hub({ person: undefined }, () => received('PENDING'))
  server.use(
    http.put(`*/api/invitations/${INVITATION}/password-link`, async ({ request }) => {
      sent.push(await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open(ENTRY)
  fireEvent.click(await screen.findByRole('button', { name: 'Ainda não tenho senha' }))
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Davi Costa' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
  expect((await screen.findByRole('status')).textContent).toBe(
    'Enviamos o link para criar a senha ao e-mail do convite.',
  )
  expect(sent).toEqual([{ name: 'Davi Costa' }])
})

test('o nome vazio fica no campo, e um 429 fica no formulário', async () => {
  let asked = 0
  hub({ person: undefined }, () => received('PENDING'))
  server.use(
    http.put(`*/api/invitations/${INVITATION}/password-link`, () => {
      asked++
      return refusal('PASSWORD_LINKS_EXCEEDED')
    }),
  )
  open(ENTRY)
  fireEvent.click(await screen.findByRole('button', { name: 'Ainda não tenho senha' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Enviar link' }))
  expect(await screen.findByText('Escreva o seu nome.')).toBeTruthy()
  expect(asked).toBe(0)
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Davi Costa' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
  const refused = await screen.findByText(
    'Muitos pedidos de link. Espere um pouco e tente de novo.',
  )
  expect(refused.getAttribute('role')).toBe('alert')
  expect(screen.queryByText('Escreva o seu nome.')).toBeNull()
})

test('com sessão, o endereço do convite leva a /acceptance, e "Aceitar convite" abre a empresa com as duas pessoas', async () => {
  hub({ person: DAVI }, () => received('PENDING'))
  const router = open(ENTRY)
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar convite' }))
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}`)
  expect(await screen.findByText('Davi Costa')).toBeTruthy()
  expect(screen.getByText('Ana Lima')).toBeTruthy()
})

test('aceito: "Você já faz parte de Empresa Teste." com o caminho para a empresa', async () => {
  hub({ person: DAVI }, () => received('ACCEPTED'))
  open(ENTRY)
  expect(
    await screen.findByRole('heading', { name: 'Você já faz parte de Empresa Teste.' }),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Abrir empresa' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}`,
  )
  expect(screen.queryByRole('button', { name: 'Aceitar convite' })).toBeNull()
})

for (const state of ['EXPIRED', 'CANCELED']) {
  test(`${state === 'EXPIRED' ? 'vencido' : 'cancelado'}: a frase do convite que não vale mais, sem aceitar`, async () => {
    hub({ person: DAVI }, () => received(state))
    open(ENTRY)
    expect(await screen.findByRole('heading', { name: 'Este convite não vale mais.' })).toBeTruthy()
    expect(screen.getByText('Peça um novo a quem convidou você.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Aceitar convite' })).toBeNull()
  })
}

const OTHER_ADDRESS = 'Se o convite foi para outro e-mail, saia e entre com ele.'

test('desconhecido ou de outra pessoa (404): a página de "não encontrado" e a linha do outro e-mail, sem dizer qual', async () => {
  hub({ person: DAVI }, () => refusal('NOT_FOUND'))
  open(ENTRY)
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  expect(screen.getByText(OTHER_ADDRESS)).toBeTruthy()
  expect(screen.queryByText('Não foi possível abrir o Conexus')).toBeNull()
})

test('um endereço de convite malformado, com ou sem sessão: a mesma página e a mesma linha', async () => {
  for (const person of [DAVI, undefined]) {
    hub({ person }, () => received('PENDING'))
    open('/invitations/curto')
    expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
    expect(screen.getByText(OTHER_ADDRESS)).toBeTruthy()
    cleanup()
  }
})

test('a empresa cheia: a frase fica na página, e o convite segue para aceitar', async () => {
  hub({ person: DAVI }, () => received('PENDING'))
  server.use(http.put(`*/api/invitations/${INVITATION}/acceptance`, () => refusal('COMPANY_FULL')))
  open(ENTRY)
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar convite' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A empresa já tem 100 pessoas. Fale com quem convidou você.',
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Aceitar convite' }).hasAttribute('disabled')).toBe(
      false,
    ),
  )
})

test('aceitar: "Você já faz parte" não aparece antes de a empresa abrir', async () => {
  let accepted = false
  let companyOpens: () => void = () => undefined
  const companyHeld = new Promise<void>((resolve) => {
    companyOpens = resolve
  })
  hub({ person: DAVI }, () => received(accepted ? 'ACCEPTED' : 'PENDING'))
  server.use(
    http.put(`*/api/invitations/${INVITATION}/acceptance`, () => {
      accepted = true
      return HttpResponse.json(acceptInvitation.success.body.parse({ company: COMPANY }))
    }),
    http.get(`*/api/companies/${COMPANY.id}`, async () => {
      await companyHeld
      return HttpResponse.json(
        getCompany.success.body.parse({ company: COMPANY, role: 'admin', mayInviteAs: [] }),
      )
    }),
  )
  open(ENTRY)
  const button = await screen.findByRole('button', { name: 'Aceitar convite' })
  let flashed = false
  const watch = new MutationObserver(() => {
    flashed ||= document.body.textContent?.includes('Você já faz parte') === true
  })
  watch.observe(document.body, { childList: true, subtree: true, characterData: true })
  fireEvent.click(button)
  // The company is still loading: the navigation waits for it, and the cache has not yet marked
  // the invitation stale, so the page still reads as pending.
  await waitFor(() => expect(accepted).toBe(true))
  expect(screen.getByRole('button', { name: /Aceitando/ })).toBeTruthy()
  companyOpens()
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  watch.disconnect()
  expect(flashed).toBe(false)
})
