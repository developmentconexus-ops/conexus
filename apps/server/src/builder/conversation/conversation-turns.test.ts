import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ANA } from '../../hub/identity/test-hub.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { conversing, endOf, holding, sent, started, streamOf, title } from './test-conversation.ts'
import { dataOf, failuresOf, partsOf } from './test-parts.ts'
import { answerTo, ask, invocations, untilCard, WHO } from './test-questions.ts'

const OBSERVER = /^You are the memory consciousness/

test('duas conversas do mesmo Projeto ao mesmo tempo: a segunda é aceita e termina RUN_BUSY com o nome de quem trabalha, sem chamar o modelo', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? held.reply,
  )
  const urls = [
    `${conversations}/${await started(hub, ana, conversations)}`,
    `${conversations}/${await started(hub, ana, conversations)}`,
  ]
  const [working, refused] = await Promise.all(urls.map((url) => streamOf(hub, ana, url)))
  assert.ok(working && refused)
  t.after(() => working.close())
  t.after(() => refused.close())
  assert.equal((await sent(hub, ana, urls[0] ?? '', 'Primeira')).statusCode, 200)
  await working.text()
  function modelCalls() {
    return anthropic.sent.filter((each) => each.stream && !OBSERVER.test(each.system)).length
  }
  const before = modelCalls()
  assert.equal((await sent(hub, ana, urls[1] ?? '', 'Outra')).statusCode, 200)
  const events = await refused.turn()
  assert.deepEqual(dataOf(events, 'data-conexus-failure'), [{ code: 'RUN_BUSY', person: ANA.name }])
  assert.equal(endOf(events), 'error')
  assert.equal(modelCalls(), before, 'the refused run calls no model')
  held.release()
  assert.deepEqual(failuresOf(await working.turn()), [])
})

test('a execução recusada com RUN_BUSY não liga máquina nem deixa workspace aberta; depois que a outra termina, a conversa recusada liga a sua (41, 52)', async (t) => {
  const held = holding(t)
  const write = { type: 'tool_use', name: 'mastra_workspace_write_file' } as const
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    step += 1
    if (step === 1)
      return { kind: 'blocks', blocks: [{ ...write, input: { path: 'a.ts', content: 'a\n' } }] }
    if (step === 2) return held.reply
    if (step === 3)
      return { kind: 'blocks', blocks: [{ ...write, input: { path: 'b.ts', content: 'b\n' } }] }
    return { kind: 'text', text: 'Pronto.' }
  })
  const ids = [await started(hub, ana, conversations), await started(hub, ana, conversations)]
  const urls = ids.map((id) => `${conversations}/${id}`)
  const names = ids.map((id) => `conexus-${INSTALLATION}-${id}`)
  const [working, refused] = await Promise.all(urls.map((url) => streamOf(hub, ana, url)))
  assert.ok(working && refused)
  t.after(() => working.close())
  t.after(() => refused.close())
  assert.equal((await sent(hub, ana, urls[0] ?? '', 'Primeira')).statusCode, 200)
  await working.text()
  assert.equal((await sent(hub, ana, urls[1] ?? '', 'Outra')).statusCode, 200)
  assert.deepEqual(failuresOf(await refused.turn()), ['RUN_BUSY'])
  assert.deepEqual(
    hub.builder.control.names,
    names.slice(0, 1),
    'the refused run started no machine',
  )
  held.release()
  assert.deepEqual(failuresOf(await working.turn()), [])
  assert.equal((await sent(hub, ana, urls[1] ?? '', 'Terceira')).statusCode, 200)
  assert.deepEqual(failuresOf(await refused.turn()), [])
  assert.deepEqual(hub.builder.control.names, names)
})

test('a resposta a um cartão com o Projeto ocupado por outra conversa fica guardada e termina RUN_BUSY com o nome; a próxima mensagem segue dela (14.2, fundador: A)', async (t) => {
  const held = holding(t)
  let step = 0
  const { hub, ana, conversations, anthropic } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    step += 1
    if (step === 1) return { kind: 'blocks', blocks: [ask(WHO)] }
    if (step === 2) return held.reply
    return { kind: 'text', text: 'Pronto.' }
  })
  const asking = `${conversations}/${await started(hub, ana, conversations)}`
  const holder = `${conversations}/${await started(hub, ana, conversations)}`
  const [card, other] = await Promise.all([streamOf(hub, ana, asking), streamOf(hub, ana, holder)])
  assert.ok(card && other)
  t.after(() => card.close())
  t.after(() => other.close())
  assert.equal((await sent(hub, ana, asking, 'Crie')).statusCode, 200)
  const { card: open } = await untilCard(card, 'question')
  assert.equal((await sent(hub, ana, holder, 'Segura')).statusCode, 200)
  await other.text()
  const answer = { kind: 'answers', answers: ['Todos (recomendado)'] } as const
  assert.equal((await answerTo(hub, ana, asking, open.toolCallId, answer)).statusCode, 200)
  const refused = await card.turn()
  assert.deepEqual(dataOf(refused, 'data-conexus-failure'), [
    { code: 'RUN_BUSY', person: ANA.name },
  ])
  assert.equal(endOf(refused), 'error')
  assert.deepEqual(
    invocations(partsOf(refused), open.toolCallId).map((call) => call.state),
    ['result'],
    'the card closes answered',
  )
  held.release()
  assert.deepEqual(failuresOf(await other.turn()), [])
  assert.equal((await sent(hub, ana, asking, 'Continue')).statusCode, 200)
  assert.deepEqual(failuresOf(await card.turn()), [])
  const last = anthropic.sent.filter((each) => each.stream && !OBSERVER.test(each.system)).at(-1)
  assert.ok(
    last?.texts.some((text) => text.includes('Todos (recomendado)')),
    'the next message continues from the answer',
  )
})
