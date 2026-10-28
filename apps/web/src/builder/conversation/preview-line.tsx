import type { PreviewData } from '@conexus/hub-api'
import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { WaitLine } from './machine-line.tsx'
import { askOf, reasonOf } from './migration-cause.ts'

/**
 * The Prévia's line in the version's message. A wait shows only while the turn runs: a kept
 * `sending` on a settled turn is a send the shutdown cut, and the Versões tab tells its end. A
 * failure with a cause shows the reason and a button that brings it to the box (A1, 2026-10-27).
 */
export function PreviewLine({
  data,
  live,
  onAsk,
}: {
  data: PreviewData
  live: boolean
  onAsk?: (text: string) => void
}) {
  if (data.state === 'sending') return live ? <WaitLine text="Subindo o app…" /> : null
  const ready = data.state === 'ready'
  const cause = data.state === 'failed' ? data.cause : undefined
  return (
    <Marker className={ready ? 'text-text' : 'text-danger'}>
      <MarkerIcon>{ready ? <CheckIcon /> : <CircleAlertIcon />}</MarkerIcon>
      <MarkerContent>
        {ready ? 'Prévia pronta.' : `Prévia não atualizada: ${sentenceOfCode(data.code)}`}
        {cause !== undefined && (
          <>
            <span className="block">Motivo: {reasonOf(cause)}.</span>
            {onAsk !== undefined && (
              <Button className="mt-xs" onClick={() => onAsk(askOf(data.number, cause))}>
                Pedir ao Builder para corrigir
              </Button>
            )}
          </>
        )}
      </MarkerContent>
    </Marker>
  )
}
