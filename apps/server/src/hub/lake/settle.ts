import type { StackId, StackStatus } from '../../platform/aws.ts'

export type LakeState = 'creating' | 'ready' | 'failed' | 'deleting' | 'delete_failed'
type Row = { state: LakeState; stackId: StackId | null }

/** What the Hub does with its row once it has read the stack (card L.3, L.12). */
export type Step =
  | { do: 'KEEP' }
  | { do: 'RESEND_CREATE' }
  | { do: 'READY' }
  | { do: 'FAIL' }
  | { do: 'RESEND_DELETE' }
  | { do: 'GONE' }
  | { do: 'DELETE_FAILED' }

// With OnFailure DELETE a failed creation is deleted, so it ends DELETE_COMPLETE; the two
// ROLLBACK_ states and DELETE_FAILED are the undoing that did not finish, as ParallelCluster folds
// them into one (`api/converters.py:17-28`).
const WHILE_CREATING: Partial<Record<StackStatus, Step['do']>> = {
  CREATE_COMPLETE: 'READY',
  DELETE_COMPLETE: 'FAIL',
  DELETE_FAILED: 'DELETE_FAILED',
  ROLLBACK_COMPLETE: 'DELETE_FAILED',
  ROLLBACK_FAILED: 'DELETE_FAILED',
}
const WHILE_DELETING: Partial<Record<StackStatus, Step['do']>> = {
  CREATE_COMPLETE: 'RESEND_DELETE',
  DELETE_COMPLETE: 'GONE',
  DELETE_FAILED: 'DELETE_FAILED',
}

/**
 * The one owner of the row's passage (C21): the row and the stack's status, or `null` for a row
 * with no stack yet. A row that is not moving is kept, and so is a stack still in progress.
 */
export function settle(row: Row, status: StackStatus | null): Step {
  if (row.state === 'creating' && row.stackId === null) return { do: 'RESEND_CREATE' }
  if (status === null) return { do: 'KEEP' }
  const table =
    row.state === 'creating' ? WHILE_CREATING : row.state === 'deleting' ? WHILE_DELETING : {}
  return { do: table[status] ?? 'KEEP' }
}
