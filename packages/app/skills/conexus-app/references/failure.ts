// In the app: src/lib/failure.ts
import { CallFailed, failureText } from '@conexus/app'

/** The sentence a person reads when a call fails: the platform's, never a code or a stack. */
export function failureOf(error: Error): string {
  return error instanceof CallFailed ? failureText[error.code] : failureText.UNREACHABLE
}
