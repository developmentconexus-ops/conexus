import { GlobeIcon, PencilIcon, SearchIcon, TerminalIcon } from 'lucide-react'
import { AgentSign } from '../ai/agent-sign.tsx'
import { ReasoningLine } from '../ai/reasoning-line.tsx'
import type { SourceView } from '../ai/sources.tsx'
import { Sources } from '../ai/sources.tsx'
import type { TaskListText, TaskView } from '../ai/task-list.tsx'
import { TaskList } from '../ai/task-list.tsx'
import { ToolGroup } from '../ai/tool-group.tsx'
import type { ToolLineBeside, ToolLineState } from '../ai/tool-line.tsx'
import { ToolLine } from '../ai/tool-line.tsx'
import { WorkingLine } from '../ai/working-line.tsx'
import { TraceDescription } from '../trace.tsx'
import { entry } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

const BODY = <pre className="font-mono text-fact">$ npm run build</pre>
const CLOCK: ToolLineBeside = {
  kind: 'CLOCK',
  clock: <TraceDescription className="shrink-0 text-fact">(12 s)</TraceDescription>,
}

function Tool(props: { state: ToolLineState; beside: ToolLineBeside; body?: true }) {
  const failed = props.state.kind === 'FAILED'
  return (
    <ToolLine
      icon={TerminalIcon}
      sentence={
        failed
          ? 'Não conseguiu rodar o comando, porque a pasta do app não existe mais'
          : 'Rodou um comando'
      }
      state={props.state}
      beside={props.beside}
      body={props.body ? BODY : undefined}
    />
  )
}

const TASK_TEXT: TaskListText = {
  region: 'Painel de tarefas',
  heading: 'Tarefas · 1 de 3',
  done: 'Concluída',
  running: 'Em andamento',
  pending: 'Pendente',
}

const TASKS: readonly TaskView[] = [
  { id: 't1', text: 'Ler a tabela de pedidos', status: 'DONE' },
  { id: 't2', text: 'Montando a tela de encomendas', status: 'IN_PROGRESS' },
  { id: 't3', text: 'Publicar o app', status: 'PENDING' },
]

const PAGE: SourceView = {
  kind: 'PAGE',
  key: 'p1',
  title: 'Como precificar encomendas de padaria',
  href: 'https://padaria.example.test/precos',
  domain: 'padaria.example.test',
}

const TABLE: SourceView = {
  kind: 'TABLE',
  key: 'd1',
  name: 'Sankhya · Matriz',
  logo: undefined,
  table: 'TGFCAB',
  stamp: { tone: 'success', text: 'copiado hoje, às 09:00' },
}

