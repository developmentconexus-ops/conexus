import type { ConversationId } from '@conexus/hub-api'
import { ConnectionId, ProjectId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Kept, Owner } from './context.ts'
import { assistantConversation } from './tables.ts'

const Chosen = z.array(ConnectionId)

function scopeOf(owner: Owner) {
  return { kind: 'COMPANY', companyId: owner.companyId, personId: owner.personId } as const
}

export type ChosenConnections = ReturnType<typeof chosenConnections>

/**
 * The connections each Assistant conversation chose, which only the Hub's routes write
 * (`tables.ts`).
 */
export function chosenConnections(database: Database) {
  return {
    /**
     * The creation's choice, kept before its thread exists: a repeat of the attempt finds the first
     * and keeps it, and one with another place is `IDEMPOTENCY_CONFLICT` (code C37).
     */
    keep(
      owner: Owner,
      input: {
        conversationId: ConversationId
        projectId: ProjectId | undefined
        connections: readonly ConnectionId[]
      },
    ): Promise<boolean> {
      return database.command(scopeOf(owner), async (tx) => {
        const projectId = input.projectId ?? null
        const [made] = await tx
          .insert(assistantConversation)
          .values({
            id: input.conversationId,
            ...owner,
            projectId,
            connections: [...input.connections],
          })
          .onConflictDoNothing({ target: assistantConversation.id })
          .returning({ id: assistantConversation.id })
        if (made !== undefined) return true
        const [kept] = await tx
          .select({ projectId: assistantConversation.projectId })
          .from(assistantConversation)
          .where(eq(assistantConversation.id, input.conversationId))
        if (kept?.projectId !== projectId) throw new Failure('IDEMPOTENCY_CONFLICT')
        return false
      })
    },

    /** A new choice for the conversation; the last one written holds. */
    change(
      owner: Owner,
      conversationId: ConversationId,
      connections: readonly ConnectionId[],
    ): Promise<void> {
      return database.command(scopeOf(owner), async (tx) => {
        const [changed] = await tx
          .update(assistantConversation)
          .set({ connections: [...connections] })
          .where(eq(assistantConversation.id, conversationId))
          .returning({ id: assistantConversation.id })
        // The creation keeps the row before the thread: a thread of the person's without one is
        // ours.
        if (changed === undefined) {
          throw new Failure('INTERNAL_UNEXPECTED', {
            details: { reason: 'ASSISTANT_CHOICE_MISSING' },
          })
        }
      })
    },

    /** The conversation's place and choice as the Hub keeps them: only the Hub writes the row. */
    of(owner: Owner, conversationId: ConversationId): Promise<Kept> {
      return database.read(scopeOf(owner), async (tx) => {
        const [row] = await tx
          .select({
            projectId: assistantConversation.projectId,
            connections: assistantConversation.connections,
          })
          .from(assistantConversation)
          .where(eq(assistantConversation.id, conversationId))
        if (row === undefined) {
          throw new Failure('INTERNAL_UNEXPECTED', {
            details: { reason: 'ASSISTANT_CHOICE_MISSING' },
          })
        }
        return {
          projectId: ProjectId.nullable().parse(row.projectId),
          connections: Chosen.parse(row.connections),
        }
      })
    },
  }
}
