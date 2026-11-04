import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  personOn,
  post,
} from '../../hub/identity/test-hub.ts'
import { agentsOn, otherProject } from '../agents/test-agents.ts'
import {
  endOf,
  holding,
  hubBeside,
  MODEL,
  PARTIAL,
  sent,
  sessionUrl,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { sessionStateOf } from '../conversation/test-questions.ts'
import { CONSTRUTOR_MARK } from './open.ts'
import { kept, opened } from './test-construtor.ts'

type Listed = { conversations: { id: string }[] }

test('abrir e listar: 201, a mesma chave acha a mesma conversa, a lista é só da pessoa e do Projeto, e a chave com outro Projeto dá IDEMPOTENCY_CONFLICT', async (t) => {
  const on = await agentsOn(t)
  const key = randomUUID()
  const url = await opened(on, key)
  assert.equal(await opened(on, key), url)
  const other = await otherProject(on.hub, on.ana, on.company, [on.matriz], 'Outro')
  const elsewhere = `${on.company}/projects/${other.projectId}/construtor/conversations`
  const conflict = await post(on.hub, on.ana, elsewhere, {}, key)
  assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
  const there = await post(on.hub, on.ana, elsewhere, {}, randomUUID())
  assert.equal(there.statusCode, 201, there.body)

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  await post(on.hub, carla, url.slice(0, url.lastIndexOf('/')), {}, randomUUID())
  const base = url.slice(0, url.lastIndexOf('/'))
  const listed: Listed = Object((await call(on.hub, on.ana, 'GET', base)).json())
  assert.deepEqual(
    listed.conversations.map((each) => each.id),
    [url.slice(url.lastIndexOf('/') + 1)],
  )
  const theirs: Listed = Object((await call(on.hub, on.ana, 'GET', elsewhere)).json())
  assert.equal(theirs.conversations.length, 1)
})

test('recusas: o membro não abre nem lista, e sem conta de modelo a conversa não nasce', async (t) => {
  const on = await agentsOn(t)
  const base = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const member = await memberOn(on.hub, on.companyId, CARLA, 'member')
  for (const refused of [
    await post(on.hub, member, base, {}, randomUUID()),
    await call(on.hub, member, 'GET', base),
  ]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  await on.hub.test.asOwner('delete from builder.model_account')
  const noAccount = await post(on.hub, on.ana, base, {}, randomUUID())
  assert.deepEqual([noAccount.statusCode, codeOf(noAccount)], [422, 'MODEL_NO_ACCOUNT'])
})

test('a remoção: tirar a pessoa leva as conversas dela, apagar o Projeto leva as de todas, e remover a empresa as da empresa', async (t) => {
  const on = await agentsOn(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const base = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const ana = await opened(on)
  const made = await post(on.hub, carla, base, {}, randomUUID())
  const theirs = `${base}/${String(Object(made.json()).conversation.id)}`
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual([await kept(on, ana), await kept(on, theirs)], [true, false])
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.company}/projects/${on.projectId}`, {
    name: 'Encomendas',
  })
  assert.equal(gone.statusCode, 204, gone.body)
  assert.equal(await kept(on, ana), false)

  const again = await agentsOn(t)
  const here = await opened(again)
  const operator = await personOn(again.hub, {
    name: 'Olga Souza',
    email: 'olga@example.test',
    role: 'admin',
  })
  await again.hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [again.companyId],
  )
  const deleted = await call(again.hub, operator, 'DELETE', `/api/clients/${again.companyId}`, {
    name: 'Empresa Teste',
    revision: 0,
  })
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.equal(await kept(again, here), false)
})

test('a atualização: no settle, o turno do Construtor termina antes do fim e uma conversa nova recebe HUB_UPDATING', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const on = await agentsOn(t, (asked) => title(asked) ?? held.reply)
  const stopping = await hubBeside(t, on.hub)
  const url = await opened({ ...on, hub: stopping })
  const other = await opened({ ...on, hub: stopping })
  const stream = await streamOf(stopping, on.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, on.ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const stopped = stopping.close(30_000)
  const refused = await sent(stopping, on.ana, other, 'Outra pergunta')
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'HUB_UPDATING'])
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  await stopped
})

test('o guarda: as seis rotas servem o controlador construtor ao dono enquanto ele gerencia agentes; a de outra pessoa, a de outro controlador e a de quem virou membro dão CONVERSATION_NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const mine = await opened(on)
  const id = mine.slice(mine.lastIndexOf('/') + 1)
  function transcript(controller: string): string {
    return `${sessionUrl(mine).replace('/construtor/', `/${controller}/`)}/threads/${id}/messages`
  }
  const read = await call(on.hub, on.ana, 'GET', sessionUrl(mine))
  assert.equal(read.statusCode, 200, read.body)
  assert.equal((await call(on.hub, on.ana, 'GET', transcript('construtor'))).statusCode, 200)
  for (const crossed of [transcript('agents'), transcript('assistant'), transcript('builder')]) {
    assert.equal(codeOf(await call(on.hub, on.ana, 'GET', crossed)), 'CONVERSATION_NOT_FOUND')
  }
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const hers = await opened({ ...on, ana: carla })
  const foreign = await post(on.hub, on.ana, `${sessionUrl(hers)}/messages`, { message: 'Oi' })
  assert.equal(codeOf(foreign), 'CONVERSATION_NOT_FOUND')
  await on.hub.test.asOwner(
    `update auth.member set role = 'member' where user_id = $1 and company_id = $2`,
    [carla.id, on.companyId],
  )
  const demoted = await call(on.hub, carla, 'GET', sessionUrl(hers))
  assert.deepEqual([demoted.statusCode, codeOf(demoted)], [404, 'CONVERSATION_NOT_FOUND'])
})

test('o modelo: a conversa nasce no modelo e no esforço escolhidos, e a troca vale para a conversa', async (t) => {
  const on = await agentsOn(t)
  const base = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const made = await post(on.hub, on.ana, base, { model: MODEL, effort: 'high' }, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  const url = `${base}/${String(Object(made.json()).conversation.id)}`
  assert.deepEqual(await sessionStateOf(on.hub, on.ana, url), {
    model: MODEL,
    effort: 'high',
    tasks: [],
  })
  const switched = await call(on.hub, on.ana, 'PUT', `${url}/model`, {
    model: MODEL,
    effort: 'off',
  })
  assert.deepEqual([switched.statusCode, switched.json()], [200, { model: MODEL, effort: 'off' }])
  assert.deepEqual(await sessionStateOf(on.hub, on.ana, url), {
    model: MODEL,
    effort: 'off',
    tasks: [],
  })
})

test('o modelo: depois de um reinício a troca recupera a sessão com as marcas da abertura, e a conversa segue do Projeto', async (t) => {
  const on = await agentsOn(t)
  const base = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const made = await post(on.hub, on.ana, base, {}, randomUUID())
  const url = `${base}/${String(Object(made.json()).conversation.id)}`
  const restarted = await hubBeside(t, on.hub)
  const switched = await call(restarted, on.ana, 'PUT', `${url}/model`, {
    model: MODEL,
    effort: 'off',
  })
  assert.equal(switched.statusCode, 200, switched.body)
  const id = url.slice(url.lastIndexOf('/') + 1)
  const session = await restarted.mastra.getAgentController('construtor')?.getSession(id)
  assert.ok(session)
  assert.equal(session.getTags()[CONSTRUTOR_MARK.project], on.projectId)
})

test('o modelo: sem conta, desconhecido ou com esforço que o modelo não tem, recusa e nada muda; de outra pessoa ou inexistente, CONVERSATION_NOT_FOUND; o membro, NOT_FOUND', async (t) => {
  const on = await agentsOn(t)
  const base = `${on.company}/projects/${on.projectId}/construtor/conversations`
  const url = await opened(on)
  const before = await sessionStateOf(on.hub, on.ana, url)
  const refusals = [
    [{ model: 'openai/gpt-5.4', effort: 'off' }, 422, 'MODEL_NO_ACCOUNT'],
    [{ model: 'nada/nenhum', effort: 'off' }, 422, 'MODEL_UNKNOWN'],
    [{ model: MODEL, effort: 'xhigh' }, 422, 'EFFORT_UNSUPPORTED'],
  ] as const
  for (const [body, status, code] of refusals) {
    const refused = await call(on.hub, on.ana, 'PUT', `${url}/model`, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [status, code], refused.body)
  }
  assert.deepEqual(await sessionStateOf(on.hub, on.ana, url), before, 'a refusal changes nothing')
  const born = await post(on.hub, on.ana, base, { model: MODEL, effort: 'xhigh' }, randomUUID())
  assert.deepEqual([born.statusCode, codeOf(born)], [422, 'EFFORT_UNSUPPORTED'])

  const body = { model: MODEL, effort: 'off' }
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const missing = `${base}/${randomUUID()}`
  for (const [person, at] of [
    [carla, url],
    [on.ana, missing],
  ] as const) {
    const refused = await call(on.hub, person, 'PUT', `${at}/model`, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'CONVERSATION_NOT_FOUND'])
  }
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const member = await call(on.hub, bruno, 'PUT', `${url}/model`, body)
  assert.deepEqual([member.statusCode, codeOf(member)], [404, 'NOT_FOUND'])
})
