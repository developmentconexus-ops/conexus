import type { PreviewData } from '@conexus/hub-api'
import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { WaitLine } from './machine-line.tsx'

export function PreviewLine({ data }: { data: PreviewData }) {
  if (data.state === 'sending') return <WaitLine text="Subindo o app…" />
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
