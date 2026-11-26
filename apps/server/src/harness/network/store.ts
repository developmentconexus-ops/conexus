import { randomUUID } from 'node:crypto'
import type { CompanyId, ConversationId, PersonId } from '@conexus/hub-api'
import { CompanyNetworkDomain, NetworkDomain, NetworkDomainId } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { companyNetworkDomain, conversationNetworkDomain } from './tables.ts'

const OPERATION = 'a lista de internet da empresa'

type NetworkStore = {
  /** The domains the conversation's machine reaches beyond the package registries: the company's and the conversation's. */
  opened(where: {
    companyId: CompanyId
    conversationId: ConversationId
  }): Promise<readonly NetworkDomain[]>
  /** Opens what a person allowed on the card; refused unless their role manages the list now. */
  grant(grant: {
    scope: 'CONVERSATION' | 'COMPANY'
    companyId: CompanyId
    conversationId: ConversationId
    personId: PersonId
    domains: readonly NetworkDomain[]
    reason: string
  }): Promise<void>
  forget(where: { companyId: CompanyId; conversationId: ConversationId }): Promise<void>
  onRemoved(listener: (companyId: CompanyId) => void): () => void
}

type Asker = { companyId: CompanyId; personId: PersonId }

export type CompanyList = {
  list(who: Asker): Promise<CompanyNetworkDomain[]>
  add(who: Asker, input: { domain: NetworkDomain; reason: string }): Promise<CompanyNetworkDomain>
  remove(who: Asker, id: NetworkDomainId): Promise<void>
}

type Deps = { database: Database; identity: IdentityPorts; log: FailureLog }

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

export function createNetworkStore({ database, identity, log }: Deps) {
  const removed = new Set<(companyId: CompanyId) => void>()

  async function admitManager(tx: CommandTx, who: Asker): Promise<void> {
    try {
      await identity.admitMember({ tx, ...who, action: 'manageNetwork' })
    } catch (error) {
      if (error instanceof Failure && error.details.reason === 'FORBIDDEN')
        throw new Failure('NOT_IN_ROLE', { named: { operation: OPERATION }, cause: error })
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

  function logGranted(
    companyId: CompanyId,
    scope: 'CONVERSATION' | 'COMPANY',
    domainCount: number,
  ) {
    log.info({ companyId, scope, domains: domainCount }, 'NETWORK_DOMAIN_GRANTED')
  }

  return Object.freeze({
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
        await admitManager(tx, who)
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
      logGranted(who.companyId, 'COMPANY', 1)
      return added
    },

    async remove(who, id) {
      await database.command(scopeOf(who), async (tx) => {
        await admitManager(tx, who)
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
      for (const listener of removed) listener(who.companyId)
    },

    opened({ companyId, conversationId }) {
      return database.read(hubScopeOf(companyId), async (tx) => {
        const rows = await tx
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
        return rows.map((row) => NetworkDomain.parse(row.domain))
      })
    },

    async grant({ scope, companyId, conversationId, personId, domains, reason }) {
      const who = { companyId, personId }
      await database.command(scopeOf(who), async (tx) => {
        await admitManager(tx, who)
        switch (scope) {
          case 'COMPANY':
            await insertCompany(tx, who, domains, reason)
            return
          case 'CONVERSATION':
            await tx
              .insert(conversationNetworkDomain)
              .values(
                domains.map((domain) => ({
                  conversationId,
                  companyId,
                  personId,
                  domain,
                  reason,
                })),
              )
              .onConflictDoNothing({
                target: [
                  conversationNetworkDomain.conversationId,
                  conversationNetworkDomain.domain,
                ],
              })
            return
          default:
            return scope satisfies never
        }
      })
      logGranted(companyId, scope, domains.length)
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
      removed.add(listener)
      return () => {
        removed.delete(listener)
      }
    },
  } satisfies NetworkStore & CompanyList)
}
