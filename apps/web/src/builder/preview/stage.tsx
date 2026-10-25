import { ConexusMark } from '../../brand/mark.tsx'

/** The Prévia of a Projeto before its first app. */
export function Stage() {
  return (
    <div className="grid h-full place-items-center p-lg text-center">
      <div className="flex max-w-message flex-col items-center gap-md">
        <ConexusMark size={48} />
        <p className="text-text-2">
          Ainda não há uma prévia disponível. Descreva o aplicativo para começar.
        </p>
      </div>
    </div>
  )
}
