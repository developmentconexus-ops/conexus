import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import type { Declared } from '../identity/public.ts'
import type { Place } from './model.ts'
import type { Principal } from './principal.ts'
import { principalFor } from './principal.ts'

type Who = Readonly<{ companyId: CompanyId; personId: PersonId; place: Place }>

/** Who reads the catalog in a place with no choice: the Builder in a Projeto, the Assistant in the company. */
export function readerAt(who: Who): Principal {
  const { companyId, personId, place } = who
  return place.kind === 'PROJECT'
    ? principalFor({ consumer: 'builder', companyId, personId, projectId: place.projectId })
    : principalFor({ consumer: 'assistant', companyId, personId, place, choice: { kind: 'ANY' } })
}

/** An Assistant's conversation in `place` that chose `chosen`. */
export function chooserAt(who: Who, chosen: readonly ConnectionId[]): Principal {
  return principalFor({
    consumer: 'assistant',
    ...who,
    choice: { kind: 'CHOSEN', connections: chosen },
  })
}

/** A version that declares `declared`, in `place`, reading the connections it chose. */
export function versionAt(
  who: Who,
  declared: Declared,
  chosen: readonly ConnectionId[],
): Principal {
  return principalFor({
    consumer: 'agent',
    ...who,
    declared,
    choice: { kind: 'CHOSEN', connections: chosen },
  })
}
