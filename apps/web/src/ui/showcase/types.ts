import type { ReactElement } from 'react'

export type ShowcaseGroup =
  | 'Ações'
  | 'Campos'
  | 'Navegação'
  | 'Dados'
  | 'Retorno'
  | 'Sobreposições'
  | 'Conversa'

type PreviewState =
  | 'default'
  | 'hover'
  | 'focus'
  | 'active'
  | 'disabled'
  | 'invalid'
  | 'loading'
  | 'empty'
  | 'error'

type MemberLabel = `${string}.${Uppercase<string>}` | `${string}.${Uppercase<string>} ${string}`
type StateLabel = PreviewState | MemberLabel

export type ShowcaseEntry = {
  /** O arquivo de `ui/` que a entrada mostra, como `button.tsx`; o teste confere que existe. */
  file: `${string}.tsx`
  name: string
  group: ShowcaseGroup
  /** Uma linha de quando usar, tirada do `DESIGN.md` quando ele tem. */
  when: string
  typical: () => ReactElement
  states: readonly [StateLabel, () => ReactElement][]
}
