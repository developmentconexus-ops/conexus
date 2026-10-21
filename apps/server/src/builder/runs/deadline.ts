/**
 * The turn's hour (card, the clocks): when `deadlineAt` comes, `abort` stops the turn as the person's
 * Parar does, and what was written is saved. The returned function cancels the watch.
 */
export function watchDeadline(deadlineAt: Date, abort: () => void): () => void {
  const timeout = AbortSignal.timeout(Math.max(deadlineAt.getTime() - Date.now(), 1))
  timeout.addEventListener('abort', abort, { once: true })
  return () => timeout.removeEventListener('abort', abort)
}
