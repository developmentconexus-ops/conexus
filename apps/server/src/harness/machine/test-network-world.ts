import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { CompanyId, ConversationId, DEVELOPMENT_HOSTS, NetworkDomain } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { createWorkspaceTools, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import type { NetworkStore } from '../network/public.ts'
import { createConversationMachines, MARK } from './public.ts'
import { testConversationMachines } from './test-conversation-machines.ts'
import { INSTALLATION } from './test-machine.ts'

export const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
export const OTHER_COMPANY = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')

export function domains(...names: string[]) {
  return names.map((name) => NetworkDomain.parse(name))
}

export function nameOf(id: ConversationId) {
  return `conexus-${INSTALLATION}-${id}`
}

/** The conversations' machines over doubles, with lists a test fills and the log kept. */
export function world(t: TestContext) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-network-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const doubles = testConversationMachines(folder)
  const company = new Map<CompanyId, NetworkDomain[]>()
  const conversation = new Map<ConversationId, NetworkDomain[]>()
  const lines: { message: string; fields: Record<string, unknown> }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
  }
  const internet = new Set<CompanyId>()
  const opened: NetworkStore['opened'] = async ({ companyId, conversationId }) => {
    if (internet.has(companyId)) return { kind: 'ALL' }
    const hosts = [...(company.get(companyId) ?? []), ...(conversation.get(conversationId) ?? [])]
    return { kind: 'LIST', hosts }
  }
  function hub(lists = opened) {
    return createConversationMachines(
      {
        network: { kind: 'ON_REQUEST', hosts: DEVELOPMENT_HOSTS, opened: lists },
        otherTemplate: 'resume',
        marks: async (context) => ({ [MARK.company]: String(context.get('company')) }),
      },
      { ...doubles.deps, log },
      doubles.tuning,
    )
  }
  function appliedTo(id: ConversationId) {
    return doubles.control.networkApplied
      .filter((each) => each.name === nameOf(id))
      .map((each) => each.hosts)
  }
  return { ...doubles, company, conversation, internet, lines, opened, hub, appliedTo }
}

/** A conversation's turn: its workspace, a file write and a command. */
export async function turn(
  machines: ReturnType<ReturnType<typeof world>['hub']>,
  companyId = COMPANY,
) {
  const id = ConversationId.parse(randomUUID())
  const context = new RequestContext<unknown>([
    ['controller', { sessionId: id }],
    ['company', companyId],
  ])
  const workspace = await machines.workspace(context)
  const files = workspace?.filesystem
  assert.ok(workspace !== undefined && files !== undefined)
  const held = workspace
  const written = files
  function write() {
    return written.writeFile('a.txt', 'um')
  }
  async function command() {
    const tools = await createWorkspaceTools(held)
    const execute = tools[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]
    assert.ok(execute, 'the workspace offers execute_command')
    const input = { description: 'Listando', command: 'echo feito' }
    return JSON.stringify(await execute.execute(input, { workspace: held }))
  }
  return { id, context, write, command }
}
