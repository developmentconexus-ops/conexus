import type { ToolSummary, ToolVersionDetail } from '@conexus/hub-api'
import { FAILURES, PROBLEM_MEDIA_TYPE, ToolVersionBody, ToolVersionId } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { problemOf } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA as SANKHYA } from '../../platform/test-kit.ts'

type Held = { tools?: ToolSummary[]; toolVersions?: ToolVersionDetail[] }

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
