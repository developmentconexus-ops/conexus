import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { BUILDER_TOOL, SUBAGENT_TOOL, WORKSPACE_TOOL } from '@conexus/hub-api'
import { BRUNO, memberOn, post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { agentsOn, publishedAgent, talkedTo } from '../agents/test-agents.ts'
import { createAskUserTool } from '../conversation/public.ts'
import {
  asked,
  conversing,
  endOf,
  KEY,
  MODEL,
  messagesOf,
} from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import {
  assisting,
  created,
  helperReading,
  reading,
  researching,
  said,
  searching,
  talking,
} from './test-assistant.ts'

const READ = BUILDER_TOOL.connectorRead
const WORKSPACE_READS = [
  WORKSPACE_TOOL.readFile,
  WORKSPACE_TOOL.listFiles,
  WORKSPACE_TOOL.fileStat,
  WORKSPACE_TOOL.grep,
]
const OTHER_MODEL = 'anthropic/claude-haiku-4-5'

/** The calls to the model that were the helper's: the only ones that offer `connector_read`. */
function helperOf(calls: readonly Sent[]) {
  return calls.filter((call) => call.tools.includes(READ))
}

/** The calls that were the main agent's. */
function mainOf(calls: readonly Sent[]) {
  return calls.filter((call) => !call.tools.includes(READ))
}

function turnLines(on: { lines: readonly { message: string; fields: Record<string, unknown> }[] }) {
  return on.lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED')
}

test('o ajudante existe só no Assistente', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const [first] = on.calls
  assert.ok(first?.tools.includes(SUBAGENT_TOOL), String(first?.tools))
  assert.deepEqual(Object(first?.schemas[SUBAGENT_TOOL]).properties?.agentType?.enum, ['pesquisar'])
  assert.match(first?.descriptions[SUBAGENT_TOOL] ?? '', /\*\*pesquisar\*\* \(Pesquisa\)/)

  const calls: Sent[] = []
  const builder = await conversing(t, stepped([], calls))
  await asked(t, { hub: builder.hub, person: builder.ana, conversations: builder.conversations })
  assert.ok(calls.length > 0)
  for (const call of calls) assert.ok(!call.tools.includes(SUBAGENT_TOOL), 'the Builder has none')

  const agents = await agentsOn(t, [[said('Oi.')]])
  const agent = await publishedAgent(agents.hub, agents.ana, agents.agents, {
    instructions: 'Responda sobre os pedidos.',
  })
  const talk = await talking(
    t,
    agents.hub,
    agents.ana,
    await talkedTo(agents.hub, agents.ana, agents.agents, agent.id),
  )
  assert.equal(endOf(await talk.say('Oi')), 'complete')
  assert.ok(agents.calls.length > 0)
  for (const call of agents.calls) assert.ok(!call.tools.includes(SUBAGENT_TOOL), 'nor an agent')
})

