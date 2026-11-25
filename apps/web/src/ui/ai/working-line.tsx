import type { ReactElement } from 'react'
import type { Signer } from './agent-sign.tsx'
import { AgentSign } from './agent-sign.tsx'

export type WorkingState =
  /** `since` is the time already written, with its separator; `undefined` without a count. */
  | { kind: 'WORKING'; sentence: string; since: string | undefined }
  | { kind: 'WAITING'; sentence: string }

export function WorkingLine(props: { signer: Signer; state: WorkingState }): ReactElement {
  const { signer, state } = props
  return (
    <div role="status" className="flex items-center gap-sm text-label text-text-2">
      <AgentSign signer={signer} working={state.kind === 'WORKING'} />
      <p>
        {state.sentence}
        {state.kind === 'WORKING' && state.since !== undefined && (
          <span aria-hidden="true">{state.since}</span>
        )}
      </p>
    </div>
  )
}
