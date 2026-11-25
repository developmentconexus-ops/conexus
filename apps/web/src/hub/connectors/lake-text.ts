import { CONNECTION_LINK_MINUTES } from '@conexus/hub-api'
import { isoDayText } from './lake-words.ts'

/** The words of the window "Ligar" and of the section "Tabelas no lago" (U9). */
export const STEPS = ['Acesso', 'Testando e lendo', 'O que copiar', 'Quando copiar'] as const
export const STEPS_LABEL = 'Passos'
export const STEP_DONE = 'feito'
export const LINKED_STEP = 'Ligado'

export function phoneStepText(step: number | null): string {
  const name = step === null ? undefined : STEPS[step]
  return name === undefined ? LINKED_STEP : `Passo ${(step ?? 0) + 1} de ${STEPS.length} · ${name}`
}

export const CONTINUE = 'Continuar'
export const BACK = 'Voltar'
export const CANCEL = 'Cancelar'
export const CLOSE = 'Fechar'
export const SEND_LINK = 'Enviar link'
export const SEND_TITLE = 'Outra pessoa tem a senha?'
export const SEND_LEAD =
  'Escolha o que ela preenche. Ela abre um link, sem entrar no Conexus, e as chaves não passam por você.'
export const SEND_PICK = 'Marque o que a outra pessoa preenche. O que você não marcar, ela não vê.'
export const NAME_LABEL = 'Nome da ligação'
export const NAME_NEEDED = 'Dê um nome à ligação, de até 60 letras.'
export const MAKE_LINK = 'Gerar o link'
export const MAKING_LINK = 'Gerando…'
export const COPY_LINK = 'Copiar'
export const BACK_TO_ACCESS = 'Voltar ao acesso'
export const LINK_NEXT =
  'Quando a outra pessoa enviar, a ligação nova aparece em Integrações. Abra-a e clique em Escolher o que copiar.'

export function linkValidText(expiresAt: string, clock: (instant: string) => string): string {
  return `Vale até ${clock(expiresAt)}.`
}

export const SINCE = 'Desde'
export const WHOLE_HISTORY = 'Todo o histórico'
export const SINCE_HELP_EMPTY = `${WHOLE_HISTORY}. Ponha uma data para ler só o que veio desde ela.`
export const SINCE_HELP_SET =
  'Vale para as tabelas que seguem uma data de alteração. Cadastros e tabelas inteiras vêm sempre inteiros.'
export const SINCE_FUTURE = 'A data não pode ser depois de hoje.'

export const TESTING_LINE = 'Testando a ligação…'

export function readingText(name: string): string {
  return `Lendo o que o ${name} oferece`
}

export function refusedKeysText(name: string): string {
  return `O ${name} recusou as chaves`
}

export const PREFIX = 'Prefixo'
export const PREFIX_HELP = 'Vale para o nome de todas as tabelas.'
export const SEARCH_TABLE = 'Buscar tabela'
export const NO_TABLE_FOUND = 'Nenhuma tabela com esse nome.'
export const LAKE_NAME = 'Nome no lago'
export const DICTIONARY_OUT = 'Não deu para ler o dicionário agora.'
export const PICK_ONE = 'Marque ao menos uma tabela para continuar.'

export function groupBoxText(group: string): string {
  return `Marcar o grupo ${group}`
}

export function columnsText(count: number): string {
  return count === 1 ? '1 coluna' : `${count} colunas`
}

export function markedText(marked: number, limited: number): string {
  const tables = `${marked} ${marked === 1 ? 'tabela marcada' : 'tabelas marcadas'}`
  if (limited === 0) return tables
  return `${tables}, ${limited} ${limited === 1 ? 'limitada' : 'limitadas'} pela data`
}

export const INTERVAL = 'Intervalo'
export const REVIEW = 'Revisão'
export const LINK_AND_COPY = 'Ligar e copiar agora'
export const LINKING = 'Ligando…'

export function everyText(interval: string): string {
  return `A cada ${interval}, a partir de agora.`
}

export const MANUAL_HELP = 'A ligação só copia quando você clicar em Rodar agora.'

export function reviewSinceText(since: string): string {
  return since === ''
    ? `${WHOLE_HISTORY}.`
    : `Desde ${isoDayText(since)} nas tabelas que a data limita.`
}

export const STARTED = 'A primeira carga começou.'

