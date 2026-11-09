import type {
  CompanyId,
  ConnectionId,
  ConnectorId,
  OperationId,
  PersonId,
  Role,
} from '@conexus/hub-api'
import { hasPermission } from 'better-auth/plugins'
import type { Database, ReadTx } from '../../platform/database.ts'
import { roleOf } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { libraryCommandOn } from './auth.ts'
import { organizationWith } from './organization.ts'
import type { RoleSet } from './roles.ts'

/**
 * Who asks for a read. A person is held to their role in the company; a published version (an
 * agent's, an app's, a workflow's) to what it declares, which publishing checked against the
 * publisher's role (decision C1): each entry is a connection of the Projeto and one of its operations.
 */
type Declared = readonly Readonly<{ connectionId: ConnectionId; operation: OperationId }>[]
export type Speaker =
  | Readonly<{ kind: 'PERSON'; personId: PersonId; role: Role }>
  | Readonly<{ kind: 'VERSION'; declared: Declared }>
  | Readonly<{ kind: 'WORKFLOW'; declared: Declared }>

export type PersonSpeaker = Extract<Speaker, { kind: 'PERSON' }>

/** The person as the role they hold now, read in the caller's transaction; none for someone who is no member. */
export async function speakerOf(
  tx: ReadTx,
  companyId: CompanyId,
  personId: PersonId,
): Promise<PersonSpeaker | undefined> {
  const role = await roleOf(tx, companyId, personId)
  return role === undefined ? undefined : personOf(personId, role)
}

/** The person with a role the caller already read (the Assistant's admission). */
export function personOf(personId: PersonId, role: Role): PersonSpeaker {
  return { kind: 'PERSON', personId, role }
}

/** The operation a speaker asks to use: the connection it runs on, the kit's connector and operation. */
export type Target = Readonly<{
  connectionId: ConnectionId
  connectorId: ConnectorId
  operationId: OperationId
}>

/** The name the model and the logs read for the speaker's role; a version has none. */
export function roleOfSpeaker(speaker: Speaker): string | null {
  return speaker.kind === 'PERSON' ? speaker.role : null
}

/**
 * Whether the speaker may use the operation, read now: the library's own `hasPermission` (not its
 * route, which needs a session) over the company's stored roles, with no cache of ours and the
 * library's memory cache off for each call's first target, so a role changed answers differently on
 * the next call. The library
 * reads in a short transaction of its own, never the caller's.
 */
export function createMayUse(auth: Auth, database: Database, roles: RoleSet) {
  const options = organizationWith(roles)
  const command: LibraryCommand = libraryCommandOn(auth, database)

  /** The library's `hasPermission` over the company's roles, the one call both questions make. */
  function permitted(
    context: Awaited<Auth['$context']>,
    asked: Omit<Parameters<typeof hasPermission>[0], 'options'>,
  ) {
    return hasPermission(
      { options, ...asked },
      // @ts-expect-error: better-auth 1.7.8 types the context parameter with an options type no configured auth's context matches (invariant); the function reads only context.adapter and context.logger.
      { context },
    )
  }

  function declares(speaker: Exclude<Speaker, { kind: 'PERSON' }>, target: Target): boolean {
    return speaker.declared.some(
      (each) => each.connectionId === target.connectionId && each.operation === target.operationId,
    )
  }

  /** Each target answered in one short transaction of the library's, with one read of the roles for the whole list. */
  async function mayUseEach(
    companyId: CompanyId,
    speaker: Speaker,
    targets: readonly Target[],
  ): Promise<boolean[]> {
    if (speaker.kind !== 'PERSON') return targets.map((target) => declares(speaker, target))
    if (targets.length === 0) return []
    const context = await auth.$context
    return command({ kind: 'COMPANY', companyId, personId: null }, async () => {
      const answers: boolean[] = []
      for (const [index, target] of targets.entries()) {
        answers.push(
          await permitted(context, {
            organizationId: companyId,
            role: speaker.role,
            // The first target reads the roles and the library keeps them for the company; the rest of
            // this call take that read, so a long list is one read, and the next call reads again.
            useMemoryCache: index > 0,
            permissions: { [`connector_${target.connectorId}`]: [target.operationId] },
          }),
        )
      }
      return answers
    })
  }

  async function mayUse(companyId: CompanyId, speaker: Speaker, target: Target): Promise<boolean> {
    const [answer] = await mayUseEach(companyId, speaker, [target])
    return answer === true
  }

  /** Whether the role publishes a write that runs without asking (step 24.5), read now as `mayUse` reads. */
  async function mayPublishUnattended(companyId: CompanyId, role: Role): Promise<boolean> {
    const context = await auth.$context
    return command({ kind: 'COMPANY', companyId, personId: null }, () =>
      permitted(context, {
        organizationId: companyId,
        role,
        useMemoryCache: false,
        permissions: { agent: ['publishUnattendedWrite'] },
      }),
    )
  }
  return { mayUse, mayUseEach, mayPublishUnattended }
}
