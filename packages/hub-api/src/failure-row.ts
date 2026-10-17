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
