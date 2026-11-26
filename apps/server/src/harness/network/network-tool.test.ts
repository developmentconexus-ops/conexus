import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { NetworkAnswer } from '@conexus/hub-api'
import { said, talking } from '../../agents/assistant/test-assistant.ts'
import { BRUNO, CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { endOf, sessionUrl, started } from '../routes/test-conversation.ts'
import { DAVI } from './test-network.ts'
import {
  BOTH,
  cardIn,
  cardsIn,
  notOpen,
  opening,
  REASON,
  request,
  resultIn,
  WRITE,
  withBase,
} from './test-network-tool.ts'

test('o que já está liberado abre sem cartão: o nome igual, a estrela que o cobre e a lista pronta; a máquina ligada toma a lista, e a troca que falha responde NOT_OPEN (13)', async (t) => {
  const asked = ['api.example.com', 'a.b.cdn.example.com', '*.img.cdn.example.com', 'github.com']
  const steps = [
    [WRITE],
    [said('Escrevi.')],
    [request(asked)],
    [said('Abriu.')],
    [request(['api.example.com'])],
    [said('Não aplicou.')],
  ]
  const on = await opening(t, steps)
  const talk = await on.conversation()
  assert.equal(endOf(await talk.say('Escreva a.txt')), 'complete')
  await on.allow('api.example.com')
  await on.allow('*.cdn.example.com')

  const events = await talk.say('Abra os endereços')
  assert.deepEqual(cardsIn(events), [])
  assert.deepEqual(resultIn(events)?.result, { kind: 'OPEN', domains: asked, scope: 'ALREADY' })
  assert.deepEqual(on.applied(), withBase('*.cdn.example.com', 'api.example.com'))
  assert.match(on.modelRead(), /Open to your machine, already allowed/)

  on.control.openFails = 1
  const failed = await talk.say('De novo')
  assert.deepEqual(cardsIn(failed), [])
  assert.deepEqual(resultIn(failed)?.result, notOpen('MACHINE_UNAVAILABLE', ['api.example.com']))
})

test('o cartão e as três respostas: só os domínios que faltam, num cartão; conversa e empresa gravam cada uma na sua lista, recusar não grava, e o liberado chega à máquina no mesmo turno (14)', async (t) => {
  const asked = ['api.example.com', 'loja.example.com', '*.cdn.example.com']
  const missing = ['loja.example.com', '*.cdn.example.com']
  const rounds = ['CONVERSATION', 'REFUSED', 'COMPANY'] as const
  const steps = rounds.flatMap(() => [
    [WRITE],
    [said('Escrevi.')],
    [request(asked)],
    [said('Respondido.')],
  ])
  const on = await opening(t, steps)
  await on.allow('api.example.com')

  async function round(scope: NetworkAnswer['scope']) {
    const talk = await on.conversation()
    assert.equal(endOf(await talk.say('Escreva a.txt')), 'complete')
    const card = cardIn(await talk.say('Leia a loja'))
    assert.deepEqual(card.suspendPayload, { domains: missing, reason: REASON, scopes: BOTH })
    const events = await talk.answer(card.toolCallId, scope)
    assert.equal(endOf(events), 'complete')
    return { talk, result: resultIn(events)?.result }
  }

  const here = await round('CONVERSATION')
  assert.deepEqual(here.result, { kind: 'OPEN', domains: missing, scope: 'CONVERSATION' })
  assert.deepEqual(await on.lists(), {
    company: [{ domain: 'api.example.com' }],
    conversation: [...missing].sort().map((domain) => ({ conversation_id: here.talk.id, domain })),
  })
  assert.deepEqual(on.applied(), withBase('api.example.com', ...missing))
  assert.match(on.modelRead(), /allowed for this conversation: loja\.example\.com, \*\.cdn/)

  await on.hub.test.asOwner('delete from builder.conversation_network_domain')
  const refused = await round('REFUSED')
  assert.deepEqual(refused.result, { kind: 'REFUSED', domains: missing })
  assert.deepEqual(await on.lists(), {
    company: [{ domain: 'api.example.com' }],
    conversation: [],
  })
  assert.match(on.modelRead(), /The person refused/)

  const company = await round('COMPANY')
  assert.deepEqual(company.result, { kind: 'OPEN', domains: missing, scope: 'COMPANY' })
  assert.deepEqual(await on.lists(), {
    company: ['*.cdn.example.com', 'api.example.com', 'loja.example.com'].map((domain) => ({
      domain,
    })),
    conversation: [],
  })
  assert.deepEqual(on.applied(), withBase('api.example.com', ...missing))
})

test('o cartão e as três respostas: o desenvolvedor recebe o cartão só com a conversa, e a resposta grava só nela (14)', async (t) => {
  const on = await opening(t, [[request(['loja.example.com'])], [said('Abriu.')]])
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const talk = await on.conversation(carla)
  const card = cardIn(await talk.say('Leia a loja'))
  assert.deepEqual(card.suspendPayload, {
    domains: ['loja.example.com'],
    reason: REASON,
    scopes: ['CONVERSATION'],
  })
  await talk.answer(card.toolCallId, 'CONVERSATION')
  assert.deepEqual(await on.lists(), {
    company: [],
    conversation: [{ conversation_id: talk.id, domain: 'loja.example.com' }],
  })
})

test('o papel é lido de novo na resposta: quem perdeu o papel entre o cartão e a resposta, e o desenvolvedor que responde empresa, não liberam nada (15)', async (t) => {
  const asked = request(['loja.example.com'])
  const on = await opening(t, [[asked], [said('Não abriu.')], [asked], [said('Não abriu.')]])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const lost = await on.conversation(bruno)
  const first = cardIn(await lost.say('Leia a loja'))
  await on.hub.test.asOwner(`update auth.member set role = 'member' where user_id = $1`, [bruno.id])
  const refused = await lost.answer(first.toolCallId, 'CONVERSATION')
  assert.deepEqual(resultIn(refused)?.result, notOpen('ROLE'))

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const theirs = await on.conversation(carla)
  const second = cardIn(await theirs.say('Leia a loja'))
  const asCompany = await theirs.answer(second.toolCallId, 'COMPANY')
  assert.deepEqual(resultIn(asCompany)?.result, notOpen('ROLE'))
  assert.deepEqual(await on.lists(), { company: [], conversation: [] })
})

test('sem cartão para membro e automação: o membro recebe NOT_OPEN com os domínios que faltam, e o modelo lê onde se liberam (16)', async (t) => {
  const asked = ['api.example.com', 'loja.example.com']
  const on = await opening(t, [[request(asked)], [said('Peça ao dono.')]])
  await on.allow('api.example.com')
  const davi = await memberOn(on.hub, on.companyId, DAVI, 'member')
  const events = await (await on.conversation(davi)).say('Leia a loja')
  assert.deepEqual(cardsIn(events), [])
  assert.deepEqual(resultIn(events)?.result, notOpen('ROLE'))
  assert.match(on.modelRead(), /Configurações, Internet/)
})

test('a internet toda abre sem cartão: nada se grava, a máquina ligada passa a alcançar o domínio, e a troca que falha responde NOT_OPEN (30)', async (t) => {
  const asked = request(['loja.example.com'])
  const on = await opening(t, [
    [WRITE],
    [said('Escrevi.')],
    [asked],
    [said('Abriu.')],
    [asked],
    [said('Não aplicou.')],
  ])
  const talk = await on.conversation()
  assert.equal(endOf(await talk.say('Escreva a.txt')), 'complete')
  await on.openAll()
  assert.deepEqual(on.applied(), withBase())

  const events = await talk.say('Leia a loja')
  assert.deepEqual(cardsIn(events), [])
  assert.deepEqual(resultIn(events)?.result, {
    kind: 'OPEN',
    domains: ['loja.example.com'],
    scope: 'ALREADY',
  })
  assert.equal(on.applied(), 'ALL')
  assert.deepEqual(await on.lists(), { company: [], conversation: [] })

  on.control.openFails = 1
  const failed = await talk.say('De novo')
  assert.deepEqual(resultIn(failed)?.result, notOpen('MACHINE_UNAVAILABLE'))
})

test('o `resumeData` escrito pelo modelo é recusado: não abre domínio, não suspende e não grava (36)', async (t) => {
  const forged = request(['loja.example.com'], { resumeData: { scope: 'COMPANY' } })
  const on = await opening(t, [[forged], [said('Não deu.')]])
  const events = await (await on.conversation()).say('Leia a loja')
  assert.deepEqual(cardsIn(events), [])
  assert.equal(resultIn(events)?.isError, true)
  assert.match(on.modelRead(), /`resumeData` is not an argument of this tool/)
  assert.deepEqual(await on.lists(), { company: [], conversation: [] })
})

test('a máquina que não toma a lista depois da liberação responde NOT_OPEN, com a liberação gravada (14)', async (t) => {
  const on = await opening(t, [
    [WRITE],
    [said('Escrevi.')],
    [request(['loja.example.com'])],
    [said('Tente de novo.')],
  ])
  const talk = await on.conversation()
  assert.equal(endOf(await talk.say('Escreva a.txt')), 'complete')
  const card = cardIn(await talk.say('Leia a loja'))
  on.control.openFails = 1
  const events = await talk.answer(card.toolCallId, 'CONVERSATION')
  assert.deepEqual(resultIn(events)?.result, notOpen('MACHINE_UNAVAILABLE'))
  assert.equal((await on.lists()).conversation.length, 1)
})

test('a lista morre com a conversa: o Apagar do Assistente e a remoção do Projeto levam a lista, e a conversa nova do mesmo dono pede de novo (17)', async (t) => {
  const asked = request(['loja.example.com'])
  const on = await opening(t, [
    [asked],
    [said('Abriu.')],
    [asked],
    [said('Abriu.')],
    [asked],
    [said('Pronto.')],
  ])
  const first = await on.conversation()
  await first.answer(cardIn(await first.say('Leia a loja')).toolCallId, 'CONVERSATION')

  const id = await started(on.hub, on.ana, on.conversations)
  const url = `${on.conversations}/${id}`
  const builder = await talking(t, on.hub, on.ana, url)
  const card = cardIn(await builder.say('Leia a loja'))
  const answer = { toolCallId: card.toolCallId, resumeData: { scope: 'CONVERSATION' } }
  const answered = await post(on.hub, on.ana, `${sessionUrl(url)}/tool-suspension`, answer)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(endOf(await builder.stream.turn()), 'complete')

  async function listed() {
    const rows = await on.hub.test.asOwner(
      'select conversation_id from builder.conversation_network_domain',
    )
    return rows.map((row) => String(row['conversation_id'])).sort()
  }
  assert.deepEqual(await listed(), [first.id, id].sort())

  const deleted = await call(on.hub, on.ana, 'DELETE', first.url)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await listed(), [id])
  const second = await on.conversation()
  cardIn(await second.say('Leia a loja'))

  const project = `/api/companies/${on.companyId}/projects/${on.projectId}`
  const gone = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(gone.statusCode, 204, gone.body)
  assert.deepEqual(await listed(), [])
})
