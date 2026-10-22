import type { Operations } from '@conexus/app-contract'

export type { Operations }

/**
 * Declares an app's operations once, in Zod (code C27): the handlers, the generated client and the
 * app's Worker all read this value, so none can name an operation it lacks.
 */
export function defineOperations<const O extends Operations>(operations: O): O {
  return operations
}