export function startedText(tables: number, system: string): string {
  const [going, each] =
    tables === 1
      ? ['1 tabela está', 'ela aparece']
      : [`${tables} tabelas estão`, 'cada uma aparece']
  return `${going} indo para o lago da empresa. Em Dados, ${each} como ${RUNNING} e vira ${UP_TO_DATE} quando termina. No ${system} de uma empresa grande a primeira carga leva horas; você pode fechar esta janela.`
}
export const SEE_IN_DATA = 'Ver em Dados'
export const ASK_COPY_MANAGER = 'Peça a quem gerencia as cópias para escolher o que copiar.'

export const LAKE_TABLES = 'Tabelas no lago'
export const OVERVIEW = 'Visão geral'
export const TABLES_TAB = 'Tabelas'
export const NOTHING_COPIED = 'Nada desta ligação é copiado para o lago.'
export const CHOOSE_WHAT = 'Escolher o que copiar'
export const NAME_FIXED = 'o nome não muda mais'
export const ONLY_COPY_MANAGER = 'Só quem gerencia as cópias muda o que se copia.'
export const LINES_STAY = 'As linhas ficam no lago da empresa.'
export const SAVE = 'Salvar'
export const RUN_NOW = 'Rodar agora'
export const READ_AGAIN = 'Ler de novo desde a data'
export const READ_AGAIN_CONFIRM = 'Ler de novo'
export const RUNNING = 'Rodando…'
export const UP_TO_DATE = 'Em dia'
export const WITH_ERROR = 'Com erro'

export function readingDictionaryText(name: string): string {
  return `Lendo o dicionário do ${name}…`
}

export function otherTablesText(name: string, count: number): string {
  return `Outras tabelas do ${name} (${count})`
}

export function sinceOfTableText(since: string): string {
  return `Desde ${isoDayText(since)}`
}

export function lastRunText(when: string): string {
  return `Última rodada ${when}`
}

const NEWER =
  'A data nova vale a partir da próxima rodada. As linhas de antes dela continuam no lago até você ler de novo desde a data.'

/** What saving another date did, said once saved; null when the date did not change. */
export function dateEffectText(before: string, after: string): string | null {
  if (before === after) return null
  if (after !== '' && (before === '' || after > before)) return NEWER
  const since = after === '' ? 'desde o começo' : `desde ${isoDayText(after)}`
  return `As próximas rodadas continuam de onde pararam. Para trazer as linhas ${since}, clique ${READ_AGAIN}.`
}

export function readAgainTitle(since: string): string {
  return `Ler de novo ${since === '' ? 'desde o começo' : `desde ${isoDayText(since)}`}?`
}

export const READ_AGAIN_LEAD = 'O lago troca o que tem destas tabelas:'
export function leaveTitle(count: number): string {
  return count === 1 ? 'Tirar 1 tabela do lago?' : `Tirar ${count} tabelas do lago?`
}

export const LEAVE_LEAD = 'O lago apaga estas tabelas e as linhas delas:'
export const LEAVE_CONFIRM = 'Tirar do lago'
export const OTHERS_STAY = 'As outras tabelas seguem como sempre.'

export function readAgainEffectText(kind: 'CHANGED' | 'WINDOW', system: string): string {
  return kind === 'WINDOW'
    ? 'Janela por mês: trocam-se só os meses desde o mês da data.'
    : `Só o que mudou: o que veio antes da data, ou foi apagado no ${system}, sai do lago.`
}

export const SEND_KEYS = 'Enviar'

export function linkPageTitle(system: string): string {
  return `Acesso do ${system}`
}

export function linkAskedText(askedBy: string, system: string, company: string): string {
  return `${askedBy} pediu o acesso do ${system} para ${company}.`
}

export function linkOnceText(askedBy: string): string {
  return `O link vale por ${CONNECTION_LINK_MINUTES} minutos e funciona uma vez. O que você escrever aqui vai para o Conexus, não para ${askedBy}.`
}

export const LINK_GONE = 'Este link venceu ou já foi usado'
export const LINK_GONE_NEXT = 'Peça um novo a quem enviou.'

export function linkDoneTitle(system: string): string {
  return `Pronto, o ${system} está ligado`
}

export function linkDoneText(askedBy: string): string {
  return `${askedBy} já pode escolher o que copiar. Você pode fechar esta página.`
}
