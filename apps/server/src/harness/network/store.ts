import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  CompanyNetworkDomain,
  ConversationId,
  NetworkOpened,
  PersonId,
} from '@conexus/hub-api'
import { CompanyNetworkOpen, NetworkDomain, NetworkDomainId } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { companyNetworkDomain, companyNetworkOpen, conversationNetworkDomain } from './tables.ts'

const COMPANY_LIST = 'a lista de internet da empresa'

const REFUSED_AS = {
  manageNetwork: COMPANY_LIST,
  openConversationNetwork: COMPANY_LIST,
  openAllNetwork: 'a internet toda da empresa',
} as const

type NetworkStore = {
  opened(where: { companyId: CompanyId; conversationId: ConversationId }): Promise<NetworkOpened>
  /**
   * Opens what a person allowed on the card; refused unless their role holds the scope's action now:
   * `openConversationNetwork` for the conversation, `manageNetwork` for the company.
   */
  grant(grant: {
    scope: 'CONVERSATION' | 'COMPANY'
    companyId: CompanyId
    conversationId: ConversationId
    personId: PersonId
    domains: readonly NetworkDomain[]
    reason: string
  }): Promise<void>
  forget(where: { companyId: CompanyId; conversationId: ConversationId }): Promise<void>
  /**
   * Notifies after a domain leaves a company's list, and after every `closeAll`, even one that
   * found the internet already off.
   */
  onRemoved(listener: (companyId: CompanyId) => void): () => void
}

type Asker = { companyId: CompanyId; personId: PersonId }

export type CompanyList = {
  list(who: Asker): Promise<CompanyNetworkDomain[]>
  add(who: Asker, input: { domain: NetworkDomain; reason: string }): Promise<CompanyNetworkDomain>
  remove(who: Asker, id: NetworkDomainId): Promise<void>
  readOpenAll(who: Asker): Promise<CompanyNetworkOpen | null>
  openAll(who: Asker): Promise<CompanyNetworkOpen>
  closeAll(who: Asker): Promise<void>
}

type Deps = { database: Database; identity: IdentityPorts; log: FailureLog }

type Removals = Set<(companyId: CompanyId) => void>

const Row = z.object({
  id: NetworkDomainId,
  domain: NetworkDomain,
  reason: z.string(),
  grantedBy: z.string().nullable(),
  grantedAt: z.date().transform((at) => at.toISOString()),
})

const columns = {
  id: companyNetworkDomain.id,
  domain: companyNetworkDomain.domain,
  reason: companyNetworkDomain.reason,
  grantedBy: personNameColumn(companyNetworkDomain.grantedBy),
  grantedAt: companyNetworkDomain.grantedAt,
}

function scopeOf({ companyId, personId }: Asker) {
  return { kind: 'COMPANY', companyId, personId } as const
}

