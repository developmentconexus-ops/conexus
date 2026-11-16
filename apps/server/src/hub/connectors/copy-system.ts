import type { Native } from '@conexus/connectors'
import type { CopySystemMessage } from '@conexus/hub-api'
import { SYSTEM_MESSAGE_MAX } from '@conexus/hub-api'

/** Half a character and the NUL that `text` refuses are gone, so what the system said is kept. */
function storableText(text: string): string {
  return text.replaceAll('\0', '').toWellFormed()
}

/** The text a run keeps: cleaned, cut when it is a message, and null when nothing is left of it. */
function keptText(text: string | null, max = Number.POSITIVE_INFINITY): string | null {
  if (text === null) return null
  const kept = storableText(text).slice(0, max).toWellFormed()
  return kept === '' ? null : kept
}

/** What the system said in a refusal, cleaned and cut for the run's row; null when it sent neither a code nor a message. */
export function systemOf(native: Native | null): CopySystemMessage | null {
  if (native === null) return null
  const code = keptText(native.code)
  const message = keptText(native.message, SYSTEM_MESSAGE_MAX)
  return code === null && message === null ? null : { status: native.status, code, message }
}
