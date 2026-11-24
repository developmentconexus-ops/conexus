import type {
  FailureData,
  MachineData,
  MachinePhase,
  NoticeData,
  VersionData,
} from '@conexus/hub-api'
import { CheckIcon, CircleAlertIcon, CogIcon, InfoIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { useSecondsShown } from './elapsed.ts'
import { useRoom } from './room.ts'
import { durationOf } from './text.ts'

const PHASES: Record<MachinePhase, string> = {
  starting: 'Ligando a máquina…',
  copying: 'Copiando os arquivos do app…',
  saving: 'Guardando a versão…',
}

function Since() {
  const seconds = useSecondsShown()
  return <span aria-hidden="true"> (há {durationOf(seconds)})</span>
}

/** A step the turn waits on, with how long it has shown. */
export function WaitLine({ text }: { text: string }) {
  return (
    <Marker className="text-text-2">
      <MarkerIcon>
        <CogIcon />
      </MarkerIcon>
      <MarkerContent>
        {text}
        <Since />
      </MarkerContent>
    </Marker>
  )
}

export function MachineLine({ data }: { data: MachineData }) {
  return <WaitLine text={PHASES[data.phase]} />
}

function files(count: number, changed: string): string {
  return `${count} ${count === 1 ? 'arquivo' : 'arquivos'}${changed}`
}

const BUILT = {
  passed: ', montou',
  failed: ', não montou',
  unchecked: ', sem conferência',
  unfinished: ', pela metade',
} as const

function versionSentence(data: VersionData): string {
  if (!data.changed) return `A versão ${data.number} segue a mesma.`
  const count =
    data.number === 1
      ? files(data.files, '')
      : files(data.changedFiles, data.changedFiles === 1 ? ' mudado' : ' mudados')
  const built = BUILT[data.check?.state ?? 'unchecked']
  return `Versão ${data.number} guardada${built}: ${count}.`
}

export function VersionLine({ data }: { data: VersionData }) {
  const said =
    data.check?.state === 'failed' || data.check?.state === 'unchecked'
      ? data.check.code
      : undefined
  const failed = data.check?.state === 'failed'
  return (
    <Marker className={failed ? 'text-danger' : 'text-text'}>
      <MarkerIcon>{said === undefined ? <CheckIcon /> : <CircleAlertIcon />}</MarkerIcon>
      <MarkerContent>
        {versionSentence(data)}
        {said !== undefined && <span className="block">{sentenceOfCode(said)}</span>}
      </MarkerContent>
    </Marker>
  )
}

export function FailureLine({ data }: { data: FailureData }) {
  const room = useRoom()
  return (
    <Marker role="alert" className="text-danger">
      <MarkerIcon>
        <CircleAlertIcon />
      </MarkerIcon>
      <MarkerContent>
        {room.failures[data.code] ?? sentenceOfCode(data.code, data.person)}
      </MarkerContent>
    </Marker>
  )
}

export function NoticeLine({ data }: { data: NoticeData }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <InfoIcon />
      </MarkerIcon>
      <MarkerContent>{data.text}</MarkerContent>
    </Marker>
  )
}
