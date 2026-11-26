import type { CodeSaveResult } from '@conexus/hub-api'

type Refusal = Extract<CodeSaveResult, { kind: 'REFUSED' }>

export function refusal(code: Refusal['code'], rest: Omit<Refusal, 'kind' | 'code'> = {}): Refusal {
  return { kind: 'REFUSED', code, ...rest }
}

const NOT_OFFERED_HINT =
  'A ligação não foi liberada para este Projeto. Leia project_read e use o connectionId de uma ligação em offered. Se offered vier vazia, diga à pessoa para abrir Integrações do Projeto e tocar em "Liberar para ler".'
const NOT_A_READ_HINT =
  'Alguma operação de reads não é uma leitura dessa ligação. Use só as operações que project_read mostra em offered para ela.'

/** What the model needs to correct a refusal that has no test output: the cause in words, never a bare code. */
export function hintOf(_field: string | undefined, reason: string | undefined): string | undefined {
  if (reason === 'NOT_OFFERED') return NOT_OFFERED_HINT
  if (reason === 'NOT_A_READ') return NOT_A_READ_HINT
  return undefined
}

/** Why the call fits neither shape: the missing piece, for the model, in the words of the call's fields. */
export function missingOf(input: {
  toolId?: unknown
  slug?: unknown
  connectionId?: unknown
}): string {
  if (input.toolId !== undefined) {
    return 'Para salvar uma versão nova de uma ferramenta, envie toolId e basedOn (a versão que você leu como a última).'
  }
  const missing = [
    ...(input.slug === undefined ? ['slug'] : []),
    ...(input.connectionId === undefined ? ['connectionId'] : []),
  ].join(' e ')
  return `Uma ferramenta de código nova precisa de slug, de connectionId (uma ligação que o Projeto recebeu, em offered de project_read) e de pelo menos uma leitura em reads. Faltou: ${missing}. Toda ferramenta de código lê uma ligação; se o Projeto não recebeu nenhuma, diga à pessoa para abrir Integrações do Projeto e tocar em "Liberar para ler".`
}

/** The field a call that fits neither shape lacks: the one `missingOf` names first. */
export function fieldOf(input: {
  toolId?: unknown
  slug?: unknown
}): 'toolId' | 'slug' | 'connectionId' {
  if (input.toolId !== undefined) return 'toolId'
  return input.slug === undefined ? 'slug' : 'connectionId'
}