function hubScopeOf(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

async function admitWriter(
  identity: IdentityPorts,
  tx: CommandTx,
  who: Asker,
  action: keyof typeof REFUSED_AS,
): Promise<void> {
  try {
    await identity.admitMember({ tx, ...who, action })
  } catch (error) {
    if (error instanceof Failure && error.details.reason === 'FORBIDDEN')
      throw new Failure('NOT_IN_ROLE', { named: { operation: REFUSED_AS[action] }, cause: error })
    throw error
  }
}

function insertCompany(
  tx: CommandTx,
  who: Asker,
  domains: readonly NetworkDomain[],
  reason: string,
) {
  const { companyId, personId: grantedBy } = who
  return tx
    .insert(companyNetworkDomain)
    .values(domains.map((domain) => ({ id: randomUUID(), companyId, domain, reason, grantedBy })))
    .onConflictDoNothing({
      target: [companyNetworkDomain.companyId, companyNetworkDomain.domain],
    })
}

function insertConversation(
  tx: CommandTx,
  who: Asker & { conversationId: ConversationId },
  domains: readonly NetworkDomain[],
  reason: string,
) {
  return tx
    .insert(conversationNetworkDomain)
    .values(domains.map((domain) => ({ ...who, domain, reason })))
    .onConflictDoNothing({
      target: [conversationNetworkDomain.conversationId, conversationNetworkDomain.domain],
    })
}

function domainsIn(tx: ReadTx, companyId: CompanyId, conversationId: ConversationId) {
  return tx
    .select({ domain: companyNetworkDomain.domain })
    .from(companyNetworkDomain)
    .where(eq(companyNetworkDomain.companyId, companyId))
    .union(
      tx
        .select({ domain: conversationNetworkDomain.domain })
        .from(conversationNetworkDomain)
        .where(
          and(
            eq(conversationNetworkDomain.companyId, companyId),
            eq(conversationNetworkDomain.conversationId, conversationId),
          ),
        ),
    )
}

async function openAllOf(tx: ReadTx, companyId: CompanyId): Promise<CompanyNetworkOpen | null> {
  const [row] = await tx
    .select({
      openedBy: personNameColumn(companyNetworkOpen.openedBy),
      openedAt: companyNetworkOpen.openedAt,
    })
    .from(companyNetworkOpen)
    .where(eq(companyNetworkOpen.companyId, companyId))
  return row === undefined
    ? null
    : CompanyNetworkOpen.parse({ ...row, openedAt: row.openedAt.toISOString() })
}

function logGranted(
  log: FailureLog,
  companyId: CompanyId,
  scope: 'CONVERSATION' | 'COMPANY',
  domainCount: number,
) {
  log.info({ companyId, scope, domains: domainCount }, 'NETWORK_DOMAIN_GRANTED')
}

type DomainList = Pick<CompanyList, 'list' | 'add' | 'remove'>

function companyList({ database, identity, log }: Deps, removals: Removals): DomainList {
  return {
    list(who) {
      return database.read(scopeOf(who), async (tx) => {
        await identity.admitMember({ tx, ...who, action: 'readNetwork' })
        const rows = await tx
          .select(columns)
          .from(companyNetworkDomain)
          .where(eq(companyNetworkDomain.companyId, who.companyId))
          .orderBy(asc(companyNetworkDomain.domain))
        return rows.map((row) => Row.parse(row))
      })
    },

    async add(who, input) {
      const added = await database.command(scopeOf(who), async (tx) => {
        await admitWriter(identity, tx, who, 'manageNetwork')
        // A removal may commit between the insert that found the domain and the read of it.
        for (;;) {
          await insertCompany(tx, who, [input.domain], input.reason)
          const [row] = await tx
            .select(columns)
            .from(companyNetworkDomain)
            .where(
              and(
                eq(companyNetworkDomain.companyId, who.companyId),
                eq(companyNetworkDomain.domain, input.domain),
              ),
            )
          if (row !== undefined) return Row.parse(row)
        }
      })
      logGranted(log, who.companyId, 'COMPANY', 1)
      return added
    },

    async remove(who, id) {
      await database.command(scopeOf(who), async (tx) => {
        await admitWriter(identity, tx, who, 'manageNetwork')
        const gone = await tx
          .delete(companyNetworkDomain)
          .where(
            and(eq(companyNetworkDomain.companyId, who.companyId), eq(companyNetworkDomain.id, id)),
          )
          .returning({ id: companyNetworkDomain.id })
        if (gone.length === 0)
          throw new Failure('NOT_FOUND', { details: { reason: 'UNKNOWN_DOMAIN' } })
      })
      log.info({ companyId: who.companyId }, 'NETWORK_DOMAIN_REMOVED')
      for (const listener of removals) listener(who.companyId)
    },
  }
}

type OpenAllSwitch = Pick<CompanyList, 'readOpenAll' | 'openAll' | 'closeAll'>

function openAllSwitch({ database, identity, log }: Deps, removals: Removals): OpenAllSwitch {
  return {
    readOpenAll(who) {
      return database.read(scopeOf(who), async (tx) => {
        await identity.admitMember({ tx, ...who, action: 'readNetwork' })
        return openAllOf(tx, who.companyId)
      })
    },

    async openAll(who) {
      const { companyId, personId: openedBy } = who
      const opened = await database.command(scopeOf(who), async (tx) => {
        await admitWriter(identity, tx, who, 'openAllNetwork')
        // A close may commit between the insert that found the row and the read of it.
        for (;;) {
          await tx
            .insert(companyNetworkOpen)
            .values({ companyId, openedBy })
            .onConflictDoNothing({ target: companyNetworkOpen.companyId })
          const open = await openAllOf(tx, companyId)
          if (open !== null) return open
        }
      })
      log.info({ companyId }, 'NETWORK_ALL_OPENED')
      return opened
    },

    async closeAll(who) {
      const { companyId } = who
      await database.command(scopeOf(who), async (tx) => {
        await admitWriter(identity, tx, who, 'openAllNetwork')
        await tx.delete(companyNetworkOpen).where(eq(companyNetworkOpen.companyId, companyId))
      })
      log.info({ companyId }, 'NETWORK_ALL_CLOSED')
      for (const listener of removals) listener(companyId)
    },
  }
}

function machineSide({ database, identity, log }: Deps, removals: Removals): NetworkStore {
  return {
    opened({ companyId, conversationId }) {
      return database.read(hubScopeOf(companyId), async (tx): Promise<NetworkOpened> => {
        if ((await openAllOf(tx, companyId)) !== null) return { kind: 'ALL' }
        const rows = await domainsIn(tx, companyId, conversationId)
        return { kind: 'LIST', hosts: rows.map((row) => NetworkDomain.parse(row.domain)) }
      })
    },

    async grant({ scope, companyId, conversationId, personId, domains, reason }) {
      const who = { companyId, personId }
      await database.command(scopeOf(who), async (tx) => {
        switch (scope) {
          case 'COMPANY':
            await admitWriter(identity, tx, who, 'manageNetwork')
            await insertCompany(tx, who, domains, reason)
            return
          case 'CONVERSATION':
            await admitWriter(identity, tx, who, 'openConversationNetwork')
            await insertConversation(tx, { ...who, conversationId }, domains, reason)
            return
          default:
            return scope satisfies never
        }
      })
      logGranted(log, companyId, scope, domains.length)
    },

    async forget({ companyId, conversationId }) {
      await database.command(hubScopeOf(companyId), (tx) =>
        tx
          .delete(conversationNetworkDomain)
          .where(
            and(
              eq(conversationNetworkDomain.companyId, companyId),
              eq(conversationNetworkDomain.conversationId, conversationId),
            ),
          ),
      )
    },

    onRemoved(listener) {
      removals.add(listener)
      return () => {
        removals.delete(listener)
      }
    },
  }
}

export function createNetworkStore(deps: Deps) {
  const removals: Removals = new Set()
  return Object.freeze({
    ...machineSide(deps, removals),
    ...companyList(deps, removals),
    ...openAllSwitch(deps, removals),
  })
}
