import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'
import { connectionOf, SANKHYA } from './fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import {
  connectionsHub,
  fill,
  mount,
  openForm,
  openIntegrations,
  PAGE,
  pageOf,
  SECRETS,
  viewOf,
} from './test-hub.tsx'

const server = hubServer()
const MEMBER_SENTENCE = 'Só o dono ou um administrador liga, testa e desliga.'
const TESTED = '2026-10-29T14:02:00.000Z'

function open(view?: View, answers?: Answers, path?: string) {
  return openIntegrations(server, view, answers, path)
}

test('a primeira vez: a frase, o logotipo e o resumo do conector, e Ligar para quem pode', async () => {
  open()
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
  expect(screen.getByText(/O Conexus só lê\.$/)).toBeTruthy()
  expect(screen.getByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  const toLink = within(screen.getByRole('region', { name: 'Para ligar' }))
  expect(toLink.getByText('Sankhya')).toBeTruthy()
  expect(toLink.getByText('ERP')).toBeTruthy()
  expect(toLink.getByText(SANKHYA.summary)).toBeTruthy()
  const logo = toLink.getByRole('presentation', { hidden: true })
  expect(logo.getAttribute('src')?.startsWith('data:image/svg+xml;utf8,')).toBe(true)
  expect(screen.queryByText(MEMBER_SENTENCE)).toBeNull()
})

test('a dona liga e testa num toque, e desliga: a janela monta os campos do catálogo, liga, abre a página e testa', async () => {
  const sent = open()
  const form = await openForm()
  expect(within(form).getByRole('region', { name: 'Antes de colar' })).toBeTruthy()
  const guide = within(form).getByRole('link', { name: 'Onde achar Client ID, Client Secret' })
  expect(guide.getAttribute('target')).toBe('_blank')
  expect(guide.getAttribute('rel')).toContain('noopener')
  expect(within(form).getByLabelText<HTMLInputElement>('Nome da ligação').value).toBe('Sankhya')
  expect(within(form).getByLabelText('Client ID').getAttribute('type')).toBe('text')
  for (const label of ['Client Secret', 'X-Token']) {
    expect(within(form).getByLabelText(label).getAttribute('type')).toBe('password')
  }
  for (const label of Object.keys(SECRETS)) {
    expect(within(form).getByLabelText(label).getAttribute('autocomplete')).toBe('off')
  }
  fill('Comercial')
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
  expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['POST', 'POST'])
  expect(sent[0]?.body).toEqual({
    connector: 'sankhya',
    name: 'Comercial',
    credential: {
      clientId: 'id-plantado-1',
      clientSecret: 'segredo-plantado-2',
      xToken: 'token-plantado-3',
    },
  })
  expect(sent[0]?.attemptKey).toBeTruthy()
  expect(sent[1]?.path).toMatch(/\/test$/)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.textContent).not.toContain('segredo-plantado-2')
  // ... e desliga: o menu da página, a confirmação pelo nome, e a lista de volta sem a ligação.
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  const confirm = await screen.findByRole('alertdialog')
  expect(within(confirm).getByText('Desligar Comercial?')).toBeTruthy()
  fireEvent.click(within(confirm).getByRole('button', { name: 'Desligar' }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['POST', 'POST', 'DELETE'])
})

test('a página que chega de Ligar e testar mostra "Testando a ligação…" enquanto espera', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), {}, `${pageOf(connection)}?testar=true`)
  expect(await screen.findByText('Testando a ligação…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Testando…' })).toBeTruthy()
  expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByText('Testando a ligação…')).toBeNull())
})

