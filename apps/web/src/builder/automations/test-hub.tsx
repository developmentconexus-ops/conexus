import type { AutomationRun, AutomationSummary, CreateAutomation } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  AutomationId,
  AutomationRunId,
  ConnectionId,
  ConversationId,
  createAutomation,
  listAutomationRuns,
  listAutomations,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'

export const RESUMO = AutomationId.parse(
  'schedule_conexus-automation-11111111-1111-4111-8111-111111111111',
)
export const METAS = AutomationId.parse(
  'schedule_conexus-automation-22222222-2222-4222-8222-222222222222',
)
const MATRIZ = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
export const RAN = ConversationId.parse('66666666-6666-4666-8666-666666666666')

const BASE = `*/api/companies/${COMPANY.id}/automations`

/** An automation as the Hub lists it: Resumo de vendas, every day at 07:00, reading the Matriz, from the Início. */
export function automation(fields: Partial<AutomationSummary> = {}): AutomationSummary {
  return listAutomations.success.body.shape.automations.element.parse({
    id: RESUMO,
    name: 'Resumo de vendas',
    prompt: 'Resuma as vendas de ontem, por vendedor.',
    cadence: { kind: 'DAILY', time: '07:00' },
    projectId: null,
    connections: [{ connectionId: MATRIZ, connector: 'sankhya', name: 'Matriz', chosen: true }],
    state: 'ACTIVE',
    nextRunAt: '2026-11-02T10:00:00.000Z',
    createdAt: '2026-11-01T12:00:00.000Z',
    ...fields,
  })
}

/** A run as the history lists it. */
export function run(fields: Partial<AutomationRun> = {}): AutomationRun {
  return listAutomationRuns.success.body.shape.runs.element.parse({
    runId: AutomationRunId.parse(`sched_${RESUMO}_1793520000000`),
    firedAt: '2026-11-01T10:00:00.000Z',
    trigger: 'SCHEDULED',
    state: { kind: 'DONE', conversationId: RAN },
    ...fields,
  })
}

export type Answers = {
  /** What a write of one automation answers instead of the Hub's success. */
  write?: () => Response | undefined
}

type Sent = { method: string; path: string; body: unknown; key: string | null }

/**
 * The Hub's automations on `server`: a list that changes as the writes land, and the runs of each.
 * `sent` holds every write, with its attempt key.
 */
export function automationsHub(
  server: ReturnType<typeof setupServer>,
  held: { automations: AutomationSummary[]; runs?: AutomationRun[]; answers?: Answers },
) {
  const sent: Sent[] = []
  const { answers = {} } = held
  async function note(request: Request) {
    const text = await request.text()
    const body: unknown = text === '' ? undefined : JSON.parse(text)
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body,
      key: request.headers.get(ATTEMPT_KEY_HEADER),
    })
    return body
  }
  function change(id: unknown, fields: Partial<AutomationSummary>) {
    const found = held.automations.find((one) => one.id === id)
    if (found === undefined) return undefined
    Object.assign(found, fields)
    return found
  }
  server.use(
    http.get(BASE, ({ request }) => {
      const project = new URL(request.url).searchParams.get('projectId')
      const here = held.automations.filter((one) => one.projectId === project)
      return HttpResponse.json({ automations: here })
    }),
    http.post(BASE, async ({ request }) => {
      const body = createAutomation.input.body.parse(await note(request))
      const replaced = answers.write?.()
      if (replaced) return replaced
      const made = automation({ ...madeFrom(body), id: RESUMO })
      held.automations.push(made)
      return HttpResponse.json({ automation: made }, { status: 201 })
    }),
    http.post(`${BASE}/:id/pause`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.write?.()
      if (replaced) return replaced
      const found = change(params.id, { state: 'PAUSED', nextRunAt: null })
      return found ? HttpResponse.json({ automation: found }) : refusal('AUTOMATION_NOT_FOUND')
    }),
    http.post(`${BASE}/:id/resume`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.write?.()
      if (replaced) return replaced
      const found = change(params.id, { state: 'ACTIVE', nextRunAt: '2026-11-02T10:00:00.000Z' })
      return found ? HttpResponse.json({ automation: found }) : refusal('AUTOMATION_NOT_FOUND')
    }),
    http.post(`${BASE}/:id/run`, async ({ request }) => {
      await note(request)
      const replaced = answers.write?.()
      if (replaced) return replaced
      return HttpResponse.json({ runId: run().runId }, { status: 202 })
    }),
    http.delete(`${BASE}/:id`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.write?.()
      if (replaced) return replaced
      held.automations = held.automations.filter((one) => one.id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${BASE}/:id/runs`, () =>
      HttpResponse.json({ runs: held.runs ?? [], next: { kind: 'END' } }),
    ),
  )
  return { sent, writes: () => sent.filter((one) => one.method !== 'GET') }
}

function madeFrom(body: CreateAutomation): Partial<AutomationSummary> {
  return {
    name: body.name,
    prompt: body.prompt,
    cadence: body.cadence,
    projectId: body.projectId ?? null,
  }
}
