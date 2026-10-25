import type { Project } from '@conexus/hub-api'
import { AppOpenQuery, FrameEntry } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { TriangleAlertIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group.tsx'
import { sendFrameHandoff } from './queries.ts'
import { Stage } from './stage.tsx'
import { isAppleWebKitBrowser } from './webkit.ts'

type FrameView = 'computer' | 'phone'

function AppLink({ address }: { address: string }) {
  return (
    <a
      href={`https://${address}/`}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants()}
    >
      Abrir app
    </a>
  )
}

/**
 * The app in its frame. A frame with no session of the app says so to the Hub (`conexus-entry`), and
 * the Hub's pass takes the frame to the app, signed in; a message from another origin or window is
 * not heard.
 */
function Frame(props: { address: string; view: FrameView }) {
  const { address } = props
  const [src, setSrc] = useState(`https://${address}/`)
  const frame = useRef<HTMLIFrameElement>(null)
  const entered = useRef<string | null>(null)
  const handoff = useMutation(sendFrameHandoff)
  const { mutate } = handoff
  useEffect(() => {
    function heard(event: MessageEvent) {
      if (event.origin !== `https://${address}` || event.source !== frame.current?.contentWindow) {
        return
      }
      const entry = FrameEntry.safeParse(event.data)
      if (!entry.success || entered.current === entry.data.binding) return
      const body = AppOpenQuery.safeParse(entry.data)
      if (!body.success) return
      mutate(
        { body: body.data },
        {
          onSuccess: ({ location }) => {
            entered.current = entry.data.binding
            setSrc(location)
          },
        },
      )
    }
    window.addEventListener('message', heard)
    return () => window.removeEventListener('message', heard)
  }, [address, mutate])
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-surface-3">
      <iframe
        ref={frame}
        src={src}
        title="Prévia"
        className={cn(
          'h-full border-0 bg-surface',
          props.view === 'phone' ? 'mx-auto w-[390px] max-w-full border-x border-line' : 'w-full',
        )}
      />
    </div>
  )
}

/** The Prévia of a Projeto: its app in a frame, or the Stage before its first app. */
export function Preview({ project }: { project: Project }) {
  const [view, setView] = useState<FrameView>('computer')
  const [reloads, setReloads] = useState(0)
  const { address, appVersion } = project
  if (appVersion === null || address === null) return <Stage />
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-md border-b border-line px-md py-xs">
        <div className="w-56 max-md:hidden">
          <ToggleGroup
            aria-label="Tamanho da tela"
            value={[view]}
            onValueChange={(next) => {
              const [chosen] = next
              if (chosen === 'computer' || chosen === 'phone') setView(chosen)
            }}
          >
            <ToggleGroupItem value="computer">Computador</ToggleGroupItem>
            <ToggleGroupItem value="phone">Celular</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button className="ml-auto" onClick={() => setReloads((count) => count + 1)}>
          Recarregar
        </Button>
      </div>
      {isAppleWebKitBrowser() && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-md border-b border-line bg-surface-3 px-md py-xs text-label"
        >
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">O app pode não abrir aqui dentro neste navegador.</p>
          <AppLink address={address} />
        </div>
      )}
      <Frame key={`${appVersion}-${reloads}`} address={address} view={view} />
    </div>
  )
}
