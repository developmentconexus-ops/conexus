/**
 * The ceiling of one version's files as the Hub receives them (code C26): a bound on the send, not
 * on what an app may do. Record 0043 uploaded 10 MB in 1,000 files in 14.9 s.
 */
export const APP_LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, files: 1000 })

/** The Workers runtime date each contract version runs on, fixed when the contract enters (0043). */
export const APP_COMPATIBILITY_DATE = Object.freeze({ 1: '2026-10-18' })

/**
 * What one call of an app may use (decision 0047): the CPU its Worker is uploaded with and the
 * dispatcher sets on each call, the `db` calls the platform lets it make and the time the dispatcher
 * grants it, and the run login's statement and transaction timeouts.
 */
export const APP_CALL_LIMITS = Object.freeze({
  cpuMs: 50,
  dbCallsPerCall: 50,
  callDeadlineMs: 10_000,
  statementTimeoutMs: 5_000,
  transactionTimeoutMs: 6_000,
})
