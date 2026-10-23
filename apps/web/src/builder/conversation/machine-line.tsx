import { CheckIcon, CircleAlertIcon, CogIcon, InfoIcon, RotateCcwIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { useSecondsShown } from './elapsed.ts'
import { durationOf } from './text.ts'
import type {
  ConexusFailureData,
  ConexusMachineData,
  ConexusNoticeData,
  ConexusRestartedData,
  ConexusVersionData,
  MachinePhase,
} from './transcript-items.ts'
import { isMachineLasting } from './transcript-items.ts'

export {
  ConexusFailureData,
  ConexusMachineData,
  ConexusNoticeData,
  ConexusRestartedData,
  ConexusVersionData,
} from './transcript-items.ts'

const PHASES: Record<MachinePhase, string> = {
  starting: 'Ligando a máquina…',
  waking: 'Ligando a máquina…',
  copying: 'Copiando os arquivos do app…',
  replaced: 'A máquina anterior sumiu; refiz a partir do que está guardado.',
  saving: 'Guardando a versão…',
}

function Since() {
  const seconds = useSecondsShown()
  return <span aria-hidden="true"> (há {durationOf(seconds)})</span>
}

export function MachineLine({ data }: { data: ConexusMachineData }) {
  const lasts = isMachineLasting(data.phase)
  return (
    <Marker className="text-text-2">
      <MarkerIcon>
        <CogIcon />
      </MarkerIcon>
      <MarkerContent>
        {PHASES[data.phase]}
        {!lasts && <Since />}
      </MarkerContent>
    </Marker>
  )
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

function versionSentence(data: ConexusVersionData): string {
  if (!data.changed) return `A versão ${data.number} segue a mesma.`
  const count =
    data.number === 1
      ? files(data.files, '')
      : files(data.changedFiles, data.changedFiles === 1 ? ' mudado' : ' mudados')
  const built = BUILT[data.check?.state ?? 'unchecked']
  return `Versão ${data.number} guardada${built}: ${count}.`
}

export function VersionLine({ data }: { data: ConexusVersionData }) {
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

export function RestartedLine({ data }: { data: ConexusRestartedData }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <RotateCcwIcon />
      </MarkerIcon>
      <MarkerContent>
        {data.kept === 'lost' ? (
          'O turno anterior foi cortado; os arquivos dele não foram guardados.'
        ) : (
          <>
            O servidor reiniciou no meio do turno.{' '}
            {data.kept !== 'nothing' && (
              <>
                O que o Builder já tinha escrito foi guardado como{' '}
                <strong>Versão {data.kept}</strong>.{' '}
              </>
            )}
            Mande a mensagem de novo para ele continuar.
          </>
        )}
      </MarkerContent>
    </Marker>
  )
}

export function FailureLine({ data }: { data: ConexusFailureData }) {
  return (
    <Marker role="alert" className="text-danger">
      <MarkerIcon>
        <CircleAlertIcon />
      </MarkerIcon>
      <MarkerContent>{sentenceOfCode(data.code)}</MarkerContent>
    </Marker>
  )
}

export function NoticeLine({ data }: { data: ConexusNoticeData }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <InfoIcon />
      </MarkerIcon>
      <MarkerContent>{data.text}</MarkerContent>
    </Marker>
  )
}
