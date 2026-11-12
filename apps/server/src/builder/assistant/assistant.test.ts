import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { call, plantCompany } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { approving } from '../agents/test-approval.ts'
import { TITLE } from '../controller-kit/public.ts'
import { endOf, holding, MODEL, sent, title } from '../conversation/test-conversation.ts'
import { sessionStateOf, tool } from '../conversation/test-questions.ts'
import {
  assisting,
  created,
  publishedApp,
  reading,
  said,
  searching,
  talking,
} from './test-assistant.ts'
import { conversation, LONG } from './test-files.ts'

const OTHER_MODEL = 'anthropic/claude-haiku-4-5'

/** Waits, up to five seconds, for `done`. */
async function until(done: () => boolean) {
  for (let waited = 0; !done() && waited < 5000; waited += 20) await sleep(20)
  assert.ok(done(), 'it did not happen in time')
}

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
    assert.deepEqual(read.scope, {
      companyId: on.companyId,
      personId: on.ana.id,
      place: { kind: 'PROJECT', projectId: on.projectId },
      chosen: [on.matriz],
    })
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

test('a visão da empresa: os Projetos com o app, e as ligações que o lugar oferece com a escolha; numa conversa do Projeto a Filial não aparece', async (t) => {
  const overview = [tool('conexus_overview', {})]
  const on = await assisting(t, [overview, [said('Veja.')], overview])
  const inProject = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, inProject)).say('Resuma')), 'complete')
  const seen = JSON.parse(
    String(on.calls.at(1)?.texts.findLast((text) => text.includes('projects'))),
  )
  assert.deepEqual(seen, {
    projects: [{ projectId: on.projectId, name: 'Encomendas', app: { kind: 'NOT_PUBLISHED' } }],
    moreProjects: false,
    connections: [{ connectionId: on.matriz, connector: 'sankhya', name: 'Matriz', chosen: true }],
  })

  const atHome = await created(on.hub, on.ana, on.assistant, { connections: [on.filial] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, atHome)).say('Resuma')), 'complete')
  const home = JSON.parse(
    String(on.calls.at(3)?.texts.findLast((text) => text.includes('projects'))),
  )
  assert.deepEqual(
    home.connections.map((each: { name: string; chosen: boolean }) => [each.name, each.chosen]),
    [
      ['Matriz', false],
      ['Filial', true],
    ],
  )
})

test('a visão da empresa com 51 Projetos: 50 pelo nome e moreProjects; o app publicado com a versão que as pessoas usam; o Projeto de outra empresa nunca (F21, F22)', async (t) => {
  const overview = [tool('conexus_overview', {})]
  const on = await assisting(t, [overview, [said('Veja.')]])
  const asOwner = on.hub.test.asOwner
  await publishedApp(on.hub, { ...on, personId: on.ana.id })
  const elsewhere = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa')
  const plant = `insert into projects.project (id, company_id, name, attempt_key, created_at)
     select md5($2 || n::text), $1, $3 || lpad(n::text, 2, '0'), md5($2 || n::text), now()
     from generate_series(1, $4::int) as n`
  await asOwner(plant, [elsewhere, 'fora', 'Antes de tudo ', 1])
  await asOwner(plant, [on.companyId, 'aqui', 'Pedidos ', 50])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Resuma')), 'complete')
  const seen = JSON.parse(
    String(on.calls.at(1)?.texts.findLast((text) => text.includes('projects'))),
  )
  assert.equal(seen.projects.length, 50)
  assert.equal(seen.moreProjects, true)
  assert.deepEqual(seen.projects[0], {
    projectId: on.projectId,
    name: 'Encomendas',
    app: { kind: 'PUBLISHED', version: '3' },
  })
  assert.equal(
    seen.projects.some((each: { name: string }) => each.name.startsWith('Antes de tudo')),
    false,
    'another company’s Projeto, first by name, never appears',
  )
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
  await until(() => used.length === 1)
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
    assert.match(observer.system, /numbers with where they came from/)
    assert.match(observer.system, /Do not observe `<current-task-list>` or `<task-list-update>`/)
  }
  assert.equal(
    TITLE.app.observer.includes('business analyst'),
    false,
    'the Builder’s does not change',
  )
})
