import type { Native } from '@conexus/hub-api'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible.tsx'
import { nativeText, reasonText } from './text.ts'

/**
 * What the provider said, as text: its status and code on one line, its message when it sent one,
 * why a 2xx did not read, and its body, shut until asked for.
 */
export function Said(props: { native: Native; name: string }) {
  const { native } = props
  const body = native.body === undefined || native.body === null ? undefined : native.body
  return (
    <div className="flex flex-col gap-xs">
      <p className="break-words text-text-2">{nativeText(native, props.name)}</p>
      {native.reason !== undefined && (
        <p className="break-words text-text-2">{reasonText(native.reason)}</p>
      )}
      {body !== undefined && (
        <Collapsible>
          <CollapsibleTrigger className="text-text-2 underline underline-offset-2">
            Ver a resposta inteira
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-control border border-line bg-surface-3 p-sm font-mono text-fact">
              {typeof body === 'string' ? body : JSON.stringify(body, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
