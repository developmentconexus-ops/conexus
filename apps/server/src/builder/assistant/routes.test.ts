import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { endOf, MODEL, started } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

type Listed = { conversations: { id: string; projectId: string | null }[]; next: Next }
type Next = { kind: 'END' } | { kind: 'MORE'; page: string }

function conversationOf(response: { json(): unknown }) {
  return Object(response.json()).conversation
}

function choiceOf(response: { json(): unknown }) {
  return conversationOf(response).connections.map((each: { name: string; chosen: boolean }) => [
    each.name,
    each.chosen,
  ])
}

test('criar: com o modelo padrão, só as ligações que o lugar oferece, no Projeto; a mesma chave dá a mesma conversa, e com outro lugar IDEMPOTENCY_CONFLICT', async (t) => {
  const on = await assisting(t)
  const key = randomUUID()
  const body = { projectId: on.projectId, connections: [on.matriz, on.filial] }
  const made = await post(on.hub, on.ana, on.assistant, body, key)
  assert.equal(made.statusCode, 201, made.body)
  const conversation = conversationOf(made)
  assert.equal(conversation.model, MODEL)
  assert.equal(conversation.projectId, on.projectId)
  assert.deepEqual(choiceOf(made), [['Matriz', true]])
  // The Filial released after the creation (a Projeto reads one connection per system) was not kept
  // as chosen: the conversation keeps only what its place offered then.
  const grants = `${on.company}/projects/${on.projectId}/connections`
  assert.equal((await call(on.hub, on.ana, 'DELETE', `${grants}/${on.matriz}`)).statusCode, 204)
  assert.equal((await call(on.hub, on.ana, 'PUT', `${grants}/${on.filial}`)).statusCode, 200)
  const read = await call(on.hub, on.ana, 'GET', `${on.assistant}/${conversation.id}`)
  assert.deepEqual(choiceOf(read), [['Filial', false]])
  const again = await post(on.hub, on.ana, on.assistant, body, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.equal(conversationOf(again).id, conversation.id)
  // The same key with another place is another attempt: refused, the conversation as it was.
  const elsewhere = await post(on.hub, on.ana, on.assistant, { connections: [] }, key)
  assert.equal(elsewhere.statusCode, 409, elsewhere.body)
  assert.equal(codeOf(elsewhere), 'IDEMPOTENCY_CONFLICT')
  const listed: Listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json())
  assert.deepEqual(
    listed.conversations.map((each) => each.id),
    [conversation.id],
  )
  assert.ok(
    on.lines.some((line) => line.message === 'ASSISTANT_CONVERSATION_CREATED'),
    'the creation is logged',
  )
})

test('criar: um modelo sem conta, um Projeto de outra empresa, apagado ou marcado, e o membro não criam nada', async (t) => {
  const on = await assisting(t)
  const noAccount = await post(on.hub, on.ana, on.assistant, {
    model: 'openai/gpt-5.4',
    connections: [],
  })
  assert.equal(noAccount.statusCode, 422, noAccount.body)
  assert.equal(codeOf(noAccount), 'MODEL_NO_ACCOUNT')

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const otherCompany = await plantCompany(on.hub.test, carla.id, 'Outra')
  const theirs = await post(on.hub, carla, `/api/companies/${otherCompany}/projects`, {
    name: 'Deles',
  })
  assert.equal(theirs.statusCode, 201, theirs.body)
  const foreign = String(Object(theirs.json()).project.id)
  const marked = String(
    Object((await post(on.hub, on.ana, `${on.company}/projects`, { name: 'Indo' })).json()).project
      .id,
  )
  await on.hub.test.asOwner('update projects.project set deleting_since = now() where id = $1', [
    marked,
  ])
  for (const projectId of [foreign, marked, 'projectA2AAAAAAAAAAAAAAAAAAAAAAA']) {
    const refused = await post(on.hub, on.ana, on.assistant, { projectId, connections: [] })
    assert.equal(refused.statusCode, 404, refused.body)
    assert.equal(codeOf(refused), 'NOT_FOUND')
  }
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const member = await post(on.hub, bruno, on.assistant, { connections: [] })
  assert.equal(member.statusCode, 404, member.body)
  const listed: Listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json())
  assert.deepEqual(listed.conversations, [])
})

