import { setMemberProfile } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import {
  companyRead,
  hubServer,
  memberView,
  refusal,
  sessionRead,
} from '../../platform/test-hub.tsx'
import { COMPANY_ACCESS_NONE } from '../../platform/test-hub-access.tsx'

const server = hubServer()
const ACCOUNT = `/companies/${COMPANY.id}/settings/account`
const PEOPLE = `/companies/${COMPANY.id}/settings/people`
const HINT = 'Ajuda o Assistente a entender o seu trabalho.'
const TOO_LONG = 'Escreva até 80 caracteres.'
const DAVI = { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const UNSAVED =
  'Não confirmamos se o cargo e a área foram salvos. Confira os campos e tente de novo.'

type People = Parameters<typeof memberView>[0][]
type Hub = { writes: { personId: string; body: unknown }[]; reads: number }

/**
 * The company as `role` sees it, with `people` listed; a write replaces the person's two texts and
 * answers the member as the list then shows them, unless `answer` refuses.
 */
function hub(role: string, people: People, answer?: () => Response) {
  const state: Hub = { writes: [], reads: 0 }
  const rows = people.map((one) => ({ ...one }))
  server.use(
    sessionRead(() => ANA),
    COMPANY_ACCESS_NONE,
    http.get(`*/api/companies/${COMPANY.id}/members`, () => {
      state.reads += 1
      return HttpResponse.json({
        members: rows.map((one) => memberView(one)),
        next: { kind: 'END' },
      })
    }),
    http.put(
      `*/api/companies/${COMPANY.id}/members/:personId/profile`,
      async ({ request, params }) => {
        const body = setMemberProfile.input.body.parse(await request.json())
        state.writes.push({ personId: String(params.personId), body })
        if (answer !== undefined) return answer()
        const row = rows.find((one) => one.personId === params.personId)
        if (row === undefined) return refusal('NOT_FOUND')
        Object.assign(row, body)
        return HttpResponse.json(setMemberProfile.success.body.parse({ member: memberView(row) }))
      },
    ),
    http.get(`*/api/companies/${COMPANY.id}/roles`, () => HttpResponse.json({ roles: [] })),
    ...companyRead({ role, members: [] }),
  )
  return state
}

function open(path: string) {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

const MINE = { ...ANA, personId: ANA.id, role: 'owner' }

async function account() {
  return within(await screen.findByRole('region', { name: 'Cargo e área' }))
}

async function fields(section: ReturnType<typeof within>) {
  const job = await section.findByRole('textbox', { name: 'Cargo' })
  const area = await section.findByRole('textbox', { name: 'Área' })
  if (!(job instanceof HTMLInputElement) || !(area instanceof HTMLInputElement)) {
    throw new Error('the fields are not text boxes')
  }
  return { job, area }
}

test('Sua conta, primeira vez e vazio: os dois campos vazios com a dica', async () => {
  hub('owner', [MINE])
  open(ACCOUNT)
  const section = await account()
  const { job, area } = await fields(section)
  expect([job.value, area.value]).toEqual(['', ''])
  expect(section.getByText(HINT)).toBeTruthy()
  expect(section.getByRole('button', { name: 'Salvar' })).toBeTruthy()
})

test('Sua conta, carregando: o texto carregando no lugar dos campos', async () => {
  const { promise: held, resolve: release } = Promise.withResolvers<void>()
  hub('owner', [MINE])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/members`, async () => {
      await held
      return HttpResponse.json({
        members: [memberView({ ...MINE, jobTitle: 'Diretora comercial', department: 'Vendas' })],
        next: { kind: 'END' },
      })
    }),
  )
  open(ACCOUNT)
  const section = await account()
  expect(section.getByRole('status', { name: 'Carregando' })).toBeTruthy()
  expect(section.queryByRole('textbox')).toBeNull()
  release()
  expect((await fields(section)).job.value).toBe('Diretora comercial')
})

test('Sua conta, com texto: grava o cargo e a área, e o branco vira nada', async () => {
  const hubbed = hub('owner', [{ ...MINE, jobTitle: 'Diretora comercial', department: 'Vendas' }])
  open(ACCOUNT)
  const section = await account()
  const { job, area } = await fields(section)
  expect([job.value, area.value]).toEqual(['Diretora comercial', 'Vendas'])
  fireEvent.change(job, { target: { value: '  Diretora de operações ' } })
  fireEvent.change(area, { target: { value: '   ' } })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(hubbed.writes).toEqual([
      { personId: ANA.id, body: { jobTitle: 'Diretora de operações', department: null } },
    ]),
  )
  await waitFor(() => expect(hubbed.reads).toBeGreaterThan(1))
  await waitFor(() => expect((job.isConnected ? job : job).value).toBeDefined())
  const after = await fields(await account())
  expect([after.job.value, after.area.value]).toEqual(['Diretora de operações', ''])
})

test('Sua conta, acima de 80 caracteres: a frase do campo, e nada é enviado', async () => {
  const hubbed = hub('owner', [MINE])
  open(ACCOUNT)
  const section = await account()
  const { job, area } = await fields(section)
  fireEvent.change(job, { target: { value: 'a'.repeat(81) } })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  expect(await section.findByText(TOO_LONG)).toBeTruthy()
  expect(job.getAttribute('aria-invalid')).toBe('true')
  expect(area.getAttribute('aria-invalid')).toBeNull()
  expect(hubbed.writes).toEqual([])
  fireEvent.change(job, { target: { value: 'a'.repeat(80) } })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(hubbed.writes.length).toBe(1))
})

test('Sua conta, erro na gravação: a frase do código que o Hub fechou, e o texto da pessoa fica', async () => {
  hub('owner', [MINE], () => refusal('REQUEST_MALFORMED'))
  open(ACCOUNT)
  const section = await account()
  const { job } = await fields(section)
  fireEvent.change(job, { target: { value: 'Compradora' } })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  expect(await section.findByText(sentenceOfCode('REQUEST_MALFORMED'))).toBeTruthy()
  expect(job.value).toBe('Compradora')
})

test('Sua conta, banco fora: a frase de que não confirmou, sem dizer que gravou', async () => {
  hub('owner', [MINE], () => refusal('DATABASE_UNAVAILABLE'))
  open(ACCOUNT)
  const section = await account()
  fireEvent.change((await fields(section)).job, { target: { value: 'Compradora' } })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  expect(await section.findByText(UNSAVED)).toBeTruthy()
})

test('Sua conta, erro na leitura: a frase com Tentar de novo, que lê de novo', async () => {
  let failing = true
  hub('owner', [{ ...MINE, jobTitle: 'Diretora comercial' }])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      failing
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({
            members: [memberView({ ...MINE, jobTitle: 'Diretora comercial' })],
            next: { kind: 'END' },
          }),
    ),
  )
  open(ACCOUNT)
  const section = await account()
  expect(await section.findByText('Não foi possível ler o seu cargo e a sua área.')).toBeTruthy()
  failing = false
  fireEvent.click(section.getByRole('button', { name: 'Tentar de novo' }))
  expect((await fields(section)).job.value).toBe('Diretora comercial')
})

const PEOPLE_OWNER: People = [
  { ...MINE, mayEditProfile: true },
  {
    ...DAVI,
    role: 'member',
    mayEditProfile: true,
    mayRemove: true,
    jobTitle: 'Analista',
    department: 'Compras',
  },
]

test('Pessoas, vazio: quem pode vê o botão de cada membro e nenhuma linha de cargo', async () => {
  hub('owner', [
    { ...MINE, mayEditProfile: true },
    { ...DAVI, role: 'member', mayEditProfile: true },
  ])
  open(PEOPLE)
  expect(await screen.findByRole('button', { name: 'Cargo e área: Davi Costa' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Cargo e área: Ana Lima' })).toBeTruthy()
  expect(screen.queryByText(/·/)).toBeNull()
})

test('Pessoas, sem permissão de mudar papel: o cargo e a área só para ler, sem o botão', async () => {
  hub('member', [
    { ...MINE, jobTitle: 'Diretora comercial', department: 'Vendas' },
    { ...DAVI, role: 'member', mayEditProfile: true, jobTitle: 'Analista' },
    {
      personId: 'person-eva',
      name: 'Eva Neves',
      email: 'eva@example.test',
      role: 'member',
      jobTitle: 'Gerente',
    },
  ])
  open(PEOPLE)
  expect(await screen.findByText('Diretora comercial · Vendas')).toBeTruthy()
  expect(screen.getByText('Gerente')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Cargo e área: Ana Lima' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Cargo e área: Eva Neves' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Cargo e área: Davi Costa' })).toBeTruthy()
})

async function openDavi() {
  open(PEOPLE)
  fireEvent.click(await screen.findByRole('button', { name: 'Cargo e área: Davi Costa' }))
  const dialog = await screen.findByRole('alertdialog')
  return { dialog, ...(await fields(within(dialog))) }
}

test('Pessoas, o administrador grava os de outro: a janela traz o que está escrito e o PUT leva o membro', async () => {
  const hubbed = hub('owner', PEOPLE_OWNER)
  open(PEOPLE)
  expect(await screen.findByText('Analista · Compras')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cargo e área: Davi Costa' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog.textContent).toContain('Cargo e área de Davi Costa')
  const { job, area } = await fields(within(dialog))
  expect([job.value, area.value]).toEqual(['Analista', 'Compras'])
  fireEvent.change(job, { target: { value: 'Compradora sênior' } })
  fireEvent.change(area, { target: { value: '' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(hubbed.writes).toEqual([
    { personId: DAVI.personId, body: { jobTitle: 'Compradora sênior', department: null } },
  ])
  expect(await screen.findByText('Compradora sênior')).toBeTruthy()
  expect(screen.queryByText('Analista · Compras')).toBeNull()
})

test('Pessoas, cancelar: a janela fecha sem gravar e abre de novo com o que está escrito', async () => {
  const hubbed = hub('owner', PEOPLE_OWNER)
  const { dialog, job } = await openDavi()
  fireEvent.change(job, { target: { value: 'Outro cargo' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Cargo e área: Davi Costa' }))
  expect((await fields(within(await screen.findByRole('alertdialog')))).job.value).toBe('Analista')
  expect(hubbed.writes).toEqual([])
})

test('Pessoas, acima de 80 caracteres: a frase do campo na janela, e nada é enviado', async () => {
  const hubbed = hub('owner', PEOPLE_OWNER)
  const { dialog, area } = await openDavi()
  fireEvent.change(area, { target: { value: 'b'.repeat(81) } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  expect(await within(dialog).findByText(TOO_LONG)).toBeTruthy()
  expect(hubbed.writes).toEqual([])
})

test.each([
  ['REQUEST_MALFORMED', sentenceOfCode('REQUEST_MALFORMED')],
  ['NOT_IN_ROLE', 'Só quem pode mudar papéis muda o cargo e a área de outra pessoa.'],
] as const)(
  'Pessoas, a gravação recusada (%s): a frase na janela, que continua aberta',
  async (code, sentence) => {
    hub('owner', PEOPLE_OWNER, () => refusal(code))
    const { dialog, job } = await openDavi()
    fireEvent.change(job, { target: { value: 'Outro cargo' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialog).findByText(sentence)).toBeTruthy()
    expect(job.value).toBe('Outro cargo')
  },
)

test('Pessoas, o membro que saiu: a janela fecha e a lista é lida de novo', async () => {
  const hubbed = hub('owner', PEOPLE_OWNER, () => refusal('NOT_FOUND'))
  const { dialog, job } = await openDavi()
  fireEvent.change(job, { target: { value: 'Outro cargo' } })
  const before = hubbed.reads
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  await waitFor(() => expect(hubbed.reads).toBeGreaterThan(before))
})

test('Pessoas, banco fora: a janela diz que não confirmou a mudança e manda ver a lista', async () => {
  hub('owner', PEOPLE_OWNER, () => refusal('DATABASE_UNAVAILABLE'))
  const { dialog, job } = await openDavi()
  fireEvent.change(job, { target: { value: 'Outro cargo' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  expect(await within(dialog).findByText('Não confirmamos a mudança. Veja a lista.')).toBeTruthy()
})
