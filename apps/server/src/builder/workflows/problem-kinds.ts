import type { Balloon, WorkflowId, WorkflowProblem } from '@conexus/hub-api'
import { refsOf, valuesOf } from './compile-refs.ts'
import type { Spot } from './problem-walk.ts'
import { problemAt, spotsOf } from './problem-walk.ts'
import type { Seen } from './problem-world-rules.ts'
import { peopleProblems } from './problem-world-rules.ts'
import type { World } from './world.ts'

type Of<K extends Balloon['kind']> = Extract<Balloon, { kind: K }>

/** Who answers: a named person still in the company. */
export function approverProblems(
  seen: Seen,
  spot: Spot,
  balloon: Of<'AGENT' | 'APPROVAL' | 'WRITE'>,
) {
  return balloon.approver.kind === 'PERSON'
    ? peopleProblems(seen, spot, [balloon.approver.personId])
    : []
}

/** A WRITE: Faz sozinho is the role's to allow, and a named approver holds the write in their own role. */
export async function writeProblems(
  world: World,
  seen: Seen,
  spot: Spot,
  balloon: Of<'WRITE'>,
  publisher: Parameters<World['mayLeaveAlone']>[0],
): Promise<WorkflowProblem[]> {
  const { connectionId, operation } = balloon
  const kit = seen.kits.find((each) => each.connectionId === connectionId)
  if (kit === undefined || operation === null || connectionId === null) return []
  const target = { connectionId, connectorId: kit.connectorId, operationId: operation }
  const problems: WorkflowProblem[] = []
  if (
    balloon.approval === 'AUTO' &&
    !(await world.mayLeaveAlone(publisher, { ...target, slug: balloon.id }))
  ) {
    problems.push(
      problemAt(
        'WRITE_AUTO_NOT_ALLOWED',
        spot,
        'approval',
        `Quem publica não pode deixar “${balloon.title}” escrever sozinho.`,
      ),
    )
  }
  if (balloon.approver.kind === 'PERSON' && seen.people.has(balloon.approver.personId)) {
    const speaker = await world.speakerOf(balloon.approver.personId)
    if (speaker === undefined || !(await world.mayUse(speaker, target))) {
      problems.push(
        problemAt(
          'PERSON_CANNOT_APPROVE',
          spot,
          'approver',
          `Quem aprova “${balloon.title}” não pode usar esta escrita.`,
        ),
      )
    }
  }
  return problems
}

/** An AGENT: the agent exists, is published, lives where the workflow lives; the Assistant's connections are released. */
export function agentProblems(
  seen: Seen,
  world: World,
  spot: Spot,
  balloon: Of<'AGENT'>,
): WorkflowProblem[] {
  const { agent } = balloon
  const title = balloon.title
  if (agent === null) return []
  if (agent.kind === 'ASSISTANT') {
    return agent.connections
      .filter((id) => !seen.kits.some((kit) => kit.connectionId === id))
      .map(() =>
        problemAt(
          'CONNECTION_NOT_OFFERED',
          spot,
          'agent',
          `“${title}” usa uma ligação que não está liberada aqui.`,
        ),
      )
  }
  const found = seen.agents.find((each) => each.agentId === agent.agentId)
  if (found === undefined)
    return [problemAt('AGENT_NOT_FOUND', spot, 'agent', `“${title}” usa um agente que não existe.`)]
  if (world.place.kind === 'COMPANY') {
    return [
      problemAt(
        'AGENT_IN_COMPANY',
        spot,
        'agent',
        `“${title}” usa um agente publicado, e um workflow da empresa não usa agentes de Projeto.`,
      ),
    ]
  }
  if (found.projectId !== world.place.projectId) {
    return [
      problemAt('AGENT_OTHER_PROJECT', spot, 'agent', `“${title}” usa um agente de outro Projeto.`),
    ]
  }
  return found.activeVersion === null
    ? [
        problemAt(
          'AGENT_NOT_PUBLISHED',
          spot,
          'agent',
          `“${title}” usa um agente que ainda não foi publicado.`,
        ),
      ]
    : []
}

/** The trigger fields a workflow reads, which a USE of it must fill. */
function triggerFieldsOf(balloons: readonly Balloon[]): ReadonlySet<string> {
  const fields = new Set<string>()
  for (const { balloon } of spotsOf([...balloons])) {
    for (const text of Object.values(valuesOf(balloon)))
      for (const ref of refsOf(text))
        if (ref.who === 'gatilho' && ref.field !== 'dia') fields.add(ref.field)
  }
  return fields
}

function samePlace(a: World['place'], b: World['place']): boolean {
  return (
    a.kind === b.kind &&
    (a.kind === 'COMPANY' || (b.kind === 'PROJECT' && a.projectId === b.projectId))
  )
}

/** A USE: the other workflow is published, is not this one, lives in the same place, and gets every field it reads; its operations are the publisher's to use. */
export async function usedProblems(
  world: World,
  seen: Seen,
  self: WorkflowId,
  spot: Spot,
  balloon: Of<'USE'>,
): Promise<WorkflowProblem[]> {
  const { workflowId } = balloon
  const title = balloon.title
  if (workflowId === null) return []
  if (workflowId === self)
    return [problemAt('USE_ITSELF', spot, 'workflowId', `“${title}” usa o próprio workflow.`)]
  const other = seen.workflows.find((each) => each.workflowId === workflowId)
  if (other === undefined || other.frozen === null) {
    return [
      problemAt(
        'USE_NOT_PUBLISHED',
        spot,
        'workflowId',
        `“${title}” usa um workflow que não tem versão publicada.`,
      ),
    ]
  }
  if (!samePlace(other.place, world.place)) {
    return [
      problemAt(
        'USE_OTHER_PLACE',
        spot,
        'workflowId',
        `“${title}” usa um workflow de outro lugar.`,
      ),
    ]
  }
  const problems = [...triggerFieldsOf(other.frozen.draft.balloons)]
    .filter((field) => balloon.input[field] === undefined)
    .map((field) =>
      problemAt(
        'USE_INPUT_MISSING',
        spot,
        'input',
        `“${title}”: o outro workflow lê ${field}, e falta preencher.`,
      ),
    )
  for (const declared of other.frozen.declared) {
    const kit = seen.kits.find((each) => each.connectionId === declared.connectionId)
    const allowed =
      kit !== undefined &&
      seen.speaker !== undefined &&
      (await world.mayUse(seen.speaker, {
        connectionId: declared.connectionId,
        connectorId: kit.connectorId,
        operationId: declared.operation,
      }))
    if (!allowed) {
      problems.push(
        problemAt(
          'OPERATION_NOT_IN_ROLE',
          spot,
          'workflowId',
          `Quem publica não pode usar uma operação do workflow que “${title}” usa.`,
        ),
      )
    }
  }
  return problems
}

/** A FOREACH takes the list of the READ right before it, which the kit marks as returning many. */
export function foreachProblems(seen: Seen, spot: Spot, balloon: Of<'FOREACH'>): WorkflowProblem[] {
  const before = spot.previous
  const kit =
    before?.kind === 'READ'
      ? seen.kits.find((each) => each.connectionId === before.connectionId)
      : undefined
  const many =
    before?.kind === 'READ' &&
    kit?.reads.find((each) => each.id === before.operation)?.many === true
  return many
    ? []
    : [
        problemAt(
          'FOREACH_NOT_A_LIST',
          spot,
          null,
          `“${balloon.title}” precisa de uma leitura de lista logo antes.`,
        ),
      ]
}
