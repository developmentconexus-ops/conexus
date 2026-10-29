import type { Project } from '@conexus/hub-api'
import { FrameEntry } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  ExternalLinkIcon,
  LockIcon,
  MonitorIcon,
  RotateCwIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import { View } from '../../hub/projects/public.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { pageStorage } from '../../platform/storage.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { sendFrameHandoff } from './queries.ts'
import { Stage } from './stage.tsx'
import { isAppleWebKitBrowser } from './webkit.ts'

type FrameView = 'computer' | 'phone'
type FrameState = { kind: 'framed'; src: string } | { kind: 'refused'; error: unknown }
type NoticeState = 'open' | 'closed'

const NOTICE_CLOSED = 'conexus-preview-notice-closed'

const storage = pageStorage('session')

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** A control of the window's bar, named by its tooltip and for a screen reader. */
function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Computador or Celular, kept in the address like the list state of web W18. */
function ViewSwitch({ view }: { view: FrameView }) {
  const navigate = useNavigate()
  return (
    <ToggleGroup
      aria-label="Tamanho da tela"
      className="w-auto"
      value={[view]}
      onValueChange={(next) => {
        const [chosen] = next
        const parsed = View.safeParse(chosen)
        if (parsed.success) {
          void navigate({ to: '.', search: (previous) => ({ ...previous, view: parsed.data }) })
        }
      }}
    >
      <Tip label="Computador">
        <ToggleGroupItem value="computer" size="icon" aria-label="Computador">
          <MonitorIcon aria-hidden="true" />
        </ToggleGroupItem>
      </Tip>
      <Tip label="Celular">
        <ToggleGroupItem value="phone" size="icon" aria-label="Celular">
          <SmartphoneIcon aria-hidden="true" />
        </ToggleGroupItem>
      </Tip>
    </ToggleGroup>
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
    <div
      className={cn(
        'min-h-0 flex-1 overflow-hidden bg-surface',
        props.view === 'phone' &&
          'md:mx-auto md:mt-sm md:rounded-phone md:border-8 md:border-phone-frame',
      )}
    >
      <iframe
        ref={frame}
        src={state.src}
        title="Prévia"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
        className={cn(
          'h-full border-0 bg-surface',
          props.view === 'phone' ? 'w-full md:w-[390px]' : 'w-full',
        )}
      />
    </div>
  )
}

/** The Prévia of a Projeto: its app in a browser window the Hub draws, or the Stage before its first app. */
export function Preview({
  project,
  reloads,
  onReload,
}: {
  project: Project
  reloads: number
  onReload: () => void
}) {
  const { view = 'computer' } = route.useSearch()
  const isMobile = useIsMobile()
  const [notice, setNotice] = useState<NoticeState>(() =>
    storage.getItem(NOTICE_CLOSED) === 'true' ? 'closed' : 'open',
  )
  const { address, appVersion, publishedVersion } = project
  if (appVersion === null || address === null) return <Stage />
  const phone = view === 'phone'
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-surface-3 md:px-lg md:pt-lg',
        phone && 'md:pb-lg',
      )}
    >
      <section
        aria-label="Prévia"
        className={cn(
          'flex min-h-0 flex-1 flex-col bg-surface',
          phone
            ? 'md:items-stretch md:bg-transparent'
            : 'md:overflow-hidden md:rounded-t-object md:border md:border-b-0 md:border-line',
        )}
      >
        <div
          className={cn(
            'grid h-11 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-sm border-b border-line bg-canvas px-sm md:grid-cols-[1fr_minmax(0,26rem)_1fr] md:bg-transparent',
            phone &&
              'md:w-[390px] md:self-center md:border-0 md:px-0 md:grid-cols-[auto_minmax(0,1fr)_auto]',
          )}
        >
          <Tip label="Recarregar">
            <Button variant="ghost" size="icon" aria-label="Recarregar" onClick={onReload}>
              <RotateCwIcon aria-hidden="true" />
            </Button>
          </Tip>
          <div className="flex h-8 min-w-0 items-center gap-sm rounded-pill bg-surface-3 px-lg md:justify-center max-md:bg-surface">
            <LockIcon className="size-3 shrink-0 text-text-2" aria-hidden="true" />
            <span className="min-w-0 truncate font-mono text-fact text-text">{address}</span>
            <span className="shrink-0 border-l border-line pl-sm text-label text-text-2 max-md:hidden">
              versão {appVersion}
            </span>
          </div>
          <div className="flex items-center justify-end gap-sm">
            {isMobile ? (
              publishedVersion !== null && (
                <a
                  href={`https://${address}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir app"
                  className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                >
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
              )
            ) : (
              <ViewSwitch view={view} />
            )}
          </div>
        </div>
        {isAppleWebKitBrowser() && notice === 'open' && (
          <div
            role="status"
            className={cn(
              'flex flex-wrap items-center gap-md border-b border-line bg-accent-soft px-md py-xs text-label',
              phone && 'md:w-[390px] md:max-w-full md:self-center md:rounded-control md:border',
            )}
          >
            <TriangleAlertIcon className="size-4 shrink-0 text-warning" aria-hidden="true" />
            <p className="min-w-0 flex-1">O app pode não abrir aqui dentro neste navegador.</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar aviso"
              onClick={() => {
                storage.setItem(NOTICE_CLOSED, 'true')
                setNotice('closed')
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        )}
        <Frame key={`${appVersion}-${reloads}`} address={address} view={view} />
      </section>
    </div>
  )
}
