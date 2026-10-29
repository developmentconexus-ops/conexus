import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import {
  accessRead,
  accessView,
  CARLA,
  changedRole,
  invitedToApp,
} from '../../platform/test-hub-access.tsx'

const server = hubServer()
beforeEach(() => server.use(conversationsNone))
const ACCESS = `/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/access`
const ADDRESS = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}?lens=project&section=access`

type Write = { method: string; url: string; key?: string | null; body?: unknown }

/** The Hub with Pedidos and its list in `view`; every write is recorded and answered by `answers`. */
function hub(
  view: { list: ReturnType<typeof accessView> },
  answers: { invite?: () => Response; change?: () => Response; revoke?: () => Response } = {},
) {
  const writes: Write[] = []
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
    accessRead(view),
    http.post(`*${ACCESS}/invitations`, async ({ request }) => {
      writes.push({
        method: 'POST',
        url: 'invitations',
        key: request.headers.get('idempotency-key'),
        body: await request.json(),
      })
      return (answers.invite ?? (() => invitedToApp('dora@example.test', 'vendedor')))()
    }),
    http.put(`*${ACCESS}/:personId`, async ({ request, params }) => {
      writes.push({ method: 'PUT', url: String(params.personId), body: await request.json() })
      return (answers.change ?? (() => changedRole('gerente')))()
    }),
    http.delete(`*${ACCESS}/invitations/:invitationId`, ({ params }) => {
      writes.push({ method: 'DELETE', url: `invitations/${String(params.invitationId)}` })
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`*${ACCESS}/:personId`, ({ params }) => {
      writes.push({ method: 'DELETE', url: String(params.personId) })
      return (answers.revoke ?? (() => new HttpResponse(null, { status: 204 })))()
    }),
  )
  return writes
}

async function open() {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ADDRESS] }))} />)
  await screen.findByRole('heading', { name: 'Quem usa o app' })
}

async function pick(label: string, option: string) {
  fireEvent.click(await screen.findByLabelText(label))
  const item = await screen.findByRole('option', { name: option })
  for (const event of [
    fireEvent.pointerDown,
    fireEvent.mouseDown,
    fireEvent.pointerUp,
    fireEvent.mouseUp,
    fireEvent.click,
  ]) {
    event(item)
  }
}

function rows() {
  return within(screen.getByRole('table', { name: 'Quem usa o app' }))
    .getAllByRole('row')
    .slice(1)
}

test('a dona: os membros com todos os papéis, a pessoa com o papel e o convite, e o formulário', async () => {
  hub({ list: accessView() })
  await open()
  await screen.findByText('Carla Souza')
  expect(rows().map((row) => row.textContent)).toEqual([
    'Ana Limaana@example.testTodos os papéis',
    'Davi Costadavi@example.testTodos os papéis',
    expect.stringMatching(/^Carla Souzacarla@example\.test · desde 28\/10Vendedor.*Tirar acesso$/),
    expect.stringMatching(
      /^carla2@example\.testconvite pendente · vence 04\/11\/2026.*GerenteCancelar convite$/,
    ),
  ])
  expect(screen.getByRole('button', { name: 'Dar acesso' })).toBeTruthy()
})

test('trocar o papel: o Select manda o PUT e a linha mostra "Salvo"', async () => {
  const view = { list: accessView() }
  const writes = hub(view, {
    change: () => {
      view.list = accessView({ people: [{ ...CARLA, role: 'gerente' }] })
      return changedRole('gerente')
    },
  })
  await open()
  expect(screen.queryByText('Salvo')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  await pick('Papel de Carla Souza', 'Gerente')
  expect(await screen.findByText('Salvo')).toBeTruthy()
  expect(writes).toEqual([{ method: 'PUT', url: CARLA.personId, body: { role: 'gerente' } }])
})

test('a troca recusada mostra a frase do código', async () => {
  hub({ list: accessView() }, { change: () => refusal('APP_ROLE_UNKNOWN') })
  await open()
  await pick('Papel de Carla Souza', 'Gerente')
  const phrase = FAILURES.APP_ROLE_UNKNOWN
  expect(await screen.findByText(`${phrase.phrase} ${phrase.action}`)).toBeTruthy()
})

test('tirar acesso: a confirmação diz o que acontece e confirmar manda o DELETE', async () => {
  const writes = hub({ list: accessView() })
  await open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar acesso: Carla Souza' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog.textContent).toContain('Tirar o acesso de Carla Souza?')
  expect(dialog.textContent).toContain('O próximo clique no app é recusado.')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar acesso' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(writes).toEqual([{ method: 'DELETE', url: CARLA.personId }])
})

test('tirar acesso de quem o Hub já não encontra fecha a confirmação', async () => {
  hub({ list: accessView() }, { revoke: () => refusal('NOT_FOUND') })
  await open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar acesso: Carla Souza' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Tirar acesso' }),
  )
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

test('cancelar o convite pendente manda o DELETE do convite', async () => {
  const writes = hub({ list: accessView() })
  await open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar convite para carla2@example.test' }),
  )
  await waitFor(() =>
    expect(writes).toEqual([{ method: 'DELETE', url: `invitations/${'i'.repeat(32)}` }]),
  )
})

test('dar acesso: o e-mail e o papel vão com a chave de tentativa e o aviso diz para quem', async () => {
  const writes = hub({ list: accessView() })
  await open()
  fireEvent.change(await screen.findByLabelText('E-mail'), {
    target: { value: 'dora@example.test' },
  })
  await pick('Papel', 'Gerente')
  fireEvent.click(screen.getByRole('button', { name: 'Dar acesso' }))
  expect(await screen.findByText('Convite enviado para dora@example.test.')).toBeTruthy()
  expect(writes).toHaveLength(1)
  expect(writes[0]?.body).toEqual({ email: 'dora@example.test', role: 'gerente' })
  expect(writes[0]?.key).toMatch(/\S/)
})

for (const code of ['APP_ACCESS_MEMBER', 'APP_ACCESS_EXISTS'] as const) {
  test(`dar acesso recusado ${code}: a frase do código fica no campo do e-mail`, async () => {
    hub({ list: accessView() }, { invite: () => refusal(code) })
    await open()
    fireEvent.change(await screen.findByLabelText('E-mail'), {
      target: { value: 'ana@example.test' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Dar acesso' }))
    expect(await screen.findByText(FAILURES[code].phrase)).toBeTruthy()
  })
}

test('o membro vê quem usa o app, sem Select, sem Tirar acesso e sem formulário', async () => {
  hub({ list: accessView({ mayManage: false }) })
  await open()
  await screen.findByText('Carla Souza')
  expect(screen.queryByLabelText('Papel de Carla Souza')).toBeNull()
  expect(screen.queryByRole('button', { name: /Tirar acesso/ })).toBeNull()
  expect(screen.queryByRole('button', { name: /Cancelar convite/ })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Dar acesso' })).toBeNull()
  expect(screen.getByText('Só o dono ou um administrador dá ou tira acesso ao app.')).toBeTruthy()
  expect(screen.queryByText('Publique o app para dar acesso a alguém.')).toBeNull()
})

test('o membro de um app sem versão publicada não lê a frase de quem publica', async () => {
  hub({ list: accessView({ mayManage: false, published: false, roles: [], people: [] }) })
  await open()
  expect(screen.queryByText('Publique o app para dar acesso a alguém.')).toBeNull()
})

test('sem versão publicada: a frase e nenhum formulário', async () => {
  hub({ list: accessView({ published: false, roles: [], people: [], invitations: [] }) })
  await open()
  expect(await screen.findByText('Publique o app para dar acesso a alguém.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Dar acesso' })).toBeNull()
  expect(screen.queryByText(/Só o dono ou um administrador/)).toBeNull()
})

test('um app sem papéis: o formulário só pede o e-mail e manda o papel nulo', async () => {
  const writes = hub({
    list: accessView({ roles: [], people: [{ ...CARLA, role: null }], invitations: [] }),
  })
  await open()
  fireEvent.change(await screen.findByLabelText('E-mail'), {
    target: { value: 'dora@example.test' },
  })
  expect(screen.queryByLabelText('Papel')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Dar acesso' }))
  await screen.findByText('Convite enviado para dora@example.test.')
  expect(writes[0]?.body).toEqual({ email: 'dora@example.test', role: null })
})

test('o papel que a versão publicada não tem mais: a linha diz e o Select pede outro', async () => {
  hub({ list: accessView({ people: [{ ...CARLA, role: 'caixa', roleDeclared: false }] }) })
  await open()
  expect(await screen.findByText('Papel que a versão publicada não tem mais')).toBeTruthy()
  expect(screen.getByLabelText('Papel de Carla Souza').textContent).toContain('Escolha um papel')
})

test('o membro lê que o papel sumiu, sem Select', async () => {
  hub({
    list: accessView({
      mayManage: false,
      people: [{ ...CARLA, role: 'caixa', roleDeclared: false }],
    }),
  })
  await open()
  expect(await screen.findByText('Papel que a versão publicada não tem mais')).toBeTruthy()
  expect(screen.queryByLabelText('Papel de Carla Souza')).toBeNull()
})

test('um segundo convite recusado apaga o aviso do primeiro', async () => {
  let sent = 0
  hub(
    { list: accessView() },
    {
      invite: () =>
        sent++ === 0 ? invitedToApp('dora@example.test', 'vendedor') : refusal('APP_ACCESS_EXISTS'),
    },
  )
  await open()
  const email = await screen.findByLabelText('E-mail')
  fireEvent.change(email, { target: { value: 'dora@example.test' } })
  await pick('Papel', 'Gerente')
  fireEvent.click(screen.getByRole('button', { name: 'Dar acesso' }))
  await screen.findByText('Convite enviado para dora@example.test.')
  fireEvent.change(email, { target: { value: 'ana@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Dar acesso' }))
  expect(await screen.findByText(FAILURES.APP_ACCESS_EXISTS.phrase)).toBeTruthy()
  expect(screen.queryByText('Convite enviado para dora@example.test.')).toBeNull()
})

test('carregando: o Skeleton até a lista chegar; erro: a frase e "Tentar de novo"', async () => {
  const held = Promise.withResolvers<void>()
  let fail = true
  hub({ list: accessView() })
  server.use(
    http.get(`*${ACCESS}`, async () => {
      await held.promise
      if (!fail) return HttpResponse.json(accessView())
      fail = false
      return refusal('DATABASE_UNAVAILABLE')
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ADDRESS] }))} />)
  expect(await screen.findByText('Carregando quem usa o app…')).toBeTruthy()
  held.resolve()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('Carla Souza')).toBeTruthy()
})

test('o Projeto que o Hub não encontra: a página de não encontrado', async () => {
  hub({ list: accessView() })
  server.use(http.get(`*${ACCESS}`, () => refusal('NOT_FOUND')))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [ADDRESS] }))} />)
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
})
