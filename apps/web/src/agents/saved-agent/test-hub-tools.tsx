import type { Connection, ToolSummary, ToolVersionDetail, WrittenRow } from '@conexus/hub-api'
import { FAILURES, PROBLEM_MEDIA_TYPE, ToolVersionBody, ToolVersionId } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { SANKHYA as SANKHYA_ENTRY } from '../../hub/connectors/fixtures.ts'
import { problemOf } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA as SANKHYA } from '../../platform/test-kit.ts'
import { MATRIZ } from './test-agents.ts'

export type ToolHeld = {
  tools?: ToolSummary[]
  /** The versions of every tool the Projeto reads, newest last; a tool read without them has version 1 alone. */
  toolVersions?: ToolVersionDetail[]
  /** The agent's writes as the record keeps them: the card of a write warns of the open ones and ends as the row says (step 24.5). */
  writes?: WrittenRow[]
  /** What the read of the writes answers instead of the list: a failure, or an answer that waits. */
  writesAnswer?: () => Response | Promise<Response>
}
type Held = ToolHeld

/** The writes of a conversation as the record keeps them. */
export function writesRoute(held: Held, projectApi: string) {
  return http.get(
    `${projectApi}/agents/:id/conversations/:conversationId/writes`,
    () => held.writesAnswer?.() ?? HttpResponse.json({ writes: held.writes ?? [] }),
  )
}

/** The library's tool by id: its versions, the next version and the deletion the Hub refuses while an agent uses it. */
export function toolRoutes(
  held: Held,
  projectApi: string,
  note: (request: Request) => Promise<unknown>,
) {
  function detail(tool: ToolSummary) {
    const versions = held.toolVersions ?? [
      {
        ...{ kind: 'PRESET', id: tool.latest.id, number: 1 },
        ...{ description: tool.description, bound: {}, open: [] },
      },
    ]
    return { ...tool, versions }
  }
  return [
    http.get(`${projectApi}/tools/:toolId`, ({ params }) => {
      const found = held.tools?.find((one) => one.id === params.toolId)
      return found ? HttpResponse.json({ tool: detail(found) }) : refusal('TOOL_NOT_FOUND')
    }),
    http.post(`${projectApi}/tools/:toolId/versions`, async ({ request, params }) => {
      const { basedOn: _, ...body } = ToolVersionBody.parse(await note(request))
      const found = held.tools?.find((one) => one.id === params.toolId)
      if (!found) return refusal('TOOL_NOT_FOUND')
      const number = found.latest.number + 1
      const made = {
        kind: 'PRESET',
        id: ToolVersionId.parse(crypto.randomUUID()),
        number,
        ...body,
      } as const
      held.toolVersions = [...detail(found).versions, made]
      Object.assign(found, { latest: { id: made.id, number }, description: body.description })
      return HttpResponse.json({ tool: detail(found) }, { status: 201 })
    }),
    http.delete(`${projectApi}/tools/:toolId`, async ({ request, params }) => {
      await note(request)
      const found = held.tools?.find((one) => one.id === params.toolId)
      if (!found) return refusal('TOOL_NOT_FOUND')
      if (found.usedBy.length > 0) {
        return HttpResponse.json(
          { ...problemOf('TOOL_IN_USE'), agents: found.usedBy },
          { status: FAILURES.TOOL_IN_USE.status, headers: { 'content-type': PROBLEM_MEDIA_TYPE } },
        )
      }
      held.tools = held.tools?.filter((one) => one.id !== found.id)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/** The catalog the Hub reads, with the Sankhya's subjects: the door's read is the free query. */
export const catalog = http.get('*/api/companies/:companyId/connections', () =>
  HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: true }),
)

/** The company's Matriz, linked to the Sankhya: the card of a write shows the connector's logo from it. */
const MATRIZ_LINK: Connection = {
  id: MATRIZ,
  connector: 'sankhya',
  name: 'Matriz',
  connectorVersion: '1.0.0',
  state: 'ACTIVE',
  linkedBy: null,
  linkedAt: '2026-11-01T12:00:00.000Z',
  testedAt: null,
  testedBy: null,
  account: null,
}

/** The company's catalog with the Sankhya, where the screens read the connectors' names and logos. */
export function catalogRoute() {
  return http.get('*/api/companies/:companyId/connections', () =>
    HttpResponse.json({ connectors: [SANKHYA_ENTRY], connections: [MATRIZ_LINK], mayManage: true }),
  )
}
