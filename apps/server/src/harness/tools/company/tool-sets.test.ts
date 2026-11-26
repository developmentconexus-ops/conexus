import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { building } from '../../../agents/agent-builder/test-construtor.ts'
import {
  automating,
  created as automationCreated,
  ended,
  ranNow,
} from '../../../agents/assistant/automations/test-automations.ts'
import { assisting, created, talking } from '../../../agents/assistant/test-assistant.ts'
import {
  agentsOn,
  madeTool,
  ordersOf,
  publishedAgent,
  talkedTo,
} from '../../../agents/saved-agent/test-agents.ts'
import { ASK, folder, MIGRATION, send, versionWriting } from '../../../hub/apps/test-versions.ts'
import type { Sent } from '../../../platform/test-anthropic.ts'
import { createCompanyDatabase } from '../../../platform/test-company-postgres.ts'
import { endOf, started } from '../../routes/test-conversation.ts'
import { stepped } from '../../routes/test-questions.ts'

/** What every seat of the Assistant gets beside the company's tools: the web, the machine, the memories and the controller's own. */
const ASSISTANT_REST = [
  'ask_user',
  'knowledge_list',
  'knowledge_read',
  'knowledge_search',
  'mastra_workspace_delete',
  'mastra_workspace_edit_file',
  'mastra_workspace_execute_command',
  'mastra_workspace_file_stat',
  'mastra_workspace_get_process_output',
  'mastra_workspace_grep',
  'mastra_workspace_kill_process',
  'mastra_workspace_list_files',
  'mastra_workspace_mkdir',
  'mastra_workspace_read_file',
  'mastra_workspace_write_file',
  'propose_automation',
  'propose_company_memory',
  'recall',
  'search_tools',
  'show_file',
  'skill',
  'skill_read',
  'skill_search',
  'subagent',
  'task_check',
  'task_complete',
  'task_update',
  'task_write',
  'updateWorkingMemory',
  'web_fetch',
  'web_search',
]

function namesOf(tools: readonly string[] | undefined): string[] {
  return [...(tools ?? [])].sort()
}

async function assistantAt(t: TestContext, inProject: boolean) {
  const on = await assisting(t)
  const body = inProject
    ? { projectId: on.projectId, connections: [on.matriz] }
    : { connections: [on.matriz] }
  const url = await created(on.hub, on.ana, on.assistant, body)
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  return namesOf(on.calls.at(-1)?.tools)
}

test('os nomes de hoje: o Assistente no Início', async (t) => {
  assert.deepEqual(
    await assistantAt(t, false),
    [
      ...ASSISTANT_REST,
      'conexus_overview',
      'connector_note_save',
      'connector_notes',
      'data_describe',
      'data_query',
      'propose_app',
    ].sort(),
  )
})

test('a ordem de hoje: o Assistente pede as suas ferramentas e as da empresa na ordem do main', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const order = [
    'conexus_overview',
    'show_file',
    'propose_company_memory',
    'propose_automation',
    'propose_app',
    'connector_notes',
    'connector_note_save',
    'data_describe',
    'data_query',
  ]
  assert.deepEqual(
    on.calls.at(-1)?.tools.filter((name) => order.includes(name)),
    order,
  )
})

test('os nomes de hoje: o Assistente num Projeto', async (t) => {
  assert.deepEqual(
    await assistantAt(t, true),
    [
      ...ASSISTANT_REST,
      'conexus_overview',
      'connector_note_save',
      'connector_notes',
      'data_describe',
      'data_query',
      'propose_app_change',
    ].sort(),
  )
})

