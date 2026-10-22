/** An answer that is a value or the reason there is none (code C22). */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
