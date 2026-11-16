import type { Native } from '@conexus/connectors'
import type { CopySystemMessage } from '@conexus/hub-api'
import { SYSTEM_MESSAGE_MAX } from '@conexus/hub-api'

/** Half a character and the NUL that `text` refuses are gone, so what the system said is kept. */
function storableText(text: string): string {
  return text.replaceAll('\0', '').toWellFormed()
}

/** What the system said in a refusal, cleaned and cut for the run's row; null when it sent neither a code nor a message. */
export function systemOf(native: Native | null): CopySystemMessage | null {
  if (native === null) return null
  const { status, code, message } = native
  if (code === null && message === null) return null
  return {
    status,
    code: code === null ? null : storableText(code),
    message:
      message === null ? null : storableText(message).slice(0, SYSTEM_MESSAGE_MAX).toWellFormed(),
  }
}
