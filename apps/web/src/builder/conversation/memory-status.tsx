import { BrainIcon, CircleAlertIcon, MessageSquareIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'

export type MemoryGauge = {
  pendingTokens: number
  threshold: number
  observationTokens: number
  reflectionThreshold: number
}

function formatK(tokens: number): string {
  const k = tokens / 1000
  return k.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function TokenRing({
  tokens,
  threshold,
  spinning = false,
}: {
  tokens: number
  threshold: number
  spinning?: boolean
}) {
  const percent = threshold > 0 ? Math.min(100, Math.max(0, (tokens / threshold) * 100)) : 0
  const circumference = 2 * Math.PI * 6
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-3.5 shrink-0 ${spinning ? 'animate-spin' : ''}`}
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
 * Memory rings and status under the composer (Criterion 11).
 * Displays observational memory windows, holding text, and failure marks without vendor text (C48, C51).
 */
export function MemoryStatus(props: {
  memory: MemoryGauge | null
  omPhase?: 'idle' | 'buffering' | 'observing' | 'reflecting'
  failed?: 'observation' | 'reflection' | null
}) {
  const { memory, omPhase = 'idle', failed = null } = props

  // Initial / empty state:
  const pending = memory?.pendingTokens ?? 0
  const threshold = memory?.threshold ?? 30_000
  const observations = memory?.observationTokens ?? 0
  const reflectionThreshold = memory?.reflectionThreshold ?? 40_000

  const isObserving = omPhase === 'observing'
  const isReflecting = omPhase === 'reflecting'
  const isBuffering = omPhase === 'buffering'

  const holdingText = isObserving
    ? 'Guardando a memória…'
    : isReflecting
      ? 'Reorganizando a memória…'
      : undefined

  const msgReading = `${formatK(pending)}/${formatK(threshold)}k`
  const obsReading = `${formatK(observations)}/${formatK(reflectionThreshold)}k`

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-sm text-fact text-text-2 hover:text-text focus-visible:outline-none"
        aria-label={`Memória da conversa: Mensagens ${msgReading}, Observações ${obsReading}${
          failed ? ' · Falha na memória' : ''
        }`}
      >
        <span className="flex items-center gap-xs">
          <TokenRing tokens={pending} threshold={threshold} spinning={isObserving || isBuffering} />
          <span className="tabular-nums">{msgReading}</span>
        </span>

        {reflectionThreshold > 0 && (
          <span className="flex items-center gap-xs">
            <TokenRing
              tokens={observations}
              threshold={reflectionThreshold}
              spinning={isReflecting}
            />
            <span className="tabular-nums">{obsReading}</span>
          </span>
        )}

        {holdingText && (
          <span className="flex items-center gap-xs font-medium text-text">
            <BrainIcon className="size-3.5" aria-hidden="true" />
            <span>{holdingText}</span>
          </span>
        )}

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
            {failed === 'observation'
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
