import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ConversationId, DEVELOPMENT_HOSTS } from '@conexus/hub-api'
import { until } from '../../platform/test-until.ts'
import { confer, conferring, stubBrowser, TOKEN } from './test-confer.ts'
import { COMPANY as BUILDERS, pausedByE2b } from './test-machine.ts'
import { COMPANY, domains, nameOf, OTHER_COMPANY, turn, world } from './test-network-world.ts'

test('a rede na partida: a máquina criada leva a lista pronta, a lista da empresa e a da conversa, e nada mais (8)', async (t) => {
  const on = world(t)
  const asked = await turn(on.hub())
  on.company.set(COMPANY, domains('api.example.com'))
  on.company.set(OTHER_COMPANY, domains('outra.example.com'))
  on.conversation.set(asked.id, domains('*.docs.example.org'))
  await asked.write()
  assert.deepEqual(on.appliedTo(asked.id), [
    [...DEVELOPMENT_HOSTS, 'api.example.com', '*.docs.example.org'],
  ])
})

test('a rede na partida: a máquina que volta de uma pausa leva as listas de agora (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('antes.example.com'))
  const asked = await turn(on.hub())
  await asked.write()
  on.company.set(COMPANY, domains('depois.example.com'))
  pausedByE2b(on.control)
  await asked.command()
  assert.deepEqual(on.appliedTo(asked.id).at(-1), [...DEVELOPMENT_HOSTS, 'depois.example.com'])
})

test('a rede na partida: depois que o Hub reinicia, a máquina achada leva as listas de agora (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('antes.example.com'))
  const before = await turn(on.hub())
  await before.write()
  on.control.discoverable.push(nameOf(before.id))
  on.company.set(COMPANY, domains('depois.example.com'))
  const files = (await on.hub().workspace(before.context))?.filesystem
  await files?.writeFile('b.txt', 'dois')
  assert.deepEqual(on.control.attached, [nameOf(before.id)])
  assert.deepEqual(on.appliedTo(before.id).at(-1), [...DEVELOPMENT_HOSTS, 'depois.example.com'])
})

test('a rede na partida: o download, sem conversa em curso, liga a máquina achada só com a lista pronta (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  const id = ConversationId.parse(randomUUID())
  on.control.discoverable.push(nameOf(id))
  mkdirSync(on.tuning.workFolder, { recursive: true })
  writeFileSync(join(on.tuning.workFolder, 'a.txt'), 'um')
  const machines = on.hub(async () => assert.fail('a download has no company whose lists to read'))
  const read = await machines.read(id, 'a.txt', new AbortController().signal)
  assert.equal(read.kind, 'OK')
  assert.deepEqual(on.appliedTo(id), [DEVELOPMENT_HOSTS])
})

test('a partida com a internet toda: a máquina criada, e a que volta de uma pausa, alcançam qualquer endereço (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  on.internet.add(COMPANY)
  const asked = await turn(on.hub())
  await asked.write()
  pausedByE2b(on.control)
  await asked.command()
  assert.deepEqual(on.appliedTo(asked.id), ['ALL', 'ALL'])
})

test('desligar a internet toda volta a máquina ligada às listas (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  on.company.set(COMPANY, domains('api.example.com'))
  on.internet.add(COMPANY)
  const asked = await turn(machines)
  await asked.write()
  on.internet.delete(COMPANY)
  await machines.narrow(COMPANY)
  assert.deepEqual(on.appliedTo(asked.id), ['ALL', [...DEVELOPMENT_HOSTS, 'api.example.com']])
})

test('a remoção fecha as máquinas ligadas da empresa, e só elas (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  on.company.set(COMPANY, domains('api.example.com'))
  on.company.set(OTHER_COMPANY, domains('api.example.com'))
  const first = await turn(machines)
  const second = await turn(machines)
  const other = await turn(machines, OTHER_COMPANY)
  const unused = await turn(machines)
  for (const each of [first, second, other]) await each.write()
  on.conversation.set(second.id, domains('da-conversa.example.com'))
  on.company.set(COMPANY, [])
  await machines.narrow(COMPANY)
  assert.deepEqual(on.appliedTo(first.id).slice(1), [DEVELOPMENT_HOSTS])
  assert.deepEqual(on.appliedTo(second.id).slice(1), [
    [...DEVELOPMENT_HOSTS, 'da-conversa.example.com'],
  ])
  assert.equal(on.appliedTo(other.id).length, 1, 'another company keeps its list')
  assert.deepEqual(on.appliedTo(unused.id), [], 'a machine never started takes no change')
  assert.equal(on.control.names.includes(nameOf(unused.id)), false)
})

test('a troca que falha refaz na próxima ferramenta, antes de o comando rodar, e a falha vai ao log sem o domínio (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  on.company.set(COMPANY, domains('api.example.com'))
  const asked = await turn(machines)
  await asked.write()
  on.company.set(COMPANY, [])
  on.control.openFails = 100
  await machines.narrow(COMPANY)
  assert.deepEqual(on.lines.slice(1), [
    {
      message: 'MACHINE_NETWORK_FAILED',
      fields: { conversationId: asked.id, reason: 'REMOVE', causes: 'Error' },
    },
  ])
  const during: unknown[] = []
  on.control.afterCommand = () => during.push(on.appliedTo(asked.id).at(-1))
  assert.match(await asked.command(), /feito/, 'a retry that fails holds no tool back')
  assert.deepEqual(during.at(-1), [...DEVELOPMENT_HOSTS, 'api.example.com'])
  on.control.openFails = 0
  await asked.command()
  assert.deepEqual(during.at(-1), DEVELOPMENT_HOSTS)
  const sent = on.appliedTo(asked.id).length
  await asked.command()
  assert.equal(on.appliedTo(asked.id).length, sent, 'a change that took effect is not made again')
})