test('trocar as ligações: a resposta diz as que ficaram, só as que o lugar oferece; de outra pessoa ou inexistente, CONVERSATION_NOT_FOUND; o membro, NOT_FOUND', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const changed = await call(on.hub, on.ana, 'PUT', `${url}/connections`, {
    connections: [on.filial, randomUUID()],
  })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.deepEqual(choiceOf(changed), [
    ['Matriz', false],
    ['Filial', true],
  ])
  assert.equal(conversationOf(changed).projectId, null)
  assert.deepEqual(choiceOf(await call(on.hub, on.ana, 'GET', url)), [
    ['Matriz', false],
    ['Filial', true],
  ])
  assert.ok(on.lines.some((line) => line.message === 'ASSISTANT_CONNECTIONS_CHANGED'))

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const missing = `${on.assistant}/${randomUUID()}`
  for (const [person, at] of [
    [carla, url],
    [on.ana, missing],
  ] as const) {
    const refused = await call(on.hub, person, 'PUT', `${at}/connections`, { connections: [] })
    assert.equal(refused.statusCode, 404, refused.body)
    assert.equal(codeOf(refused), 'CONVERSATION_NOT_FOUND')
  }
  const notMade = await call(on.hub, on.ana, 'GET', missing)
  assert.equal(codeOf(notMade), 'CONVERSATION_NOT_FOUND')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const member = await call(on.hub, bruno, 'PUT', `${url}/connections`, { connections: [] })
  assert.equal(codeOf(member), 'NOT_FOUND')
})

test('a lista: só as da pessoa, as mais novas primeiro, por Projeto; mais de 30 em páginas sem repetir nem pular; uma página adulterada, NOT_FOUND', async (t) => {
  const on = await assisting(t)
  const made: string[] = []
  for (let n = 0; n < 32; n += 1) {
    const body = n % 2 === 0 ? { projectId: on.projectId, connections: [] } : { connections: [] }
    made.push((await created(on.hub, on.ana, on.assistant, body)).split('/').at(-1) ?? '')
  }
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  await created(on.hub, carla, on.assistant, { connections: [] })

  const first: Listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json())
  assert.equal(first.conversations.length, 30)
  assert.equal(first.next.kind, 'MORE')
  const page = first.next.kind === 'MORE' ? first.next.page : ''
  const second: Listed = Object(
    (await call(on.hub, on.ana, 'GET', `${on.assistant}?page=${page}`)).json(),
  )
  assert.deepEqual(second.next, { kind: 'END' })
  assert.deepEqual(
    [...first.conversations, ...second.conversations].map((each) => each.id),
    [...made].reverse(),
  )
  const inProject: Listed = Object(
    (await call(on.hub, on.ana, 'GET', `${on.assistant}?projectId=${on.projectId}`)).json(),
  )
  assert.equal(inProject.conversations.length, 16)
  assert.ok(inProject.conversations.every((each) => each.projectId === on.projectId))

  const tampered = await call(on.hub, on.ana, 'GET', `${on.assistant}?page=${page}x`)
  assert.equal(codeOf(tampered), 'NOT_FOUND')
  const builder = await started(on.hub, on.ana, on.conversations)
  const again: Listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json())
  assert.ok(again.conversations.every((each) => each.id !== builder))
  const asBuilders = await call(on.hub, on.ana, 'GET', `${on.assistant}/${builder}`)
  assert.equal(codeOf(asBuilders), 'CONVERSATION_NOT_FOUND')
})

test('uma conversa e o que escolher: cada ligação do lugar com a escolha; uma conversa nova pode escolher tudo o que o lugar oferece; o membro, NOT_FOUND', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  assert.deepEqual(choiceOf(await call(on.hub, on.ana, 'GET', url)), [['Matriz', false]])
  const offered = `${on.company}/assistant/connections`
  const home = await call(on.hub, on.ana, 'GET', offered)
  assert.deepEqual(
    Object(home.json()).connections.map((each: { name: string }) => each.name),
    ['Matriz', 'Filial'],
  )
  const project = await call(on.hub, on.ana, 'GET', `${offered}?projectId=${on.projectId}`)
  assert.deepEqual(
    Object(project.json()).connections.map((each: { name: string }) => each.name),
    ['Matriz'],
  )
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  for (const at of [url, offered, on.assistant]) {
    assert.equal(codeOf(await call(on.hub, bruno, 'GET', at)), 'NOT_FOUND', at)
  }
})

test('uma escolha guardada que não se lê não escolhe nada: a conversa fica sem ligação escolhida', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const id = url.slice(url.lastIndexOf('/') + 1)
  const threads = 'mastra.mastra_threads'
  const [row] = (
    await on.hub.test.mastraPool.query(`select metadata from ${threads} where id = $1`, [id])
  ).rows
  const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
  const broken = JSON.stringify({ ...metadata, conexusConnections: [on.matriz, 42] })
  await on.hub.test.mastraPool.query(`update ${threads} set metadata = $2 where id = $1`, [
    id,
    broken,
  ])
  assert.deepEqual(choiceOf(await call(on.hub, on.ana, 'GET', url)), [
    ['Matriz', false],
    ['Filial', false],
  ])
})

