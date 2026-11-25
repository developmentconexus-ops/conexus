import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DATA_TOOL } from '@conexus/hub-api'
import { TITLE } from '../../harness/prompt/public.ts'
import {
  endOf,
  holding,
  MODEL,
  messagesOf,
  sent,
  title,
} from '../../harness/routes/test-conversation.ts'
import { sessionStateOf, tool } from '../../harness/routes/test-questions.ts'
import { TOTAL_OUTUBRO } from '../../harness/tools/data/test-data.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { until } from '../../platform/test-until.ts'
import { approving } from '../agents/test-approval.ts'
import {
  anasChoice,
  assisting,
  created,
  reading,
  said,
  searching,
  talking,
} from './test-assistant.ts'
import { conversation, LONG } from './test-files.ts'
import { invocationsOf } from './test-scorecard.ts'
import { shows } from './test-truths.ts'

const OTHER_MODEL = 'anthropic/claude-haiku-4-5'

const OCTOBER_SALES =
  "SELECT ROUND(SUM(C.VLRNOTA), 2) AS TOTAL FROM TGFCAB C WHERE C.DTNEG BETWEEN '2026-10-01' AND '2026-10-31'"

test('a escolha no turno: numa conversa de Projeto, as duas leituras do Sankhya vão na escolha e no Projeto dela, com a mesma chave; o turno seguinte tem outra', async (t) => {
  const on = await assisting(t, [
    [searching()],
    [reading()],
    [reading()],
    [said('Uma empresa.')],
    [reading()],
  ])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('Quantas empresas há na Matriz?')), 'complete')
  const first = on.calls.at(3)
  const result = first?.texts.find((text) => text.includes('"kind":"OK"'))
  assert.ok(result !== undefined, first?.texts.join('\n'))
  // The model reads the cut of the answer and the file it was saved in, never the door's whole answer beside it.
  const answered = JSON.parse(result)
  assert.deepEqual(Object.keys(answered).sort(), [
    'at',
    'bytes',
    'complete',
    'file',
    'kind',
    'rows',
    'value',
  ])
  assert.match(answered.file, /^reads\/[0-9a-f]{8}-1\.json$/)
  assert.equal(on.reads.length, 2)
  for (const read of on.reads) {
    assert.equal(read.connectionId, on.matriz)
    assert.deepEqual(read.scope, anasChoice(on, on.projectId, [on.matriz]))
  }
  assert.equal(on.reads[0]?.turn, on.reads[1]?.turn)

  assert.equal(endOf(await say('E agora?')), 'complete')
  assert.equal(on.reads.length, 3)
  assert.notEqual(on.reads[2]?.turn, on.reads[0]?.turn)
})

test('as ferramentas: o modelo do Assistente da dona recebe a busca das leituras e as do caderno, a escrita incluída, a visão da empresa, as da web, as de skill, a de perguntar por cartão, a do ajudante de pesquisa, as de tarefas, a de mostrar arquivo, as da memória, as de ler a memória da empresa e a de propor guardar nela, e as da máquina do Builder, nenhuma a mais', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('O que você pode fazer?')), 'complete')
  const asked = on.calls.at(0)
  assert.deepEqual([...(asked?.tools ?? [])].sort(), [
    'ask_user',
    'conexus_overview',
    'connector_note_save',
    'connector_notes',
    'data_describe',
    'data_query',
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
    'propose_app',
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
  ])
})

test('as ferramentas: numa conversa de Projeto o modelo recebe propose_app_change e não propose_app (3)', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('O que você pode fazer?')), 'complete')
  const tools = [...(on.calls.at(0)?.tools ?? [])]
  assert.equal(tools.includes('propose_app'), false)
  assert.equal(tools.includes('propose_app_change'), true)
  assert.equal(tools.includes('show_file'), true)
  assert.equal(tools.includes('propose_automation'), true)
})

test('as ferramentas: propose_automation, numa conversa de Projeto, recebe as ligações pelo nome que o modelo vê e devolve os ids das que a conversa escolheu, sem gravar nada (17)', async (t) => {
  const steps: ReturnType<typeof said>[][] = []
  const proposal = {
    name: 'Resumo de vendas',
    prompt: 'Resuma as vendas de ontem, por vendedor.',
    cadence: { kind: 'DAILY', time: '07:00' },
  }
  steps.push(
    [tool('propose_automation', { ...proposal, connections: ['Matriz'] })],
    [said('Pronto.')],
  )
  const on = await assisting(t, steps)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Todo dia às 7h me manda o resumo de vendas')), 'complete')
  const seen = on.calls.at(1)?.texts.findLast((text) => text.includes('Resumo de vendas'))
  assert.ok(seen !== undefined, on.calls.at(1)?.texts.join('\n'))
  assert.deepEqual(JSON.parse(seen), { ...proposal, connections: [on.matriz] })
  const listed = await call(
    on.hub,
    on.ana,
    'GET',
    `${on.company}/automations?projectId=${on.projectId}`,
  )
  assert.deepEqual(Object(listed.json()).automations, [])
})

test('as ferramentas: propose_automation recusa uma ligação que a conversa não escolheu e diz os nomes que há (17)', async (t) => {
  const steps: ReturnType<typeof said>[][] = []
  steps.push(
    [
      tool('propose_automation', {
        name: 'Resumo de vendas',
        prompt: 'Resuma as vendas de ontem.',
        cadence: { kind: 'DAILY', time: '07:00' },
        connections: ['Filial'],
      }),
    ],
    [said('Vou corrigir.')],
  )
  const on = await assisting(t, steps)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Todo dia às 7h me manda o resumo de vendas')), 'complete')
  const refused = on.calls.at(1)?.texts.join('\n') ?? ''
  assert.match(refused, /validation failed for propose_automation/)
  assert.match(refused, /Matriz/)
})

