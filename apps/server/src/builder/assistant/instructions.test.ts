import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { MemoryPG } from '@mastra/pg'
import { call } from '../../hub/identity/test-hub.ts'
import { turnDate } from '../conversation/public.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { assisting, created, talking } from './test-assistant.ts'

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8').trim()
}

const FIXED = `${read('../conversation/prompt/conexus.md')}\n\n${read('./prompt/assistant.md')}`

test('a mensagem fixa: a mesma em toda conversa, com a sua marca de cache, antes do bloco da conversa; nenhuma frase do trabalho do Builder', async (t) => {
  const on = await assisting(t)
  const home = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const inProject = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, home)).say('Oi')), 'complete')
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, inProject)).say('Oi')), 'complete')

  for (const asked of on.calls) {
    const [fixed, block, ...mastra] = asked.systems
    assert.equal(fixed?.text, FIXED)
    assert.equal(fixed?.cached, true)
    assert.ok(block?.text.startsWith('Company: Empresa Teste.'), block?.text)
    assert.doesNotMatch(fixed.text, /Prévia|preview|plan|conexus_check|ask_user/i)
    assert.ok(
      mastra.every((each) => /skill|machine/i.test(each.text) && !/recall/i.test(each.text)),
      JSON.stringify(mastra),
    )
    assert.ok(
      mastra.every((each) => !/npmjs|pypi|pythonhosted/i.test(each.text)),
      JSON.stringify(mastra),
    )
    assert.equal(asked.cached.filter((mark) => mark.at === 'system').length, 2)
    assert.ok(asked.cached.every((mark) => mark.at !== 'system' || mark.ttl === '1h'))
  }
})

test('o bloco da conversa: a empresa, a pessoa e o papel, hoje e o fuso, o lugar e as ligações escolhidas; trocar a escolha muda o turno seguinte', async (t) => {
  const on = await assisting(t)
  const home = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const inProject = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, home)).say('Oi')), 'complete')
  const project = await talking(t, on.hub, on.ana, inProject)
  assert.equal(endOf(await project.say('Oi')), 'complete')
  const today = `Today: ${turnDate()}, America/Sao_Paulo.`
  assert.equal(
    on.calls.at(0)?.systems.at(1)?.text,
    `Company: Empresa Teste. Person: Ana Lima (owner). ${today} Place: Início. Connections in this conversation: Matriz (sankhya).`,
  )
  assert.equal(
    on.calls.at(1)?.systems.at(1)?.text,
    `Company: Empresa Teste. Person: Ana Lima (owner). ${today} Place: Projeto "Encomendas", which reads only the connections it received. Connections in this conversation: Matriz (sankhya).`,
  )
  assert.ok(on.calls.at(1)?.tools.includes('connector_read'))
  assert.match(String(on.calls.at(1)?.system), /<name>conexus-sankhya<\/name>/)

  const changed = await call(on.hub, on.ana, 'PUT', `${inProject}/connections`, { connections: [] })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.equal(endOf(await project.say('E agora?')), 'complete')
  const after = on.calls.at(2)
  assert.match(String(after?.systems.at(1)?.text), /Connections in this conversation: none\.$/)
  assert.ok(!after?.tools.includes('connector_read'))
  assert.doesNotMatch(String(after?.system), /<name>conexus-sankhya<\/name>/)
})

test('trocar a escolha enquanto o Mastra grava o título: o turno seguinte lê só a escolha nova, e o título fica', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const id = url.slice(url.lastIndexOf('/') + 1)
  // The title's write, as @mastra/pg's updateThread does it (index.js:12438-12470), with the gap
  // between its read of the thread and its write held open: the merge writes what it read.
  const read = Promise.withResolvers<void>()
  const held = Promise.withResolvers<void>()
  const written = Promise.withResolvers<void>()
  t.after(() => held.resolve())
  const update = MemoryPG.prototype.updateThread
  t.mock.method(
    MemoryPG.prototype,
    'updateThread',
    async function (this: MemoryPG, args: Parameters<MemoryPG['updateThread']>[0]) {
      if (args.id !== id || args.title === undefined) return update.call(this, args)
      const before = await this.getThreadById({ threadId: id })
      read.resolve()
      await held.promise
      const done = await update.call(this, { ...args, metadata: before?.metadata ?? {} })
      written.resolve()
      return done
    },
  )
  const conversation = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await conversation.say('Oi')), 'complete')
  await read.promise

  const changed = await call(on.hub, on.ana, 'PUT', `${url}/connections`, { connections: [] })
  assert.equal(changed.statusCode, 200, changed.body)
  held.resolve()
  await written.promise

  assert.equal(endOf(await conversation.say('E agora?')), 'complete')
  const after = on.calls.at(-1)
  assert.match(String(after?.systems.at(1)?.text), /Connections in this conversation: none\.$/)
  assert.ok(!after?.tools.includes('connector_read'))
  assert.doesNotMatch(String(after?.system), /<name>conexus-sankhya<\/name>/)
  const now = Object((await call(on.hub, on.ana, 'GET', url)).json()).conversation
  assert.equal(now.title, 'Título')
  assert.deepEqual(
    now.connections.map((each: { name: string; chosen: boolean }) => [each.name, each.chosen]),
    [['Matriz', false]],
  )
})
