import type { MessagePart } from '@conexus/hub-api'
import { machinePhaseLasts } from '@conexus/hub-api'
import { CheckIcon, CircleAlertIcon, CogIcon, RotateCcwIcon } from 'lucide-react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { useSecondsShown } from './elapsed.ts'
import { durationOf } from './text.ts'

type Machine = Extract<MessagePart, { type: 'machine' }>
type Version = Extract<MessagePart, { type: 'version' }>
type Restarted = Extract<MessagePart, { type: 'restarted' }>

const PHASES: Record<Machine['phase'], string> = {
  starting: 'Ligando a máquina…',
  waking: 'Ligando a máquina…',
  copying: 'Copiando os arquivos do app…',
  replaced: 'A máquina anterior sumiu; refiz a partir do que está guardado.',
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

/**
 * What the end of the turn's check said of the saved version (card of step 14): it built, it did
 * not, or the machine could not check it (founder, 2026-10-22: "Aprovookay").
 */
const BUILT = {
  passed: ', montou',
  failed: ', não montou',
  unchecked: ', sem conferência',
} as const

/**
 * "Versão 1 guardada, montou: 7 arquivos.", then "Versão 2 guardada, não montou: 2 arquivos
 * mudados."; a turn that ended before its check ran (stopped, the hour, an error) saved its version
 * without one, and says so (founder, 2026-10-22, "Aprovo").
 */
function versionSentence(part: Version): string {
  if (!part.changed) return `A versão ${part.number} segue a mesma.`
  const count =
    part.number === 1
      ? files(part.files, '')
      : files(part.changedFiles, part.changedFiles === 1 ? ' mudado' : ' mudados')
  const built = BUILT[part.check?.state ?? 'unchecked']
  return `Versão ${part.number} guardada${built}: ${count}.`
}

/**
 * The version the turn saved; one that did not build, or that the machine could not check, says
 * its failure's words below it.
 */
export function VersionLine({ part }: { part: Version }) {
  const said = part.check?.state === 'passed' ? undefined : part.check?.code
  const failed = part.check?.state === 'failed'
  return (
    <Marker className={failed ? 'text-danger' : 'text-text'}>
      <MarkerIcon>{said === undefined ? <CheckIcon /> : <CircleAlertIcon />}</MarkerIcon>
      <MarkerContent>
        {versionSentence(part)}
        {said !== undefined && <span className="block">{sentenceOfCode(said)}</span>}
      </MarkerContent>
    </Marker>
  )
}

/**
 * The server restarted mid-turn: what the Builder had written is a version, and the person sends
 * again; a restart that cut the save says its files were not saved.
 */
export function RestartedLine({ part }: { part: Restarted }) {
  return (
    <Marker className="text-text">
      <MarkerIcon>
        <RotateCcwIcon />
      </MarkerIcon>
      <MarkerContent>
        {part.kept === 'lost' ? (
          'O turno anterior foi cortado; os arquivos dele não foram guardados.'
        ) : (
          <>
            O servidor reiniciou no meio do turno.{' '}
            {part.kept !== 'nothing' && (
              <>
                O que o Builder já tinha escrito foi guardado como{' '}
                <strong>Versão {part.kept}</strong>.{' '}
              </>
            )}
            Mande a mensagem de novo para ele continuar.
          </>
        )}
      </MarkerContent>
    </Marker>
  )
}