test('os nomes de hoje: a rodada de automação', async (t) => {
  const on = await automating(t)
  const automation = await automationCreated(on.hub, on.ana, on.automations, {
    name: 'Relatório',
    prompt: 'O relatório de vendas de ontem.',
    cadence: { kind: 'DAILY', time: '07:00' },
    connections: [on.matriz],
  })
  const ran = `${on.automations}/${automation.id}`
  const run = await ended(on.hub, on.ana, ran, await ranNow(on.hub, on.ana, ran))
  assert.equal(run.state.kind, 'DONE')
  const asked = on.calls.filter((each) => each.tools.includes('search_tools'))
  assert.ok(asked.length > 0)
  for (const each of asked) {
    assert.deepEqual(
      namesOf(each.tools),
      [...ASSISTANT_REST, 'conexus_overview', 'connector_notes', 'data_describe', 'data_query']
        .filter((name) => name !== 'updateWorkingMemory')
        .sort(),
    )
  }
})

test('os nomes de hoje: o Builder, sem copy_propose', async (t) => {
  const on = await assisting(t)
  const url = `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  assert.deepEqual(namesOf(on.calls.at(-1)?.tools), [
    'app_data_check',
    'app_data_read',
    'ask_user',
    'conexus_check',
    'connector_note_save',
    'connector_notes',
    'connector_read',
    'data_describe',
    'data_query',
    'mastra_workspace_delete',
    'mastra_workspace_edit_file',
    'mastra_workspace_execute_command',
    'mastra_workspace_file_stat',
    'mastra_workspace_get_process_output',
    'mastra_workspace_grep',
    'mastra_workspace_kill_process',
    'mastra_workspace_list_files',
    'mastra_workspace_mkdir',
    'mastra_workspace_read_file',
    'mastra_workspace_write_file',
    'recall',
    'skill',
    'skill_read',
    'skill_search',
    'submit_plan',
    'task_check',
    'task_complete',
    'task_update',
    'task_write',
    'web_fetch',
    'web_search',
  ])
})

test('os nomes de hoje: o Construtor', async (t) => {
  const on = await building(t, [])
  assert.equal(endOf(await on.conversation.say('Oi')), 'complete')
  assert.deepEqual(namesOf(on.calls.at(-1)?.tools), [
    'agent_draft',
    'agent_read',
    'agent_set',
    'agent_test',
    'ask_user',
    'connector_notes',
    'connector_read',
    'project_read',
    'task_check',
    'task_complete',
    'task_update',
    'task_write',
    'tool_code_save',
    'tool_save',
    'tool_search',
    'web_fetch',
    'web_search',
  ])
})

test('os nomes de hoje: o agente salvo, sem e com os dados do app', async (t) => {
  const writing = versionWriting()
  const calls: Sent[] = []
  const model = stepped([], calls)
  const on = await agentsOn(t, (sent) =>
    sent.texts.some((text) => text.startsWith(ASK)) ? writing(sent) : model(sent),
  )
  const subject = { t, hub: on.hub, projects: `${on.company}/projects`, projectId: on.projectId }
  const [neonProject] = on.hub.neon.projects()
  assert.ok(neonProject)
  on.hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  assert.equal(
    (await send(subject, on.ana, folder({ migrations: [MIGRATION] }))).preview?.state,
    'ready',
  )
  const orders = await madeTool(on.hub, on.ana, on.tools, ordersOf(on.matriz))
  const seen: string[][] = []
  for (const appData of [false, true]) {
    const agent = await publishedAgent(on.hub, on.ana, on.agents, {
      instructions: 'Responda sobre os pedidos.',
      connections: [on.matriz],
      tools: [orders.latest.id],
      appData,
    })
    const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
    assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
    seen.push(namesOf(calls.at(-1)?.tools))
  }
  const company = ['connector_notes', 'data_describe', 'data_query', 'tool_pedidos_matriz']
  assert.deepEqual(seen, [company, ['app_data_read', ...company]])
})

test('sem copy_runs: o Assistente, no Início e num Projeto, recebe pela ligação do Hub nenhuma ferramenta de cópia', async (t) => {
  for (const inProject of [false, true]) {
    const copies = (await assistantAt(t, inProject)).filter((name) => name.includes('copy'))
    assert.deepEqual(copies, [], inProject ? 'num Projeto' : 'no Início')
  }
})
