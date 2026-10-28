import type { Operations, Roles } from '@conexus/app-contract'

export type { Operations, Roles }

/**
 * Declares an app's operations once, in Zod (code C27): the handlers, the generated client and the
 * app's Worker all read this value, so none can name an operation it lacks.
 */
export function defineOperations<const O extends Operations>(operations: O): O {
  return operations
}

/**
 * Declares an app's roles once, by name with the label a person reads in Quem usa o app: the
 * operations name them in `roles`, and the check carries them to the manifest.
 */
export function defineRoles<const R extends Roles>(roles: R): R {
  return roles
}
