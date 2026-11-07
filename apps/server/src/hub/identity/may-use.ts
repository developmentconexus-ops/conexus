import type {
  CompanyId,
  ConnectionId,
  ConnectorId,
  OperationId,
  PersonId,
  Role,
} from '@conexus/hub-api'
import { hasPermission } from 'better-auth/plugins'
import type { Database } from '../../platform/database.ts'
import { roleOf } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { libraryCommandOn, ORGANIZATION } from './auth.ts'

/**
 * Who asks for a read. A person is held to their role in the company; a published version (an
 * agent's, an app's) to what it declares, which publishing checked against the publisher's role
 * (decision C1): each entry is a connection of the Projeto and one of its operations.
 */
export type Speaker =
  | Readonly<{ kind: 'PERSON'; personId: PersonId; role: Role }>
  | Readonly<{
      kind: 'VERSION'
      declared: readonly Readonly<{ connectionId: ConnectionId; operation: OperationId }>[]
    }>

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
 * library's memory cache off, so a role changed answers differently on the next call. The library
 * reads in a short transaction of its own, never the caller's.
 */
export function createMayUse(auth: Auth, database: Database) {
  const command: LibraryCommand = libraryCommandOn(auth, database)

  function declares(speaker: Extract<Speaker, { kind: 'VERSION' }>, target: Target): boolean {
    return speaker.declared.some(
      (each) => each.connectionId === target.connectionId && each.operation === target.operationId,
    )
  }

  /** Each target answered in one short transaction of the library's, so a long list is one read of the roles. */
  async function mayUseEach(
    companyId: CompanyId,
    speaker: Speaker,
    targets: readonly Target[],
  ): Promise<boolean[]> {
    if (speaker.kind === 'VERSION') return targets.map((target) => declares(speaker, target))
    if (targets.length === 0) return []
    const context = await auth.$context
    return command({ kind: 'COMPANY', companyId, personId: null }, async () => {
      const answers: boolean[] = []
      for (const target of targets) {
        answers.push(
          await hasPermission(
            {
              options: ORGANIZATION,
              organizationId: companyId,
              role: speaker.role,
              permissions: { [`connector_${target.connectorId}`]: [target.operationId] },
            },
            // @ts-expect-error: better-auth 1.7.8 types the context parameter with an options type no configured auth's context matches (invariant); the function reads only context.adapter and context.logger.
            { context },
          ),
        )
      }
      return answers
    })
  }

  async function mayUse(companyId: CompanyId, speaker: Speaker, target: Target): Promise<boolean> {
    const [answer] = await mayUseEach(companyId, speaker, [target])
    return answer === true
  }
  return { mayUse, mayUseEach, roleOf }
}
