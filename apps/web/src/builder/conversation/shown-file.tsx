import type { ShownFile } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { DownloadIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { failureOf, hubClientFetch, sentenceOf, sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { SHEET_CLOSE_ROOM } from '../../ui/sheet.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Markdown } from './markdown.tsx'
import { FILE_EMPTY } from './text.ts'

type Shown = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/** The images the Hub's CSP lets the page draw from its own address; every other file is saved. */
const DRAWN = ['image/png', 'image/jpeg', 'image/svg+xml']

/**
 * Reads the conversation's file route with the Hub's fetch (web W9: a refusal is read, not left to
 * the browser's download manager). A refusal is thrown as the Hub's one failure, so a lapsed
 * session returns to sign-in like every other call (W15).
 */
async function readFile(url: string): Promise<Response> {
  const response = await hubClientFetch(url)
  if (!response.ok) throw await failureOf(response)
  return response
}

/** Reads the route again to learn why the image did not come: the image tag says only that it failed. */
async function whyNot(url: string): Promise<void> {
  await readFile(url)
}

/** How long the saved file's address lives: Firefox reads the blob after the click returns. */
const REVOKE_AFTER_MS = 40_000

/** Saves the file the route answers: the bytes become a blob that an `<a download>` saves. */
async function save(file: { url: string; name: string }): Promise<void> {
  const href = URL.createObjectURL(await (await readFile(file.url)).blob())
  const link = document.createElement('a')
  link.href = href
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), REVOKE_AFTER_MS)
}

type PictureState = 'LOADING' | 'DRAWN' | 'FAILED'

/**
 * The image's own state, held by the panel so that its failure and the download's are one block
 * when they say the same thing. A failed image reads the route again to learn why: the image tag
 * says only that it failed.
 */
function usePicture() {
  const [state, setState] = useState<PictureState>('LOADING')
  const [attempt, setAttempt] = useState(0)
  const why = useMutation({ mutationFn: whyNot, meta: { keepCache: true } })
  return {
    state,
    attempt,
    drawn: () => setState('DRAWN'),
    failed: (url: string) => {
      setState('FAILED')
      why.mutate(url)
    },
    text:
      state === 'FAILED'
        ? why.isError
          ? sentenceOf(why.error)
          : sentenceOfCode('INTERNAL_UNEXPECTED')
        : undefined,
    again: () => {
      setState('LOADING')
      setAttempt(attempt + 1)
      why.reset()
    },
  }
}

type Picture = ReturnType<typeof usePicture>

function Image(props: { url: string; name: string; picture: Picture }) {
  const { picture } = props
  return (
    <>
      {picture.state === 'LOADING' && (
        <div role="status" aria-label="Carregando">
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {picture.state !== 'FAILED' && (
        <img
          key={picture.attempt}
          src={props.url}
          alt={props.name}
          onLoad={picture.drawn}
          onError={() => picture.failed(props.url)}
          className={cn('max-w-full', picture.state === 'LOADING' && 'hidden')}
        />
      )}
    </>
  )
}

/** The address of a file of the conversation's machine, on the route of the conversation's owner. */
type UrlOf = (path: string) => string

function Body(props: { urlOf: UrlOf; shown: Shown; picture: Picture }) {
  const { shown } = props
  if (shown.kind === 'TEXT') {
    if (shown.content === '') return <p className="text-text-2">{FILE_EMPTY}</p>
    return shown.media === 'text/markdown' ? (
      <Markdown text={shown.content} />
    ) : (
      <pre className="whitespace-pre-wrap break-words font-mono text-fact">{shown.content}</pre>
    )
  }
  if (shown.bytes === 0) return <p className="text-text-2">{FILE_EMPTY}</p>
  if (DRAWN.includes(shown.media)) {
    return <Image url={props.urlOf(shown.path)} name={shown.name} picture={props.picture} />
  }
  return (
    <p className="text-text-2">
      {shown.name} · {shown.media} · {bytesText(shown.bytes)}
    </p>
  )
}

function bytesText(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/**
 * The file `show_file` showed, beside the chat (web W31's panel in the Prévia's place): a text as
 * Markdown or as plain text, an image drawn from the conversation's file route (same origin,
 * `img-src 'self'`), any other file by its name, size and type. Every file has **Baixar**, which
 * reads the route with the Hub's fetch and saves the bytes, or says why it could not; the Hub
 * answers the route with the headers that keep the browser from running it (S24).
 */
function FilePanel(props: {
  urlOf: UrlOf
  shown: Shown
  onClose?: () => void
  /** In the sheet on a phone, the header leaves room for the sheet's own **Fechar**. */
  inSheet?: boolean
}) {
  const { shown } = props
  const url = props.urlOf(shown.path)
  const download = useMutation({ mutationFn: save, meta: { keepCache: true } })
  const picture = usePicture()
  // The image and Baixar read the same route: when they fail the same way, the person reads it once.
  const downloadText = download.isError ? sentenceOf(download.error) : undefined
  return (
    <section aria-label={shown.name} className="flex h-full min-h-0 flex-col bg-canvas">
      <header
        className={cn(
          'flex items-center justify-between gap-sm border-b border-line px-md py-sm',
          props.inSheet === true && SHEET_CLOSE_ROOM,
        )}
      >
        <h2 className="min-w-0 truncate font-medium">{shown.name}</h2>
        <div className="flex shrink-0 items-center gap-xs">
          <Button
            size="sm"
            className="gap-xs"
            disabled={download.isPending}
            onClick={() => download.mutate({ url, name: shown.name })}
          >
            <DownloadIcon aria-hidden="true" />
            Baixar
          </Button>
          {props.onClose !== undefined && (
            <Button size="icon" variant="ghost" aria-label="Fechar" onClick={props.onClose}>
              <XIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-md overflow-auto p-md">
        {picture.text !== undefined && (
          <ReadFailure
            text={picture.text}
            onRetry={() => {
              picture.again()
              if (downloadText === picture.text) download.reset()
            }}
          />
        )}
        {downloadText !== undefined && downloadText !== picture.text && (
          <ReadFailure
            text={downloadText}
            onRetry={() => download.mutate({ url, name: shown.name })}
          />
        )}
        <Body urlOf={props.urlOf} shown={shown} picture={picture} />
      </div>
    </section>
  )
}

/**
 * What goes beside a conversation (`Beside`'s `side`): the file panel once a file is open, none
 * before. On a phone the sheet has its own **Fechar**, so the panel does not draw one.
 */
export function fileSide(
  file: Shown | undefined,
  urlOf: UrlOf,
  closing: { phone: boolean; close: () => void },
): ReactNode | undefined {
  if (file === undefined) return undefined
  return (
    <FilePanel
      urlOf={urlOf}
      shown={file}
      onClose={closing.phone ? undefined : closing.close}
      inSheet={closing.phone}
    />
  )
}