const FILE_TURN = [[write('relatorio.csv', 'a;b\n1;2\n')], [said('Escrevi.')]]

function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}

function fileOf(url: string, path: string) {
  return `${url}/files?${new URLSearchParams({ path })}`
}

/** The provider holds the conversation's machine, as E2B does after the turn: a download finds it by its name. */
function provided(
  on: { hub: { assistantMachines: { control: { discoverable: string[] } } } },
  url: string,
) {
  on.hub.assistantMachines.control.discoverable.push(
    `conexus-${INSTALLATION}-${url.slice(url.lastIndexOf('/') + 1)}`,
  )
}

/** A conversation of Ana's in which the model wrote `relatorio.csv` on its machine. */
async function withFile(t: TestContext) {
  const on = await assisting(t, FILE_TURN)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  provided(on, url)
  return { ...on, url }
}

test('o arquivo: o dono baixa os bytes com o tipo, Content-Disposition, nosniff e CSP sandbox (20)', async (t) => {
  const on = await withFile(t)
  const got = await call(on.hub, on.ana, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, 'a;b\n1;2\n')
  assert.equal(got.headers['content-type'], 'text/csv')
  assert.equal(got.headers['content-disposition'], "attachment; filename*=UTF-8''relatorio.csv")
  assert.equal(got.headers['x-content-type-options'], 'nosniff')
  assert.equal(got.headers['content-security-policy'], 'sandbox')
})

test('o arquivo: o que o modelo escreveu como imagem abre no lugar, e ainda sob sandbox (20)', async (t) => {
  const on = await assisting(t, [
    [write('grafico.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Desenhe')), 'complete')
  provided(on, url)
  const got = await call(on.hub, on.ana, 'GET', fileOf(url, 'grafico.svg'))
  assert.equal(got.headers['content-type'], 'image/svg+xml')
  assert.match(String(got.headers['content-disposition']), /^inline;/)
  assert.equal(got.headers['content-security-policy'], 'sandbox')
})

test('o arquivo: de outra pessoa, do membro ou de conversa que não existe, CONVERSATION_NOT_FOUND ou NOT_FOUND; fora da pasta ou inexistente, FILE_NOT_FOUND (20)', async (t) => {
  const on = await withFile(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const other = await call(on.hub, carla, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])
  const member = await call(on.hub, bruno, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(member.statusCode, 404)
  assert.equal(codeOf(member), 'NOT_FOUND')
  const nowhere = `${on.assistant}/${randomUUID()}`
  assert.equal(
    codeOf(await call(on.hub, on.ana, 'GET', fileOf(nowhere, 'a.csv'))),
    'CONVERSATION_NOT_FOUND',
  )
  for (const path of ['../fora.csv', '/etc/hostname', 'nao-existe.csv', '.']) {
    const refused = await call(on.hub, on.ana, 'GET', fileOf(on.url, path))
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'FILE_NOT_FOUND'], path)
  }
  assert.equal((await call(on.hub, on.ana, 'GET', `${on.url}/files`)).statusCode, 400)
})

test('o arquivo: acima do teto, FILE_TOO_LARGE; a máquina perdida, FILE_GONE; a que não liga, MACHINE_UNAVAILABLE (20)', async (t) => {
  const big = await assisting(t, [
    [
      tool('mastra_workspace_execute_command', {
        command: 'head -c 67108865 /dev/zero > grande.bin',
      }),
    ],
    [said('Escrevi.')],
  ])
  const bigUrl = await created(big.hub, big.ana, big.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, big.hub, big.ana, bigUrl)).say('Escreva')), 'complete')
  provided(big, bigUrl)
  const tooLarge = await call(big.hub, big.ana, 'GET', fileOf(bigUrl, 'grande.bin'))
  assert.deepEqual([tooLarge.statusCode, codeOf(tooLarge)], [413, 'FILE_TOO_LARGE'])
  // The machine the files were written on is gone: the provider makes a new, empty one.
  big.hub.assistantMachines.control.discoverable.length = 0
  const gone = await call(big.hub, big.ana, 'GET', fileOf(bigUrl, 'grande.bin'))
  assert.deepEqual([gone.statusCode, codeOf(gone)], [410, 'FILE_GONE'])

  const down = await withFile(t)
  down.hub.assistantMachines.control.start = 'unreachable'
  const unavailable = await call(down.hub, down.ana, 'GET', fileOf(down.url, 'relatorio.csv'))
  assert.deepEqual([unavailable.statusCode, codeOf(unavailable)], [503, 'MACHINE_UNAVAILABLE'])
})
