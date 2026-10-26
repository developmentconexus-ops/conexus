import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { PreviewData } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Checked } from '../../hub/apps/test-versions.ts'
import { checking, folder } from '../../hub/apps/test-versions.ts'
import type { Person } from '../../hub/identity/test-hub.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { asked, conversing, title } from './test-conversation.ts'

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const

/** A model that writes a file in its first step and answers after; `asked` keeps its calls. */
export function writing(): { asked: Sent[]; answer: Anthropic['answer'] } {
  const asked: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    asked.push(call)
    if (asked.length === 1) return { kind: 'blocks', blocks: [WRITE] }
    return { kind: 'text', text: 'Pronto.' }
  }
  return { asked, answer }
}

/**
 * `conversing`, with the Projeto's company database on the test server as Neon would give it, so
 * a turn's version can go to the app, and the check's `plan`.
 */
export async function previewing(
  t: TestContext,
  plan: readonly Checked[] = ['passed'],
  answer: Anthropic['answer'] = writing().answer,
) {
  const subject = await conversing(t, answer)
  const { hub, companyId, projectId } = subject
  const [neonProject] = hub.neon.projects()
  if (neonProject === undefined) throw new Error('no company database')
  hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  const check = checking(hub.builder.folder, plan, folder())
  const project = `/api/companies/${companyId}/projects/${projectId}`
  return { ...subject, check, project, versions: `${project}/versions` }
}

/** What each `data-conexus-preview` part says, in order. */
export function previewsIn(parts: MastraMessagePart[]): PreviewData[] {
  return parts.flatMap((part) =>
    part.type === 'data-conexus-preview' ? [PreviewData.parse(part.data)] : [],
  )
}

export type Previewing = Awaited<ReturnType<typeof previewing>>

/** The Projeto's versions as its owner lists them on the Versões tab. */
export async function versionsOf(subject: Previewing, person: Person = subject.ana) {
  const listed = await call(subject.hub, person, 'GET', subject.versions)
  assert.equal(listed.statusCode, 200)
  return Object(listed.json()).versions.map((version: Record<string, unknown>) => ({
    number: version.number,
    state: version.state,
    live: version.live,
    failure: version.failure,
    sentBy: version.sentBy,
  }))
}

/**
 * One turn of `person` on a new conversation of the Projeto: its events, and what its version's
 * message says of the Prévia when last told, the `sending` told at the save replaced by the end.
 */
export async function turn(t: TestContext, subject: Previewing, person?: Person) {
  const { hub, conversations } = subject
  const { url, events } = await asked(t, { hub, person: person ?? subject.ana, conversations })
  const told = events.flatMap((event) =>
    event.type === 'message_start' &&
    event.message.content.parts.some((part) => part.type === 'data-conexus-version')
      ? [event.message.content.parts]
      : [],
  )
  return { url, events, previews: previewsIn(told.at(-1) ?? []) }
}
