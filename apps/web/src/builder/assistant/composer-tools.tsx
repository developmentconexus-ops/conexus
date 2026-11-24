import type { AssistantConversation, CompanyId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import type { ComposerTools } from '../conversation/public.ts'
import { CHIP, WORDS } from './choice-list.tsx'
import { useConnectorCatalog } from './connector-names.ts'
import type { DraftChoice } from './draft-choice.ts'
import type { Choice, ComposerPlace } from './plus-menu.tsx'
import { PlusMenu } from './plus-menu.tsx'
import { ProjectControl } from './project-choice.tsx'
import { assistantConversationQuery, sendAssistantConnections } from './queries.ts'
import { NO_TOOLS, READING_TOOLS, toolsOf, toolWord, UNCONFIRMED_CHOICE } from './text.ts'

export type { ComposerPlace } from './plus-menu.tsx'

const SHOWN_LOGOS = 3

/** "N ferramentas": up to three logos and the count; it opens the "+" menu, which lists the switches. */
function ToolsCount(props: {
  place: ComposerPlace
  choice: Choice
  open: boolean
  onOpen: () => void
}) {
  const { place, choice } = props
  const catalog = useConnectorCatalog(place.companyId)
  const { offered } = choice
  if (offered === undefined)
    return choice.failed === undefined ? (
      <span role="status" className="inline-flex items-center gap-xs text-fact text-text-2">
        <Skeleton className="h-5 w-5" />
        <span className={WORDS}>{READING_TOOLS}</span>
      </span>
    ) : null
  const chosen = offered.filter((one) => one.chosen)
  const logos = chosen.slice(0, SHOWN_LOGOS).flatMap((one) => {
    const logo = catalog.logo(one.connector)
    return logo === undefined ? [] : [{ id: one.connectionId, logo }]
  })
  const none = chosen.length === 0
  return (
    <button
      type="button"
      aria-label={none ? NO_TOOLS : toolsOf(chosen.length)}
      aria-haspopup="dialog"
      aria-expanded={props.open}
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), CHIP, 'px-sm')}
      onClick={props.onOpen}
    >
      <span aria-hidden="true" className="flex -space-x-1">
        {logos.map(({ id, logo }, index) => (
          <span key={id} className={index > 0 ? '@max-[26rem]:hidden' : undefined}>
            <ConnectorLogo small entry={{ logo }} />
          </span>
        ))}
      </span>
      <span aria-hidden="true">
        {none ? (
          NO_TOOLS
        ) : (
          <>
            {chosen.length}
            <span className="@max-[26rem]:hidden">{` ${toolWord(chosen.length)}`}</span>
          </>
        )}
      </span>
    </button>
  )
}

/** What a place reads with no conversation begun: nothing yet, so nothing to show or to switch. */
const NO_OFFER: Choice = { offered: undefined, busy: false, onToggle: () => undefined }

/** The switch of a conversation begun is a `PUT`: the box shows what the Hub answered, and the choice before when it refuses (web W10, W12). */
function useLiveChoice(
  companyId: CompanyId,
  conversation: AssistantConversation | undefined,
): Choice {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const send = useMutation({
    ...sendAssistantConnections,
    onSuccess: (answer) =>
      conversation !== undefined &&
      queryClient.setQueryData(
        assistantConversationQuery(companyId, conversation.id).queryKey,
        answer,
      ),
  })
  if (conversation === undefined) return NO_OFFER
  // While the swap is in the air the box already shows it; a refusal puts the choice before back.
  const asked = send.isPending ? send.variables.body.connections : undefined
  return {
    offered: conversation.connections.map((one) => ({
      ...one,
      chosen: asked === undefined ? one.chosen : asked.includes(one.connectionId),
    })),
    busy: send.isPending,
    error,
    onToggle: (connectionId, chosen) => {
      setError(undefined)
      const connections = conversation.connections
        .filter((one) => (one.connectionId === connectionId ? chosen : one.chosen))
        .map((one) => one.connectionId)
      send.mutate(
        { params: { companyId, conversationId: conversation.id }, body: { connections } },
        { onError: (failure) => setError(writeFailureText(failure, UNCONFIRMED_CHOICE)) },
      )
    },
  }
}

function draftChoice(draft: DraftChoice): Choice {
  const { read } = draft
  return {
    offered: draft.offered,
    busy: false,
    failed: read.isError
      ? { text: sentenceOf(read.error), retry: () => void read.refetch() }
      : undefined,
    onToggle: draft.toggle,
  }
}

function useChoice(place: ComposerPlace): Choice {
  const live = useLiveChoice(
    place.companyId,
    place.kind === 'CONVERSATION' ? place.conversation : undefined,
  )
  return place.kind === 'HOME' ? draftChoice(place.draft) : live
}

/** What fails in the tools, said above the box: the offer that could not be read, a switch the Hub refused, a catalog that did not load. */
function Notice(props: { choice: Choice; catalogFailure: string | undefined }) {
  const { failed, error } = props.choice
  if (failed !== undefined) return <ReadFailure text={failed.text} onRetry={failed.retry} />
  const text = error ?? props.catalogFailure
  return text === undefined ? null : <Alert tone="danger">{text}</Alert>
}

/**
 * The "+" menu, the folder and the tools count of a place, from one reading: the pieces `Composer`
 * puts on its row (design V30, the card's row "A linha da caixa"), and what to say above the box
 * when they fail. The count opens the same menu as the "+".
 */
export function useComposerTools(place: ComposerPlace): ComposerTools {
  const choice = useChoice(place)
  const catalog = useConnectorCatalog(place.companyId)
  const [open, setOpen] = useState(false)
  return {
    plus: (pickFiles) => (
      <PlusMenu
        place={place}
        choice={choice}
        open={open}
        onOpenChange={setOpen}
        pickFiles={pickFiles}
      />
    ),
    context: (
      <>
        <ProjectControl place={place} />
        <ToolsCount place={place} choice={choice} open={open} onOpen={() => setOpen(true)} />
      </>
    ),
    notice: <Notice choice={choice} catalogFailure={catalog.failure} />,
  }
}
