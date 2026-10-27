import { BrainIcon, CircleAlertIcon, MessageSquareIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '../../ui/cn.ts'
import { Meter } from '../../ui/meter.tsx'
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

function Ring({ percent, working }: { percent: number; working: boolean }) {
  const id = useId()
  const circumference = 2 * Math.PI * 6
  const arc = `${(circumference * percent) / 100} ${circumference}`
  const circle = {
    cx: 8,
    cy: 8,
    r: 6,
    fill: 'none',
    strokeWidth: 2,
    strokeDasharray: arc,
    strokeLinecap: 'round',
    className: 'origin-center -rotate-90 transition-all duration-300 motion-reduce:transition-none',
  } as const

  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-accent"
      data-working={working || undefined}
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-text-2 opacity-20"
      />
      {working ? (
        <>
          <defs>
            <linearGradient id={`${id}-sheen`}>
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
            </linearGradient>
            <mask id={`${id}-arc`}>
              <circle {...circle} stroke="white" />
            </mask>
          </defs>
          <g mask={`url(#${id}-arc)`}>
            <rect
              width="16"
              height="16"
              fill={`url(#${id}-sheen)`}
              className="origin-center animate-ring-sweep motion-reduce:rotate-[120deg] motion-reduce:animate-none"
            />
          </g>
        </>
      ) : (
        <circle {...circle} stroke="currentColor" />
      )}
    </svg>
  )
}

/** One memory of the popover: its icon and name, how full it is, the bar and what filling it does. */
function Budget(props: {
  icon: ReactNode
  label: string
  used: number
  threshold: number
  tone: string
  description: string
  className?: string
}) {
  const { icon, label, used, threshold, tone, description, className } = props
  const percent = threshold > 0 ? Math.min(100, (used / threshold) * 100) : 0

  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      <div className="flex items-center gap-xs font-semibold text-text">
        <span className={tone}>{icon}</span>
        <span>{label}</span>
        <span className="ms-auto text-text-2 tabular-nums">
          {formatK(used)} de {formatK(threshold)}k
        </span>
      </div>
      <Meter label={label} value={percent} className={tone} />
      <p className="text-text-2">{description}</p>
    </div>
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
        <Ring percent={percent} working={working} />
        <span className="tabular-nums max-md:hidden">{percent}%</span>
        {failed && (
          <span className="flex items-center text-danger" title="Falha na memória">
            <CircleAlertIcon className="size-3.5" aria-label="Falha na memória" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="flex flex-col gap-md p-md text-fact">
        <Budget
          icon={<MessageSquareIcon className="size-4" />}
          label="Mensagens"
          used={pending}
          threshold={threshold}
          tone="text-accent"
          description={
            failed === 'observation' || failed === 'buffering'
              ? 'Não foi possível guardar as mensagens na memória.'
              : 'Quando encher, o Builder resume a conversa para lembrar do que importa.'
          }
        />
        <Budget
          icon={<BrainIcon className="size-4" />}
          label="Memória"
          used={observations}
          threshold={reflectionThreshold}
          tone="text-memory"
          className="border-t border-line pt-sm"
          description={
            failed === 'reflection'
              ? 'Não foi possível reorganizar as observações.'
              : 'Quando encher, o Builder junta as observações num resumo mais curto.'
          }
        />
      </PopoverContent>
    </Popover>
  )
}
