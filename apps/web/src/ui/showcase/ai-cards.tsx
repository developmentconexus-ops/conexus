import type { ApprovalState, ApprovalText } from '../ai/approval.tsx'
import { Approval } from '../ai/approval.tsx'
import type { PlanState, PlanText } from '../ai/plan.tsx'
import { Plan } from '../ai/plan.tsx'
import type { QuestionState, QuestionText, QuestionView } from '../ai/question.tsx'
import { Question } from '../ai/question.tsx'
import { WorkingLine } from '../ai/working-line.tsx'
import { entry, noop } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

const WAITING_LINE = (
  <WorkingLine
    signer="CONEXUS"
    state={{ kind: 'WAITING', sentence: 'Conexus esperando sua resposta' }}
  />
)

const PLAN_TEXT: PlanText = {
  readAll: 'Ler plano completo',
  reasonLabel: 'O que mudar no plano',
  approve: 'Aprovar e construir',
  reject: 'Pedir ajustes',
  sending: 'Enviando…',
  approved: 'Plano aprovado.',
  rejected: 'Este plano foi substituído.',
  closed: 'Este plano foi fechado.',
}

const PLAN_OPEN: PlanState = {
  kind: 'OPEN',
  waiting: undefined,
  busy: false,
  error: undefined,
  onApprove: noop,
  onReject: noop,
}

function APlan({ state }: { state: PlanState }) {
  return (
    <Plan
      title="Plano: o app de encomendas"
      body={<p>Uma tela de pedidos com cliente, data e valor, e a lista do dia.</p>}
      state={state}
      text={PLAN_TEXT}
    />
  )
}

const APPROVAL_TEXT: ApprovalText = {
  approve: 'Aprovar',
  decline: 'Recusar',
  approving: 'Aprovando…',
  declining: 'Recusando…',
  approved: 'Aprovado por você',
  declined: 'Recusado',
  interrupted: 'Recusado porque você mandou outra mensagem',
  stopped: 'Recusado porque você parou a conversa',
  steer: 'Escrever outra mensagem recusa este pedido.',
}

const APPROVAL_OPEN: ApprovalState = {
  kind: 'OPEN',
  waiting: undefined,
  lit: true,
  sending: undefined,
  error: undefined,
  readFailure: undefined,
  openWrite: undefined,
  locked: undefined,
  onApprove: noop,
  onDecline: noop,
}

function AnApproval({ state }: { state: ApprovalState }) {
  return (
    <Approval
      title="Conexus quer lançar um pedido no Sankhya"
      connection=" · Matriz"
      logo={undefined}
      fields={[
        { label: 'Cliente', lines: ['Padaria Central'] },
        { label: 'Itens', lines: ['20 bolos de cenoura', '10 pães de mel'] },
      ]}
      state={state}
      text={APPROVAL_TEXT}
    />
  )
}

const QUESTION_TEXT: QuestionText = {
  previous: 'Anterior',
  next: 'Próxima',
  submit: 'Enviar',
  sending: 'Enviando…',
  other: 'outra resposta…',
  otherLabel: 'Outra resposta',
  answerLabel: 'Resposta',
  answerPlaceholder: 'Escreva sua resposta…',
  required: 'Escolha ou escreva uma resposta para continuar.',
}

const QUESTIONS: readonly QuestionView[] = [
  {
    id: 'quem',
    text: 'Quem cadastra as encomendas?',
    multiple: false,
    choices: [
      { value: 'Todos', label: 'Todos (recomendado)', hint: 'Qualquer pessoa da equipe.' },
      { value: 'Só eu', label: 'Só eu', hint: undefined },
    ],
  },
]

function AQuestion({ state }: { state: QuestionState }) {
  return <Question questions={QUESTIONS} state={state} error={undefined} text={QUESTION_TEXT} />
}