test('o nome sugerido é o do conector, e vazio quando a empresa já tem uma ligação com ele', async () => {
  open(viewOf({ connections: [connectionOf({ name: 'Sankhya' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar outra ligação do Sankhya' }))
  const form = await screen.findByRole('dialog', { name: 'Ligar Sankhya' })
  expect(within(form).getByLabelText<HTMLInputElement>('Nome da ligação').value).toBe('')
})

test('um nome já usado por outra pessoa: a lista é lida de novo atrás da janela', async () => {
  let reads = 0
  open(viewOf(), { link: () => refusal('CONNECTION_NAME_TAKEN') })
  server.use(
    http.get('*/api/companies/*/connections', () => {
      reads += 1
      return undefined
    }),
  )
  const form = await openForm()
  fill('Comercial')
  const before = reads
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  await waitFor(() => expect(reads).toBeGreaterThan(before))
})

test.each([
  ['CONNECTION_NAME_TAKEN', 'Já existe uma ligação desse conector com esse nome. Dê outro nome.'],
  ['CONNECTION_NAME_INVALID', 'Dê um nome à ligação, de até 60 letras.'],
] as const)('%s aparece no campo do nome e as chaves coladas ficam', async (code, sentence) => {
  open(viewOf(), { link: () => refusal(code) })
  const form = await openForm()
  fill('Comercial')
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  const name = within(form).getByLabelText('Nome da ligação')
  await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'))
  expect(within(form).getByText(sentence)).toBeTruthy()
  expect(within(form).getByDisplayValue(SECRETS['X-Token'])).toBeTruthy()
  expect(screen.getByRole('dialog', { name: 'Ligar Sankhya' })).toBeTruthy()
})

test('Ligar recusado por chave inválida: a frase no formulário, nada some em silêncio', async () => {
  open(viewOf(), { link: () => refusal('CONNECTION_CREDENTIAL_INVALID') })
  const form = await openForm()
  fill('Comercial')
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  expect((await within(form).findByRole('alert')).textContent).toBe(
    'Confira os campos: cole cada chave inteira.',
  )
})

test.each(undecided('{"connection":'))(
  'Ligar com %s: "Não confirmamos a ligação", a mesma chave de tentativa na repetição',
  async (_name, reply) => {
    let answers = 0
    const sent = open(viewOf(), { link: () => (answers++ === 0 ? reply() : undefined) })
    const form = await openForm()
    fill('Comercial')
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
    expect((await within(form).findByRole('alert')).textContent).toBe(
      'Não confirmamos a ligação. Tente de novo.',
    )
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
    expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
    // The page tests the new connection; the test ends once it has answered.
    expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
    expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)
  },
)

test('uma chave maior que o catálogo aceita: a frase diz que passou do tamanho, não que está vazia', async () => {
  const sent = open()
  const form = await openForm()
  fill('Comercial')
  fireEvent.change(within(form).getByLabelText('Client ID', { exact: true }), {
    target: { value: 'a'.repeat(201) },
  })
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  expect(await within(form).findByText('Client ID passa de 200 letras.')).toBeTruthy()
  expect(within(form).queryByText('Cole Client ID.')).toBeNull()
  expect(sent).toHaveLength(0)
})

test('campo vazio: o formulário pede os campos antes de mandar', async () => {
  const sent = open()
  const form = await openForm()
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar e testar' }))
  expect((await within(form).findAllByText(/^Cole /)).length).toBe(3)
  expect(sent).toHaveLength(0)
})

test('duas ligações do mesmo conector: um grupo com o logotipo, a conta e cada ligação com o seu estado', async () => {
  const tested = connectionOf({ name: 'Comercial', state: 'ACTIVE', testedAt: TESTED })
  const refused = connectionOf({ name: 'Financeiro', state: 'NEEDS_REAUTH', linkedBy: null })
  open(viewOf({ connections: [tested, refused] }))
  const linked = within(await screen.findByRole('region', { name: 'Ligadas' }))
  expect(linked.getByText('2 ligações')).toBeTruthy()
  expect(linked.getAllByRole('presentation', { hidden: true })).toHaveLength(1)
  expect(linked.getByText('Funcionando')).toBeTruthy()
  expect(linked.getByText('Chaves recusadas')).toBeTruthy()
  expect(linked.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d$/)).toBeTruthy()
  expect(linked.getByText(/^Ligada por Ana em \d\d\/\d\d$/)).toBeTruthy()
  expect(linked.getByText(/^Ligada em \d\d\/\d\d$/)).toBeTruthy()
  const links = linked.getAllByRole('link').map((one) => one.getAttribute('href'))
  expect(links).toEqual([pageOf(tested), pageOf(refused)].map((one) => one))
  // The connector stays under "Para ligar" too: another account of it can be linked.
  expect(
    within(screen.getByRole('region', { name: 'Para ligar' })).getByText(SANKHYA.summary),
  ).toBeTruthy()
})

test('a ligação nova diz "ainda não testada", sem selo e sem "testada em"', async () => {
  open(viewOf({ connections: [connectionOf()] }))
  expect(await screen.findByText(/^Ligada por Ana em \d\d\/\d\d, ainda não testada$/)).toBeTruthy()
  expect(screen.queryByText('Funcionando')).toBeNull()
  expect(screen.queryByText(/^testada em/)).toBeNull()
})

test('o membro lê; vazio e erro: a lista sem Ligar, e a frase de quem pode', async () => {
  const sent = open(
    viewOf({
      mayManage: false,
      connections: [connectionOf({ state: 'ACTIVE', testedAt: TESTED })],
    }),
  )
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
  expect(screen.getByText('Comercial')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Ligar/ })).toBeNull()
  expect(sent).toHaveLength(0)
  // Vazio: a frase da primeira vez e o conector sem Ligar.
  cleanup()
  open(viewOf({ mayManage: false }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.getByText(SANKHYA.summary)).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Ligar/ })).toBeNull()
  // Erro: a leitura que falha mostra a frase do Hub e "Tentar de novo" lê outra vez.
  cleanup()
  let failing = true
  server.use(
    http.get('*/api/companies/*/connections', () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
    ...connectionsHub(viewOf({ mayManage: false })).handlers,
  )
  mount(PAGE)
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
})

test('a página: o cabeçalho, o selo, quem testou e quando, o conector e a sua versão; nada de um teste antigo', async () => {
  const connection = connectionOf({
    state: 'ACTIVE',
    testedAt: TESTED,
    testedBy: connectionOf().linkedBy,
  })
  open(viewOf({ connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
  expect(screen.getByText('Sankhya · ERP')).toBeTruthy()
  expect(screen.getByText('Funcionando')).toBeTruthy()
  expect(screen.getByText(/^Ligada por Ana em \d\d\/\d\d$/)).toBeTruthy()
  expect(screen.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d, por Ana$/)).toBeTruthy()
  expect(screen.getByText('1.0.0')).toBeTruthy()
  // What a Testar answered is shown only on the page that ran it.
  expect(screen.queryByText('Ligado e funcionando.')).toBeNull()
})

test('uma ligação ainda não testada diz que não foi testada, e o menu da dona tem Desligar', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByText(/^Ligada por Ana em \d\d\/\d\d, ainda não testada$/)).toBeTruthy()
  expect(screen.queryByText(/^testada em/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }))
  expect(await screen.findByRole('menuitem', { name: 'Desligar' })).toBeTruthy()
})

test('o membro lê a página com quem testou, sem Testar nem Desligar', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const sent = open(viewOf({ mayManage: false, connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
  expect(screen.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d$/)).toBeTruthy()
  for (const name of ['Testar', 'Mais ações', 'Ligar']) {
    expect(screen.queryByRole('button', { name })).toBeNull()
  }
  expect(sent).toHaveLength(0)
})
