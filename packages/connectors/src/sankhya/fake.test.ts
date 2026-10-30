import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import type { ProviderAnswer, ProviderRequest } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'

const GATEWAY = '/gateway/v1/mge/service.sbr'
const COUNT = { sql: 'SELECT COUNT(*) AS N FROM TSIEMP' }

async function send(request: Request): Promise<ProviderAnswer> {
  const response = await globalThis.fetch(request)
  const text = await response.text()
  return {
    status: response.status,
    body: text === '' ? undefined : z.unknown().parse(JSON.parse(text)),
  }
}

function door(requestBody: typeof COUNT): ProviderRequest {
  const serviceName = 'DbExplorerSP.executeQuery'
  return {
    method: 'POST',
    path: GATEWAY,
    query: { serviceName, outputType: 'json' },
    body: { serviceName, requestBody },
  }
}

function query(token: string, origin: string): Promise<ProviderAnswer> {
  return send(toRequest(sankhya, door(COUNT), token, origin))
}

function empresas(token: string, origin: string): Promise<ProviderAnswer> {
  const request: ProviderRequest = {
    method: 'GET',
    path: '/v1/empresas',
    query: { page: '0' },
    body: undefined,
  }
  return send(toRequest(sankhya, request, token, origin))
}

async function withToken(
  use: (origin: string, token: string, fake: ReturnType<typeof sankhyaFake>) => Promise<void>,
) {
  const fake = sankhyaFake()
  const server = await fake.serve()
  try {
    const login = readToken(
      sankhya.auth,
      await send(
        toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null, server.origin),
      ),
    )
    assert.equal(login.kind, 'OK')
    if (login.kind === 'OK') await use(server.origin, login.accessToken, fake)
  } finally {
    await server.close()
  }
}

test('um segundo pedido no mesmo token em curso recebe o envelope "4"; no REST, 409', async () => {
  await withToken(async (origin, token) => {
    const [first, second] = await Promise.all([query(token, origin), query(token, origin)])
    const statuses = z.object({ status: z.string() })
    assert.deepEqual([first, second].map((a) => statuses.parse(a.body).status).sort(), ['1', '4'])
    const rest = await Promise.all([empresas(token, origin), empresas(token, origin)])
    assert.deepEqual(rest.map((a) => a.status).sort(), [200, 409])
  })
})

test('os interruptores: recusa, token vencido, fora do esquema, acima de 2 MiB, redirecionamento', async () => {
  const [ready] = sankhya.operations
  assert.ok(ready)
  await withToken(async (origin, token, fake) => {
    fake.switches.refuse.add('empresas')
    assert.partialDeepStrictEqual(ready.answer(await empresas(token, origin)), {
      kind: 'REFUSED',
    })
    fake.switches.refuse.clear()
    fake.switches.malformed = true
    assert.partialDeepStrictEqual(ready.answer(await empresas(token, origin)), {
      kind: 'UNREADABLE',
    })
    fake.switches.malformed = false
    fake.switches.oversize = true
    const oversize = await empresas(token, origin)
    assert.ok(JSON.stringify(oversize.body).length > 2 * 1024 * 1024)
    assert.equal(ready.answer(oversize).kind, 'OK')
    fake.switches.oversize = false
    fake.switches.expireToken = true
    assert.partialDeepStrictEqual(ready.answer(await empresas(token, origin)), {
      kind: 'TOKEN_EXPIRED',
    })
    fake.switches.expireToken = false
    fake.switches.redirect = true
    await assert.rejects(empresas(token, origin))
    const refused = toRequest(sankhya, door(COUNT), token, origin)
    const followed = await send(new Request(refused, { redirect: 'follow' }))
    assert.equal(z.object({ status: z.string() }).parse(followed.body).status, '1')
    fake.switches.redirect = false
    assert.equal((await empresas(token, origin)).status, 200)
  })
})

test('os seis 403 que a documentação descreve vêm em mensagem.codigo, e as outras rotas com o code', async () => {
  const clientes = sankhya.operations.find((candidate) => candidate.id === 'clientes')
  const pedidos = sankhya.operations.find((candidate) => candidate.id === 'pedidos')
  assert.ok(clientes && pedidos)
  await withToken(async (origin, token, fake) => {
    function read(path: ProviderRequest['path'], query: Record<string, string>) {
      return send(
        toRequest(sankhya, { method: 'GET', path, query, body: undefined }, token, origin),
      )
    }
    fake.switches.expireToken = true
    const expired = await read('/v1/parceiros/clientes', { page: '0' })
    assert.deepEqual(expired.body, {
      mensagem: { codigo: 'GTW3403', descricao: 'Bearer Token inválido ou expirado' },
    })
    assert.partialDeepStrictEqual(clientes.answer(expired), { kind: 'TOKEN_EXPIRED' })
    const bare = await read('/v1/vendas/pedidos', { codigoEmpresa: '1', page: '0' })
    assert.deepEqual(bare.body, { code: 'GTW3403', message: 'Bearer Token inválido ou expirado' })
    assert.partialDeepStrictEqual(pedidos.answer(bare), { kind: 'TOKEN_EXPIRED' })
    fake.switches.expireToken = false
    fake.switches.refuse.add('clientes')
    const refused = await read('/v1/parceiros/clientes', { page: '0' })
    assert.deepEqual(refused.body, {
      mensagem: { codigo: 'NO_ACCESS', descricao: 'Sem permissão' },
    })
    assert.partialDeepStrictEqual(clientes.answer(refused), { kind: 'REFUSED' })
  })
})

test('a chave errada dá 401, e o servidor fechado recusa a conexão', async () => {
  const fake = sankhyaFake()
  const server = await fake.serve()
  const wrong = tokenRequest(sankhya.auth, { ...fake.credential, xToken: 'wrong' })
  assert.equal((await send(toRequest(sankhya, wrong, null, server.origin))).status, 401)
  await server.close()
  await assert.rejects(send(toRequest(sankhya, wrong, null, server.origin)))
})

test('o token vence como o Sankhya dá: o expires_in é o que o dublê configura', async () => {
  const fake = sankhyaFake()
  fake.switches.expiresInSeconds = 42
  const answer = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  assert.deepEqual(readToken(sankhya.auth, { status: answer.status, body: await answer.json() }), {
    kind: 'OK',
    accessToken: 'fake-token-1',
    expiresInSeconds: 42,
  })
  assert.equal(fake.logins(), 1)
})
