import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import type { Agent, StreamIsTaskCompleteConfig } from '@mastra/core/agent'
import { Knowledge } from '@mastra/core/knowledge'
import type { InputProcessor } from '@mastra/core/processors'
import { RequestContext } from '@mastra/core/request-context'
import { TaskSignalProvider } from '@mastra/core/signals'
import { createSkill } from '@mastra/core/skills'
import { InMemoryStore } from '@mastra/core/storage'
import { createTool } from '@mastra/core/tools'
import { Workspace } from '@mastra/core/workspace'
import { Memory } from '@mastra/memory'
import { z } from 'zod'
import { hubOn } from '../../hub/identity/test-hub.ts'
import { silent } from '../../platform/test-database.ts'
import type { AgentSpec, ConversationSpec, Taken } from './public.ts'
import {
  agentOfSpec,
  CONTROLLER_KINDS,
  CONVERSATION_MODE,
  mountAgent,
  NEVER_ASKS,
  routedModel,
} from './public.ts'

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
    prompt: { kind: 'MESSAGES', parts: [{ kind: 'TEXT', text: 'Responda.' }] },
    model: { kind: 'SESSION' },
    tools: async () => ({}),
    approval: { kind: 'NOTHING_ASKS' },
    turn: { kind: 'SESSION', id: 'conexus-spec-turn', take: async () => undefined },
    threads: new Memory({ storage }),
    mode: { id: CONVERSATION_MODE },
  }
  const alone: AgentSpec = {
    id: 'agent-de-teste',
    name: 'Agente de teste',
    prompt: { kind: 'MESSAGES', parts: [{ kind: 'TEXT', text: 'Responda.' }] },
    model: { kind: 'OF_RUN', of: async () => routedModel(ModelId.parse('anthropic/claude-test')) },
    tools: async () => ({}),
    approval: { kind: 'THE_WRITE_ASKS' },
    memory: new Memory({ storage }),
    turn: {
      kind: 'RUN',
      id: 'conexus-spec-run',
      none: 'SEM_VEZ',
      resumes: false,
      take: async () => ({ kind: 'NONE' }) satisfies Taken,
    },
  }
  return {
    storage,
    alone: (fields: Partial<AgentSpec> = {}) => agentOfSpec({ ...alone, ...fields }, { queue }),
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

test('o agente da ficha leva o id do controlador do seu tipo, nunca um da ficha', async (t) => {
  const { mount } = await mounting(t)
  assert.equal(mount().agent.id, CONTROLLER_KINDS.construtor.id)
})

test('as instruções seguem a ordem da ficha, e uma parte do run que não dá nada fica fora', async (t) => {
  const { mount } = await mounting(t)
  const { agent } = mount({
    prompt: {
      kind: 'MESSAGES',
      parts: [
        { kind: 'TEXT', text: 'Primeiro.' },
        { kind: 'OF_RUN', of: async () => undefined },
        { kind: 'OF_RUN', of: async () => 'Do run.' },
      ],
    },
  })
  assert.deepEqual(await agent.getInstructions({ requestContext: new RequestContext() }), [
    { role: 'system', content: 'Primeiro.' },
    { role: 'system', content: 'Do run.' },
  ])
})

test('a ficha com um bloco por modelo o põe depois do texto fixo só quando o modelo da sessão tem um', async (t) => {
  const { mount } = await mounting(t)
  const { agent } = mount({
    prompt: {
      kind: 'MESSAGES',
      parts: [
        { kind: 'TEXT', text: 'Primeiro.' },
        { kind: 'BY_MODEL', blocks: { 'openai/gpt-6-luna': 'Do Luna.' } },
        { kind: 'TEXT', text: 'Último.' },
      ],
    },
  })
  function on(modelId: string) {
    const requestContext = new RequestContext()
    requestContext.set('controller', { session: { modelId } })
    return agent.getInstructions({ requestContext })
  }
  assert.deepEqual(await on('openai/gpt-6-luna'), [
    { role: 'system', content: 'Primeiro.' },
    { role: 'system', content: 'Do Luna.' },
    { role: 'system', content: 'Último.' },
  ])
  assert.deepEqual(await on('anthropic/claude-test'), [
    { role: 'system', content: 'Primeiro.' },
    { role: 'system', content: 'Último.' },
  ])
})

test('a ficha sem processors dá o turno e a escolha da conta; com eles, uns antes e outros depois da escolha', async (t) => {
  const { mount } = await mounting(t)
  async function idsOf(fields: Partial<ConversationSpec>) {
    const listed = await mount(fields).agent.listConfiguredInputProcessors(new RequestContext())
    return listed.map((each) => ('id' in each ? each.id : undefined))
  }
  assert.deepEqual(await idsOf({}), ['conexus-spec-turn', 'conexus-account-pick'])
  const before: InputProcessor = { id: 'antes', processInputStep: () => ({}) }
  const after: InputProcessor = { id: 'depois', processInputStep: () => ({}) }
  assert.deepEqual(await idsOf({ processors: { beforePick: [before], afterPick: [after] } }), [
    'conexus-spec-turn',
    'antes',
    'conexus-account-pick',
    'depois',
  ])
})

test('o regime "a escrita pergunta" dá NEVER_ASKS, numa cópia, a toda ferramenta sem regra em função', async (t) => {
  const { mount } = await mounting(t)
  const unruled = createTool({
    id: 'sem_regra',
    description: 'Sem regra própria.',
    inputSchema: z.object({}),
    execute: async () => ({}),
  })
  function own() {
    return true
  }
  const ruled = createTool({
    id: 'com_regra',
    description: 'Com regra em função.',
    inputSchema: z.object({}),
    requireApproval: own,
    execute: async () => ({}),
  })
  const { agent } = mount({
    approval: { kind: 'THE_WRITE_ASKS' },
    tools: async () => ({ sem_regra: unruled, com_regra: ruled }),
  })
  const listed = await agent.listTools({ requestContext: new RequestContext() })
  assert.equal(Reflect.get(listed.sem_regra ?? {}, 'requireApproval'), NEVER_ASKS)
  assert.notEqual(listed.sem_regra, unruled)
  assert.equal(Object.getPrototypeOf(listed.sem_regra), Object.getPrototypeOf(unruled))
  assert.equal(unruled.requireApproval, false)
  assert.equal(listed.com_regra, ruled)
  assert.equal(ruled.requireApproval, own)
  assert.equal(NEVER_ASKS(), false)
})

test('o regime "nada pergunta" deixa as ferramentas como estão', async (t) => {
  const { mount } = await mounting(t)
  const unruled = createTool({
    id: 'sem_regra',
    description: 'Sem regra própria.',
    inputSchema: z.object({}),
    execute: async () => ({}),
  })
  const { agent } = mount({ tools: async () => ({ sem_regra: unruled }) })
  const listed = await agent.listTools({ requestContext: new RequestContext() })
  assert.equal(listed.sem_regra, unruled)
})

test('a ficha de um agente que roda sozinho leva a descrição, o modelo do run e uma vez sem sessão', async (t) => {
  const { alone } = await mounting(t)
  assert.equal(alone().agent.getDescription(), '')
  assert.equal(alone({ description: 'Faz uma coisa.' }).agent.getDescription(), 'Faz uma coisa.')
  assert.equal(alone().watch, undefined)
  const context = new RequestContext()
  const model = await alone().agent.getModel({ requestContext: context })
  assert.equal(model.modelId, 'claude-test')
})

test('o turno RUN da ficha leva o id dela e só retoma no primeiro passo se a ficha disser', async (t) => {
  const { alone } = await mounting(t)
  async function processorOf(resumes: boolean) {
    const turn = {
      kind: 'RUN',
      id: 'conexus-spec-run',
      none: 'SEM_VEZ',
      resumes,
      take: async () => ({ kind: 'NONE' }) satisfies Taken,
    } as const
    const found = await alone({ turn }).agent.resolveProcessorById(
      'conexus-spec-run',
      new RequestContext(),
    )
    assert.equal(found?.id, 'conexus-spec-run')
    return found ?? {}
  }
  assert.equal('processInputStep' in (await processorOf(false)), false)
  assert.equal('processInputStep' in (await processorOf(true)), true)
})

test('a ficha dá um agente sem máquina própria: a máquina é a do controlador, nunca uma local no servidor do Hub', async (t) => {
  const { mount } = await mounting(t)
  assert.equal(await mount().agent.getWorkspace(), undefined)
})

test('a ficha com um só trecho do run dá uma mensagem de sistema, e a ficha vê o run', async (t) => {
  const { mount } = await mounting(t)
  const requestContext = new RequestContext()
  requestContext.set('lido', 'do run')
  const { agent } = mount({
    prompt: {
      kind: 'MESSAGES',
      parts: [{ kind: 'OF_RUN', of: async (context) => `Uma só, ${String(context.get('lido'))}.` }],
    },
  })
  assert.deepEqual(await agent.getInstructions({ requestContext }), [
    { role: 'system', content: 'Uma só, do run.' },
  ])
})

test('a ficha sem juiz dá um agente sem isTaskComplete; com um, ele é o padrão do agente e os outros padrões ficam', async (t) => {
  const { mount } = await mounting(t)
  const requestContext = new RequestContext()
  const without = await mount().agent.getDefaultOptions({ requestContext })
  assert.equal('isTaskComplete' in without, false)
  const judge: StreamIsTaskCompleteConfig = { scorers: [], strategy: 'all' }
  const judged = await mount({ judge }).agent.getDefaultOptions({ requestContext })
  assert.equal(judged.isTaskComplete, judge)
  assert.deepEqual(judged.toolCallConcurrency, without.toolCallConcurrency)
  assert.deepEqual(judged.modelSettings, without.modelSettings)
})

test('uma conversa com o turno RUN leva o processador do turno e nenhum que depende da sessão', async (t) => {
  const { mount } = await mounting(t)
  const turn = {
    kind: 'RUN',
    id: 'conexus-spec-run',
    none: 'SEM_VEZ',
    resumes: true,
    take: async () => ({ kind: 'NONE' }) satisfies Taken,
  } as const
  const { agent } = mount({ turn })
  const listed = await agent.listConfiguredInputProcessors(new RequestContext())
  assert.deepEqual(
    listed.map((each) => ('id' in each ? each.id : undefined)),
    ['conexus-spec-run', 'conexus-account-pick'],
  )
  async function deletedRunsOf(agent: Agent) {
    const output = await agent.listConfiguredOutputProcessors(new RequestContext())
    return output.flatMap((each) => ('id' in each && each.id.endsWith('-deleted') ? [each.id] : []))
  }
  assert.deepEqual(await deletedRunsOf(agent), [])
  assert.deepEqual(await deletedRunsOf(mount().agent), ['conexus-spec-turn-deleted'])
})
