import type { PreviewData } from '@conexus/hub-api'
import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { WaitLine } from './machine-line.tsx'

/**
 * The Prévia's line in the version's message. A wait shows only while the turn runs: a kept
 * `sending` on a settled turn is a send the shutdown cut, and the Versões tab tells its end.
 */
export function PreviewLine({ data, live }: { data: PreviewData; live: boolean }) {
  if (data.state === 'sending') return live ? <WaitLine text="Subindo o app…" /> : null
  const ready = data.state === 'ready'
  return (
    <Marker className={ready ? 'text-text' : 'text-danger'}>
      <MarkerIcon>{ready ? <CheckIcon /> : <CircleAlertIcon />}</MarkerIcon>
      <MarkerContent>
        {ready ? 'Prévia pronta.' : `Prévia não atualizada: ${sentenceOfCode(data.code)}`}
      </MarkerContent>
    </Marker>
  )
}
