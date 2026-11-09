import type { Balloon, WorkflowDraft } from '@conexus/hub-api'
import { BalloonId, ConnectionId, OperationId, WorkflowId } from '@conexus/hub-api'
import { Mastra } from '@mastra/core/mastra'
import { InMemoryStore } from '@mastra/core/storage'
import type { FrozenWorkflow } from './frozen.ts'
import { readyDraftOf } from './frozen.ts'
import type { NOT_BUILT } from './tools.ts'
import { workflowTools } from './tools.ts'

export const WORKFLOW_A = WorkflowId.parse('11111111-1111-4111-8111-111111111111')
export const WORKFLOW_B = WorkflowId.parse('22222222-2222-4222-8222-222222222222')
export const CONNECTION = ConnectionId.parse('33333333-3333-4333-8333-333333333333')

type Leaf<K extends Balloon['kind']> = Extract<Balloon, { kind: K }>

export function read(n: number, input: Record<string, string> = {}): Leaf<'READ'> {
  return {
    kind: 'READ',
    id: BalloonId.parse(`b${n}`),
    title: `Ler ${n}`,
    connectionId: CONNECTION,
    operation: OperationId.parse('pedidos'),
    input,
  }
}

export function notify(n: number, message: string): Leaf<'NOTIFY'> {
  return { kind: 'NOTIFY', id: BalloonId.parse(`b${n}`), title: `Avisar ${n}`, people: [], message }
}

export function approval(n: number, question: string): Leaf<'APPROVAL'> {
  return {
    kind: 'APPROVAL',
    id: BalloonId.parse(`b${n}`),
    title: `Aprovar ${n}`,
    approver: { kind: 'ACTIVATED_BY' },
    question,
  }
}

export function ifBalloon(n: number, field: string, yes: Balloon[], no: Balloon[]): Leaf<'IF'> {
  return {
    kind: 'IF',
    id: BalloonId.parse(`b${n}`),
    title: `Se ${n}`,
    when: { field, op: 'gt', than: 10 },
    // biome-ignore lint/suspicious/noThenProperty: `then` is the "se sim" path of the document
    then: yes,
    else: no,
  }
}

export function parallel(n: number, paths: Balloon[][]): Leaf<'PARALLEL'> {
  return { kind: 'PARALLEL', id: BalloonId.parse(`b${n}`), title: `Ao mesmo tempo ${n}`, paths }
}

export function foreach(n: number, body: Balloon[]): Leaf<'FOREACH'> {
  return { kind: 'FOREACH', id: BalloonId.parse(`b${n}`), title: `Para cada ${n}`, body }
}

export function loop(n: number, max: number, field: string, body: Balloon[]): Leaf<'LOOP'> {
  return {
    kind: 'LOOP',
    id: BalloonId.parse(`b${n}`),
    title: `Repetir ${n}`,
    until: { field, op: 'gte', than: 5 },
    max,
    body,
  }
}

export function use(
  n: number,
  workflowId: WorkflowId,
  input: Record<string, string> = {},
): Leaf<'USE'> {
  return { kind: 'USE', id: BalloonId.parse(`b${n}`), title: `Usar ${n}`, workflowId, input }
}

function readsOf(balloons: readonly Balloon[], many: readonly string[]): FrozenWorkflow['reads'] {
  return balloons.flatMap((balloon): FrozenWorkflow['reads'] => {
    if (balloon.kind === 'READ') return [{ balloonId: balloon.id, many: many.includes(balloon.id) }]
    if (balloon.kind === 'IF') return readsOf([...balloon.then, ...balloon.else], many)
    if (balloon.kind === 'PARALLEL') return readsOf(balloon.paths.flat(), many)
    if (balloon.kind === 'FOREACH' || balloon.kind === 'LOOP') return readsOf(balloon.body, many)
    return []
  })
}

/** A frozen version of a draft, as publishing would write it; `many` names the READ the kit marks as a list. */
export function frozenOf(
  balloons: Balloon[],
  options: { many?: string[]; uses?: FrozenWorkflow['uses'] } = {},
): FrozenWorkflow {
  const draft: WorkflowDraft = { name: 'Fluxo', trigger: { kind: 'MANUAL' }, balloons }
  return {
    draft: readyDraftOf(draft),
    agents: [],
    uses: options.uses ?? [],
    reads: readsOf(balloons, options.many ?? []),
    declared: [],
  }
}

/** A `Mastra` with the eight tools, each answering what the test says; the counter reads `max` from the loop's id. */
export function testMastra(
  executors: Partial<typeof NOT_BUILT> = {},
  limit: Parameters<typeof workflowTools>[0]['limit'] = async () => 3,
): Mastra {
  return new Mastra({
    storage: new InMemoryStore(),
    tools: workflowTools({ limit, executors: { ...echoes(), ...executors } }),
  })
}

function echoes(): typeof NOT_BUILT {
  return {
    'conexus-conferir': async (input) => ({ ...input, dia: '08/11/2026' }),
    'conexus-ler': async () => ({ resultado: {} }),
    'conexus-ler-lista': async () => [],
    'conexus-agente': async () => ({ texto: 'oi', conversationId: 'c1' }),
    'conexus-aprovar': async () => ({ aprovado: true, por: 'p1' }),
    'conexus-escrever': async () => ({ resultado: {}, marca: 'm1' }),
    'conexus-avisar': async () => ({ avisados: [] }),
  }
}
