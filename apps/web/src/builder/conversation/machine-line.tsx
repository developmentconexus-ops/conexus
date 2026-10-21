import type { MessagePart } from '@conexus/hub-api'
import { machinePhaseLasts } from '@conexus/hub-api'
import { CheckIcon, CogIcon } from 'lucide-react'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { useSecondsShown } from './elapsed.ts'
import { durationOf } from './text.ts'

type Machine = Extract<MessagePart, { type: 'machine' }>
type Version = Extract<MessagePart, { type: 'version' }>

const PHASES: Record<Machine['phase'], string> = {
  starting: 'Ligando a máquina…',
  waking: 'Ligando a máquina…',
  copying: 'Copiando os arquivos do app…',
  replaced: 'A máquina anterior sumiu; refiz a partir do que está guardado.',
  resumed: 'O servidor reiniciou; continuando…',
  saving: 'Guardando a versão…',
}

/** How long the machine's step has run, for the eye: "(há 4 s)". */
function Since() {
  const seconds = useSecondsShown()
  return <span aria-hidden="true"> (há {durationOf(seconds)})</span>
}

/**
 * What the machine does before a tool can run, in a line of its own, with how long it has been at
 * it; a phase that lasts is a fact, said without a clock.
 */
export function MachineLine({ part }: { part: Machine }) {
  return (
    <Marker className="text-text-2">
      <MarkerIcon>
        <CogIcon />
      </MarkerIcon>
      <MarkerContent>
        {PHASES[part.phase]}
        {!machinePhaseLasts(part.phase) && <Since />}
      </MarkerContent>
    </Marker>
  )
}

function files(count: number, changed: string): string {
  return `${count} ${count === 1 ? 'arquivo' : 'arquivos'}${changed}`
}

/** "Versão 1 guardada: 7 arquivos.", then "Versão 2 guardada: 2 arquivos mudados.". */
function versionSentence(part: Version): string {
  if (!part.changed) return `A versão ${part.number} segue a mesma.`
  const count =
    part.number === 1
      ? files(part.files, '')
      : files(part.changedFiles, part.changedFiles === 1 ? ' mudado' : ' mudados')
  return `Versão ${part.number} guardada: ${count}.`
}

/** The version the turn saved. */
export function VersionLine({ part }: { part: Version }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <CheckIcon />
      </MarkerIcon>
      <MarkerContent>{versionSentence(part)}</MarkerContent>
    </Marker>
  )
}