export const AI_CARDS: readonly ShowcaseEntry[] = [
  entry(
    'ai/plan.tsx',
    'IA',
    'O plano que o agente espera a pessoa aprovar, com o pedido de ajuste.',
    () => <APlan state={PLAN_OPEN} />,
    [
      ['PlanState.OPEN', () => <APlan state={{ ...PLAN_OPEN, waiting: WAITING_LINE }} />],
      [
        'PlanState.OPEN com erro',
        () => <APlan state={{ ...PLAN_OPEN, error: 'Não foi possível enviar. Tente de novo.' }} />,
      ],
      ['PlanState.APPROVED', () => <APlan state={{ kind: 'APPROVED' }} />],
      ['PlanState.REJECTED', () => <APlan state={{ kind: 'REJECTED' }} />],
      ['PlanState.CLOSED', () => <APlan state={{ kind: 'CLOSED' }} />],
    ],
  ),
  entry(
    'ai/approval.tsx',
    'IA',
    'Uma escrita num sistema da empresa que pede a palavra da pessoa.',
    () => <AnApproval state={APPROVAL_OPEN} />,
    [
      [
        'ApprovalState.OPEN',
        () => <AnApproval state={{ ...APPROVAL_OPEN, waiting: WAITING_LINE }} />,
      ],
      ['ApprovalState.OPEN apagada', () => <AnApproval state={{ ...APPROVAL_OPEN, lit: false }} />],
      [
        'ApprovalState.OPEN enviando',
        () => <AnApproval state={{ ...APPROVAL_OPEN, sending: 'APPROVE' }} />,
      ],
      [
        'ApprovalState.OPEN com erro',
        () => (
          <AnApproval
            state={{ ...APPROVAL_OPEN, error: 'Não foi possível enviar. Tente de novo.' }}
          />
        ),
      ],
      [
        'ApprovalState.OPEN com falha de leitura',
        () => (
          <AnApproval
            state={{
              ...APPROVAL_OPEN,
              readFailure: { text: 'Não foi possível ler os envios abertos.', onRetry: noop },
            }}
          />
        ),
      ],
      [
        'ApprovalState.OPEN sem permissão',
        () => (
          <AnApproval state={{ ...APPROVAL_OPEN, locked: 'Peça a quem gerencia a ligação.' }} />
        ),
      ],
      [
        'ApprovalState.OPEN com escrita aberta',
        () => (
          <AnApproval
            state={{
              ...APPROVAL_OPEN,
              openWrite: 'Um pedido igual saiu às 09:00 e ainda não voltou.',
            }}
          />
        ),
      ],
      [
        'ApprovalState.APPROVED',
        () => <AnApproval state={{ kind: 'APPROVED', byYou: true, outcome: undefined }} />,
      ],
      [
        'ApprovalState.APPROVED sem ser por você',
        () => <AnApproval state={{ kind: 'APPROVED', byYou: false, outcome: undefined }} />,
      ],
      [
        'ApprovalState.DECLINED',
        () => <AnApproval state={{ kind: 'DECLINED', outcome: undefined }} />,
      ],
      [
        'ApprovalState.INTERRUPTED',
        () => <AnApproval state={{ kind: 'INTERRUPTED', outcome: undefined }} />,
      ],
      [
        'ApprovalState.STOPPED',
        () => <AnApproval state={{ kind: 'STOPPED', outcome: undefined }} />,
      ],
      [
        'ApprovalOutcome.NOTE',
        () => (
          <AnApproval
            state={{
              kind: 'APPROVED',
              byYou: true,
              outcome: { kind: 'NOTE', text: 'O pedido 1234 foi lançado.' },
            }}
          />
        ),
      ],
      [
        'ApprovalOutcome.REFUSAL',
        () => (
          <AnApproval
            state={{
              kind: 'APPROVED',
              byYou: true,
              outcome: {
                kind: 'REFUSAL',
                alert: 'O Sankhya recusou.',
                text: 'Cliente sem limite de crédito.',
              },
            }}
          />
        ),
      ],
    ],
  ),
  entry(
    'ai/question.tsx',
    'IA',
    'As perguntas do agente, uma por vez; respondidas, viram uma linha que abre nas respostas.',
    () => <AQuestion state={{ kind: 'OPEN', waiting: undefined, busy: false, onSubmit: noop }} />,
    [
      [
        'QuestionState.OPEN',
        () => (
          <AQuestion state={{ kind: 'OPEN', waiting: WAITING_LINE, busy: true, onSubmit: noop }} />
        ),
      ],
      [
        'QuestionState.ANSWERED',
        () => (
          <AQuestion
            state={{ kind: 'ANSWERED', row: 'Respondeu 1 pergunta', answers: ['Todos'] }}
          />
        ),
      ],
      [
        'QuestionState.CLOSED',
        () => (
          <AQuestion
            state={{
              kind: 'CLOSED',
              row: '1 pergunta sem resposta',
              said: 'Você parou o Conexus.',
            }}
          />
        ),
      ],
    ],
  ),
]
