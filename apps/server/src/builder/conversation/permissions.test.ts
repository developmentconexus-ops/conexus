import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from './test-conversation.ts'

const CONTROLLER_TOOLS = [
  'ask_user',
  'submit_plan',
  'task_write',
  'task_update',
  'task_complete',
  'task_check',
  'subagent',
]
const ALLOWED =
  /^(mastra_workspace_(read_file|list_files|grep|file_stat|write_file|edit_file|mkdir|delete|execute_command|get_process_output|kill_process)|web_search|web_fetch|recall)$/

/** A model that calls `tools` in its first step and answers in the second. */
function calling(...tools: { name: string; input: object }[]) {
  let step = 0
  const seen: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    seen.push(call)
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: tools.map((tool) => ({ type: 'tool_use', ...tool })) }
  }
  return { answer, seen }
}

test('as ferramentas oferecidas são só ler, escrever e rodar: nenhuma das sete do controller, nenhuma fora das categorias liberadas', async (t) => {
  const model = calling({ name: 'mastra_workspace_list_files', input: { path: '.' } })
  const { hub, ana, conversations } = await conversing(t, model.answer)
  await asked(t, { hub, person: ana, conversations })
  const offered = model.seen[0]?.tools ?? []
  assert.ok(offered.includes('mastra_workspace_write_file'))
  assert.ok(offered.includes('mastra_workspace_execute_command'))
  assert.deepEqual(
    offered.filter((name) => CONTROLLER_TOOLS.includes(name)),
    [],
  )
  assert.deepEqual(
    offered.filter((name) => !ALLOWED.test(name)),
    [],
  )
  assert.equal(offered.includes('mastra_workspace_ast_edit'), false)
})

test('escrever e rodar um comando não param à espera de aprovação: nenhuma execução fica guardada como suspensa', async (t) => {
  const write = { name: 'mastra_workspace_write_file', input: { path: 'a.ts', content: 'x\n' } }
  const model = calling(write, {
    name: 'mastra_workspace_execute_command',
    input: { command: 'echo oi' },
  })
  const { hub, ana, conversations } = await conversing(t, model.answer)
  /** Every run Mastra saves waiting, as an approval leaves it, from the moment its tables exist. */
  async function recordSuspensions() {
    await hub.test.mastraPool.query(`
    create table mastra.suspended_runs (run_id text);
    create function mastra.record_suspension() returns trigger language plpgsql as $$
    begin insert into mastra.suspended_runs values (new.run_id); return new; end $$;
    create trigger record_suspension after insert or update on mastra.mastra_workflow_snapshot
      for each row when (new.snapshot->>'status' = 'suspended')
      execute function mastra.record_suspension();
    `)
  }
  const { events } = await asked(t, { hub, person: ana, conversations, between: recordSuspensions })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const states = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'tool' ? [event.part.state] : [],
  )
  assert.deepEqual(states, ['running', 'running', 'completed', 'completed'])
  assert.deepEqual(
    (await hub.test.mastraPool.query('select run_id from mastra.suspended_runs')).rows,
    [],
  )
})

test('uma ferramenta fora das categorias (ast_edit, desligada) não age: o turno segue e nada é escrito', async (t) => {
  const edit = { name: 'mastra_workspace_ast_edit', input: { path: 'a.ts', transform: 'x' } }
  const model = calling(edit)
  const { hub, ana, conversations } = await conversing(t, model.answer)
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(existsSync(join(hub.builder.folder, 'app', 'a.ts')), false)
})
