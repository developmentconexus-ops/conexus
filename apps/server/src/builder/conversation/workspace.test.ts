import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, endOf, title } from './test-conversation.ts'
import { partsOf } from './test-parts.ts'

type Tool = { name: string; input: object }

/** A model that calls each list of tools in its steps, one list per step, and then answers. */
function steps(...lists: Tool[][]) {
  let step = 0
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    const tools = lists[step]
    step += 1
    if (tools === undefined) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: tools.map((tool) => ({ type: 'tool_use', ...tool })) }
  }
}

function write(path: string, content = 'x\n'): Tool {
  return { name: 'mastra_workspace_write_file', input: { path, content } }
}

test('pela rota, a escrita vai para o Projeto da conversa e não para o vizinho', async (t) => {
  let answer = steps([write('a.ts')])
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, (call) =>
    answer(call),
  )
  const other = await post(hub, ana, `/api/companies/${companyId}/projects`, { name: 'Estoque' })
  const otherId = String(Object(other.json()).project.id)
  await asked(t, { hub, person: ana, conversations })
  answer = steps([write('b.ts')])
  const inOther = `/api/companies/${companyId}/projects/${otherId}/conversations`
  await asked(t, { hub, person: ana, conversations: inOther })
  const company = CompanyId.parse(companyId)
  const first = hub.builder.repository({
    companyId: company,
    projectId: ProjectId.parse(projectId),
  })
  const second = hub.builder.repository({ companyId: company, projectId: ProjectId.parse(otherId) })
  const turn = /^[ab]\.ts$/
  async function written(repository: typeof first): Promise<string[] | undefined> {
    const tree = await repository.tree(await repository.main())
    return tree?.map((file) => file.path).filter((path) => turn.test(path))
  }
  assert.deepEqual(await written(first), ['a.ts'])
  assert.deepEqual(await written(second), ['b.ts'])
})

test('fora da pasta do app e via link: recusado; regrava sem ler: aceita', async (t) => {
  const link = {
    name: 'mastra_workspace_execute_command',
    input: { command: 'ln -s .. saida' },
  }
  const model = steps(
    [write('a.ts', 'um\n')],
    [write('../fora.ts'), link],
    [write('saida/fora.ts')],
    [write('a.ts', 'dois\n')],
  )
  const { hub, ana, conversations } = await conversing(t, model)
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(endOf(events), 'complete')
  const outside = join(hub.builder.folder, 'fora.ts')
  assert.equal(existsSync(outside), false)
  assert.equal(existsSync(join(hub.builder.folder, '..', 'fora.ts')), false)
  const ended = new Map<string, boolean>()
  for (const part of partsOf(events)) {
    if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
      ended.set(part.toolInvocation.toolCallId, part.toolInvocation.isError === true)
    }
  }
  // The outside write and the write through the symlink fail; a second write needs no prior read.
  assert.deepEqual([...ended.values()], [false, true, false, true, false])
})
