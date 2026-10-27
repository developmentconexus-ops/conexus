import { BrainIcon, CircleAlertIcon, MessageSquareIcon } from 'lucide-react'
import { cn } from '../../ui/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import type { OMProgress } from './session-state.ts'

export type MemoryGauge = Pick<
  OMProgress,
  'pendingTokens' | 'threshold' | 'observationTokens' | 'reflectionThreshold'
>

function formatK(tokens: number): string {
  const k = tokens / 1000
  return k.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function Ring({ percent, spinning }: { percent: number; spinning: boolean }) {
  const circumference = 2 * Math.PI * 6
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-3.5 shrink-0', spinning && 'animate-spin')}
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-20"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-accent origin-center -rotate-90 transition-all duration-300"
      />
    </svg>
  )
}

/**
 * One memory ring in the status line of the composer's action row (Criterion 15): the share of the
 * message window that is full, with the number beside it on a computer. The popover keeps both
 * memories (Criterion 16).
 * Failure marks carry no vendor text (C48, C51).
 */
export function MemoryStatus(props: {
  memory: MemoryGauge | null
  omPhase?: 'idle' | 'buffering' | 'observing' | 'reflecting'
  failed?: 'observation' | 'reflection' | 'buffering' | null
}) {
  const { memory, omPhase = 'idle', failed = null } = props

  const pending = memory?.pendingTokens ?? 0
  const threshold = memory?.threshold ?? 30_000
  const observations = memory?.observationTokens ?? 0
  const reflectionThreshold = memory?.reflectionThreshold ?? 40_000

  const percent =
    threshold > 0 ? Math.round(Math.min(100, Math.max(0, (pending / threshold) * 100))) : 0
  const working = omPhase !== 'idle'

  return (
    <Popover>
      <PopoverTrigger
        className="flex min-h-11 min-w-11 items-center justify-center gap-xs text-fact text-text-2 hover:text-text md:min-h-0 md:min-w-0"
        aria-label={`Memória da conversa: Mensagens ${percent}%, ${formatK(pending)}/${formatK(threshold)}k, Observações ${formatK(observations)}/${formatK(reflectionThreshold)}k${
          failed ? ' · Falha na memória' : ''
        }`}
      >
        <Ring percent={percent} spinning={working} />
        <span className="tabular-nums max-md:hidden">{percent}%</span>
        {failed && (
          <span className="flex items-center text-danger" title="Falha na memória">
            <CircleAlertIcon className="size-3.5" aria-label="Falha na memória" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="flex flex-col gap-sm p-md text-fact">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-xs font-semibold text-text">
            <MessageSquareIcon className="size-4 text-text-2" />
            <span>Mensagens</span>
            <span className="ms-auto text-text-2 tabular-nums">
              {formatK(pending)} de {formatK(threshold)}k
            </span>
          </div>
          <p className="text-text-2">
            {failed === 'observation' || failed === 'buffering'
              ? 'Não foi possível guardar as mensagens na memória.'
              : 'Quando encher, o Builder resume a conversa para lembrar do que importa.'}
          </p>
        </div>

        <div className="flex flex-col gap-xs border-t border-line pt-sm">
          <div className="flex items-center gap-xs font-semibold text-text">
            <BrainIcon className="size-4 text-text-2" />
            <span>Memória</span>
            <span className="ms-auto text-text-2 tabular-nums">
              {formatK(observations)} de {formatK(reflectionThreshold)}k
            </span>
          </div>
          <p className="text-text-2">
            {failed === 'reflection'
              ? 'Não foi possível reorganizar as observações.'
              : 'Quando encher, o Builder junta as observações num resumo mais curto.'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
