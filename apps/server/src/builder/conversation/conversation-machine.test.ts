import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { asked, conversing, title } from './test-conversation.ts'

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
  const [shell] = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'shell' && event.part.exitCode !== null
      ? [event.part]
      : [],
  )
  assert.deepEqual(shell?.lines, [realpathSync(app)])
})
