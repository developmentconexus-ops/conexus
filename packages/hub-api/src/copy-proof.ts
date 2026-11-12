import { z } from 'zod'
import { ConnectorId } from './company-roles.ts'
import { CopyMode, CopyProposalId } from './copies.ts'
import { CopyOrigin } from './copy-shown.ts'

/** The rows of the one page a proposed copy proves its definition with: the page's size and the `proved_rows` CHECK read this (Capacidade 3). */
export const PROOF_PAGE_ROWS = 50

/**
 * What the proof of one connection counted (version 2), never a cell: the rows of its first page and
 * whether more followed, the key's nulls and repeats, each column's nulls and cells that did not fit
 * its type, the total the read tells, the calls a whole pass spends, and the rows changed in the last
 * day (null without `changedSince`).
 */
export const ProveCounts = z.object({
  rows: z.int().min(0),
  more: z.boolean(),
  keyNull: z.int().min(0),
  keyRepeated: z.int().min(0),
  nulls: z.record(z.string(), z.int().min(0)),
  misfits: z.record(z.string(), z.int().min(0)),
  total: z.int().min(0).nullable(),
  callsPerPass: z.int().min(0).nullable(),
  changedLastDay: z.int().min(0).nullable(),
})
export type ProveCounts = z.infer<typeof ProveCounts>

/** What `copy_propose` answers when the proposal is saved: the card in the conversation is drawn from it. */
export const CopyProposed = z.object({
  kind: z.literal('PROPOSED'),
  proposalId: CopyProposalId,
  name: z.string(),
  source: CopyOrigin,
  sources: z.array(z.object({ name: z.string(), connector: ConnectorId })).min(1),
  key: z.array(z.string()),
  mode: CopyMode,
  rows: z.int().min(0),
  more: z.boolean(),
  calls: z.int().min(0).nullable(),
  counts: z.array(ProveCounts),
})
export type CopyProposed = z.infer<typeof CopyProposed>
