import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import { applyUpdate, WIRE_LIMITS } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  answeredOf,
  asked,
  conversing,
  hubBeside,
  messagesOf,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { partsOf } from './test-parts.ts'
import { conversingWith, tool } from './test-questions.ts'
import { citing, FETCH_ERROR, PAGES, printedOf, researching, UNREACHABLE } from './test-research.ts'

type Invocation = Extract<MastraPart, { type: 'tool-invocation' }>

/** Each tool call as its part last stood, by its id: what the stream said of it, or what a read gives. */
function callsOf(parts: MastraPart[]): Map<string, Invocation> {
  const calls = new Map<string, Invocation>()
  for (const part of parts) {
    if (part.type === 'tool-invocation') calls.set(part.toolInvocation.toolCallId, part)
  }
  return calls
}

/** The parts of each message the events said, folded as the screen folds them, in the order the messages began. */
function foldedParts(events: ConversationEvent[]): MastraPart[] {
  const messages = new Map<string, MastraPart[]>()
  for (const event of events) {
    if (event.type === 'message_start') messages.set(event.message.id, event.message.parts)
    else if (event.type === 'message_update') {
      messages.set(event.id, applyUpdate(messages.get(event.id) ?? [], event.event))
    }
  }
  return [...messages.values()].flat()
}

/**
 * Whether the read call is the live one. Mastra spells a call its tools refuse (unknown tool, file
 * not found) `result` with `isError` and the error in its stream, and `output-error` in its store;
 * the Hub carries both as Mastra does, so those two are the same call.
 */
function sameCall(read: Invocation | undefined, live: Invocation | undefined): boolean {
  if (read === undefined || live === undefined) return false
  if (read.toolInvocation.state !== 'output-error') {
    assert.deepEqual(read, live)
    return true
  }
  const { toolCallId, toolName, args } = read.toolInvocation
  assert.deepEqual(
    { ...live.toolInvocation, result: undefined },
    { toolCallId, toolName, args, state: 'result', isError: true, result: undefined },
  )
  return true
}

/** The states each tool call went through, in the order the stream said them. */
function statesOf(events: ConversationEvent[]): [string, string[]][] {
  const states = new Map<string, { name: string; seen: string[] }>()
  for (const part of partsOf(events)) {
    if (part.type !== 'tool-invocation') continue
    const { toolCallId, toolName, state } = part.toolInvocation
    const entry = states.get(toolCallId) ?? { name: toolName, seen: [] }
    if (entry.seen.at(-1) !== state) entry.seen.push(state)
    states.set(toolCallId, entry)
  }
  return [...states.values()].map(({ name, seen }) => [name, seen])
}

test('o fio carrega só os eventos da lista do cartão, na forma do Mastra', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const allowed = new Set([
    ...['turn', 'turnEnd', 'message_start', 'message_update', 'message_end', 'shell_output'],
    ...['command_exit', 'tool_suspended', 'task_updated', 'om_status', 'om_progress', 'agent_end'],
    ...['om_observation_start', 'om_observation_end', 'om_observation_failed'],
    ...['om_reflection_start', 'om_reflection_end', 'om_reflection_failed'],
    ...['om_buffering_start', 'om_buffering_end', 'om_buffering_failed'],
  ])
  assert.deepEqual(
    events.filter((event) => !allowed.has(event.type)),
    [],
  )
  assert.equal(events[0]?.type, 'turn')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const statuses = events.flatMap((event, at) => (event.type === 'om_status' ? [at] : []))
  assert.ok(statuses.length > 0)
  for (const at of statuses) {
    assert.equal(events[at + 1]?.type, 'om_progress', 'Mastra’s folded progress follows each om_*')
  }
})

test('um turno pensa, pesquisa e lê três páginas: o raciocínio vem com o texto do modelo, cada ferramenta com nome, argumentos e resultado', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const parts = foldedParts(events)
  const reasoning = parts.filter((part) => part.type === 'reasoning')
  assert.ok(
    reasoning.some((part) => part.reasoning.startsWith('Vou pesquisar.')),
    'the thinking is shown in the model’s words',
  )
  const fetched = [...callsOf(parts).values()].filter(
    (part) => part.toolInvocation.toolName === 'web_fetch',
  )
  assert.deepEqual(
    fetched.map((part) => Object(part.toolInvocation.args).url),
    [...PAGES, UNREACHABLE],
  )
  for (const part of fetched.slice(0, PAGES.length)) {
    assert.equal(part.toolInvocation.state, 'result')
    assert.match(JSON.stringify(part.toolInvocation.result), /Conteúdo/)
  }
  const [unreachable] = fetched.slice(-1)
  assert.match(JSON.stringify(unreachable?.toolInvocation.result), /ENOTFOUND/)
})

