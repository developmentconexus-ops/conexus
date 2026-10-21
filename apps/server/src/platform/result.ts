/** An answer that is a refusal of the thing asked, not a fault of the system that answered. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