test('a troca do modelo: uma resposta em andamento termina no modelo em que começou, a seguinte usa o novo (V54)', async (t) => {
  const held = holding(t)
  const used: (string | null)[] = []
  const on = await assisting(t, (asked: Sent) => {
    const titled = title(asked)
    if (titled !== undefined) return titled
    used.push(asked.model)
    return used.length === 1 ? held.reply : { kind: 'text', text: 'Pronto.' }
  })
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { stream, say } = await talking(t, on.hub, on.ana, url)
  const first = await sent(on.hub, on.ana, url, 'Primeira')
  assert.equal(first.statusCode, 200, first.body)
  await until(() => used.length === 1, 'the model was asked')
  const switched = await call(on.hub, on.ana, 'PUT', `${url}/model`, {
    model: OTHER_MODEL,
    effort: 'off',
  })
  assert.equal(switched.statusCode, 200, switched.body)
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(used.length, 1, 'the turn in flight made no call on the new model')
  assert.equal(endOf(await say('Segunda')), 'complete')
  assert.deepEqual(
    used.map((model) => `anthropic/${model}`),
    [MODEL, OTHER_MODEL],
  )
  assert.equal((await sessionStateOf(on.hub, on.ana, url)).model, OTHER_MODEL)
})

test('sem escrita: com uma escrita no kit e na biblioteca do Projeto, o Assistente não recebe ferramenta nem texto dela, e a leitura roda sem pedir aprovação (12)', async (t) => {
  const on = await approving(t, [[searching()], [reading()], [said('Uma empresa.')]])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)
  const events = await say('Quantas empresas?')
  assert.equal(endOf(events), 'complete')
  assert.ok(events.every((event) => event.type !== 'tool_approval_required'))
  assert.equal(on.reads.length, 1)
  const asked = on.calls[0]
  assert.ok(asked !== undefined)
  assert.ok(!asked.tools.some((name) => name.startsWith('tool_')), asked.tools.join())
  assert.doesNotMatch(asked.system, /lancarPedido|Lançar pedido/)
})

test('o Observador com foco de negócio', async (t) => {
  const on = await conversation(t, (_, index) => ({ kind: 'text', text: index < 2 ? LONG : 'Li.' }))
  for (const question of ['Quais as regras?', 'E os prazos?', 'E as multas?'])
    assert.equal(endOf(await on.say(question)), 'complete')
  assert.ok(on.observers.length > 0, 'the third turn, past the threshold, was observed')
  for (const observer of on.observers) {
    assert.ok(observer.system.includes(TITLE.ask.observer), 'the title instruction stays')
    assert.match(observer.system, /dentro de <thread-title>/)
    assert.match(observer.system, /Nunca responda a ele nem o continue/)
    assert.match(observer.system, /Nunca responda a ele[\s\S]*Escreva o título da conversa/)
    assert.match(observer.system, /numbers with where they came from/)
    assert.match(observer.system, /Do not observe `<current-task-list>` or `<task-list-update>`/)
  }
  assert.equal(
    TITLE.app.observer.includes('business analyst'),
    false,
    'the Builder’s does not change',
  )
})

test('sem cópia, ao vivo: com uma ligação do Sankhya e nenhuma cópia, o Assistente responde a pergunta de vendas pela leitura ao vivo, e a origem é a leitura', async (t) => {
  const total = `R$ ${TOTAL_OUTUBRO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const on = await assisting(t, [
    [tool(DATA_TOOL.describe, {})],
    [searching()],
    [reading('Matriz', OCTOBER_SALES)],
    [said(`Em outubro você vendeu ${total}.`)],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Quanto vendi em outubro?')),
    'complete',
  )

  const [catalog] = on.calls.at(1)?.toolResults ?? []
  const listed = JSON.parse(String(catalog?.text))
  assert.deepEqual(
    [listed.kind, listed.systems.map((each: { name: string }) => each.name), listed.tables],
    ['CATALOG', ['Matriz'], undefined],
  )

  assert.equal(on.reads.length, 1, 'the door received one live read')
  assert.equal(on.reads[0]?.connectionId, on.matriz)
  const read = JSON.parse(
    String(on.calls.at(3)?.texts.find((text) => text.includes('"kind":"OK"'))),
  )
  assert.equal(read.kind, 'OK')
  assert.match(String(read.at), /^\d{4}-\d\d-\d\dT/, 'the read carries the time it came back')
  assert.ok(JSON.stringify(read.value).includes(String(TOTAL_OUTUBRO)), 'the double’s own total')

  const messages = await messagesOf(on.hub, on.ana, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  const parts = messages.slice(asked + 1).flatMap((message) => message.parts)
  const used = invocationsOf(parts).map((each) => each.toolName)
  assert.ok(used.includes('sankhya_consultar'), 'the answer came from the typed live read')
  assert.ok(!used.includes(DATA_TOOL.query), 'no table was queried')
  const answer = parts.findLast((part) => part.type === 'text')
  assert.ok(answer?.type === 'text' && shows(answer.text, TOTAL_OUTUBRO))
})
