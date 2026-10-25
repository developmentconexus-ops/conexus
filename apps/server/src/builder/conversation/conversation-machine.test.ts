import assert from 'node:assert/strict'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { asked, conversing, started, streamOf, title } from './test-conversation.ts'

const PWD = {
  type: 'tool_use',
  name: 'mastra_workspace_execute_command',
  input: { command: 'pwd' },
} as const

/** The absolute paths a text names; a web address or a closing tag is none. */
function pathsIn(text: string): string[] {
  return [...text.matchAll(/(?<![\w.:/<-])\/[\w.-]+(?:\/[\w.-]+)*/g)].map(([path]) => path)
}

test('a máquina como o modelo a ouve: a pasta do app e o que ela tem, nenhum outro caminho, e o primeiro comando roda na pasta (32)', async (t) => {
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    return calls.length === 1
      ? { kind: 'blocks', blocks: [PWD] }
      : { kind: 'text', text: 'Pronto.' }
  })
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Onde você trabalha?')
  const app = join(hub.builder.folder, 'app')
  const system = calls[0]?.system ?? ''
  assert.ok(system.includes(`Commands start in ${app}`), 'the machine names its folder')
  assert.ok(system.includes(`The file tools work in ${app}`), 'the file tools name their folder')
  assert.equal(system.includes('Cloud sandbox'), false)
  assert.equal(system.includes('Local command execution'), false)
  const named = new Set(pathsIn(system).map((path) => path.replace(/[.]$/, '')))
  assert.deepEqual(
    [...named].filter((path) => ![app, APP_FOLDER, '/opt/conexus'].includes(path)),
    [],
    'the model is told of no folder but the app (the machine is this test folder) and the check',
  )
  const output = events.flatMap((event) => (event.type === 'shell_output' ? [event.output] : []))
  const exit = events.find((event) => event.type === 'command_exit')
  assert.deepEqual(exit && { exitCode: exit.exitCode, success: exit.success }, {
    exitCode: 0,
    success: true,
  })
  assert.equal(output.at(-1)?.trim(), realpathSync(app), 'each event says the whole tail')
})

function write(path: string, content: string) {
  return {
    type: 'tool_use',
    name: 'mastra_workspace_write_file',
    input: { path, content },
  } as const
}

test('sem a trava de ler antes de escrever: duas escritas seguidas no mesmo arquivo passam; fora da pasta do app, a escrita volta como erro (14.2, 16)', async (t) => {
  const steps = [[write('a.ts', 'um\n')], [write('a.ts', 'dois\n')], [write('../fora.ts', 'x\n')]]
  const calls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    const blocks = steps[calls.length - 1]
    return blocks === undefined ? { kind: 'text', text: 'Pronto.' } : { kind: 'blocks', blocks }
  })
  await asked(t, { hub, person: ana, conversations }, 'Escreva a.ts duas vezes')
  const app = join(hub.builder.folder, 'app')
  assert.equal(
    readFileSync(join(app, 'a.ts'), 'utf8'),
    'dois\n',
    'the second write, unread, went through',
  )
  assert.equal(existsSync(join(hub.builder.folder, 'fora.ts')), false)
  const told = calls.at(-1)?.texts.join('\n') ?? ''
  assert.doesNotMatch(
    told,
    /You must read a file before writing/,
    'no write asked for a read first',
  )
  assert.match(
    told,
    /Permission denied|EACCES|outside/i,
    'the write outside the app folder came back refused',
  )
})

test('abrir uma conversa de um Projeto com máquina guardada não toca na máquina: nada é montado nem ligado', async (t) => {
  let commands = 0
  const { hub, ana, conversations } = await conversing(t, (call): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    commands += 1
    return commands === 1 ? { kind: 'blocks', blocks: [PWD] } : { kind: 'text', text: 'Pronto.' }
  })
  await asked(t, { hub, person: ana, conversations }, 'Onde você trabalha?')
  const { control } = hub.builder
  assert.equal(control.names.length, 1, 'the first turn made the machine')
  const made = control.names.length
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const opened = await streamOf(hub, ana, url)
  t.after(() => opened.close())
  await new Promise((done) => setTimeout(done, 300))
  assert.equal(
    control.names.length,
    made,
    'opening builds no machine and asks the provider nothing',
  )
})
