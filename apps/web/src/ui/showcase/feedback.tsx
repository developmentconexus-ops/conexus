import { Alert } from '../alert.tsx'
import { Button } from '../button.tsx'
import { Notice, useNotice } from '../notice.tsx'
import { Skeleton } from '../skeleton.tsx'
import { Spinner } from '../spinner.tsx'
import { Empty, Loading, ReadFailure } from '../states.tsx'

import { Boxed, entry, noop } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

function Saved() {
  const notice = useNotice()
  return <Button onClick={() => notice({ title: 'Padrão salvo' })}>Salvar padrão</Button>
}

export const FEEDBACK: readonly ShowcaseEntry[] = [
  entry('alert.tsx', 'Retorno', 'Uma frase de erro junto do que falhou.', () => (
    <Alert tone="danger">Não foi possível salvar.</Alert>
  )),
  entry(
    'notice.tsx',
    'Retorno',
    'Um aviso calmo, lido sem urgência; o que deu certo longe do olho avisa no canto e some sozinho.',
    () => <Notice>Senha criada. Você já entrou.</Notice>,
    [['default', () => <Saved />]],
  ),
  entry('spinner.tsx', 'Retorno', 'Algo está em andamento e não tem forma própria.', () => (
    <Spinner label="Carregando" />
  )),
  entry('skeleton.tsx', 'Retorno', 'A forma do que está chegando.', () => (
    <Skeleton className="h-6 w-48" />
  )),
  entry(
    'states.tsx',
    'Retorno',
    'Carregando, falha de leitura e lista vazia de uma página.',
    () => <Empty>Nenhum projeto ainda.</Empty>,
    [
      [
        'loading',
        () => (
          <Boxed>
            <Loading />
          </Boxed>
        ),
      ],
      ['error', () => <ReadFailure text="Não foi possível carregar os Projetos." onRetry={noop} />],
    ],
  ),
]
