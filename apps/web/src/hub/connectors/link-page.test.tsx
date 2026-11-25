import type { Native } from '@conexus/hub-api'
import {
  answerConnectionLink,
  ConnectionLinkAnswered,
  ConnectionLinkPage,
  readConnectionLink,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { REFUSAL, SANKHYA } from './fixtures.ts'

const server = hubServer()
const SECRET = 'segredo-do-link'
const ADDRESS = `*/api/connection-links/${SECRET}`
const PAGE = ConnectionLinkPage.parse({
  askedBy: 'Ana Lima',
  company: 'Empresa Teste',
  system: { name: 'Sankhya', logo: SANKHYA.logo },
  fields: SANKHYA.fields.filter((field) => field.name !== 'clientId'),
})
const WORKING = ConnectionLinkAnswered.parse({ result: 'WORKING' })
const NATIVE: Native = { ...REFUSAL, body: null }

type Sent = { secret: string; body: unknown }

/** The Hub for a link: the page it reads, then what each send answers; `sent` lists the sends it received. */
function hub(answers: (() => Response | Promise<Response>)[] = [() => HttpResponse.json(WORKING)]) {
  const sent: Sent[] = []
  server.use(
    http.get(ADDRESS, () => HttpResponse.json(readConnectionLink.success.body.parse(PAGE))),
    http.post(ADDRESS, async ({ request }) => {
      sent.push({ secret: SECRET, body: await request.json() })
      const answer = answers.at(Math.min(sent.length, answers.length) - 1)
      return answer ? await answer() : refusal('INTERNAL_UNEXPECTED')
    }),
  )
  return sent
}

function open(secret = SECRET) {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/connection-links/${secret}`] }),
  )
  render(<Conexus conexus={conexus} />)
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function send() {
  type('Client Secret', 'segredo-plantado-2')
  type('X-Token', 'token-plantado-3')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
}

const GONE = 'Este link venceu ou já foi usado'

test('a página: quem pediu, o sistema, a empresa e só os campos pedidos, vazios, sem Desde e sem cabeçalho do Hub', async () => {
  hub()
  open()
  expect(await screen.findByRole('heading', { name: 'Acesso do Sankhya' })).toBeTruthy()
  expect(screen.getByText('Ana Lima pediu o acesso do Sankhya para Empresa Teste.')).toBeTruthy()
  expect(screen.getByLabelText<HTMLInputElement>('Client Secret').value).toBe('')
  expect(screen.getByLabelText<HTMLInputElement>('X-Token').value).toBe('')
  expect(screen.getByLabelText('Client Secret').getAttribute('type')).toBe('password')
  expect(screen.queryByLabelText('Client ID')).toBeNull()
  expect(screen.queryByLabelText('Desde')).toBeNull()
  expect(screen.queryByLabelText('Nome da ligação')).toBeNull()
  expect(screen.getByRole('button', { name: 'Enviar' })).toBeTruthy()
  expect(screen.queryByRole('navigation')).toBeNull()
  expect(screen.queryByRole('link', { name: /Integrações/ })).toBeNull()
})

test('o link gasto, vencido ou de segredo errado (404) mostra a frase do cartão e nenhum campo', async () => {
  server.use(http.get(ADDRESS, () => refusal('NOT_FOUND')))
  open()
  expect(await screen.findByRole('heading', { name: GONE })).toBeTruthy()
  expect(screen.getByText('Peça um novo a quem enviou.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
  expect(screen.queryByLabelText('Client Secret')).toBeNull()
})

test('enviar: "Testando a ligação…" enquanto espera; o pedido leva só os campos; o sucesso troca a página', async () => {
  const sent = hub([
    async () => {
      await delay(50)
      return HttpResponse.json(WORKING)
    },
  ])
  open()
  await screen.findByRole('heading', { name: 'Acesso do Sankhya' })
  send()
  expect(await screen.findByText('Testando a ligação…')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
  expect(await screen.findByRole('heading', { name: 'Pronto, o Sankhya está ligado' })).toBeTruthy()
  expect(sent).toEqual([
    {
      secret: SECRET,
      body: { fields: { clientSecret: 'segredo-plantado-2', xToken: 'token-plantado-3' } },
    },
  ])
  expect(screen.queryByLabelText('Client Secret')).toBeNull()
  expect(screen.queryByText(/segredo-plantado/)).toBeNull()
})

test('o sistema recusa: a resposta dele por extenso e os campos de novo, e um novo envio funciona', async () => {
  const sent = hub([
    () =>
      HttpResponse.json(
        answerConnectionLink.success.body.parse({ result: 'AUTH_REFUSED', native: NATIVE }),
      ),
    () => HttpResponse.json(WORKING),
  ])
  open()
  await screen.findByRole('heading', { name: 'Acesso do Sankhya' })
  send()
  expect(await screen.findByText('O Sankhya recusou as chaves')).toBeTruthy()
  expect(
    screen.getByText('Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela'),
  ).toBeTruthy()
  expect(screen.getByLabelText('Client Secret')).toBeTruthy()
  expect(screen.getByLabelText('X-Token')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(await screen.findByRole('heading', { name: 'Pronto, o Sankhya está ligado' })).toBeTruthy()
  expect(sent).toHaveLength(2)
})

test('campo vazio: a frase do campo e nada vai ao Hub', async () => {
  const sent = hub()
  open()
  await screen.findByRole('heading', { name: 'Acesso do Sankhya' })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(await screen.findByText('Cole Client Secret.')).toBeTruthy()
  expect(screen.getByText('Cole X-Token.')).toBeTruthy()
  expect(sent).toHaveLength(0)
})

test('o link gasto entre abrir e enviar (404 no envio) troca a página pela frase do cartão', async () => {
  hub([() => refusal('NOT_FOUND')])
  open()
  await screen.findByRole('heading', { name: 'Acesso do Sankhya' })
  send()
  expect(await screen.findByRole('heading', { name: GONE })).toBeTruthy()
  expect(screen.queryByLabelText('Client Secret')).toBeNull()
})

test('uma falha do Hub no envio fica na página, com a frase da falha, e os campos seguem', async () => {
  hub([() => refusal('DATABASE_UNAVAILABLE')])
  open()
  await screen.findByRole('heading', { name: 'Acesso do Sankhya' })
  send()
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
  expect(screen.getByLabelText('Client Secret')).toBeTruthy()
  expect(screen.queryByRole('heading', { name: GONE })).toBeNull()
})
