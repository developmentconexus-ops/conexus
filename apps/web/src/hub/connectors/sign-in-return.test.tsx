import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE } from './fixtures.ts'
import { connectionsHub, viewOf } from './test-hub.tsx'

const server = hubServer()
const SIGN_IN = '5c1a0f0e-3b7d-4a53-9a9e-0d2f6c1b7a11'
const STATE = `${COMPANY.id}.${SIGN_IN}`
const RETURN = '/integrations/return'

function open(search: string, path = RETURN) {
  const history = createMemoryHistory({ initialEntries: [`${path}${search}`] })
  render(<Conexus conexus={createConexus(history)} />)
  return history
}

function hubOf(answers = {}) {
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE] }), answers)
  server.use(...hub.handlers)
  return hub.sent
}

test('state faltando ou estragado: a frase e nenhuma chamada ao Hub', async () => {
  for (const search of [
    '?code=abc',
    '?code=abc&state=estragado',
    `?code=abc&state=${COMPANY.id}.nao-e-uuid`,
    `?code=abc&state=${STATE}.sobra`,
  ]) {
    const sent = hubOf()
    const history = open(search)
    expect(await screen.findByText('Esse endereço não é de uma ligação.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voltar a Integrações' })).toBeTruthy()
    expect(sent).toEqual([])
    expect(history.location.search).toBe('')
    document.body.innerHTML = ''
  }
})

test('error=access_denied manda { refused: true } e mostra a frase com o nome do conector', async () => {
  const sent = hubOf({
    end: () => HttpResponse.json({ result: 'CANCELLED', connector: 'mercado-livre' }),
  })
  open(`?error=access_denied&state=${STATE}`)
  expect(await screen.findByText('Você não autorizou o Conexus no Mercado Livre.')).toBeTruthy()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({
    method: 'POST',
    path: `/api/companies/${COMPANY.id}/connection-sign-ins/${SIGN_IN}`,
    body: { refused: true },
  })
  const back = screen.getByRole('link', { name: 'Voltar a Integrações' })
  expect(back.getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations`)
})

test('outro error: manda o error e a descrição ao Hub e mostra o que ele respondeu', async () => {
  const sent = hubOf({
    end: () =>
      HttpResponse.json({
        result: 'REFUSED',
        connector: 'mercado-livre',
        native: {
          status: 302,
          code: 'invalid_operator_user_id',
          message: 'colaborador sem acesso',
          body: null,
        },
      }),
  })
  open(
    `?error=invalid_operator_user_id&error_description=${encodeURIComponent('colaborador sem acesso')}&state=${STATE}`,
  )
  expect(await screen.findByText('O Mercado Livre recusou a autorização.')).toBeTruthy()
  expect(
    screen.getByText(
      'Mercado Livre respondeu 302, código invalid_operator_user_id: colaborador sem acesso',
    ),
  ).toBeTruthy()
  expect(screen.queryByText(/Você não autorizou/)).toBeNull()
  expect(sent[0]).toMatchObject({
    body: { error: 'invalid_operator_user_id', description: 'colaborador sem acesso' },
  })
})

test('a página troca o endereço na história antes de chamar o Hub: voltar não manda o código de novo', async () => {
  const held = Promise.withResolvers<void>()
  let seen = 'ainda não chamou'
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE] }))
  const history = createMemoryHistory({
    initialEntries: [`${RETURN}?code=segredo-plantado&state=${STATE}`],
  })
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/connection-sign-ins/:signInId`, async () => {
      seen = history.location.href
      await held.promise
      return HttpResponse.json({ result: 'CANCELLED', connector: 'mercado-livre' })
    }),
    ...hub.handlers,
  )
  render(<Conexus conexus={createConexus(history)} />)
  expect(await screen.findByText('Voltando da autorização…')).toBeTruthy()
  await screen.findByText('Voltando da autorização…')
  await new Promise((done) => setTimeout(done, 50))
  expect(seen).toBe(RETURN)
  expect(history.location.href).toBe(RETURN)
  held.resolve()
  expect(await screen.findByText('Você não autorizou o Conexus no Mercado Livre.')).toBeTruthy()
})

