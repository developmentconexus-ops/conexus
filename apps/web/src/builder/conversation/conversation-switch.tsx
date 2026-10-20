import type { ConversationId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { SquarePenIcon } from 'lucide-react'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../ui/combobox.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { conversationsQuery, sendCreation } from './queries.ts'
import { titleOf, UNCONFIRMED_CREATION } from './text.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')
const CONVERSATION = '/companies/$companyId/projects/$projectId/conversations/$conversationId'

export type Item = { value: ConversationId; label: string }

/** **Nova conversa**: the attempt key stays until the Hub settles the outcome (web W24). */
function NewConversation(props: { onFailure: (sentence: string | undefined) => void }) {
  const { companyId, projectId } = route.useParams()
  const navigate = useNavigate()
  const create = useMutation(sendCreation)
  const attempt = useAttemptKey()

  async function start() {
    props.onFailure(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params: { companyId, projectId }, body: {}, attemptKey }),
      )
      await navigate({
        to: CONVERSATION,
        params: { companyId, projectId, conversationId: conversation.id },
        search: (previous) => previous,
      })
    } catch (failure) {
      props.onFailure(writeFailureText(failure, UNCONFIRMED_CREATION))
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Nova conversa"
      title="Nova conversa"
      disabled={create.isPending}
      onClick={() => void start()}
    >
      <SquarePenIcon aria-hidden="true" />
    </Button>
  )
}

/**
 * The box on top of the panel: the person's conversations of the Projeto, newest first, one page,
 * and **Nova conversa**. `current` carries the open conversation's own title, which the Builder
 * may have just written, over the list's.
 */
export function ConversationSwitch(props: { current: Item | undefined }) {
  const { companyId, projectId } = route.useParams()
  const navigate = useNavigate()
  const list = useQuery(conversationsQuery(companyId, projectId, undefined))
  const [failure, setFailure] = useState<string>()
  const { current } = props
  const items: Item[] = (list.data?.conversations ?? []).map((one) => ({
    value: one.id,
    label: one.id === current?.value ? current.label : titleOf(one),
  }))
  if (current !== undefined && !items.some((one) => one.value === current.value)) {
    items.unshift(current)
  }

  return (
    <div className="flex flex-col gap-xs border-b border-line p-sm">
      <div className="flex items-center gap-sm">
        {list.isPending && current === undefined ? (
          <Skeleton className="h-9 flex-1" />
        ) : (
          <Combobox
            items={items}
            value={current ?? null}
            isItemEqualToValue={(a, b) => a.value === b.value}
            onValueChange={(item) =>
              item !== null &&
              void navigate({
                to: CONVERSATION,
                params: { companyId, projectId, conversationId: item.value },
                search: (previous) => previous,
              })
            }
          >
            <ComboboxInput aria-label="Conversas" placeholder="Conversas" className="flex-1" />
            <ComboboxContent>
              <ComboboxEmpty>Nenhuma conversa</ComboboxEmpty>
              <ComboboxList>
                {(item: Item) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
        <NewConversation onFailure={setFailure} />
      </div>
      {list.isError && <p role="alert">{sentenceOf(list.error)}</p>}
      {failure !== undefined && <p role="alert">{failure}</p>}
    </div>
  )
}
