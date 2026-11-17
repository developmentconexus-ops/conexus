import type { CompanyId, PersonId } from '@conexus/hub-api'
import type { Declared } from '../identity/public.ts'
import type { Choice, Consumer, ConsumerContext, Place } from './model.ts'

let sealPrincipal: (fields: Fields) => Principal

type Fields = Readonly<{
  consumer: Consumer
  companyId: CompanyId
  personId: PersonId
  place: Place
  declared: Declared | undefined
  choice: Choice
}>

// Nominal like MemberProof: the private constructor keeps out `new`, the private member keeps out a
// literal of the same shape, so only principalFor makes one (code C16).

/** Who the door answers for: the consumer, the person and the place, resolved once from its context. */
export class Principal {
  readonly consumer: Consumer
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly place: Place
  /** What a published version declares. */
  readonly declared: Declared | undefined
  /** The connections the conversation reads among those its place offers. */
  readonly choice: Choice
  declare private readonly nominal: never

  private constructor(fields: Fields) {
    this.consumer = fields.consumer
    this.companyId = fields.companyId
    this.personId = fields.personId
    this.place = fields.place
    this.declared = fields.declared
    this.choice = fields.choice
  }

  static {
    sealPrincipal = (fields) => new Principal(fields)
  }
}

const ANY: Choice = { kind: 'ANY' }

export function principalFor(context: ConsumerContext): Principal {
  const { consumer, companyId, personId } = context
  switch (context.consumer) {
    case 'assistant':
      return sealPrincipal({
        ...{ consumer, companyId, personId, declared: undefined },
        ...{ place: context.place, choice: context.choice },
      })
    case 'builder':
    case 'construtor':
      return sealPrincipal({
        ...{ consumer, companyId, personId, declared: undefined, choice: ANY },
        place: { kind: 'PROJECT', projectId: context.projectId },
      })
    case 'agent':
      return sealPrincipal({
        ...{ consumer, companyId, personId },
        ...{ place: context.place, declared: context.declared, choice: context.choice },
      })
    default:
      return context satisfies never
  }
}
