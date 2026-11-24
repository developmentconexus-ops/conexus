import type { ConversationId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CheckIcon, ChevronDownIcon, SquarePenIcon } from 'lucide-react'
import { useState } from 'react'
import {
  conversationsQuery,
  titleOf,
  UNCONFIRMED_CREATION,
  useStartConversation,
} from '../../harness/room/public.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../ui/combobox.tsx'
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '../../ui/drawer.tsx'
import { PhoneTopContent } from '../../ui/frame.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { usePhoneView } from './workbench.tsx'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')
const CONVERSATION = '/companies/$companyId/projects/$projectId/conversations/$conversationId'

export type Item = { value: ConversationId; label: string }

/** **Nova conversa**: the conversation opens empty, on the model the Hub picks. */
function useNewConversation(onFailure: (sentence: string | undefined) => void) {
  const { companyId, projectId } = route.useParams()
  const { start, pending } = useStartConversation('APP_BUILDER')

  async function begin(): Promise<boolean> {
    onFailure(undefined)
    const started = await start({ companyId, projectId, picked: undefined }, undefined)
    if (!started.opened) onFailure(writeFailureText(started.failure, UNCONFIRMED_CREATION))
    return started.opened
  }

  return { start: begin, pending }
}

function NewConversation(props: { onFailure: (sentence: string | undefined) => void }) {
  const { start, pending } = useNewConversation(props.onFailure)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Nova conversa"
      title="Nova conversa"
      disabled={pending}
      onClick={() => void start()}
    >
      <SquarePenIcon aria-hidden="true" />
    </Button>
  )
}

/**
 * On a phone the title is a button in the frame's top line, and the list opens from the bottom,
 * **Nova conversa** first: a text field there would raise the keyboard to filter a handful of rows.
 */
function ConversationSheet(props: {
  items: Item[]
  current: Item | undefined
  failure: string | undefined
  readFailure: string | undefined
  onRetry: () => void
  onFailure: (sentence: string | undefined) => void
}) {
  const { companyId, projectId } = route.useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { start, pending } = useNewConversation(props.onFailure)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={<Button variant="ghost" className="w-full min-w-0 justify-start px-sm" />}
      >
        <span className="truncate text-text">{props.current?.label ?? 'Conversas'}</span>
        <ChevronDownIcon aria-hidden="true" className="text-text-2" />
      </DrawerTrigger>
      <DrawerContent title="Conversas">
        <div className="-mx-sm flex min-h-0 flex-1 flex-col gap-xs overflow-y-auto overscroll-contain">
          <Button
            variant="ghost"
            className="justify-start gap-md px-sm text-text"
            disabled={pending}
            onClick={() =>
              void start().then((started) => {
                if (started) setOpen(false)
              })
            }
          >
            <SquarePenIcon aria-hidden="true" />
            Nova conversa
          </Button>
          {props.items.map((item) => (
            <DrawerClose
              key={item.value}
              render={
                <Button
                  variant="ghost"
                  className={cn(
                    'justify-start gap-md px-sm text-text',
                    item.value === props.current?.value && 'bg-accent-soft',
                  )}
                />
              }
              aria-current={item.value === props.current?.value || undefined}
              onClick={() =>
                void navigate({
                  to: CONVERSATION,
                  params: { companyId, projectId, conversationId: item.value },
                  search: (previous) => previous,
                })
              }
            >
              <span className="truncate">{item.label}</span>
              {item.value === props.current?.value && (
                <CheckIcon aria-hidden="true" className="ms-auto" />
              )}
            </DrawerClose>
          ))}
        </div>
        {props.readFailure !== undefined && (
          <ReadFailure text={props.readFailure} onRetry={props.onRetry} />
        )}
        {props.failure !== undefined && <Alert tone="danger">{props.failure}</Alert>}
      </DrawerContent>
    </Drawer>
  )
}

/**
 * The box on top of the panel: the person's conversations of the Projeto, newest first, one page,
 * and **Nova conversa**. `current` carries the open conversation's own title, which the Builder
 * may have just written, over the list's. Under `md` the box gives way to the title in the frame's
 * top line (`ConversationSheet`).
 */
export function ConversationSwitch(props: { current: Item | undefined }) {
  const { companyId, projectId } = route.useParams()
  const navigate = useNavigate()
  const list = useQuery(conversationsQuery(companyId, projectId, undefined))
  const [failure, setFailure] = useState<string>()
  const { current } = props
  const phoneView = usePhoneView()
  const items: Item[] = (list.data?.conversations ?? []).map((one) => ({
    value: one.id,
    label: one.id === current?.value ? current.label : titleOf(one),
  }))
  if (current !== undefined && !items.some((one) => one.value === current.value)) {
    items.unshift(current)
  }

  return (
    <>
      <PhoneTopContent>
        <div className={phoneView === 'app' ? 'hidden' : 'order-1 min-w-20 flex-1 md:hidden'}>
          <ConversationSheet
            items={items}
            current={current}
            failure={failure}
            readFailure={list.isError ? sentenceOf(list.error) : undefined}
            onRetry={() => void list.refetch()}
            onFailure={setFailure}
          />
        </div>
      </PhoneTopContent>
      <div className="flex flex-col gap-xs border-b border-line p-sm max-md:hidden">
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
              <ComboboxInput
                aria-label="Conversas"
                placeholder="Conversas"
                className="flex-1 border-transparent bg-transparent hover:border-line"
              />
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
        {list.isError && (
          <ReadFailure text={sentenceOf(list.error)} onRetry={() => void list.refetch()} />
        )}
        {failure !== undefined && <Alert tone="danger">{failure}</Alert>}
      </div>
    </>
  )
}
