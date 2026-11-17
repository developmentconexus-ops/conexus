import type { ReactElement } from 'react'
import { ConexusMark } from '../../brand/mark.tsx'

export type WorkingState =
  /** `since` is the time already written, with its separator; `undefined` without a count. */
  | { kind: 'WORKING'; sentence: string; since: string | undefined }
  | { kind: 'WAITING'; sentence: string }

/**
 * The agent's one activity line, as Mastra's activity line draws words and time handed to it: at
 * work, with the mark moving, or waiting on the person, with the mark still. The count is for the
 * eye; the reader hears the line once. The caller places it.
 */
export function WorkingLine(props: { state: WorkingState }): ReactElement {
  const { state } = props
  return (
    <div role="status" className="flex items-center gap-sm text-label text-text-2">
      <ConexusMark working={state.kind === 'WORKING'} size={16} />
      <p>
        {state.sentence}
        {state.kind === 'WORKING' && state.since !== undefined && (
          <span aria-hidden="true">{state.since}</span>
        )}
      </p>
    </div>
  )
}