test.each([
  [
    'REFUSED',
    {
      result: 'REFUSED',
      connector: 'mercado-livre',
      native: { status: 400, code: 'invalid_operator_user_id', message: 'sem acesso', body: null },
    },
    'O Mercado Livre recusou a autorização.',
    'Mercado Livre respondeu 400, código invalid_operator_user_id: sem acesso',
  ],
  [
    'APP_REFUSED',
    {
      result: 'APP_REFUSED',
      connector: 'mercado-livre',
      native: { status: 401, code: 'invalid_client', message: null, body: null },
    },
    'O app do Conexus foi recusado pelo Mercado Livre. Avise o suporte.',
    'Mercado Livre respondeu 401, código invalid_client',
  ],
  [
    'UNREACHABLE',
    { result: 'UNREACHABLE', connector: 'mercado-livre', native: null },
    'O Mercado Livre não respondeu. Tente de novo em alguns minutos.',
    undefined,
  ],
] as const)(
  '%s: a frase com o nome do conector e o que ele respondeu',
  async (_, answer, sentence, said) => {
    hubOf({ end: () => HttpResponse.json(answer) })
    open(`?code=abc&state=${STATE}`)
    expect(await screen.findByText(sentence)).toBeTruthy()
    if (said) expect(screen.getByText(said)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voltar a Integrações' })).toBeTruthy()
  },
)

test.each([['CONNECTION_SIGN_IN_EXPIRED'], ['CONNECTION_ACCOUNT_ELSEWHERE']] as const)(
  '%s: a frase do Hub, com a volta a Integrações',
  async (code) => {
    hubOf({ end: () => refusal(code) })
    open(`?code=abc&state=${STATE}`)
    expect((await screen.findByRole('alert')).textContent).toBe(sentenceOfCode(code))
    expect(screen.getByRole('link', { name: 'Voltar a Integrações' })).toBeTruthy()
  },
)

test('o catálogo que não carrega na volta: a frase do Hub e "Tentar de novo", nunca o id do conector', async () => {
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE] }), {
    end: () => HttpResponse.json({ result: 'CANCELLED', connector: 'mercado-livre' }),
  })
  let failing = true
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
    ...hub.handlers,
  )
  open(`?error=access_denied&state=${STATE}`)
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  expect(screen.queryByText(/mercado-livre/)).toBeNull()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('Você não autorizou o Conexus no Mercado Livre.')).toBeTruthy()
})

test('NOT_FOUND (outra empresa): "Esse endereço não é de uma ligação."', async () => {
  hubOf({ end: () => refusal('NOT_FOUND') })
  open(`?code=abc&state=${STATE}`)
  expect(await screen.findByText('Esse endereço não é de uma ligação.')).toBeTruthy()
})

test('LINKED: abre a página da ligação, que testa sozinha', async () => {
  const connection = connectionOf({
    connector: 'mercado-livre',
    name: 'Loja 2',
    account: { label: 'PADARIASOL' },
  })
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE], connections: [connection] }), {
    end: () => HttpResponse.json({ result: 'LINKED', connection }),
  })
  server.use(...hub.handlers)
  open(`?code=abc&state=${STATE}`)
  expect(await screen.findByRole('heading', { name: 'Loja 2' })).toBeTruthy()
  expect(await screen.findByText(/ · conta PADARIASOL/)).toBeTruthy()
  expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
  expect(hub.sent.map((one) => one.path)).toContain(
    `/api/companies/${COMPANY.id}/connections/${connection.id}/test`,
  )
})

test('sessão vencida: o login leva o endereço inteiro e, depois de entrar, a ligação se completa', async () => {
  let signedIn = false
  const connection = connectionOf({ connector: 'mercado-livre', name: 'Loja 2' })
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE], connections: [connection] }), {
    end: () => HttpResponse.json({ result: 'LINKED', connection }),
  })
  server.use(
    sessionRead(() => (signedIn ? ANA : undefined)),
    ...hub.handlers,
    http.put('*/api/sessions/current', () => {
      signedIn = true
      return HttpResponse.json({ person: ANA })
    }),
  )
  const history = open(`?code=abc&state=${STATE}`)
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  const asked = new URLSearchParams(history.location.search).get('redirect')
  expect(asked).toBe(`${RETURN}?code=abc&state=${STATE}`)
  expect(hub.sent).toEqual([])
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Loja 2' })).toBeTruthy()
  expect(hub.sent[0]).toMatchObject({ body: { code: 'abc' } })
})
