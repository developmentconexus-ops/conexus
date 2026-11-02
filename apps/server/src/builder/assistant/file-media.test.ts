import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SHOWN_TEXT_MAX } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const MEDIA: Record<string, [type: string, disposition: 'inline' | 'attachment']> = {
  'a.txt': ['text/plain', 'attachment'],
  'a.md': ['text/markdown', 'attachment'],
  'a.png': ['image/png', 'inline'],
  'a.jpg': ['image/jpeg', 'inline'],
  'a.jpeg': ['image/jpeg', 'inline'],
  'a.svg': ['image/svg+xml', 'inline'],
  'a.pdf': ['application/pdf', 'attachment'],
  'a.json': ['application/json', 'attachment'],
  'a.html': ['text/html', 'attachment'],
  'a.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'attachment'],
  'a.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'attachment',
  ],
  'a.pptx': [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'attachment',
  ],
  'a.desconhecido': ['application/octet-stream', 'attachment'],
}

function write(path: string) {
  return tool('mastra_workspace_write_file', { path, content: 'x' })
}

test('o arquivo: cada extensão baixa com o seu tipo, e só png, jpeg e svg abrem no lugar; o resto é salvo (20)', async (t) => {
  const names = Object.keys(MEDIA)
  const on = await assisting(t, [names.map(write), [said('Escrevi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  on.hub.assistantMachines.control.discoverable.push(
    `conexus-${INSTALLATION}-${url.slice(url.lastIndexOf('/') + 1)}`,
  )
  for (const [name, [type, disposition]] of Object.entries(MEDIA)) {
    const got = await call(
      on.hub,
      on.ana,
      'GET',
      `${url}/files?${new URLSearchParams({ path: name })}`,
    )
    assert.equal(got.statusCode, 200, `${name}: ${got.body}`)
    assert.equal(got.headers['content-type'], type, name)
    assert.match(String(got.headers['content-disposition']), new RegExp(`^${disposition};`), name)
  }
})

function make(name: string, bytes: number) {
  return tool('mastra_workspace_execute_command', {
    command: `head -c ${bytes} /dev/zero | tr '\\0' a > ${name}`,
  })
}

test('show_file: o texto de exatamente 64 KB vem com o conteúdo, e um byte a mais vem só como arquivo (19)', async (t) => {
  const on = await assisting(t, [
    [
      make('limite.txt', SHOWN_TEXT_MAX),
      make('passou.txt', SHOWN_TEXT_MAX + 1),
      make('x.desconhecido', 3),
    ],
    [
      tool('show_file', { path: 'limite.txt' }),
      tool('show_file', { path: 'passou.txt' }),
      tool('show_file', { path: 'x.desconhecido' }),
    ],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Mostre')), 'complete')
  const outputs = (await messagesOf(on.hub, on.ana, url)).flatMap((message) =>
    message.parts.flatMap((part) => {
      const call = Object(part).toolInvocation
      return call?.toolName === 'show_file' ? [call.result] : []
    }),
  )
  assert.deepEqual(
    outputs.map((each) => [each.kind, each.name, 'content' in each, each.media]),
    [
      ['TEXT', 'limite.txt', true, 'text/plain'],
      ['FILE', 'passou.txt', false, 'text/plain'],
      ['FILE', 'x.desconhecido', false, 'application/octet-stream'],
    ],
  )
})
