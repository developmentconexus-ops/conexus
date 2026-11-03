import type { ReactNode } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable.tsx'
import { Sheet, SheetContent } from '../../ui/sheet.tsx'

/** What a panel's header adds on the right in the sheet, so the sheet's own **Fechar** touches nothing in it. */
export const SHEET_CLOSE_ROOM = 'pr-14'

/**
 * A conversation and, when something is open (a file the Assistant showed, the draft the Construtor
 * saved), that thing beside it, or in a sheet over it on a phone, which holds the focus and closes
 * on Esc. The chat keeps its place in the tree, so opening a side does not remount it and drop its stream.
 */
export function Beside(props: {
  id: string
  chat: ReactNode
  side: ReactNode | undefined
  /** The sheet's title on a phone. */
  name: string
  /** The resize handle's label on a computer. */
  handle: string
  phone: boolean
  onCloseSide: () => void
}) {
  if (props.phone)
    return (
      <div className="h-full min-h-0">
        {props.chat}
        <Sheet
          open={props.side !== undefined}
          onOpenChange={(open) => !open && props.onCloseSide()}
        >
          <SheetContent
            side="right"
            title={props.name}
            titleClassName="sr-only"
            closeLabel="Fechar"
            className="p-0"
          >
            {props.side}
          </SheetContent>
        </Sheet>
      </div>
    )
  return (
    <ResizablePanelGroup id={props.id} className="h-full min-h-0">
      <ResizablePanel id="chat" minSize="320px">
        {props.chat}
      </ResizablePanel>
      {props.side !== undefined && (
        <>
          <ResizableHandle aria-label={props.handle} />
          <ResizablePanel id="side" defaultSize="45%" minSize="280px">
            {props.side}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