export const AI_LINES: readonly ShowcaseEntry[] = [
  entry(
    'ai/tool-line.tsx',
    'IA',
    'Uma chamada de ferramenta do agente, como uma linha que abre no que ela recebeu e devolveu.',
    () => (
      <Tool state={{ kind: 'DONE' }} beside={{ kind: 'DETAIL', text: 'src/pedidos.ts' }} body />
    ),
    [
      ['ToolLineState.RUNNING', () => <Tool state={{ kind: 'RUNNING' }} beside={CLOCK} />],
      [
        'ToolLineState.DONE',
        () => <Tool state={{ kind: 'DONE' }} beside={{ kind: 'NONE' }} body />,
      ],
      [
        'ToolLineState.FAILED',
        () => <Tool state={{ kind: 'FAILED' }} beside={{ kind: 'NONE' }} body />,
      ],
      [
        'ToolLineBeside.DETAIL',
        () => (
          <Tool
            state={{ kind: 'DONE' }}
            beside={{ kind: 'DETAIL', text: 'npm run build --workspace apps/web' }}
          />
        ),
      ],
      ['ToolLineBeside.CLOCK', () => <Tool state={{ kind: 'RUNNING' }} beside={CLOCK} body />],
      [
        'ToolLineBeside.NONE sem corpo',
        () => <Tool state={{ kind: 'DONE' }} beside={{ kind: 'NONE' }} />,
      ],
    ],
  ),
  entry(
    'ai/tool-group.tsx',
    'IA',
    'Três chamadas ou mais em seguida, como uma linha só.',
    () => (
      <ToolGroup
        state={{
          kind: 'DONE',
          failed: false,
          short: 'Leu 2 arquivos',
          full: 'Leu 2 arquivos e pesquisou na internet',
          icons: [SearchIcon, GlobeIcon],
          tally: '3 feitos',
        }}
      >
        <Tool state={{ kind: 'DONE' }} beside={{ kind: 'NONE' }} />
      </ToolGroup>
    ),
    [
      [
        'ToolGroupState.WORKING',
        () => (
          <ToolGroup
            state={{
              kind: 'WORKING',
              icon: PencilIcon,
              sentence: 'Editando src/pedidos.ts',
              progress: '2/3',
            }}
          >
            <Tool state={{ kind: 'RUNNING' }} beside={CLOCK} />
          </ToolGroup>
        ),
      ],
      [
        'ToolGroupState.DONE',
        () => (
          <ToolGroup
            state={{
              kind: 'DONE',
              failed: false,
              short: 'Leu 3 arquivos',
              full: 'Leu 3 arquivos',
              icons: [SearchIcon],
              tally: '3 feitos',
            }}
          >
            <Tool state={{ kind: 'DONE' }} beside={{ kind: 'NONE' }} />
          </ToolGroup>
        ),
      ],
      [
        'ToolGroupState.DONE com falha',
        () => (
          <ToolGroup
            state={{
              kind: 'DONE',
              failed: true,
              short: 'Editou 2 arquivos',
              full: 'Editou 2 arquivos',
              icons: [PencilIcon, TerminalIcon],
              tally: '2 feitos · 1 falhou',
            }}
          >
            <Tool state={{ kind: 'FAILED' }} beside={{ kind: 'NONE' }} />
          </ToolGroup>
        ),
      ],
    ],
  ),
  entry(
    'ai/reasoning-line.tsx',
    'IA',
    'O raciocínio do modelo: pensando, e depois uma linha que abre nele.',
    () => (
      <ReasoningLine
        label="Pensou por 4 s"
        state={{ kind: 'DONE', body: <p>Vou comparar os dois apps.</p> }}
      />
    ),
    [
      [
        'ReasoningState.THINKING',
        () => <ReasoningLine label="Pensando…" state={{ kind: 'THINKING' }} />,
      ],
      [
        'ReasoningState.DONE',
        () => (
          <ReasoningLine
            label="Pensou por 4 s"
            state={{ kind: 'DONE', body: <p>Vou ler a tabela de pedidos.</p> }}
          />
        ),
      ],
      [
        'ReasoningState.DONE sem corpo',
        () => <ReasoningLine label="Pensou" state={{ kind: 'DONE', body: undefined }} />,
      ],
    ],
  ),
  entry(
    'ai/agent-sign.tsx',
    'IA',
    'O sinal de quem responde: a marca do Conexus, ou o ícone de agente de um agente salvo.',
    () => <AgentSign signer="CONEXUS" working={false} />,
    [
      ['Signer.CONEXUS trabalhando', () => <AgentSign signer="CONEXUS" working />],
      ['Signer.COMPANY_AGENT', () => <AgentSign signer="COMPANY_AGENT" working={false} />],
    ],
  ),
  entry(
    'ai/working-line.tsx',
    'IA',
    'A linha de atividade do agente: trabalhando, ou esperando a pessoa; no celular, no alto do cartão aberto.',
    () => (
      <WorkingLine
        signer="CONEXUS"
        state={{ kind: 'WORKING', sentence: 'Conexus trabalhando', since: ' · há 12 s' }}
      />
    ),
    [
      [
        'WorkingState.WORKING',
        () => (
          <WorkingLine
            signer="CONEXUS"
            state={{ kind: 'WORKING', sentence: 'Ainda trabalhando…', since: ' há 1 min 20 s' }}
          />
        ),
      ],
      [
        'WorkingState.WORKING sem contagem',
        () => (
          <WorkingLine
            signer="CONEXUS"
            state={{ kind: 'WORKING', sentence: 'Conexus trabalhando', since: undefined }}
          />
        ),
      ],
      [
        'WorkingState.WAITING',
        () => (
          <WorkingLine
            signer="CONEXUS"
            state={{ kind: 'WAITING', sentence: 'Conexus esperando sua resposta.' }}
          />
        ),
      ],
      [
        'Signer.COMPANY_AGENT',
        () => (
          <WorkingLine
            signer="COMPANY_AGENT"
            state={{
              kind: 'WORKING',
              sentence: 'Conferente de metas trabalhando',
              since: ' · há 12 s',
            }}
          />
        ),
      ],
    ],
  ),
  entry(
    'ai/task-list.tsx',
    'IA',
    'As tarefas da vez, acima da caixa de mensagem, enquanto o agente trabalha.',
    () => <TaskList tasks={TASKS} text={TASK_TEXT} />,
    [
      ['TaskView.IN_PROGRESS', () => <TaskList tasks={TASKS.slice(1)} text={TASK_TEXT} />],
      ['TaskView.PENDING', () => <TaskList tasks={TASKS.slice(2)} text={TASK_TEXT} />],
      ['TaskView.DONE', () => <TaskList tasks={TASKS.slice(0, 1)} text={TASK_TEXT} />],
    ],
  ),
  entry(
    'ai/sources.tsx',
    'IA',
    'Onde a resposta achou o que diz: as páginas e as tabelas da empresa.',
    () => <Sources label="Fontes" sources={[PAGE, TABLE]} />,
    [
      ['SourceView.PAGE', () => <Sources label="Fontes" sources={[PAGE]} />],
      [
        'SourceView.PAGE sem link',
        () => <Sources label="Fontes" sources={[{ ...PAGE, key: 'p2', href: undefined }]} />,
      ],
      ['SourceView.TABLE', () => <Sources label="Fontes" sources={[TABLE]} />],
    ],
  ),
]