test('uma ferramenta do conjunto, uma que falha e uma desconhecida: ao vivo e relidas são a mesma parte, na mesma ordem', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const live = [...callsOf(foldedParts(events)).values()]
  const names = live.map((part) => part.toolInvocation.toolName)
  assert.ok(names.includes('planted_tool'), 'an unknown tool is carried by its name')
  assert.ok(names.includes('web_fetch'))
  const messages = await messagesOf(await hubBeside(t, hub), ana, url)
  assert.deepEqual(
    messages.map((message) => [message.role, message.model]),
    [
      ['person', null],
      ['builder', 'anthropic/claude-sonnet-4-6'],
      ['builder', null],
    ],
  )
  const read = messages.flatMap((message) => (message.role === 'builder' ? message.parts : []))
  assert.deepEqual(
    [...callsOf(read).values()].map((part) => part.toolInvocation.toolCallId),
    live.map((part) => part.toolInvocation.toolCallId),
  )
  for (const part of callsOf(read).values()) {
    assert.ok(sameCall(part, callsOf(foldedParts(events)).get(part.toolInvocation.toolCallId)))
  }
  const answer = read.findLast((part) => part.type === 'text')
  assert.equal(Object(answer).text, 'Comparei as padarias.')
})

test('o raciocínio e as chamadas vão ao stream e à leitura; o texto do erro do fornecedor e o log não os levam', async (t) => {
  const printed = printedOf(t)
  const { hub, ana, conversations, lines, anthropic } = await conversing(
    t,
    await researching(t),
    (config) => ({ ...config, logLevel: 'info' }),
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Compare as padarias')).statusCode, 202)
  await stream.turn()
  const given = anthropic.sent.flatMap((each) => each.texts).join('\n')
  assert.ok(given.includes(FETCH_ERROR), 'the failed fetch told the model its error')
  const read = await call(hub, ana, 'GET', url)
  assert.equal(read.statusCode, 200)
  for (const text of [stream.seen.raw, read.body]) assert.match(text, /Vou pesquisar/)
  for (const text of [JSON.stringify(lines), printed.join('')]) {
    assert.doesNotMatch(
      text,
      /SECRET-PLANTED-TEXT|secret-planted-text|Vou pesquisar|Conteúdo|ENOTFOUND/,
    )
  }
})

test('uma resposta que cita a pesquisa tem as mesmas palavras ao vivo e relida, nos trechos que o Mastra parte nas citações', async (t) => {
  const { hub, ana, conversations } = await conversing(t, citing())
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const answer =
    'Encontrei estes apps.\n\n- **Meslo:** uma plataforma para confeitarias. A limitação é que é especializada em encomendas.'
  function shape(parts: MastraPart[]) {
    const shown = parts.flatMap((part) =>
      part.type === 'text' ? [part.text] : part.type === 'tool-invocation' ? ['\0'] : [],
    )
    return shown.join('').split('\0')
  }
  const live = shape(foldedParts(events))
  assert.deepEqual(live, ['Vou buscar os apps.', answer])
  const messages = await messagesOf(await hubBeside(t, hub), ana, url)
  assert.deepEqual(shape(messages[1]?.parts ?? []), live)
})

test('task_*: a lista chega pelo evento e `Conversation.tasks` é a do armazenamento do Mastra, também recarregada', async (t) => {
  const items = [
    { content: 'Montar a tabela', status: 'in_progress', activeForm: 'Montando a tabela' },
  ]
  const { hub, ana, url, stream, send } = await conversingWith(t, [
    [tool('task_write', { tasks: items })],
  ])
  assert.equal((await send()).statusCode, 202)
  const events = await stream.turn()
  const updates = events.flatMap((event) => (event.type === 'task_updated' ? [event.tasks] : []))
  assert.deepEqual(
    updates.at(-1)?.map((each) => [each.content, each.status]),
    [['Montar a tabela', 'in_progress']],
  )
  await answeredOf(hub, ana, url)
  const read = Object((await call(hub, ana, 'GET', url)).json()).conversation
  assert.deepEqual(read.tasks, updates.at(-1))
  assert.equal(read.memory.status, 'idle', 'the open session says its memory progress')
})

// Joined here so the file holds no string a secret scanner would take for a real token.
const VALUE = 'abc123'
const LONG = Array.from({ length: 250 }, (_, at) => `linha ${at + 1}`).join('\n')
const CUTTING = [
  {
    name: 'mastra_workspace_execute_command',
    input: { command: `echo token=${VALUE}; echo pronto; exit 3` },
  },
  {
    name: 'mastra_workspace_write_file',
    input: { path: 'a.ts', content: `const key = '${VALUE}'\n${'x'.repeat(3000)}` },
  },
  {
    name: 'mastra_workspace_edit_file',
    input: { path: 'b.ts', old_string: LONG, new_string: `password=${VALUE}` },
  },
  { name: 'mastra_workspace_read_file', input: { path: 'a.ts' } },
]

test('acima de WIRE_LIMITS o texto sai cortado com `…` e o caminho em `cuts`, o resto segue; relido dá o mesmo', async (t) => {
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (sent: Sent): Reply => {
    if (title(sent) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: CUTTING.map((each) => ({ type: 'tool_use', ...each })) }
  })
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const live = callsOf(foldedParts(events))
  const byName = new Map([...live.values()].map((part) => [part.toolInvocation.toolName, part]))
  const written = byName.get('mastra_workspace_write_file')
  const content: string = Object(written?.toolInvocation.args).content
  assert.equal(content.length, WIRE_LIMITS.text + 1)
  assert.ok(content.endsWith('…') && content.startsWith(`const key = '${VALUE}'`))
  assert.deepEqual(written?.cuts, ['toolInvocation.args.content'])
  const edited = byName.get('mastra_workspace_edit_file')
  assert.deepEqual(edited?.cuts, ['toolInvocation.args.old_string'])
  assert.equal(Object(edited?.toolInvocation.args).new_string, `password=${VALUE}`)
  const viewed = byName.get('mastra_workspace_read_file')
  assert.deepEqual(
    viewed?.cuts,
    ['toolInvocation.result'],
    'only the result is marked; the short arguments are not',
  )
  const read = (await messagesOf(await hubBeside(t, hub), ana, url)).at(-1)?.parts ?? []
  for (const part of callsOf(read).values()) {
    assert.ok(sameCall(part, live.get(part.toolInvocation.toolCallId)))
  }
})

