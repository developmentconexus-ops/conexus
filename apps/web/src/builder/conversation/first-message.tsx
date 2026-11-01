import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { Empty } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Outgoing } from './attachments.ts'
import { Composer } from './composer.tsx'
import { useDraft } from './draft.ts'
import { isModelRefusal, stashHandoffFiles } from './handoff.ts'
import { ComposerModelPicker, NoAccount } from './model-choice.tsx'
import { sendCreation } from './queries.ts'
import { usePicked } from './start.tsx'
import {
  CHOOSE_ANOTHER_MODEL,
  EMPTY_CONVERSATION,
  NO_SECRETS,
  UNCONFIRMED_CREATION,
} from './text.ts'

/**
 * A Projeto with no conversation opens ready to type: the box is a draft, and the conversation is
 * created on the first send, on the model picked, then opens and sends the request as Início's does.
 * Opening it writes nothing.
 */
export function FirstMessage(props: { companyId: CompanyId; projectId: ProjectId }) {
  const { companyId, projectId } = props
  const { picked, setPicked, providers, usable } = usePicked(companyId)
  const draft = useDraft(`first:${projectId}`)
  const field = useRef<HTMLTextAreaElement>(null)
  const [failure, setFailure] = useState<string>()
  const navigate = useNavigate()
  const create = useMutation(sendCreation)
  const attempt = useAttemptKey()
  const phone = useIsMobile()

  async function send(outgoing: Outgoing): Promise<boolean> {
    setFailure(undefined)
    const params = { companyId, projectId }
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params, body: picked ?? {}, attemptKey }),
      )
      stashHandoffFiles(conversation.id, outgoing.files)
      await navigate({
        to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
        params: { ...params, conversationId: conversation.id },
        state: { handoff: { conversationId: conversation.id, content: outgoing.content } },
      })
      return true
    } catch (error) {
      setFailure(
        error instanceof HubFailure && isModelRefusal(error.code)
          ? `${sentenceOfCode(error.code)} ${CHOOSE_ANOTHER_MODEL}`
          : writeFailureText(error, UNCONFIRMED_CREATION),
      )
      return false
    }
  }

  return (
    <>
      <div className="flex flex-col gap-md px-md py-md">
        {!usable && <NoAccount companyId={companyId} />}
        <Empty>
          {EMPTY_CONVERSATION}
          {phone && <span className="mt-sm block text-fact text-text-2">{NO_SECRETS}</span>}
        </Empty>
      </div>
      <div className="flex-1" />
      {failure !== undefined && (
        <div className="px-md pb-sm">
          <Notice>{failure}</Notice>
        </div>
      )}
      <div className="px-md">
        <Composer
          answering={false}
          canSend={usable}
          draft={draft}
          field={field}
          onSend={send}
          onStop={() => undefined}
          picker={
            picked !== null && (
              <ComposerModelPicker
                providers={providers}
                value={picked}
                heading="Modelo desta conversa"
                onChange={setPicked}
              />
            )
          }
        />
      </div>
    </>
  )
}
