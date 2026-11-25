import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { plantCompany } from '../../hub/identity/test-hub.ts'
import { assisting, created, publishedApp, said, talking } from './test-assistant.ts'

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
