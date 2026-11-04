import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, codeOf } from '../../hub/identity/test-hub.ts'
import {
  automating,
  created as automation,
  ended,
  ranNow,
  salesSummary,
} from '../automations/test-automations.ts'
import { assisting, created } from './test-assistant.ts'

type Listed = { conversations: { id: string; title: string | null }[]; next: Next }
type Next = { kind: 'END' } | { kind: 'MORE'; page: string }

function idOf(url: string) {
  return url.slice(url.lastIndexOf('/') + 1)
}

async function titled(hub: Hub, person: Person, assistant: string, title: string, body: object) {
  const url = await created(hub, person, assistant, { connections: [], ...body })
  const renamed = await call(hub, person, 'PATCH', url, { title })
  assert.equal(renamed.statusCode, 200, renamed.body)
  return idOf(url)
}

async function idsOf(hub: Hub, person: Person, url: string) {
  return (await listed(hub, person, url)).conversations.map((each) => each.id)
}

async function listed(hub: Hub, person: Person, url: string): Promise<Listed> {
  const read = await call(hub, person, 'GET', url)
  assert.equal(read.statusCode, 200, read.body)
  return Object(read.json())
}

test('a busca: q acha pelo título sem acento nem caixa, a lista vazia é vazia, e q de mais de 100 caracteres é REQUEST_MALFORMED (8)', async (t) => {
  const on = await assisting(t)
  const report = await titled(on.hub, on.ana, on.assistant, 'Relatório de Outubro', {})
  const stock = await titled(on.hub, on.ana, on.assistant, 'Estoque parado', {})
  function at(q: string) {
    return `${on.assistant}?q=${encodeURIComponent(q)}`
  }
  assert.deepEqual(await idsOf(on.hub, on.ana, at('relatorio')), [report])
  assert.deepEqual(await idsOf(on.hub, on.ana, at('OUTUBRO')), [report])
  assert.deepEqual(await idsOf(on.hub, on.ana, at('  parado ')), [stock])
  assert.deepEqual(await idsOf(on.hub, on.ana, at('inexistente')), [])
  assert.deepEqual((await listed(on.hub, on.ana, at('inexistente'))).next, { kind: 'END' })
  const long = await call(on.hub, on.ana, 'GET', `${on.assistant}?q=${'a'.repeat(101)}`)
  assert.deepEqual([long.statusCode, codeOf(long)], [400, 'REQUEST_MALFORMED'])
})

test('o lugar: place=HOME lista as sem Projeto, projectId as do Projeto, e junto com q valem as duas (9)', async (t) => {
  const on = await assisting(t)
  const home = await titled(on.hub, on.ana, on.assistant, 'Pedidos da casa', {})
  const project = await titled(on.hub, on.ana, on.assistant, 'Pedidos do Projeto', {
    projectId: on.projectId,
  })
  function ids(query: string) {
    return idsOf(on.hub, on.ana, `${on.assistant}?${query}`)
  }
  assert.deepEqual(await ids('place=HOME'), [home])
  assert.deepEqual(await ids(`projectId=${on.projectId}`), [project])
  assert.deepEqual((await ids('q=pedidos')).sort(), [home, project].sort())
  assert.deepEqual(await ids('place=HOME&q=projeto'), [])
  assert.deepEqual(await ids(`projectId=${on.projectId}&q=projeto`), [project])
})

test('o lugar: place=AUTOMATIONS lista as conversas abertas por uma automação (9)', {
  timeout: 150_000,
}, async (t) => {
  const on = await automating(t)
  const mine = await titled(on.hub, on.ana, on.assistant, 'Uma conversa minha', {})
  const made = await automation(on.hub, on.ana, on.automations, salesSummary([]))
  const at = `${on.automations}/${made.id}`
  const run = await ended(on.hub, on.ana, at, await ranNow(on.hub, on.ana, at))
  const opened = String(run.state.conversationId)
  function ids(query: string) {
    return idsOf(on.hub, on.ana, `${on.assistant}?${query}`)
  }
  assert.deepEqual(await ids('place=AUTOMATIONS'), [opened])
  assert.deepEqual((await ids('place=HOME')).sort(), [mine, opened].sort())
})

test('a página: com busca o servidor pagina o resultado em 30, pelo mesmo token (9)', async (t) => {
  const on = await assisting(t)
  const urls: string[] = []
  for (let n = 0; n < 32; n += 1) {
    urls.push(await titled(on.hub, on.ana, on.assistant, `Pedido ${n}`, {}))
  }
  await titled(on.hub, on.ana, on.assistant, 'Outra coisa', {})
  const first = await listed(on.hub, on.ana, `${on.assistant}?q=pedido`)
  assert.equal(first.conversations.length, 30)
  assert.equal(first.next.kind, 'MORE')
  const token = first.next.kind === 'MORE' ? first.next.page : ''
  const second = await listed(on.hub, on.ana, `${on.assistant}?q=pedido&page=${token}`)
  assert.equal(second.conversations.length, 2)
  assert.deepEqual(second.next, { kind: 'END' })
  const seen = [...first.conversations, ...second.conversations].map((each) => each.id)
  assert.equal(new Set(seen).size, 32)
})
