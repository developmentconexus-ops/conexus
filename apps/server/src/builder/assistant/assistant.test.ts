import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { plantCompany } from '../../hub/identity/test-hub.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, reading, said, talking } from './test-assistant.ts'

test('a escolha no turno: numa conversa de Projeto, as duas leituras do Sankhya vão na escolha e no Projeto dela, com a mesma chave; o turno seguinte tem outra', async (t) => {
  const on = await assisting(t, [[reading()], [reading()], [said('Uma empresa.')], [reading()]])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('Quantas empresas há na Matriz?')), 'complete')
  const first = on.calls.at(2)
  const result = first?.texts.find((text) => text.includes('"kind":"OK"'))
  assert.ok(result !== undefined, first?.texts.join('\n'))
  // The model reads the cut of the answer and the file it was saved in, never the door's whole answer beside it.
  const answered = JSON.parse(result)
  assert.deepEqual(Object.keys(answered).sort(), ['complete', 'file', 'kind', 'value'])
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

test('as ferramentas: o modelo do Assistente recebe as de conector de leitura, a visão da empresa, as da web, as de skill, a de mostrar arquivo e as da máquina do Builder, nenhuma a mais', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('O que você pode fazer?')), 'complete')
  const asked = on.calls.at(0)
  assert.deepEqual([...(asked?.tools ?? [])].sort(), [
    'conexus_overview',
    'connector_notes',
    'connector_read',
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
    'show_file',
    'skill',
    'skill_read',
    'skill_search',
    'web_fetch',
    'web_search',
  ])
})

test('as ferramentas: numa conversa de Projeto o modelo não recebe propose_app', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  const { say } = await talking(t, on.hub, on.ana, url)

  assert.equal(endOf(await say('O que você pode fazer?')), 'complete')
  const tools = [...(on.calls.at(0)?.tools ?? [])]
  assert.equal(tools.includes('propose_app'), false)
  assert.equal(tools.includes('show_file'), true)
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
  const versionId = randomUUID().replaceAll('-', '')
  await asOwner('insert into apps.app (project_id, company_id) values ($1, $2)', [
    on.projectId,
    on.companyId,
  ])
  await asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, 3, 'ready', '{}'::jsonb, repeat('0', 64), $4, $1, now())`,
    [versionId, on.companyId, on.projectId, on.ana.id],
  )
  await asOwner('update apps.app set published_version_id = $1 where project_id = $2', [
    versionId,
    on.projectId,
  ])
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
