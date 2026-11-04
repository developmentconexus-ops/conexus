import type {
  AgentDetail,
  CompanyId,
  ProblemField,
  ProblemReason,
  ProjectId,
} from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, writeFailureText } from '../../platform/hub.ts'
import { sendTool } from './queries.ts'
import { UNCONFIRMED_SAVE } from './text.ts'
import { ToolForm } from './tool-form.tsx'
import type { Saving } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Dialogue = { scope: Scope; agent: AgentDetail; saving: Saving; onClose: () => void }

/** **Criar** of the Ferramentas section: the form that makes a library tool and chooses it in the draft. */
export function Creator(props: Dialogue) {
  const { scope, agent } = props
  const create = useMutation(sendTool)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()
  const [refused, setRefused] = useState<{
    field: ProblemField | undefined
    reason: ProblemReason | undefined
  }>()
  return (
    <ToolForm
      offered={agent.offered}
      pending={create.isPending || props.saving.pending}
      refused={refused}
      error={error ?? props.saving.error}
      submitLabel="Criar ferramenta"
      onCancel={props.onClose}
      onSubmit={(input) => {
        setError(undefined)
        setRefused(undefined)
        void (async () => {
          try {
            const { tool } = await attempt((attemptKey) =>
              create.mutateAsync({ params: scope, body: input, attemptKey }),
            )
            props.saving.save(
              (now) => ({ tools: [...now.tools.map((one) => one.version.id), tool.latest.id] }),
              props.onClose,
            )
          } catch (failure) {
            if (failure instanceof HubFailure) {
              setRefused({ field: failure.field, reason: failure.reason })
            }
            setError(writeFailureText(failure, UNCONFIRMED_SAVE))
          }
        })()
      }}
    />
  )
}
