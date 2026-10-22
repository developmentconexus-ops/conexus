/**
 * Every code a failed call ends in (decision 0055): the runtime's four, and `UNREACHABLE` for an
 * answer that is not the runtime's (the platform's own page, no answer at all). The one owner, so
 * the generated client and its Portuguese phrases cannot name a code that does not exist (code C26).
 */
export const APP_FAILURE_CODES = [
  'OPERATION_NOT_FOUND',
  'INPUT_INVALID',
  'OUTPUT_INVALID',
  'HANDLER_FAILED',
  'UNREACHABLE',
] as const

export type AppFailureCode = (typeof APP_FAILURE_CODES)[number]
