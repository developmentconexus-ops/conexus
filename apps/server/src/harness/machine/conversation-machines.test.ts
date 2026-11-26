import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, DEVELOPMENT_HOSTS } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { createConversationMachines, MARK } from './public.ts'
import { testConversationMachines } from './test-conversation-machines.ts'
import { INSTALLATION, OLD_TEMPLATE } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')

/** The conversation's machine, made from an old template, which the provider holds. */
function oldMachine(t: TestContext, otherTemplate: 'resume' | 'replace') {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-other-template-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const doubles = testConversationMachines(folder)
  const id = ConversationId.parse(randomUUID())
  const name = `conexus-${INSTALLATION}-${id}`
  mkdirSync(doubles.tuning.workFolder, { recursive: true })
  doubles.control.discoverable.push(name)
  doubles.control.templates[name] = OLD_TEMPLATE
  const machines = createConversationMachines(
    {
      network: { kind: 'ON_REQUEST', hosts: DEVELOPMENT_HOSTS, opened: async () => [] },
      otherTemplate,
      marks: async () => ({ [MARK.company]: COMPANY }),
    },
    { ...doubles.deps, log: { info: () => undefined, error: () => undefined } },
    doubles.tuning,
  )
  return { ...doubles, machines, id, name }
}

async function opened(on: ReturnType<typeof oldMachine>) {
  const context = new RequestContext<unknown>([['controller', { sessionId: on.id }]])
  const files = (await on.machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  await files.writeFile('a.txt', 'um')
}

test('com `replace`, a de outro molde é morta', async (t) => {
  const on = oldMachine(t, 'replace')
  await opened(on)
  assert.deepEqual(on.control.replaced, [on.name])
  assert.deepEqual(on.control.attached, [], 'the old machine is never resumed')
})

test('com `resume`, a de outro molde é retomada e nada é morto', async (t) => {
  const on = oldMachine(t, 'resume')
  await opened(on)
  assert.deepEqual(on.control.replaced, [])
  assert.deepEqual(on.control.attached, [on.name])
})

test('com `resume`, a lista do provedor que falha antes de ligar: a partida falha com MACHINE_UNAVAILABLE, nenhuma máquina nasce, e a seguinte retoma a que existe', async (t) => {
  const on = oldMachine(t, 'resume')
  on.control.findFails = 1
  await assert.rejects(opened(on), { code: 'MACHINE_UNAVAILABLE' })
  assert.deepEqual(on.control.names, [], 'no machine was made in place of the one the list hid')
  await opened(on)
  assert.deepEqual(on.control.attached, [on.name])
})