test('a liberação chega à máquina ligada, e reopen diz false quando a troca falha (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  const asked = await turn(machines)
  await asked.write()
  on.conversation.set(asked.id, domains('api.example.com'))
  on.control.openFails = 1
  assert.equal(await machines.reopen(asked.id), false)
  assert.equal(on.lines.at(-1)?.fields.reason, 'GRANT')
  assert.equal(await machines.reopen(asked.id), true)
  assert.deepEqual(on.appliedTo(asked.id).at(-1), [...DEVELOPMENT_HOSTS, 'api.example.com'])
  assert.equal(await machines.reopen(ConversationId.parse(randomUUID())), true)
})

test('a remoção que chega durante a partida entra depois dela, e a máquina fica com as listas de agora (10, C65)', async (t) => {
  const on = world(t)
  const gate = Promise.withResolvers<void>()
  let reads = 0
  const machines = on.hub(async (where) => {
    const read = await on.opened(where)
    reads += 1
    if (reads === 1) await gate.promise
    return read
  })
  on.company.set(COMPANY, domains('api.example.com'))
  const asked = await turn(machines)
  const writing = asked.write()
  await until(() => reads === 1, 'the start read the lists')
  on.company.set(COMPANY, [])
  const narrowing = machines.narrow(COMPANY)
  await new Promise((later) => setTimeout(later, 50))
  gate.resolve()
  await Promise.all([writing, narrowing])
  assert.deepEqual(on.appliedTo(asked.id).at(-1), DEVELOPMENT_HOSTS)
})

test('a pausa espera a troca em curso: a liberação não corre sobre uma máquina que pausa (10, C65)', async (t) => {
  const on = world(t)
  const gate = Promise.withResolvers<void>()
  let reads = 0
  const machines = on.hub(async (where) => {
    reads += 1
    if (reads === 2) await gate.promise
    return on.opened(where)
  })
  const asked = await turn(machines)
  await asked.write()
  on.conversation.set(asked.id, domains('api.example.com'))
  const reopening = machines.reopen(asked.id)
  await until(() => reads === 2, 'the grant read the lists')
  const stopping = machines.stopAll()
  await new Promise((later) => setTimeout(later, 50))
  assert.equal(on.control.stops, 0, 'no pause while the change is in flight')
  gate.resolve()
  assert.equal(await reopening, true)
  await stopping
  assert.equal(on.control.stops, 1)
  assert.deepEqual(on.appliedTo(asked.id).at(-1), [...DEVELOPMENT_HOSTS, 'api.example.com'])
})

test('a partida sem a rede certa falha: a máquina não é entregue, o turno vê MACHINE_UNAVAILABLE, e a seguinte parte (11)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  on.control.openFails = 1
  let commands = 0
  on.control.afterCommand = () => {
    commands += 1
  }
  const asked = await turn(on.hub())
  await assert.rejects(asked.write(), { code: 'MACHINE_UNAVAILABLE' })
  assert.equal(commands, 0, 'nothing ran on the machine')
  assert.deepEqual(
    on.lines.map((each) => [each.message, each.fields.reason]),
    [
      ['MACHINE_NETWORK_FAILED', 'START'],
      ['MACHINE_UNAVAILABLE', 'NETWORK'],
    ],
  )
  assert.equal(JSON.stringify(on.lines).includes('example.com'), false)
  await asked.write()
  assert.deepEqual(on.appliedTo(asked.id), [[...DEVELOPMENT_HOSTS, 'api.example.com']])
})

test('a partida sem a rede certa falha também quando as listas não são lidas (11)', async (t) => {
  const on = world(t)
  const asked = await turn(
    on.hub(async () => {
      throw new Error('connection refused')
    }),
  )
  await assert.rejects(asked.write(), { code: 'MACHINE_UNAVAILABLE' })
  assert.deepEqual(on.appliedTo(asked.id), [])
  assert.equal(on.lines.at(-1)?.fields.reason, 'NETWORK')
})

async function checking(
  t: TestContext,
  domain: string,
  options: Parameters<typeof stubBrowser>[1] = {},
) {
  const machine = await conferring(t, stubBrowser(t, options).program)
  machine.lists.listed.push(...domains(domain))
  const at = { url: new URL('https://localhost:4433'), session: TOKEN }
  function applied() {
    return machine.control.networkApplied.map((each) => each.hosts)
  }
  return { ...machine, applied, check: () => confer(machine, at) }
}

test('a conferência volta às listas: o Construtor de apps termina com a lista pronta e a da conversa, também quando falha (9)', async (t) => {
  for (const options of [{}, { failOn: 'wait' }]) {
    const on = await checking(t, 'api.example.com', options)
    await on.check()
    assert.deepEqual(on.applied().at(-1), [...DEVELOPMENT_HOSTS, 'api.example.com'])
  }
})

test('a conferência é uma entrada da lista: durante ela a máquina alcança o domínio liberado e o endereço do app, depois só o domínio, e a liberação feita no meio continua valendo (33)', async (t) => {
  const on = await checking(t, 'api.example.com')
  let told = false
  on.control.afterCommand = () => {
    if (told || on.applied().at(-1)?.includes('localhost') !== true) return
    told = true
    on.lists.listed.push(...domains('docs.example.org'))
    void on.machines.narrow(BUILDERS)
  }
  assert.ok((await on.check()).ok)
  const before = [...DEVELOPMENT_HOSTS, 'api.example.com']
  assert.deepEqual(on.applied(), [
    before,
    [...before, 'localhost'],
    [...before, 'docs.example.org', 'localhost'],
    [...before, 'docs.example.org'],
  ])
})
