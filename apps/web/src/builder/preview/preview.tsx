import type { Project } from '@conexus/hub-api'
import { FrameEntry } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { TriangleAlertIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { pageStorage } from '../../platform/storage.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group.tsx'
import { sendFrameHandoff } from './queries.ts'
import { Stage } from './stage.tsx'
import { isAppleWebKitBrowser } from './webkit.ts'

type FrameView = 'computer' | 'phone'
type FrameState = { kind: 'framed'; src: string } | { kind: 'refused'; error: unknown }
type NoticeState = 'open' | 'closed'

const NOTICE_CLOSED = 'conexus-preview-notice-closed'

const storage = pageStorage('session')

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
  const [state, setState] = useState<FrameState>({ kind: 'framed', src: `https://${address}/` })
  const frame = useRef<HTMLIFrameElement>(null)
  const { mutate } = useMutation(sendFrameHandoff)
  useEffect(() => {
    function heard(event: MessageEvent) {
      if (event.origin !== `https://${address}` || event.source !== frame.current?.contentWindow) {
        return
      }
      const entry = FrameEntry.safeParse(event.data)
      if (!entry.success) return
      const { host, binding } = entry.data
      mutate(
        { body: { host, binding } },
        {
          onSuccess: ({ location }) => setState({ kind: 'framed', src: location }),
          onError: (error) => setState({ kind: 'refused', error }),
        },
      )
    }
    window.addEventListener('message', heard)
    return () => window.removeEventListener('message', heard)
  }, [address, mutate])
  if (state.kind === 'refused') {
    return (
      <div className="min-h-0 flex-1 overflow-auto p-xl">
        <p role="alert" className="text-danger">
          {sentenceOf(state.error)}
        </p>
      </div>
    )
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-surface-3">
      <iframe
        ref={frame}
        src={state.src}
        title="Prévia"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
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
  const [notice, setNotice] = useState<NoticeState>(() =>
    storage.getItem(NOTICE_CLOSED) === 'true' ? 'closed' : 'open',
  )
  const { address, appVersion } = project
  if (appVersion === null || address === null) return <Stage />
  function reload() {
    setReloads((count) => count + 1)
  }
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
        <Button className="ml-auto" onClick={reload}>
          Recarregar
        </Button>
      </div>
      {isAppleWebKitBrowser() && notice === 'open' && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-md border-b border-line bg-surface-3 px-md py-xs text-label"
        >
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">O app pode não abrir aqui dentro neste navegador.</p>
          <AppLink address={address} />
          <Button
            aria-label="Fechar aviso"
            onClick={() => {
              storage.setItem(NOTICE_CLOSED, 'true')
              setNotice('closed')
            }}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
      <Frame key={`${appVersion}-${reloads}`} address={address} view={view} />
    </div>
  )
}
