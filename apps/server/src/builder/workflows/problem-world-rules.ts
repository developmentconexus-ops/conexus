import type { Balloon, PersonId, WorkflowProblem } from '@conexus/hub-api'
import type { z } from 'zod'
import { refsOf } from './compile-refs.ts'
import type { Spot } from './problem-walk.ts'
import { problemAt } from './problem-walk.ts'
import type { OfferedKit, PersonSpeaker, World } from './world.ts'

export type Seen = Readonly<{
  kits: readonly OfferedKit[]
  agents: Awaited<ReturnType<World['agents']>>
  workflows: Awaited<ReturnType<World['workflows']>>
  people: ReadonlySet<PersonId>
  speaker: PersonSpeaker | undefined
}>

/** Whether a text a person typed fits a field of an operation: it is checked as the text, the number or the yes/no it reads as. */
function fits(field: z.ZodType, text: string): boolean {
  return [text, Number(text), text === 'true' ? true : text === 'false' ? false : text].some(
    (value) => field.safeParse(value).success,
  )
}

function inputProblems(spot: Spot, input: z.ZodObject, given: Readonly<Record<string, string>>) {
  const problems: WorkflowProblem[] = []
  const title = spot.balloon.title
  for (const [name, text] of Object.entries(given)) {
    const field = input.shape[name]
    if (field === undefined) {
      problems.push(
        problemAt(
          'INPUT_FIELD_UNKNOWN',
          spot,
          `input.${name}`,
          `“${title}”: a operação não tem o campo ${name}.`,
        ),
      )
    } else if (refsOf(text).length === 0 && !fits(field, text)) {
      problems.push(
        problemAt(
          'INPUT_FIELD_INVALID',
          spot,
          `input.${name}`,
          `“${title}”: o valor de ${name} não serve.`,
        ),
      )
    }
  }
  for (const [name, field] of Object.entries(input.shape)) {
    if (given[name] === undefined && !field.safeParse(undefined).success) {
      problems.push(
        problemAt(
          'INPUT_FIELD_MISSING',
          spot,
          `input.${name}`,
          `“${title}”: falta o campo ${name}.`,
        ),
      )
    }
  }
  return problems
}

/** A READ or a WRITE: the connection is released, the operation exists and is of the right class, the role holds it, the fields fit. */
export async function operationProblems(
  world: World,
  seen: Seen,
  spot: Spot,
  balloon: Extract<Balloon, { kind: 'READ' | 'WRITE' }>,
): Promise<WorkflowProblem[]> {
  const { connectionId, operation } = balloon
  if (connectionId === null || operation === null) return []
  const title = balloon.title
  const kit = seen.kits.find((each) => each.connectionId === connectionId)
  if (kit === undefined) {
    return [
      problemAt(
        'CONNECTION_NOT_OFFERED',
        spot,
        'connectionId',
        `“${title}” usa uma ligação que não está liberada aqui.`,
      ),
    ]
  }
  const read = kit.reads.find((each) => each.id === operation)
  const write = kit.writes.find((each) => each.id === operation)
  const found = read ?? write
  if (found === undefined) {
    return [
      problemAt(
        'OPERATION_UNKNOWN',
        spot,
        'operation',
        `“${title}” usa uma operação que a ligação não tem.`,
      ),
    ]
  }
  if ((balloon.kind === 'READ') !== (read !== undefined)) {
    const need = balloon.kind === 'READ' ? 'uma leitura' : 'uma escrita'
    return [
      problemAt(
        'OPERATION_WRONG_CLASS',
        spot,
        'operation',
        `“${title}” precisa de ${need}, e esta operação não é.`,
      ),
    ]
  }
  const target = { connectionId, connectorId: kit.connectorId, operationId: operation }
  const allowed = seen.speaker !== undefined && (await world.mayUse(seen.speaker, target))
  if (!allowed) {
    return [
      problemAt(
        'OPERATION_NOT_IN_ROLE',
        spot,
        'operation',
        `Quem publica não pode usar esta operação em “${title}”.`,
      ),
    ]
  }
  return found.input === null ? [] : inputProblems(spot, found.input, balloon.input)
}

/** A person named in a balloon is still in the company. */
export function peopleProblems(
  seen: Seen,
  spot: Spot,
  people: readonly PersonId[],
): WorkflowProblem[] {
  return people
    .filter((person) => !seen.people.has(person))
    .map(() =>
      problemAt(
        'PERSON_NOT_FOUND',
        spot,
        null,
        `“${spot.balloon.title}” nomeia uma pessoa que não está mais na empresa.`,
      ),
    )
}
