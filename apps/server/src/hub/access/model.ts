import type {
  CatalogSystem,
  CatalogTable,
  CompanyId,
  ConnectionId,
  ConnectionState,
  OperationEffect,
  PersonId,
  ProjectId,
  Role,
} from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import type { Declared } from '../identity/public.ts'

export type Place = Readonly<{ kind: 'COMPANY' } | { kind: 'PROJECT'; projectId: ProjectId }>

/** Which connections a conversation reads: every one its place offers, or the ones it chose. */
export type Choice = Readonly<
  { kind: 'ANY' } | { kind: 'CHOSEN'; connections: readonly ConnectionId[] }
>

export function chosenIn(choice: Choice, connection: ConnectionId): boolean {
  return choice.kind === 'ANY' || choice.connections.includes(connection)
}

/** Who asks, where, through which consumer: what the door is told before it reads anything. */
export type ConsumerContext = Readonly<
  | {
      consumer: 'assistant'
      companyId: CompanyId
      personId: PersonId
      place: Place
      choice: Choice
    }
  | { consumer: 'builder'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | { consumer: 'construtor'; companyId: CompanyId; personId: PersonId; projectId: ProjectId }
  | {
      consumer: 'agent'
      companyId: CompanyId
      personId: PersonId
      place: Place
      declared: Declared
      choice: Choice
    }
>

export type Consumer = ConsumerContext['consumer']

/** One thing the door answers for: a table by its name, or one operation of one connection. */
export const LeafKey = z.string().brand<'LeafKey'>()
export type LeafKey = z.infer<typeof LeafKey>

export type Verdict = Readonly<
  | { kind: 'ALLOWED'; ceiling: OperationEffect }
  | { kind: 'REFUSED'; reason: 'OUT_OF_REACH' | 'ABOVE_CEILING' }
>

/** What today's owners say a place offers, read in the door's one transaction; they admit nobody. */
export type AccessSources = Readonly<{
  systems(
    tx: ReadTx,
    at: Readonly<{ companyId: CompanyId; place: Place }>,
  ): Promise<
    Readonly<{
      systems: readonly CatalogSystem[]
      given: ReadonlyMap<ConnectionId, ConnectionState>
    }>
  >
  tables(
    tx: ReadTx,
    at: Readonly<{
      companyId: CompanyId
      place: Place
      role: Role
      given: ReadonlyMap<ConnectionId, ConnectionState>
    }>,
  ): Promise<readonly CatalogTable[]>
}>

export type Snapshot = Readonly<{
  systems: readonly CatalogSystem[]
  tables: readonly CatalogTable[]
  /** The operations `mayUseEach` allowed. */
  allowed: ReadonlySet<LeafKey>
}>

/** Every leaf in reach, with the most it may do. */
export type Reach = ReadonlyMap<LeafKey, OperationEffect>
