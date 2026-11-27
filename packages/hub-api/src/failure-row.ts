/** What a failure code says: the row of `FAILURES` and of each table that joins it. */
export type FailureRow = {
  category: 'USER' | 'THIRD_PARTY' | 'SYSTEM'
  /** A whole answer with this code tells the client a write's outcome; it may drop its key. */
  settles: boolean
  status: number
  phrase: string
  action: string
  actionKind: 'RETRY' | 'SIGN_IN' | 'INITIAL' | 'NONE'
}

/** A refusal the person's own request caused, with nothing to offer but its phrase. */
export const USER_409 = {
  category: 'USER',
  settles: true,
  status: 409,
  action: '',
  actionKind: 'NONE',
} as const
export const USER_422 = { ...USER_409, status: 422 } as const
