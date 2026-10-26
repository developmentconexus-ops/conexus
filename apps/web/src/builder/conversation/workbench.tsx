import type { ReactNode } from 'react'
import { useState } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { pageStorage } from '../../platform/storage.ts'
import { cn } from '../../ui/cn.ts'
import { PhoneTopContent } from '../../ui/frame.tsx'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../ui/resizable.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'

const LAYOUT_ID = 'conexus-workbench'
const layoutMemory = pageStorage('local')

// A hidden region stays mounted and in the layout, so a draft and a scroll position survive the
// switch; only what it paints and what the keyboard reaches is taken away. The library owns the
// regions' own element, so the rules reach it from the group.
const PHONE_REGIONS =
  'max-md:relative max-md:[&>[data-slot=resizable-panel]]:absolute max-md:[&>[data-slot=resizable-panel]]:inset-0 max-md:[&>[data-slot=resizable-panel][data-active=false]]:invisible'

/**
 * The two regions of a Projeto: the area on the left and the conversation on the right, with a
 * divider the person drags (320 px to 60 %) and the browser remembers. Under the `md` width, "App |
 * Conversa" sits in the top line of the frame and shows one at a time, both mounted.
 */
export function Workbench(props: { area: ReactNode; panel: ReactNode }) {
  const [view, setView] = useState<'app' | 'chat'>('app')
  const phone = useIsMobile()
  const layout = useDefaultLayout({ id: LAYOUT_ID, storage: layoutMemory })
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PhoneTopContent>
        <div className="order-2 shrink-0 md:hidden">
          <ToggleGroup
            aria-label="Parte do Projeto"
            value={[view]}
            onValueChange={(next) => {
              const [chosen] = next
              if (chosen === 'app' || chosen === 'chat') setView(chosen)
            }}
          >
            <ToggleGroupItem value="app">App</ToggleGroupItem>
            <ToggleGroupItem value="chat">Conversa</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PhoneTopContent>
      <ResizablePanelGroup
        id={LAYOUT_ID}
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
        className={cn('min-h-0 flex-1', PHONE_REGIONS)}
      >
        <ResizablePanel id="area" minSize="40%" data-active={view === 'app'}>
          {props.area}
        </ResizablePanel>
        <ResizableHandle
          aria-label="Redimensionar a conversa"
          disabled={phone}
          className="max-md:hidden"
        />
        <ResizablePanel
          id="conversation"
          defaultSize="380px"
          minSize="320px"
          maxSize="60%"
          data-active={view === 'chat'}
        >
          {props.panel}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
