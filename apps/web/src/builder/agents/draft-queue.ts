import type { AgentDetail, DraftPatch } from '@conexus/hub-api'

type Write = (patch: DraftPatch) => Promise<AgentDetail>

/**
 * The writes of one agent's draft, one at a time (step 24.3, criterion 27): each carries the
 * `revision` the one before returned, so two sections saved in a row by the same person never refuse
 * each other. Only a refusal that comes from outside (`AGENT_DRAFT_STALE` of another writer) is
 * the caller's to show.
 */
export function draftQueue(start: AgentDetail, write: Write) {
  let revision = start.revision
  let tail: Promise<unknown> = Promise.resolve()

  async function run(fields: Omit<DraftPatch, 'revision'>) {
    const saved = await write({ ...fields, revision })
    revision = saved.revision
    return saved
  }

  return {
    save(fields: Omit<DraftPatch, 'revision'>): Promise<AgentDetail> {
      // A write after a refused one still runs, with the revision it last had: its failure is its caller's alone.
      const next = tail.then(
        () => run(fields),
        () => run(fields),
      )
      tail = next
      return next
    },
    /** The revision a read of the agent brought, when the screen read it again. */
    adopt(read: AgentDetail) {
      revision = Math.max(revision, read.revision)
    },
  }
}
