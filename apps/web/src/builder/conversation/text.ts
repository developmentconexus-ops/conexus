import { dayAndHour } from '../../platform/dates.ts'
import { unconfirmedText } from '../../platform/hub.ts'
import type { DictationError } from '../../ui/speech-input.tsx'
import type { Refusal } from './attachments.ts'
import { LIMITS } from './attachments.ts'

export const LOADING_OLDER = 'Carregando mensagens anteriores'
/** The words that name who answers (the Builder in a Projeto, the Assistant in a conversation of Início). */
export function workingText(agent: string): string {
  return `${agent} trabalhando`
}
export function steerPendingText(agent: string): string {
  return `Vai ao ${agent} no próximo passo`
}
export function steerPlaceholderText(agent: string): string {
  return `Escreva para orientar o ${agent}`
}
export const STILL_WORKING = 'Ainda trabalhando…'
export const EMPTY_CONVERSATION = 'Descreva o aplicativo que você quer criar.'
export const UNCONFIRMED_SEND = unconfirmedText('o envio', 'Envie de novo.')
export const FILE_EMPTY = 'Arquivo vazio.'
/** Where a person may put a secret by habit: said under the field on a computer, and on a phone in the first-time state and the model sheet. */
export const NO_SECRETS = 'Não cole senhas ou chaves na conversa.'
export const START_PLACEHOLDER = 'Descreva o app que você quer…'
export const START_NO_ACCOUNT =
  'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.'
/** Início's request, sent by the conversation it opened, when a reload cut the send short. */
export const HANDOFF_UNCONFIRMED = unconfirmedText(
  'o envio do seu pedido',
  'Confira a conversa antes de enviar de novo.',
)
/** What a Projeto created without its first request says, above "Nenhuma conversa". */
export const REQUEST_NOT_SENT = 'O Projeto foi criado, mas o seu pedido não saiu.'
/** What the first send of an empty Projeto says after the Hub's sentence on a refused model: the text is back in the box. */
export const CHOOSE_ANOTHER_MODEL = 'Escolha outro modelo e envie de novo.'
export const WRITE_AGAIN = 'Comece uma Nova conversa e escreva de novo.'

/** Início's examples: the chip's words, and what a tap puts in the box (the founder approves the texts at the end of step 13.1). */
export const EXAMPLES = [
  {
    label: 'Controle de encomendas',
    text: 'Um app de encomendas com cliente, data de entrega e valor',
  },
  {
    label: 'Pedidos de férias',
    text: 'Um app para a equipe pedir férias e o gestor aprovar ou recusar',
  },
  {
    label: 'Cadastro de visitas',
    text: 'Um app para registrar as visitas a clientes, com data, vendedor e anotações',
  },
] as const
export const UNCONFIRMED_CREATION = unconfirmedText('a criação da conversa', 'Tente de novo.')
export const UNCONFIRMED_MODEL = unconfirmedText(
  'a troca do modelo',
  'Confira o modelo e tente de novo.',
)

/** Megabytes of file the route takes for a data URL's characters: base64 spends 4 for every 3 bytes. */
function megabytesOf(characters: number): string {
  return new Intl.NumberFormat('pt-BR').format((characters * 3) / 4 / 1024 / 1024)
}

/** Why the composer left a file out, said with the ceiling the hook applies. */
export const REFUSALS: Record<Refusal, string> = {
  'too-many': `Até ${LIMITS.files} arquivos por mensagem.`,
  'too-large': `Este arquivo passa de ${megabytesOf(LIMITS.data)} MB.`,
  'too-large-together': `Os arquivos passam de ${megabytesOf(LIMITS.total)} MB juntos.`,
  type: 'Este tipo de arquivo não é aceito.',
  unread: 'Não conseguimos ler este arquivo. Escolha de novo.',
}

const DICTATION_STOPPED = 'O ditado parou. Tente de novo.'
/** Why the microphone stopped, said by the code the browser gave (`aborted` is the person's own stop and says nothing). */
export function dictationText(error: DictationError): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permita o microfone no navegador para ditar.'
    case 'language-not-supported':
      return 'Este navegador não dita em português.'
    case 'no-speech':
      return 'Não ouvimos nada. Tente de novo.'
    default:
      return DICTATION_STOPPED
  }
}

/** A conversation's label: its title, or "Conversa de <date>" by the moment it began, which no message changes (decision 4A). */
export function titleOf(
  conversation: Readonly<{ title: string | null; createdAt: string }>,
): string {
  return conversation.title ?? `Conversa de ${dayAndHour(conversation.createdAt)}`
}

/** A span of time said short: "12 s", "1 min 05 s", "1 h 02 min". */
export function durationOf(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  if (minutes === 0) return `${seconds} s`
  if (minutes < 60) return `${minutes} min ${rest} s`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

/** How many tools: "Nenhuma ferramenta", "1 ferramenta", "3 ferramentas". */
export function toolsText(count: number): string {
  if (count === 0) return 'Nenhuma ferramenta'
  return count === 1 ? '1 ferramenta' : `${count} ferramentas`
}

export function automationsText(count: number): string {
  return count === 1 ? '1 automação' : `${count} automações`
}

export function tablesText(count: number): string {
  return count === 1 ? 'app com 1 tabela' : `app com ${count} tabelas`
}

/** The tools an agent test called, said under its answer. */
export function calledText(count: number): string {
  return count === 1 ? 'Chamou 1 ferramenta' : `Chamou ${count} ferramentas`
}

/** A library tool that is not made yet: the connector's ready read. */
export const READY_TOOL = 'pronta'

/** What a group of steps counts, closed: "3 feitos", "2 feitos, 1 falhou". */
export function doneText(done: number, failed: number): string {
  const made = `${done} ${done === 1 ? 'feito' : 'feitos'}`
  return failed === 0 ? made : `${made}, ${failed} ${failed === 1 ? 'falhou' : 'falharam'}`
}

/** What the footer of a request the Assistant handed to the Builder says beside the hour (Factory's "via Slack · Jane"). */
export const FROM_ASSISTANT = 'via Assistente'
export const FROM_ASSISTANT_LABEL = 'Enviado pelo Assistente'

/**
 * What a write says when the system refused it: one label for the state, and under it the system's
 * own message as it came, with no translation (step 24.5, decision D6).
 */
export function refusedLabelText(system: string): string {
  return `O ${system} não aceitou. Nada foi lançado.`
}

/** What a read's row says when the system answered and did not give what was asked, named as the write's label names it; its message follows as it came (decision of the founder, 2026-11-08). */
export function readRefusedText(system: string): string {
  return `O ${system} não aceitou.`
}
