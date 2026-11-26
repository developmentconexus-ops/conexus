import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, DEVELOPMENT_HOSTS, NetworkDomain } from '@conexus/hub-api'
import { conferring } from './test-confer.ts'
import { COMPANY, CONVERSATION, pausedByE2b, world } from './test-machine.ts'
import { fileTools } from './test-machine-files.ts'

const DOMAIN = NetworkDomain.parse('api.example.com')
const LATER = NetworkDomain.parse('depois.example.com')
const OTHER_COMPANY = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')

test('a máquina do Construtor de apps parte com a lista pronta e as listas, criada, achada depois que o Hub reinicia e de volta de uma pausa (8, 9)', async (t) => {
  const { open, restartHub, control, lists, machines } = await world(t)
  function applied() {
    return control.networkApplied.at(-1)?.hosts
  }
  lists.listed.push(DOMAIN)
  await fileTools(await open()).writeFile('a.ts', 'um\n')
  assert.deepEqual(applied(), [...DEVELOPMENT_HOSTS, DOMAIN])
  await machines.release(CONVERSATION)
  lists.listed.splice(0, 1, LATER)
  control.discoverable = [...control.names]
  const hub = restartHub()
  const found = fileTools(await hub.open())
  await found.writeFile('b.ts', 'dois\n')
  assert.deepEqual(applied(), [...DEVELOPMENT_HOSTS, LATER])
  await hub.machines.release(CONVERSATION)
  lists.listed.splice(0, 1, DOMAIN)
  pausedByE2b(control)
  await fileTools(await hub.open()).readFile('b.ts')
  assert.deepEqual(applied(), [...DEVELOPMENT_HOSTS, DOMAIN])
})

test('a máquina ligada do Construtor de apps toma a liberação em reopen, que diz false quando a troca falha, e a remoção da empresa dela, só dela (10)', async (t) => {
  const { open, control, lists, machines } = await world(t)
  await fileTools(await open()).writeFile('a.ts', 'um\n')
  lists.listed.push(DOMAIN)
  control.openFails = 1
  assert.equal(await machines.reopen(CONVERSATION), false)
  assert.equal(await machines.reopen(CONVERSATION), true)
  assert.deepEqual(control.networkApplied.at(-1)?.hosts, [...DEVELOPMENT_HOSTS, DOMAIN])
  lists.listed.length = 0
  await machines.narrow(OTHER_COMPANY)
  assert.deepEqual(control.networkApplied.at(-1)?.hosts, [...DEVELOPMENT_HOSTS, DOMAIN])
  await machines.narrow(COMPANY)
  assert.deepEqual(control.networkApplied.at(-1)?.hosts, DEVELOPMENT_HOSTS)
})

test('a máquina do Construtor de apps sem a lista não é entregue: nada roda nela, o turno vê MACHINE_UNAVAILABLE por causa da rede, e a seguinte parte (11)', async (t) => {
  const { machines, control, lines } = await conferring(t, 'sem-navegador')
  let commands = 0
  control.afterCommand = () => {
    commands += 1
  }
  control.openFails = 1
  function check() {
    return machines.check({ conversationId: CONVERSATION })
  }
  await assert.rejects(check(), { code: 'MACHINE_UNAVAILABLE' })
  assert.equal(commands, 0, 'nothing ran on the machine')
  assert.deepEqual(
    lines.map((line) => {
      const [message, fields] = JSON.parse(line)
      return [message, fields.reason]
    }),
    [
      ['MACHINE_NETWORK_FAILED', 'START'],
      ['MACHINE_UNAVAILABLE', 'NETWORK'],
    ],
  )
  await check()
  assert.deepEqual(control.networkApplied.at(-1)?.hosts, DEVELOPMENT_HOSTS)
})
