import { Button } from '../button.tsx'
import { SpeechInput } from '../speech-input.tsx'
import { ToggleGroup, ToggleGroupItem } from '../toggle-group.tsx'

import { ACTIVE, entry, FOCUS, HOVER, noop } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

export const ACTIONS: readonly ShowcaseEntry[] = [
  entry(
    'button.tsx',
    'Ações',
    'Uma ação da página; o primário só uma vez por tela.',
    () => (
      <div className="flex flex-wrap items-center gap-lg">
        <Button variant="primary">Salvar</Button>
        <Button size="sm">Pequeno</Button>
        <Button size="icon" aria-label="Ícone" />
        <Button size="icon-sm" aria-label="Ícone pequeno" />
      </div>
    ),
    [
      ['hover', () => <Button {...HOVER}>Salvar</Button>],
      ['focus', () => <Button {...FOCUS}>Salvar</Button>],
      ['active', () => <Button {...ACTIVE}>Salvar</Button>],
      [
        'disabled',
        () => (
          <div className="flex flex-wrap gap-lg">
            <Button disabled>Salvar</Button>
            <Button variant="primary" disabled>
              Salvar
            </Button>
            <Button disabled focusableWhenDisabled>
              Salvando
            </Button>
            <Button variant="primary" disabled focusableWhenDisabled>
              Salvando
            </Button>
          </div>
        ),
      ],
    ],
  ),
  entry(
    'toggle-group.tsx',
    'Ações',
    'Escolher uma visão entre poucas, lado a lado.',
    () => (
      <ToggleGroup defaultValue={['lista']} aria-label="Visão">
        <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
        <ToggleGroupItem value="grade">Grade</ToggleGroupItem>
      </ToggleGroup>
    ),
    [
      [
        'disabled',
        () => (
          <ToggleGroup disabled aria-label="Visão">
            <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
          </ToggleGroup>
        ),
      ],
    ],
  ),
  entry(
    'speech-input.tsx',
    'Ações',
    'Ditar no lugar de escrever; só aparece onde o navegador sabe ouvir.',
    () => <SpeechInput lang="pt-BR" onFinal={noop} onInterim={noop} onError={noop} />,
  ),
]
