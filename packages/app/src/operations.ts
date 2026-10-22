import type { z } from 'zod'

/** One operation: the shape the screen sends and the shape the handler answers with. */
export type OperationSpec = Readonly<{ input: z.ZodType; output: z.ZodType }>

export type Operations = Readonly<Record<string, OperationSpec>>

/**
 * Declares an app's operations once, in Zod (code C27): the handlers, the generated client and
 * the manifest all derive from this value, so none can name an operation it lacks.
 */
export function defineOperations<const O extends Operations>(operations: O): O {
  return operations
}
