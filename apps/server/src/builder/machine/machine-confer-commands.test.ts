import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_SESSION_COOKIE } from '@conexus/hub-api'
import { confer, conferring, FAILED, stubBrowser, TOKEN } from './test-confer.ts'
import { CONVERSATION, world } from './test-machine.ts'

test('Machines.confer: a rede abre só para o host do app durante os comandos e volta no fim, o token só no arquivo', async (t) => {
  const stub = stubBrowser(t)
  const machine = await conferring(t, stub.program)
  const during: (readonly string[] | undefined)[] = []
  machine.control.afterCommand = () => during.push(machine.control.networkOpenTo)
  const at = { url: new URL('https://localhost:4433'), session: TOKEN }
  const result = await confer(machine, at)
  assert.ok(result.ok && result.value.kind === 'CLEAN')
  const commands = stub.calls()
  assert.deepEqual(
    commands.map((line) => line.split(' ').slice(1, 2).join()),
    [
      'open',
      'cookies',
      'open',
      'wait',
      'get',
      'screenshot',
      'console',
      'errors',
      'network',
      'close',
    ],
  )
  assert.ok(commands[1]?.includes('--url https://localhost:4433/'))
  assert.deepEqual(JSON.parse(stub.cookies()), [{ name: APP_SESSION_COOKIE, value: TOKEN }])
  assert.ok(!commands.join('\n').includes(TOKEN))
  assert.ok(!machine.lines.join('\n').includes(TOKEN))
  assert.deepEqual(
    during.slice(-commands.length - 1),
    Array(commands.length + 1).fill(['localhost']),
  )
  assert.equal(machine.control.networkOpenTo, undefined)
  assert.equal(existsSync(join(machine.folder, 'conexus-confer-cookies.json')), false)
})

test('Machines.confer: um comando que sai com erro, ou que não imprime o JSON do CLI, é CONFER_PLATFORM_FAILED e a rede fecha', async (t) => {
  for (const options of [{ failOn: 'wait' }, { text: 'texto solto' }]) {
    const stub = stubBrowser(t, options)
    const machine = await conferring(t, stub.program)
    const at = { url: new URL('https://localhost:4433'), session: TOKEN }
    assert.deepEqual(await confer(machine, at), FAILED)
    assert.equal(stub.calls().at(-1)?.split(' ')[1], 'close')
    assert.equal(machine.control.networkClosed, 1)
    assert.equal(existsSync(join(machine.folder, 'conexus-confer-cookies.json')), false)
  }
})

test('Machines.confer: o motivo de um comando que falha vai ao log, com o token trocado', async (t) => {
  const stub = stubBrowser(t, { failOn: 'open' })
  const machine = await conferring(t, stub.program)
  const at = { url: new URL('https://localhost:4433'), session: TOKEN }
  assert.deepEqual(await confer(machine, at), FAILED)
  const log = machine.lines.join('\n')
  assert.ok(log.includes('Chrome not found, session [token]'))
  assert.ok(!log.includes(TOKEN))
})

test('Machines.confer: um comando que lança não deixa a rede aberta nem o arquivo do token', async (t) => {
  const stub = stubBrowser(t)
  const machine = await conferring(t, stub.program)
  const at = { url: new URL('https://localhost:4433'), session: TOKEN }
  assert.ok((await confer(machine, at)).ok)
  const { sandbox } = machine.control
  const run = sandbox?.executeCommand?.bind(sandbox)
  assert.ok(sandbox !== undefined && run !== undefined)
  sandbox.executeCommand = async (command, args, options) => {
    if (args?.[1]?.includes("'wait'")) throw new Error('a máquina morreu')
    return run(command, args, options)
  }
  assert.deepEqual(await confer(machine, at), FAILED)
  assert.equal(machine.control.networkClosed, 2)
  assert.equal(machine.control.networkOpenTo, undefined)
  assert.equal(existsSync(join(machine.folder, 'conexus-confer-cookies.json')), false)
})

test('Machines.confer: uma conversa que nenhuma volta abriu é CONFER_PLATFORM_FAILED, sem tocar a máquina', async (t) => {
  const { machines, control } = await world(t)
  const at = { url: new URL('https://localhost:4433'), session: TOKEN }
  assert.deepEqual(await machines.confer({ conversationId: CONVERSATION, at }), FAILED)
  assert.deepEqual(control.names, [])
})
