import type { AppVersion } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  sentVersion,
  VERSIONS_PATH,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'
import { packed, picked } from './test-folder.ts'

const server = hubServer()
beforeEach(() => server.use(conversationsNone))
const SETTINGS = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}?lens=project&section=versions`
const GONE = 'Não confirmamos o envio. Tente de novo.'
const EMPTY = 'Nenhuma versão enviada. O endereço mostra o app de exemplo.'

function pick(files: File[]) {
  fireEvent.change(screen.getByLabelText('Pasta da versão', { selector: 'input' }), {
    target: { files },
  })
}

type Sent = { key: string | null; body: unknown }

/** The Settings of Pedidos with no version; each send is recorded and answered by `answer`. */
async function open(answer: (sent: Sent, count: number) => Response | Promise<Response>) {
  const view: { versions: AppVersion[] } = { versions: [] }
  const sent: Sent[] = []
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
    versionsRead(view),
    http.post(VERSIONS_PATH, async ({ request }) => {
      const one = { key: request.headers.get('idempotency-key'), body: await request.json() }
      sent.push(one)
      const response = await answer(one, sent.length)
      if (response.status === 201) view.versions = [versionView(1, { live: true })]
      return response
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />)
  await screen.findByText(EMPTY)
  return sent
}

async function live() {
  await waitFor(() => expect(screen.getByRole('list').textContent).toContain('Versão 1 · no ar'))
}

function accepted() {
  return sentVersion(versionView(1, { live: true }))
}

test('a pasta escolhida: nome, arquivos e tamanho; vai o manifesto e os outros arquivos', async () => {
  const sent = await open(accepted)
  pick(packed())
  expect(await screen.findByText('recados-1')).toBeTruthy()
  expect(screen.getByText(/3 arquivos · 1 KB/)).toBeTruthy()
  await live()
  expect(sent).toHaveLength(1)
  expect(sent[0]?.key).toBeTruthy()
  expect(sent[0]?.body).toEqual({
    manifest: { contract: 1 },
    files: [
      { path: 'worker.js', mediaType: 'text/javascript', base64: 'aGVsbG8=' },
      { path: 'assets/logo.png', mediaType: 'image/png', base64: 'cG5n' },
    ],
  })
})

test('na espera: "Enviando a versão…", sem a frase da lista vazia; no ar, a linha da pasta sai', async () => {
  const held = Promise.withResolvers<void>()
  await open(async () => {
    await held.promise
    return accepted()
  })
  pick(packed())
  expect(await screen.findByText('Enviando a versão…')).toBeTruthy()
  expect(screen.queryByText(EMPTY)).toBeNull()
  held.resolve()
  await live()
  expect(screen.queryByText('Enviando a versão…')).toBeNull()
  await waitFor(() => expect(screen.queryByText('recados-1')).toBeNull())
})

for (const [name, code, phrase] of [
  [
    '422',
    'APP_VERSION_INVALID',
    'A pasta não é uma versão do Conexus. Escolha a pasta montada pelo app.',
  ],
  ['413', 'APP_VERSION_TOO_LARGE', 'A versão passa de 10 MB ou de 1.000 arquivos.'],
  [
    '409',
    'APP_VERSION_SENDING',
    'Já tem uma versão sendo enviada neste Projeto. Espere ela terminar.',
  ],
] as const) {
  test(`${name} do Hub: a frase, sem "Tentar de novo"`, async () => {
    await open(() => refusal(code))
    pick(packed())
    expect((await screen.findByRole('alert')).textContent).toBe(phrase)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    expect(screen.queryByText(EMPTY)).toBeNull()
  })
}

test('sem manifest.json: recusa antes de enviar, com a frase de 422', async () => {
  const sent = await open(accepted)
  pick([picked('recados-1/worker.js', 'x')])
  expect((await screen.findByRole('alert')).textContent).toContain(
    'A pasta não é uma versão do Conexus.',
  )
  expect(sent).toHaveLength(0)
})

test('manifest.json que não é JSON: recusa antes de enviar', async () => {
  const sent = await open(accepted)
  pick([picked('recados-1/manifest.json', '{oops')])
  expect((await screen.findByRole('alert')).textContent).toContain(
    'A pasta não é uma versão do Conexus.',
  )
  expect(sent).toHaveLength(0)
})

test('mais de 1.000 arquivos: recusa antes de enviar, com a frase de 413', async () => {
  const sent = await open(accepted)
  // The packed folder holds two files the Hub keeps besides the manifest: 999 more make 1,001.
  const many = Array.from({ length: 999 }, (_, at) => picked(`recados-1/assets/${at}.txt`))
  pick([...packed(), ...many])
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A versão passa de 10 MB ou de 1.000 arquivos.',
  )
  expect(sent).toHaveLength(0)
})

test('mais de 10 MB: recusa antes de enviar', async () => {
  const sent = await open(accepted)
  const big = picked('recados-1/assets/big.bin')
  Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
  pick([...packed(), big])
  expect((await screen.findByRole('alert')).textContent).toContain('passa de 10 MB')
  expect(sent).toHaveLength(0)
})

test('502: "A versão não entrou." e "Tentar de novo" é um envio novo, com outra chave', async () => {
  const sent = await open((_, count) => (count === 1 ? refusal('APP_VERSION_FAILED') : accepted()))
  pick(packed())
  expect((await screen.findByRole('alert')).textContent).toBe('A versão não entrou. Tente de novo.')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await live()
  expect(sent).toHaveLength(2)
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
  expect(screen.queryByRole('alert')).toBeNull()
})

for (const [name, answer] of [
  ['corte', () => HttpResponse.error()],
  ['502 da borda', () => new HttpResponse('<html></html>', { status: 502 })],
  ['503 do banco', () => refusal('DATABASE_UNAVAILABLE')],
] as const) {
  test(`${name}: não confirmou, e "Tentar de novo" leva a mesma chave`, async () => {
    const sent = await open((_, count) => (count === 1 ? answer() : accepted()))
    pick(packed())
    expect((await screen.findByRole('alert')).textContent).toBe(GONE)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await live()
    expect(sent).toHaveLength(2)
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}

test('outra pasta depois de um corte: chave nova', async () => {
  const sent = await open((_, count) => (count === 1 ? HttpResponse.error() : accepted()))
  pick(packed())
  await screen.findByText(GONE)
  pick(packed('recados-2'))
  await live()
  await waitFor(() => expect(sent).toHaveLength(2))
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
  expect(screen.queryByRole('alert')).toBeNull()
})
