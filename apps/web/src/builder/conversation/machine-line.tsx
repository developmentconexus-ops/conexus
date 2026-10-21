import type { MessagePart } from '@conexus/hub-api'
import { CheckIcon, CogIcon } from 'lucide-react'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'

type Machine = Extract<MessagePart, { type: 'machine' }>
type Version = Extract<MessagePart, { type: 'version' }>

const PHASES: Record<Machine['phase'], string> = {
  starting: 'Preparando a máquina de trabalho…',
  waking: 'Acordando a máquina de trabalho…',
  copying: 'Levando o código para a máquina…',
  replaced: 'A máquina anterior sumiu; recomecei da última versão guardada.',
  resumed: 'O servidor reiniciou; continuando…',
  saving: 'Guardando a versão…',
}

/** What the machine does before a tool can run, in a line of its own. */
export function MachineLine({ part }: { part: Machine }) {
  return (
    <Marker className="text-text-2">
      <MarkerIcon>
        <CogIcon />
      </MarkerIcon>
      <MarkerContent>{PHASES[part.phase]}</MarkerContent>
    </Marker>
  )
}

/** The version the turn saved. */
export function VersionLine({ part }: { part: Version }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <CheckIcon />
      </MarkerIcon>
      <MarkerContent>
        {part.changed
          ? `Guardei a versão ${part.number}.`
          : `A versão ${part.number} segue a mesma.`}
      </MarkerContent>
    </Marker>
  )
}
