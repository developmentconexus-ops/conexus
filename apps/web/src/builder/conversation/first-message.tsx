import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useRef } from 'react'
import { HubFailure, sentenceOfCode, writeFailureText } from '../../platform/hub.ts'
import { Notice } from '../../ui/notice.tsx'
import { Empty } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import type { Outgoing } from './attachments.ts'
import { Composer } from './composer.tsx'
import { useDraft } from './draft.ts'
import { isModelRefusal } from './handoff.ts'
import { ComposerModelPicker, NoAccount } from './model-choice.tsx'
import { APP_BUILDER_WORDS } from './room.ts'
import { usePicked } from './start.tsx'
import { useStartConversation } from './start-conversation.ts'
import {
  CHOOSE_ANOTHER_MODEL,
  EMPTY_CONVERSATION,
  NO_SECRETS,
  UNCONFIRMED_CREATION,
} from './text.ts'

function failureText(failure: unknown): string {
  return failure instanceof HubFailure && isModelRefusal(failure.code)
    ? `${sentenceOfCode(failure.code)} ${CHOOSE_ANOTHER_MODEL}`
    : writeFailureText(failure, UNCONFIRMED_CREATION)
}

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
  const { start, failure } = useStartConversation('APP_BUILDER')
  const phone = useIsMobile()

  async function send(outgoing: Outgoing): Promise<boolean> {
    const started = await start({ companyId, projectId, picked: picked ?? undefined }, outgoing)
    return started.opened
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
          <Notice>{failureText(failure)}</Notice>
        </div>
      )}
      <div className="px-md">
        <Composer
          words={APP_BUILDER_WORDS}
          placement="docked"
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
