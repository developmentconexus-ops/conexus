import { createCompany, listCompanies } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  ANA,
  COMPANY,
  companyRead,
  hubServer,
  refusal,
  sessionRead,
  undecided,
} from '../../platform/test-hub.tsx'

const server = hubServer()

const UNDECIDED = undecided('{"company":{"id":"aaa')

type Sent = { key: string | null; body: unknown }

/** The Hub as an administrator sees it; `answer` is what creating a company replies, one per call. */
function hub(answers: (() => Response)[]) {
  const sent: Sent[] = []
  server.use(
    sessionRead(() => ANA),
    http.get('*/api/companies', () =>
      HttpResponse.json(
        listCompanies.success.body.parse({ companies: [], mayCreate: true, next: { kind: 'END' } }),
      ),
    ),
    http.get('*/api/status', () =>
      HttpResponse.json({
        version: 'v0.1.0',
        lastStart: { state: 'NONE' },
        previousStart: { state: 'NONE' },
      }),
    ),
    http.post('*/api/companies', async ({ request }) => {
      sent.push({ key: request.headers.get('idempotency-key'), body: await request.json() })
      return (answers[sent.length - 1] ?? answers.at(-1))?.() ?? refusal('INTERNAL_UNEXPECTED')
    }),
    ...companyRead({
      role: 'owner',
      members: [{ personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' }],
    }),
  )
  return sent
}

function created() {
  return HttpResponse.json(createCompany.success.body.parse({ company: COMPANY }), { status: 201 })
}

function open() {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/new'] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

async function write(name: string) {
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: name } })
  const button = screen.getByRole('button', { name: 'Criar empresa' })
  fireEvent.click(button)
  return button
}

test('201: abre a página da empresa, com o nome enviado e uma chave de tentativa', async () => {
  const sent = hub([created])
  const router = open()
  await write('Empresa Teste')
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}`)
  expect(sent.map((one) => one.body)).toEqual([{ name: 'Empresa Teste' }])
  expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
})

test('nome vazio: o erro no campo, em português, e nenhum pedido', async () => {
  const sent = hub([created])
  open()
  await write('   ')
  const field = await screen.findByLabelText('Nome')
  expect(await screen.findByText('Escreva o nome da empresa, com até 100 caracteres.')).toBeTruthy()
  expect(field.getAttribute('aria-invalid')).toBe('true')
  expect(sent).toEqual([])
})

test('dois cliques seguidos: um só pedido', async () => {
  const sent = hub([created])
  open()
  const button = await write('Empresa Teste')
  fireEvent.click(button)
  await screen.findByRole('heading', { name: 'Empresa Teste' })
  expect(sent.length).toBe(1)
})

test('a recusa fica no formulário, não no campo, e a próxima tentativa leva outra chave', async () => {
  const sent = hub([() => refusal('IDEMPOTENCY_CONFLICT'), created])
  open()
  await write('Empresa Teste')
  const field = await screen.findByLabelText('Nome')
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Este pedido já foi feito com outros dados. Recarregue a página.')
  expect(field.getAttribute('aria-invalid')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Criar empresa' }))
  await screen.findByRole('heading', { name: 'Empresa Teste' })
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
})

test('resposta perdida: a nova tentativa leva a mesma chave', async () => {
  const sent = hub([() => HttpResponse.error(), created])
  open()
  await write('Empresa Teste')
  await screen.findByText(
    'Algo deu errado dentro do Conexus. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Criar empresa' }))
  await waitFor(() => expect(sent.length).toBe(2))
  expect(sent[1]?.key).toBe(sent[0]?.key)
})

test('quem não pode criar: a frase de "não encontrado" no formulário', async () => {
  hub([() => refusal('NOT_FOUND')])
  open()
  await write('Empresa Teste')
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Não encontramos o que você procurou. Confira o endereço.')
  expect((await screen.findByLabelText('Nome')).getAttribute('aria-invalid')).toBeNull()
})

for (const [name, reply] of UNDECIDED) {
  test(`${name}: a nova tentativa leva a mesma chave`, async () => {
    const sent = hub([reply, created])
    open()
    await write('Empresa Teste')
    await waitFor(() => expect(sent.length).toBe(1))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Criar empresa' }))
    await screen.findByRole('heading', { name: 'Empresa Teste' })
    expect(sent.length).toBe(2)
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}
