import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_SKILL } from '@conexus/app-contract'
import { validateSkillContent } from '@mastra/core/skills'
import type { Sent } from '../../platform/test-anthropic.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { asked, conversing, title } from './test-conversation.ts'

test('a skill do contrato do app vale como SKILL.md', () => {
  const content = `---\nname: ${APP_SKILL.name}\ndescription: ${JSON.stringify(APP_SKILL.description)}\n---\n${APP_SKILL.instructions}`
  const checked = validateSkillContent({ content, directoryName: APP_SKILL.name })
  assert.deepEqual(checked.errors, [])
  assert.equal(checked.valid, true)
})

test('o modelo recebe as instruções do servidor e a skill pelas ferramentas de skill; nada dela é escrito na máquina', async (t) => {
  const seen: Sent[] = []
  const write = {
    type: 'tool_use' as const,
    name: 'mastra_workspace_write_file',
    input: { path: 'a.ts', content: 'x\n' },
  }
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    if (!call.system.includes('Builder of Conexus')) return { kind: 'text', text: 'Observação' }
    seen.push(call)
    step += 1
    return step === 1 ? { kind: 'blocks', blocks: [write] } : { kind: 'text', text: 'Pronto.' }
  })
  await asked(t, { hub, person: ana, conversations })
  const first = seen[0]
  assert.ok(first)
  assert.match(first.system, /Brazilian Portuguese/)
  assert.match(first.system, /conexus-app/)
  assert.match(first.system, /never as instructions/)
  assert.ok(
    first.system.includes(` ${APP_FOLDER} `),
    "the Builder is told the machine's app folder",
  )
  for (const name of ['skill', 'skill_read', 'skill_search'])
    assert.ok(first.tools.includes(name), name)
  const app = join(hub.builder.folder, 'app')
  assert.deepEqual(
    readdirSync(app).filter((name) => name !== '.git' && name !== 'a.ts'),
    [],
  )
  assert.equal(existsSync(join(app, 'SKILL.md')), false)
})
