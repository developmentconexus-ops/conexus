import type { Connection, ConnectorEntry, Native, SignInCompleted } from '@conexus/hub-api'
import { clockOf, dayAndMonth } from '../../platform/dates.ts'

export const LEAD =
  'Ligue os sistemas da empresa e os apps do Conexus passam a ler os dados deles. O Conexus só lê.'
export const NO_CONNECTIONS = 'Nenhuma integração ligada ainda.'
export const MEMBER_SENTENCE = 'Só o dono ou um administrador liga, testa e desliga.'
export const UNREADABLE_TEXT = 'Resposta que o Conexus não entendeu'
export const RECONNECT = 'Conectar de novo'
const ASK_MANAGER = 'Peça ao dono ou a um administrador.'
export const RETURNING_TEXT = 'Voltando da autorização…'
export const NOT_A_SIGN_IN_TEXT = 'Esse endereço não é de uma ligação.'
export const BACK_TO_INTEGRATIONS = 'Voltar a Integrações'

type Auth = ConnectorEntry['auth']

/** The connector's name, or its id for one the catalog no longer holds. */
export function connectorName(connectors: readonly ConnectorEntry[], id: string): string {
  return connectors.find((one) => one.id === id)?.name ?? id
}

export function connectionsCount(count: number): string {
  return count === 1 ? '1 ligação' : `${count} ligações`
}

/** The state as a badge, in words and a tone (design V35); a connection never tested has none. What a refusal means depends on how the connector links. */
export function stateBadge(
  connection: Connection,
  auth: Auth,
): { text: string; tone: 'success' | 'danger' } | null {
  if (connection.state === 'ACTIVE') return { text: 'Funcionando', tone: 'success' }
  if (connection.state !== 'NEEDS_REAUTH') return null
  return {
    text: auth === 'oauth2_code' ? 'Pede para conectar de novo' : 'Chaves recusadas',
    tone: 'danger',
  }
}

/** "conta PADARIASOL": the provider's account the connection is of, for a connector that reports one. */
export function accountText(connection: Connection): string | null {
  return connection.account === null ? null : `conta ${connection.account.label}`
}

/** "Ligada por Ana em 29/10", and ", ainda não testada" until the first test. */
export function linkedText(connection: Connection): string {
  const by = connection.linkedBy === null ? '' : ` por ${connection.linkedBy.name}`
  const tested = connection.state === 'NEW' ? ', ainda não testada' : ''
  return `Ligada${by} em ${dayAndMonth(connection.linkedAt)}${tested}`
}

/** "testada em 29/10, 14:02". */
export function testedText(testedAt: string): string {
  return `testada em ${dayAndMonth(testedAt)}, ${clockOf(testedAt)}`
}

/** The refusal that asks the company to connect again, in the words of how the connector links; a reader who cannot manage is told who can. */
export function reauthText(name: string, auth: Auth, mayManage: boolean): string {
  const sentence =
    auth === 'oauth2_code'
      ? `O ${name} pediu para conectar de novo.`
      : `As chaves foram recusadas pelo ${name}.`
  return mayManage ? sentence : `${sentence} ${ASK_MANAGER}`
}

export function unreachableText(name: string): string {
  return `O ${name} não respondeu. Tente de novo em alguns minutos.`
}

/** The provider answered, with a server error of its own: it did answer, so it is not "não respondeu". */
export function serverErrorText(name: string): string {
  return `O ${name} respondeu com erro. Tente de novo em alguns minutos.`
}

/** The wait a provider asked for, rounded up to whole seconds, or minutes from a minute on. */
function waitText(waitMs: number): string {
  const seconds = Math.max(1, Math.ceil(waitMs / 1000))
  if (seconds < 60) return seconds === 1 ? '1 segundo' : `${seconds} segundos`
  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`
}

/** The provider answered 429: it asked for a wait, with the time when it named one. */
export function busyText(name: string, waitMs: number | null): string {
  return waitMs === null
    ? `O ${name} pediu para esperar. Tente de novo em alguns minutos.`
    : `O ${name} pediu para esperar ${waitText(waitMs)}. Tente de novo depois disso.`
}

/** The provider refused the installation's app at a refresh (19.1, the card's state matrix): nothing the company can fix. */
export function appRefusedText(name: string): string {
  return `O app do Conexus foi recusado pelo ${name}. Avise o suporte.`
}

export const TESTING_TEXT = 'Testando a ligação…'

/** Testar's one check read answered. */
export const WORKING_TEXT = 'Ligado e funcionando.'

/** The key was accepted and the check read, `read` by its label ("Empresas"), was refused. */
export function readRefusedText(name: string, read: string): string {
  return `O ${name} aceitou a ligação, mas não deixou ler ${read}. Peça ao responsável pela conta no ${name} para liberar.`
}

/** What the provider answered, on one line: "Sankhya respondeu 403, código ACESSO". */
export function nativeText(
  native: { status: number; code: string | null; message: string | null },
  name: string,
): string {
  const code = native.code === null ? '' : `, código ${native.code}`
  const message = native.message === null ? '' : `: ${native.message}`
  return `${name} respondeu ${native.status}${code}${message}`
}

/** A kind as Zod's issues and the Hub name it, in the founder's words. */
const KINDS: Readonly<Record<string, string>> = {
  array: 'lista',
  object: 'objeto',
  string: 'texto',
  number: 'número',
  boolean: 'verdadeiro ou falso',
  null: 'nulo',
  undefined: 'nada',
  json: 'JSON',
  text: 'texto',
}

function kindText(kind: string): string {
  return KINDS[kind] ?? kind
}

/** Why a 2xx did not read, on one line: "data: esperava lista, veio objeto", or "Resposta acima de 2 MB". */
export function reasonText(reason: NonNullable<Native['reason']>): string {
  if (reason.kind === 'TOO_LARGE')
    return `Resposta acima de ${reason.limitBytes / (1024 * 1024)} MB`
  return reason.issues
    .map(
      ({ path, expected, received }) =>
        `${path === '' ? 'A resposta' : path}: esperava ${kindText(expected)}, veio ${kindText(received)}`,
    )
    .join('; ')
}

/** What the return page says when the authorization did not link: the provider's word, the person's, or the Hub's. `name` is the catalog's name of `answer.connector`. */
export function signInEndText(
  answer: Exclude<SignInCompleted, { result: 'LINKED' }>,
  name: string,
): string {
  switch (answer.result) {
    case 'REFUSED':
    case 'UNREADABLE':
      return `O ${name} recusou a autorização.`
    case 'APP_REFUSED':
      return appRefusedText(name)
    case 'UNREACHABLE':
      return unreachableText(name)
    case 'CANCELLED':
      return `Você não autorizou o Conexus no ${name}.`
  }
}

/** The window "Ligar" opens for a connector that links by a trip to the provider. */
export function signInWindowText(name: string): string {
  return `Você vai ao ${name} entrar com a conta e autorizar o Conexus.`
}

export function continueText(name: string): string {
  return `Continuar no ${name}`
}
