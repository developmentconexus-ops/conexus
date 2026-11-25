import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AgentId, AutomationId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { runOf } from '../tools/company/test-company-tools.ts'
import { dataContextOf, markIn, markSchema } from './public.ts'

test('o contexto de dados leva a conversa da execução, e nenhuma na prova de um rascunho', () => {
  const run = runOf('assistant')
  assert.ok(run.conversation.kind === 'THREAD')
  assert.deepEqual(dataContextOf(run), { thread: run.conversation.id })
  assert.deepEqual(dataContextOf({ ...run, conversation: { kind: 'TRIAL' } }), { thread: null })
})

const OWNER = {
  companyId: CompanyId.parse('Q2xpZW50ZUV4ZW1wbG9QYXJhVGVzdGUx'),
  personId: PersonId.parse('PessoaDeTesteDoVetorFixo0000001'),
}
const PROJECT = ProjectId.parse('UHJvamV0b0RlVGVzdGVEb1ZldG9yMDAx')
const AUTOMATION = AutomationId.parse(
  'schedule_conexus-automation-0f7e5c3a-1b2d-4c4e-9a6f-5d3b2a1c0e9f',
)
const AGENT = AgentId.parse('7b1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e')

/** A thread of each kind as the threads kept today carry their marks: the keys are data, byte for byte. */
const RECORDED = {
  assistant: {
    metadata: {
      companyId: OWNER.companyId,
      personId: OWNER.personId,
      conexusProjectId: PROJECT,
      conexusAutomation: AUTOMATION,
      conexusAutomationName: 'Resumo de vendas',
    },
    mark: {
      ...OWNER,
      projectId: PROJECT,
      automation: { automationId: AUTOMATION, name: 'Resumo de vendas' },
    },
  },
  construtor: {
    metadata: {
      conexusConstrutorCompany: OWNER.companyId,
      conexusConstrutorPerson: OWNER.personId,
      conexusConstrutorProject: PROJECT,
    },
    mark: { ...OWNER, projectId: PROJECT },
  },
  agents: {
    metadata: {
      conexusAgentCompany: OWNER.companyId,
      conexusAgentPerson: OWNER.personId,
      conexusAgentProject: PROJECT,
      conexusAgent: AGENT,
      conexusAgentDraft: 'true',
    },
    mark: { ...OWNER, projectId: PROJECT, agent: { agentId: AGENT, draft: true } },
  },
} as const

test('uma conversa de cada tipo, gravada com as chaves de hoje, é lida pelo esquema só: a marca de cada uma', () => {
  for (const kind of ['assistant', 'construtor', 'agents'] as const) {
    const { metadata, mark } = RECORDED[kind]
    const read = markSchema(kind).parse(metadata)
    assert.equal(read.companyId, mark.companyId, kind)
    assert.equal(read.personId, mark.personId, kind)
    assert.equal(read.projectId, mark.projectId, kind)
    assert.deepEqual(markIn(kind, metadata, OWNER), read, kind)
  }
  const { assistant, agents } = RECORDED
  assert.deepEqual(
    markIn('assistant', assistant.metadata, OWNER)?.automation,
    assistant.mark.automation,
  )
  assert.deepEqual(markIn('agents', agents.metadata, OWNER)?.agent, agents.mark.agent)
})

/** What a mark says, without the fields it leaves absent. */
function said(mark: object | undefined) {
  return Object.fromEntries(Object.entries(mark ?? {}).filter(([, value]) => value !== undefined))
}

test('uma conversa sem Projeto, sem automação e sem agente fica só com a empresa e a pessoa; o rascunho "false" não é rascunho', () => {
  assert.deepEqual(said(markIn('assistant', OWNER, OWNER)), OWNER)
  const opened = { conexusAgentCompany: OWNER.companyId, conexusAgentPerson: OWNER.personId }
  assert.deepEqual(said(markIn('agents', opened, OWNER)), OWNER)
  const published = { ...RECORDED.agents.metadata, conexusAgentDraft: 'false' }
  assert.deepEqual(markIn('agents', published, OWNER)?.agent, { agentId: AGENT, draft: false })
})

test('uma automação sem nome na marca é lida com o nome vazio, como a marca de hoje', () => {
  const { conexusAutomationName: _name, ...nameless } = RECORDED.assistant.metadata
  assert.deepEqual(markIn('assistant', nameless, OWNER)?.automation, {
    automationId: AUTOMATION,
    name: '',
  })
})

test('uma marca que falta ou tem outro tipo é recusada, e a chave de outro tipo de conversa não vale', () => {
  const { assistant, construtor, agents } = RECORDED
  const refused = [
    ['construtor', { ...construtor.metadata, conexusConstrutorCompany: undefined }],
    ['construtor', { ...construtor.metadata, conexusConstrutorProject: 7 }],
    ['construtor', { ...construtor.metadata, conexusConstrutorPerson: '' }],
    ['assistant', { ...assistant.metadata, conexusAutomation: 'nao-e-um-id' }],
    ['assistant', { ...assistant.metadata, conexusProjectId: 'nao-e-um-id' }],
    ['assistant', construtor.metadata],
    ['agents', { ...agents.metadata, conexusAgentDraft: 'talvez' }],
    ['assistant', null],
    ['assistant', 'companyId'],
  ] as const
  for (const [kind, metadata] of refused) {
    assert.equal(markSchema(kind).safeParse(metadata).success, false, `${kind} ${String(metadata)}`)
    assert.equal(markIn(kind, metadata, OWNER), undefined, kind)
  }
})

test('uma marca de outra empresa ou de outra pessoa é lida pelo esquema e recusada pela comparação com o dono', () => {
  const { metadata } = RECORDED.assistant
  const other = { ...OWNER, companyId: CompanyId.parse('T3V0cmFFbXByZXNhRGVUZXN0ZTAwMDAw') }
  assert.equal(markSchema('assistant').safeParse(metadata).success, true)
  assert.equal(markIn('assistant', metadata, other), undefined)
})
