import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { Knowledge } from '@mastra/core/knowledge'
import { TaskSignalProvider } from '@mastra/core/signals'
import { createSkill } from '@mastra/core/skills'
import { InMemoryStore } from '@mastra/core/storage'
import { Workspace } from '@mastra/core/workspace'
import { Memory } from '@mastra/memory'
import { hubOn } from '../../hub/identity/test-hub.ts'
import { silent } from '../../platform/test-database.ts'
import type { ConversationSpec } from './public.ts'
import { CONVERSATION_MODE, mountAgent } from './public.ts'

/** A Hub's account queue and a store of memory: what the mount needs; no turn runs here. */
async function mounting(t: TestContext) {
  const hub = await hubOn(t)
  const storage = new InMemoryStore()
  const queue = {
    database: hub.test.database,
    identity: hub.identity,
    sealKeys: hub.config.sealKeys,
    googleCalls: () => Promise.reject(new Error('no Google account in this test')),
    log: silent,
  }
  const base: ConversationSpec = {
    kind: 'construtor',
    name: 'Ficha de teste',
    base: 'AGENT',
    prompt: { kind: 'MESSAGES', parts: [{ kind: 'TEXT', text: 'Responda.' }] },
    model: { kind: 'SESSION' },
    tools: async () => ({}),
    approval: { kind: 'NOTHING_ASKS' },
    turn: { kind: 'SESSION', id: 'conexus-spec-turn', take: async () => undefined },
    threads: new Memory({ storage }),
    mode: { id: CONVERSATION_MODE },
  }
  return {
    storage,
    mount: (fields: Partial<ConversationSpec> = {}) =>
      mountAgent({ ...base, ...fields }, { queue, storage }),
  }
}

test('a ficha sem skills dá um agente sem skills; com elas, o agente as tem', async (t) => {
  const { mount } = await mounting(t)
  assert.deepEqual(await mount().agent.listSkills(), [])
  const skill = createSkill({ name: 'vendas', description: 'As vendas', instructions: 'Leia.' })
  const listed = await mount({ skills: [skill] }).agent.listSkills()
  assert.deepEqual(
    listed.map((each) => each.name),
    ['vendas'],
  )
})

test('a ficha sem signals dá um agente sem provedor de sinal; com um, o agente o tem', async (t) => {
  const { mount } = await mounting(t)
  assert.deepEqual(mount().agent.listSignalProviders(), [])
  const provider = new TaskSignalProvider()
  assert.deepEqual(mount({ signals: [provider] }).agent.listSignalProviders(), [provider])
})

test('a ficha sem scopes dá um agente que só passa os escopos do run; com eles, os soma', async (t) => {
  const { mount } = await mounting(t)
  assert.deepEqual(await mount().agent.getScopes({ scopes: ['run'] }), ['run'])
  const scoped = mount({ scopes: ['ficha'] }).agent
  assert.deepEqual(await scoped.getScopes({ scopes: ['run'] }), ['run', 'ficha'])
})

test('a ficha sem knowledge dá um agente sem Knowledge; com um, o agente o tem', async (t) => {
  const { mount, storage } = await mounting(t)
  assert.equal(mount().agent.getKnowledge(), undefined)
  const knowledge = new Knowledge({ id: 'conexus-spec', storage, scopes: {} })
  assert.equal(mount({ knowledge }).agent.getKnowledge(), knowledge)
})

test('a ficha sem workspace dá um controlador sem máquina, como o do Construtor; com uma, ele a tem', async (t) => {
  const { mount } = await mounting(t)
  assert.equal(mount().controller.hasWorkspace(), false)
  // A Workspace without a provider fails when made; as a function, Mastra makes it only for a run.
  function workspace() {
    return new Workspace({ id: 'conexus-spec' })
  }
  assert.equal(mount({ workspace }).controller.hasWorkspace(), true)
})