test('o ajudante só lê', async (t) => {
  const on = await assisting(t, [
    [researching('Quantas empresas?', { forked: true, modelId: OTHER_MODEL })],
    [helperReading()],
    [said('Há 2 empresas, lidas pela consulta.')],
    [said('Há 2 empresas.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas a Matriz tem?')), 'complete')

  const helper = helperOf(on.calls)
  assert.ok(helper.length >= 2, `the helper ran: ${on.calls.length} calls`)
  for (const call of helper) {
    assert.deepEqual([...call.tools].sort(), [READ, ...WORKSPACE_READS].sort())
    assert.equal(call.model, mainOf(on.calls)[0]?.model, 'not the model the main agent wrote')
  }
  const main = mainOf(on.calls)
  for (const call of main) {
    assert.ok(!call.tools.includes(READ), 'the main agent has no connector_read')
    assert.deepEqual(
      Object(call.schemas[SUBAGENT_TOOL]).properties &&
        Object.keys(Object(call.schemas[SUBAGENT_TOOL]).properties),
      ['agentType', 'task'],
    )
    assert.equal(call.tools.filter((name) => name === 'ask_user').length, 1)
    assert.equal(call.descriptions.ask_user, createAskUserTool().description)
  }
})

test('a porta, as 50 e o arquivo', async (t) => {
  const on = await assisting(t, [
    [searching()],
    Array.from({ length: 49 }, () => reading()),
    [researching()],
    [helperReading()],
    [helperReading()],
    [said('A primeira leitura veio; a segunda foi recusada.')],
    [said('Pronto.')],
    // Bruno's role lacks `empresas`: the helper's read of it is refused by the door.
    [researching('Quais empresas?')],
    [tool(READ, { connection: 'Matriz', operation: 'sankhya.empresas', input: { page: 0 } })],
    [said('Não pude ler.')],
    [said('Não pude.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Conte as empresas.')), 'complete')

  const results = helperOf(on.calls).flatMap((call) => call.toolResults.map((each) => each.text))
  assert.ok(
    results.some((text) => text.includes('"kind":"OK"')),
    'the 50th read was served',
  )
  assert.ok(
    results.some((text) => text.includes('CALLS_SPENT')),
    results.join('\n'),
  )
  assert.equal(on.reads.length, 51, 'the 51st reached the door, which refused it')
  const turn = on.reads[0]?.turn
  assert.ok(turn !== undefined)
  assert.ok(
    on.reads.every((each) => each.turn === turn),
    'one key for the main agent and the helper',
  )
  const files = readdirSync(join(on.hub.assistantMachines.folder, 'work', 'reads')).sort()
  const prefix = turn.slice(0, 8)
  assert.deepEqual(
    files,
    Array.from({ length: 50 }, (_, n) => `${prefix}-${n + 1}.json`).sort(),
    'the helper’s file is the 50th, over none',
  )

  const role = { label: 'Atendente', connectors: { sankhya: ['pedidos'] } }
  assert.equal((await post(on.hub, on.ana, `${on.company}/roles`, role)).statusCode, 201)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'atendente')
  const brunos = await created(on.hub, bruno, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const before = on.calls.length
  const asking = await talking(t, on.hub, bruno, brunos)
  assert.equal(endOf(await asking.say('Quais empresas?')), 'complete')
  const refused = helperOf(on.calls.slice(before)).flatMap((call) =>
    call.toolResults.map((each) => each.text),
  )
  assert.ok(
    refused.some((text) => text.includes('NOT_IN_ROLE')),
    refused.join('\n'),
  )
})

test('a conta da conversa', async (t) => {
  const on = await assisting(t, [
    [researching('Quantas empresas?', { modelId: OTHER_MODEL })],
    [helperReading()],
    [said('Há 2 empresas.')],
    [said('Há 2 empresas.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')
  const helper = helperOf(on.calls)
  assert.ok(helper.length >= 2)
  for (const call of helper) {
    assert.equal(call.key, KEY, 'the conversation’s account received the helper’s calls')
    assert.equal(call.model, MODEL.replace('anthropic/', ''))
  }
  assert.equal(on.calls.filter((call) => call.model?.includes('haiku')).length, 0)
})

test('a falha da conta', async (t) => {
  let main = 0
  const on = await assisting(t, (call: Sent): Reply => {
    if (!call.stream) return { kind: 'text', text: 'Título' }
    if (call.tools.includes(READ)) return { kind: 'reset' }
    main += 1
    if (main === 1) return { kind: 'blocks', blocks: [researching()] }
    return { kind: 'text', text: 'A pesquisa não deu; sigo sem ela.' }
  })
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')

  const last = mainOf(on.calls).at(-1)
  const result = last?.toolResults.at(-1)
  const answer = Object(JSON.parse(result?.text ?? 'null'))
  assert.equal(answer.isError, true, 'the main agent received the tool’s error (Mastra’s shape)')
  assert.match(String(answer.content), /Subagent "Pesquisa" failed/)
  const failed = on.lines.filter((line) => line.message === 'MODEL_SIDE_CALL_FAILED')
  assert.ok(failed.length > 0, 'the log says it')
  for (const line of failed) assert.equal(line.fields.call, 'subagent')
  const [ended] = turnLines(on)
  assert.equal(ended?.fields.end, 'complete')
})

test('só o resumo volta', async (t) => {
  const on = await assisting(t, [
    [researching()],
    [helperReading()],
    [said('RESUMO-DO-AJUDANTE: a Matriz tem 2 empresas (consulta COUNT).')],
    [said('Há 2 empresas.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')
  const last = mainOf(on.calls).at(-1)
  assert.equal(last?.toolResults.length, 1, 'one result: the helper’s')
  assert.match(last?.toolResults[0]?.text ?? '', /RESUMO-DO-AJUDANTE/)
  const heard = last?.texts.join('\n') ?? ''
  assert.ok(!heard.includes('"kind":"OK"'), 'none of the helper’s reads')
  assert.ok(!heard.includes('"rows"'))
  const kept = (await messagesOf(on.hub, on.ana, url)).flatMap((message) => message.parts)
  const calls = kept.flatMap((part) =>
    part.type === 'tool-invocation' ? [part.toolInvocation.toolName] : [],
  )
  assert.deepEqual(calls, [SUBAGENT_TOOL], 'the conversation keeps the helper’s call alone')
  const [ended] = turnLines(on)
  assert.equal(ended?.fields.helpers, 1)
  assert.equal(ended?.fields.helperCalls, 1)
})