test('a saída de um comando sai cortada nos dois lados do mesmo jeito: as últimas linhas, `cuts` no resultado', async (t) => {
  const command = `seq 1 250 | sed 's/^/linha /'`
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (sent: Sent): Reply => {
    if (title(sent) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return {
      kind: 'blocks',
      blocks: [{ type: 'tool_use', name: 'mastra_workspace_execute_command', input: { command } }],
    }
  })
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const [ran] = [...callsOf(foldedParts(events)).values()]
  const result = String(ran?.toolInvocation.result)
  assert.ok(result.startsWith('…\n'), 'the cut output says where it was cut')
  assert.ok(result.endsWith('linha 250'))
  assert.ok(result.split('\n').length <= WIRE_LIMITS.outputLines + 1)
  assert.deepEqual(ran?.cuts, ['toolInvocation.result'])
  const shown = events.flatMap((event) => (event.type === 'shell_output' ? [event] : []))
  for (const each of shown) assert.ok(each.output.split('\n').length <= WIRE_LIMITS.outputLines)
  const read = (await messagesOf(await hubBeside(t, hub), ana, url)).at(-1)?.parts ?? []
  assert.deepEqual([...callsOf(read).values()], [ran])
})

function writing(content: string) {
  return {
    type: 'tool_use' as const,
    name: 'mastra_workspace_write_file',
    input: { path: 'notas.md', content },
  }
}

test('o resultado do segundo write_file é sucesso mesmo sem leitura prévia', async (t) => {
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (sent: Sent): Reply => {
    if (title(sent) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 2) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [writing(`versão ${step}`)] }
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  const states = statesOf(events)
  assert.equal(states.length, 2)
  assert.deepEqual(
    states.map(([name]) => name),
    ['mastra_workspace_write_file', 'mastra_workspace_write_file'],
  )
  const [first, second] = [...callsOf(foldedParts(events)).values()]
  assert.equal(first?.toolInvocation.state, 'result')
  assert.equal(second?.toolInvocation.state, 'result')
  assert.notEqual(second?.toolInvocation.isError, true)
})
