// A0c: como ler a TGFEFDVMRSTDIA mais depressa pelo DbExplorerSP, só leitura. A A0b mediu 442 linhas/s
// (página de 5.000 linhas em ~11 s) com a chave composta de 6 colunas encadeada com OR; esta sonda mede
// outras formas de ler a mesma tabela, alternando-as em blocos curtos para que a mesma hora de carga
// do banco pese igual em todas, e depois mede 1, 2 e 3 sessões do mesmo usuário lendo ao mesmo tempo.
// No máximo 20 minutos no total; qualquer sinal de carga (página acima de 30 s, 429, 504) para tudo.
//
// Roda dentro da imagem do Hub que está no ar, num contêiner avulso (lab/a0c-sankhya.sh), nunca no
// contêiner do Hub, como a A0b. Lê dois arquivos: a URL do banco do Hub (HUB_DATABASE_URL_FILE) e as
// chaves de selo (HUB_SEAL_KEYS_FILE). Abre a credencial selada de UMA conexão Sankhya com o código do
// próprio Hub e fala com o Sankhya só pelo executor do Hub e pela leitura `consultar` do kit
// (DbExplorerSP.executeQuery, um SELECT por chamada, julgado pelo filtro de leitura do kit).
//
// Nenhuma escrita: só SELECT (e a tentativa de EXPLAIN PLAN, que o filtro do kit pode recusar).
// Imprime só linhas JSON com formas, classes de resposta, códigos, contagens, tempos e nomes do
// dicionário padrão do Oracle e do Sankhya. Nunca imprime célula de dado, valor de chave, código de
// empresa, token, credencial, mensagem do Sankhya, nome de empresa, de conexão nem id: o log do
// workflow do laboratório é público.
import { createHash } from 'node:crypto'
import type { Answered, Connector, Operation } from '@conexus/connectors'
import { CONCURRENT_CALL, connectorOf } from '@conexus/connectors'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type {
  BearerToken,
  Executor,
  OpenedConnection,
} from '../apps/server/src/hub/connectors/executor.ts'
import { createExecutor } from '../apps/server/src/hub/connectors/executor.ts'
import { sealContext, sealedOf } from '../apps/server/src/hub/connectors/rows.ts'
import type { Database } from '../apps/server/src/platform/database.ts'
import { DatabaseUrl, openDatabase } from '../apps/server/src/platform/database.ts'
import type { SealKeys } from '../apps/server/src/platform/seal.ts'
import { open, parseSealKeys } from '../apps/server/src/platform/seal.ts'
import { readSecretFile } from '../apps/server/src/platform/secret-file.ts'

/** Tudo aqui é fixo no commit revisado; nada vem do ambiente. Os tempos contam do começo da sonda. */
export type Plano = Readonly<{
  tabela: string
  /** Linhas por página: o teto que o gateway aceita (a A0b mediu 5.000). */
  paginaLinhas: number
  /** Páginas de cada forma na fase A (o controle também: 5). */
  paginasPorForma: number
  /** A fase A (as formas alternadas) não começa uma rodada nova depois disto. */
  faseAMs: number
  /** A fase B (1, 2 e 3 sessões) não começa um bloco novo depois disto. */
  faseBMs: number
  /** Nenhuma leitura nova depois disto, em nenhuma fase. */
  tetoLeituraMs: number
  /** Páginas que cada sessão lê por bloco da fase B. */
  paginasPorBloco: number
  /** A ordem dos blocos da fase B: quantas sessões leem ao mesmo tempo em cada bloco (palíndromos, para a deriva da hora pesar igual). */
  sequenciaB: readonly number[]
  /** Prazo de cada chamada ao Sankhya. */
  prazoMs: number
  /** Renova o login quando faltar isto para o token vencer (o token vence aos 300 s, mesmo em uso). */
  folgaRenovacaoMs: number
  /** Uma página mais lenta que isto para a sonda inteira. */
  paginaLentaMs: number
  /** Meses para a fase B e a faixa: só entra um mês completo com ao menos isto de linhas. */
  minLinhasB: number
  /** O mês antigo e o pequeno (sem ORDER BY): o antigo precisa de ao menos isto; o pequeno cabe em `paginasSemOrdemMax` páginas. */
  minLinhasAntigo: number
  paginasSemOrdemMax: number
  /** A faixa de empresas e cada fatia da fase B: linhas mínimas no mês. */
  linhasPorFatia: number
}>

export const PLANO: Plano = {
  tabela: 'TGFEFDVMRSTDIA',
  paginaLinhas: 5000,
  paginasPorForma: 5,
  faseAMs: 9 * 60_000,
  faseBMs: 15 * 60_000,
  tetoLeituraMs: 17 * 60_000,
  paginasPorBloco: 1,
  sequenciaB: [1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 1],
  prazoMs: 120_000,
  folgaRenovacaoMs: 60_000,
  paginaLentaMs: 30_000,
  minLinhasB: 150_000,
  minLinhasAntigo: 25_000,
  paginasSemOrdemMax: 4,
  linhasPorFatia: 100_000,
}

const PRAZO_LOGOUT_MS = 5_000
/** Uma leitura ao vivo do Hub nesta janela antes da sonda a cancela: alguém está usando. */
const QUIETO_MIN = 15
const silencioso = { info: () => undefined, error: () => undefined }

type Valor = string | number | boolean | null | readonly unknown[] | Readonly<Record<string, unknown>>
type Linha = Record<string, Valor>
export type Saida = (linha: Linha) => void

/** Um código do Sankhya só passa quando é um código: qualquer outro texto pode trazer dado. */
function codigoSeguro(code: string | null | undefined): string | null {
  if (code === null || code === undefined) return null
  return /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'outro'
}

/** Um nome do dicionário só passa quando é um nome padrão: o que a empresa criou (AD_) sai mascarado. */
function nomeSeguro(nome: unknown): string {
  const n = String(nome)
  if (n.startsWith('AD_')) return 'AD_*'
  return /^[A-Z][A-Z0-9_$#]{0,29}$/.test(n) ? n : 'outro'
}

/** O nome de uma operação do plano do Oracle ("INDEX", "RANGE SCAN", "SORT"): só maiúsculas, espaço e parêntese. */
function operacaoSegura(texto: unknown): string | null {
  if (texto === null || texto === undefined) return null
  const t = String(texto)
  return /^[A-Z][A-Z ()$]{0,39}$/.test(t) ? t : 'outro'
}

type Classe = Readonly<{ resultado: string; status: number | null; codigo: string | null }>

function classe(answered: Answered<unknown> | Readonly<{ kind: 'UNREACHABLE' }>): Classe {
  switch (answered.kind) {
    case 'OK':
      return { resultado: 'OK', status: null, codigo: null }
    case 'TOKEN_EXPIRED':
      return { resultado: 'TOKEN_ENCERRADO', status: answered.native.status, codigo: codigoSeguro(answered.native.code) }
    case 'AUTH_REFUSED':
      return { resultado: 'CHAVE_RECUSADA', status: answered.native.status, codigo: codigoSeguro(answered.native.code) }
    case 'UNREADABLE':
      return {
        resultado: answered.native.code === CONCURRENT_CALL ? 'CHAMADA_CONCORRENTE' : 'ILEGIVEL',
        status: answered.native.status,
        codigo: codigoSeguro(answered.native.code),
      }
    case 'REFUSED':
      return { resultado: 'RECUSADA', status: answered.native.status, codigo: codigoSeguro(answered.native.code) }
    case 'BUSY':
      return { resultado: 'OCUPADO', status: 429, codigo: null }
    case 'UNREACHABLE':
      return { resultado: 'INALCANCAVEL', status: null, codigo: null }
    default:
      return { resultado: 'OUTRO', status: null, codigo: null }
  }
}

type Consulta = Readonly<{ linhas: readonly Record<string, unknown>[]; completo: boolean }>
type Lido = Readonly<{ classe: Classe; consulta: Consulta | null; ms: number }>

/** Escapa um texto como literal do Oracle. O valor nunca sai do processo. */
function literalTexto(texto: string): string {
  return `'${texto.replaceAll("'", "''")}'`
}

const DATA_SANKHYA = /^\d{8} \d{2}:\d{2}:\d{2}$/

/** Uma célula de chave como literal: número, data no formato do DbExplorer, ou texto. */
export function literal(celula: unknown, tipo: string): string {
  if (celula === null || celula === undefined) throw new Error('chave nula')
  if (typeof celula === 'number') return String(celula)
  const texto = String(celula)
  if (tipo === 'DATE' && DATA_SANKHYA.test(texto))
    return `TO_DATE(${literalTexto(texto)}, 'DDMMYYYY HH24:MI:SS')`
  if (tipo === 'NUMBER' && /^-?\d+(\.\d+)?$/.test(texto)) return texto
  return literalTexto(texto)
}

export type Chave = readonly Readonly<{ coluna: string; tipo: string }>[]

/** Depois da última chave lida, em ordem de chave, com a primeira coluna à frente (a forma da A0b, o controle). */
export function depoisDe(chave: Chave, ultima: Readonly<Record<string, unknown>> | null): string | null {
  if (ultima === null) return null
  const lits = chave.map(({ coluna, tipo }) => literal(ultima[coluna], tipo))
  const ramos = chave.map(({ coluna }, at) =>
    [
      ...chave.slice(0, at).map((antes, i) => `${antes.coluna} = ${lits[i]}`),
      `${coluna} > ${lits[at]}`,
    ].join(' AND '),
  )
  const primeira = chave[0]
  if (primeira === undefined) return null
  return `${primeira.coluna} >= ${lits[0]} AND (${ramos.map((r) => `(${r})`).join(' OR ')})`
}

/** A instrução de uma página por chave (a da A0b): SELECT * ordenado pela chave, depois da última lida. */
export function paginaSql(
  tabela: string,
  chave: Chave,
  ultima: Readonly<Record<string, unknown>> | null,
  linhas: number,
  filtro: string | null,
): string {
  const where = [filtro, depoisDe(chave, ultima)].filter((w) => w !== null)
  const ordem = chave.map(({ coluna }) => coluna).join(', ')
  return `SELECT * FROM ${tabela}${where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${ordem} OFFSET 0 ROWS FETCH NEXT ${linhas} ROWS ONLY`
}

// ---------------------------------------------------------------- as formas de ler

/** Um corte da tabela: o filtro, a ordem da chave e se a página tem ORDER BY. */
export type Corte = Readonly<{ filtro: string | null; ordem: Chave; semOrdem: boolean }>

/** Uma forma em leitura: o corte, onde parou, e o que mediu. Só a sonda a muda. */
export type Forma = {
  nome: string
  corte: Corte
  maximo: number
  ultima: Record<string, unknown> | null
  paginas: number
  tempos: number[]
  linhas: number
  fim: boolean
  falha: string | null
  /** A instrução da terceira página, para o plano de execução. */
  sqlTerceira: string | null
}

export function novaForma(nome: string, corte: Corte, maximo: number): Forma {
  return { nome, corte, maximo, ultima: null, paginas: 0, tempos: [], linhas: 0, fim: false, falha: null, sqlTerceira: null }
}

/** A próxima página da forma: com chave (keyset) ou, sem ORDER BY, por deslocamento (só para um mês pequeno). */
export function sqlDaPagina(tabela: string, f: Forma, linhas: number): string {
  if (f.corte.semOrdem)
    return `SELECT * FROM ${tabela} WHERE ${f.corte.filtro ?? '1 = 1'} OFFSET ${f.paginas * linhas} ROWS FETCH NEXT ${linhas} ROWS ONLY`
  return paginaSql(tabela, f.corte.ordem, f.ultima, linhas, f.corte.filtro)
}

/** O mesmo SELECT contado por dentro: o Oracle faz o trabalho da página e nenhuma linha volta pelo gateway. */
export function contagemDaPagina(texto: string, soma: string | null): string {
  return `SELECT COUNT(*) AS N${soma === null ? '' : `, SUM(${soma}) AS S`} FROM (${texto})`
}

const mesInicio = (mes: string) => `TO_DATE('${mes}-01', 'YYYY-MM-DD')`

export function proximoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
}

export function mesesEntre(de: string, ate: string): number {
  const [a1, m1] = de.split('-').map(Number) as [number, number]
  const [a2, m2] = ate.split('-').map(Number) as [number, number]
  return (a2 - a1) * 12 + (m2 - m1)
}

export const filtroDoMes = (coluna: string, mes: string) =>
  `${coluna} >= ${mesInicio(mes)} AND ${coluna} < ${mesInicio(proximoMes(mes))}`

export type MesContado = Readonly<{ mes: string; n: number }>

export type Escolha = Readonly<{
  recentes: readonly string[]
  antigo: string | null
  pequeno: Readonly<{ mes: string; n: number }> | null
  /** O mês mais novo da tabela (pode estar incompleto): nunca é lido. */
  ultimo: string | null
}>

/** Escolhe os meses pelas contagens: recentes completos e grandes, um antigo (~24 meses antes) e um pequeno. */
export function escolherMeses(historia: readonly MesContado[], plano: Plano): Escolha {
  const ordenada = [...historia].filter((m) => m.n > 0).sort((a, b) => (a.mes < b.mes ? -1 : 1))
  const ultimo = ordenada.at(-1)?.mes ?? null
  const completos = ordenada.slice(0, -1)
  const grandes = completos.filter((m) => m.n >= plano.minLinhasB).reverse()
  const recentes = (grandes.length > 0
    ? grandes
    : [...completos.slice(-6)].sort((a, b) => b.n - a.n).slice(0, 1)
  ).slice(0, 3).map((m) => m.mes)
  const recente = recentes[0] ?? null
  const antigos = recente === null ? [] : completos.filter((m) => mesesEntre(m.mes, recente) >= 12 && m.n >= plano.minLinhasAntigo)
  const antigo =
    recente === null || antigos.length === 0
      ? null
      : [...antigos].sort((a, b) => Math.abs(mesesEntre(a.mes, recente) - 24) - Math.abs(mesesEntre(b.mes, recente) - 24))[0]?.mes ?? null
  const cabem = completos.filter((m) => m.n <= plano.paginasSemOrdemMax * plano.paginaLinhas)
  const pequeno = [...cabem].sort((a, b) => b.n - a.n)[0] ?? null
  return { recentes, antigo, pequeno, ultimo }
}

export type Fatia = Readonly<{ lo: number; hi: number; n: number }>

/** Reparte as empresas de um mês em fatias contíguas de ao menos `alvo` linhas (a última curta se junta à anterior). */
export function fatiasDeEmpresas(contagens: readonly Readonly<{ empresa: number; n: number }>[], alvo: number, maximo: number): Fatia[] {
  const fatias: { lo: number; hi: number; n: number }[] = []
  let aberta: { lo: number; hi: number; n: number } | null = null
  for (const { empresa, n } of [...contagens].sort((a, b) => a.empresa - b.empresa)) {
    const atual: { lo: number; hi: number; n: number } = aberta === null ? { lo: empresa, hi: empresa, n } : { lo: aberta.lo, hi: empresa, n: aberta.n + n }
    if (atual.n >= alvo) {
      fatias.push(atual)
      aberta = null
    } else aberta = atual
  }
  const resto = aberta as { lo: number; hi: number; n: number } | null
  if (resto !== null) {
    const ultima = fatias.pop()
    fatias.push(ultima === undefined ? resto : { lo: ultima.lo, hi: resto.hi, n: ultima.n + resto.n })
  }
  return fatias.slice(0, maximo)
}

export const filtroDaFatia = (fatia: Fatia, mes: string) =>
  `${fatia.lo === fatia.hi ? `CODEMP = ${fatia.lo}` : `CODEMP BETWEEN ${fatia.lo} AND ${fatia.hi}`} AND ${filtroDoMes('DTREF', mes)}`

// ---------------------------------------------------------------- a conversa com o Sankhya

/** Um SIGTERM ou SIGINT (o `timeout` do `.sh`, ou o cancelamento do workflow) pede parada: nenhuma leitura nova, só os logouts. */
export const pedidoDeParada: { motivo: string | null } = { motivo: null }

/** O freio é um só para todas as sessões: o primeiro sinal de carga de qualquer uma para as outras. */
export type Freio = { motivo: string | null }

export type Contexto = Readonly<{
  executor: Executor
  opened: OpenedConnection
  plano: Plano
  saida: Saida
  relogio: () => number
  inicio: number
  freio: Freio
}>

export type Sessao = Readonly<{
  rotulo: string
  /** `isento`: a leitura não pára a sonda por demorar (a contagem por mês da tabela inteira). */
  consultar(texto: string, isento?: boolean): Promise<Lido>
  logins(): number
  fechar(): Promise<void>
}>

const PARADA: Classe = { resultado: 'PARADA', status: null, codigo: null }

/** O login, a renovação antes do vencimento, o freio, e o logout de todo token emitido. Uma sessão = um login próprio. */
export async function abrirSessao(cx: Contexto, rotulo: string): Promise<Sessao | null> {
  const { executor, opened, plano, saida, relogio, freio } = cx
  const consultar = opened.connector.readDoor?.consultar
  if (consultar === undefined) throw new Error('kit sem a leitura consultar')
  let token: BearerToken | null = null
  let venceEm = 0
  let logins = 0
  const emitidos: BearerToken[] = []

  async function sair(t: BearerToken) {
    const i = emitidos.indexOf(t)
    if (i !== -1) emitidos.splice(i, 1)
    const r = (await executor.logout(opened, t, PRAZO_LOGOUT_MS)) ?? 'SEM_LOGOUT'
    saida({ a0c: 'logout', sessao: rotulo, resultado: r })
  }

  async function entrar(): Promise<boolean> {
    const comeco = relogio()
    const answered = await executor.login(opened, plano.prazoMs)
    logins += 1
    if (answered.kind !== 'TOKEN') {
      saida({ a0c: 'login', sessao: rotulo, resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : answered.kind, ms: Math.round(relogio() - comeco) })
      return false
    }
    const anterior = token
    token = answered.token
    emitidos.push(answered.token)
    venceEm = relogio() + answered.expiresInSeconds * 1000
    saida({ a0c: 'login', sessao: rotulo, resultado: 'OK', validadeS: answered.expiresInSeconds, ms: Math.round(relogio() - comeco), numero: logins })
    // O token trocado termina já: uma sessão que expira sem logout fica pendurada no Sankhya.
    if (anterior !== null) await sair(anterior)
    return true
  }

  if (!(await entrar())) return null

  async function chamar(texto: string): Promise<Answered<Consulta> | Readonly<{ kind: 'UNREACHABLE' }>> {
    if (token === null) return { kind: 'UNREACHABLE' }
    const op = consultar as Operation<{ sql: string }, Consulta>
    return executor.call(opened, token, op, { sql: texto } as never, plano.prazoMs) as never
  }

  return {
    rotulo,
    async consultar(texto, isento = false) {
      if (freio.motivo === null && relogio() - cx.inicio > plano.tetoLeituraMs) freio.motivo = 'teto-de-tempo'
      if (freio.motivo === null && pedidoDeParada.motivo !== null) freio.motivo = pedidoDeParada.motivo
      if (freio.motivo !== null) return { classe: PARADA, consulta: null, ms: 0 }
      if (relogio() > venceEm - plano.folgaRenovacaoMs) await entrar()
      const comeco = relogio()
      let answered: Answered<Consulta> | Readonly<{ kind: 'UNREACHABLE' }>
      try {
        answered = await chamar(texto)
        if (answered.kind === 'TOKEN_EXPIRED' && (await entrar())) answered = await chamar(texto)
      } catch {
        // O filtro de leitura do kit (SELECT ou WITH, uma só) julga a instrução antes de qualquer pedido:
        // o que ele recusa (o EXPLAIN PLAN) nunca sai do processo. Nada foi enviado ao Sankhya.
        return { classe: { resultado: 'RECUSADA_NO_KIT', status: null, codigo: null }, consulta: null, ms: 0 }
      }
      const ms = Math.round(relogio() - comeco)
      const c = classe(answered)
      // Um 429 ou um 504 (prazo de 2 minutos do gateway) para todas as sessões: não se insiste num ERP sob carga.
      if (c.resultado === 'OCUPADO' || c.resultado === 'INALCANCAVEL') freio.motivo ??= `falha-${c.resultado}`
      if (!isento && ms > plano.paginaLentaMs) freio.motivo ??= 'pagina-lenta'
      return { classe: c, consulta: answered.kind === 'OK' ? answered.value : null, ms }
    },
    logins: () => logins,
    async fechar() {
      for (const t of [...emitidos]) await sair(t)
      token = null
    },
  }
}

// ---------------------------------------------------------------- medidas

/** Mediana, p90 e máximo de uma lista de tempos. */
export function estatistica(ms: readonly number[]) {
  const s = [...ms].sort((a, b) => a - b)
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? null
  return { n: s.length, p50: at(0.5), p90: at(0.9), max: s.at(-1) ?? null, soma: s.reduce((a, b) => a + b, 0) }
}

/** Linhas por segundo como a A0b mediu: linhas lidas pela soma dos tempos das páginas (uma sessão). */
export const taxa = (linhas: number, ms: number): number | null => (ms === 0 ? null : Math.round((linhas * 1000) / ms))

export type Pagina = Readonly<{ ok: boolean; linhas: number; ms: number }>

/** Lê a próxima página de uma forma numa sessão, cronometra, emite uma linha e avança a chave. */
export async function lerPagina(cx: Contexto, sessao: Sessao, f: Forma, fase: string): Promise<Pagina> {
  const texto = sqlDaPagina(cx.plano.tabela, f, cx.plano.paginaLinhas)
  if (f.paginas === 2) f.sqlTerceira = texto
  const lido = await sessao.consultar(texto)
  if (lido.classe.resultado === 'PARADA') return { ok: false, linhas: 0, ms: 0 }
  const recebidas = lido.consulta?.linhas ?? []
  const bytes = lido.consulta === null ? 0 : Buffer.byteLength(JSON.stringify(recebidas))
  cx.saida({ a0c: 'pagina', fase, forma: f.nome, sessao: sessao.rotulo, pagina: f.paginas + 1, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: recebidas.length, completo: lido.consulta?.completo ?? null, bytesAprox: bytes, ms: lido.ms })
  if (lido.classe.resultado !== 'OK') {
    f.falha = lido.classe.resultado
    return { ok: false, linhas: 0, ms: lido.ms }
  }
  f.paginas += 1
  f.tempos.push(lido.ms)
  f.linhas += recebidas.length
  if (recebidas.length < cx.plano.paginaLinhas && lido.consulta?.completo !== false) f.fim = true
  f.ultima = recebidas.at(-1) ?? null
  if (!f.corte.semOrdem && f.ultima !== null && f.corte.ordem.some(({ coluna }) => f.ultima?.[coluna] === null || f.ultima?.[coluna] === undefined)) f.falha = 'chave-nula'
  return { ok: true, linhas: recebidas.length, ms: lido.ms }
}

const pendente = (f: Forma) => f.falha === null && !f.fim && f.paginas < f.maximo

function resumoDaForma(cx: Contexto, f: Forma, fase: string) {
  const e = estatistica(f.tempos)
  cx.saida({ a0c: 'forma', fase, forma: f.nome, paginas: e.n, linhas: f.linhas, motivo: f.falha ?? (f.fim ? 'fim-do-corte' : f.paginas >= f.maximo ? 'teto-de-paginas' : 'parada'), p50Ms: e.p50, p90Ms: e.p90, maxMs: e.max, linhasPorSegundo: taxa(f.linhas, e.soma), temposMs: f.tempos })
}

// ---------------------------------------------------------------- o catálogo e as contagens (só nomes padrão e números)

const ESQUEMA = "SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')"

export const CATALOGO = {
  colunas: (t: string) =>
    `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE FROM ALL_TAB_COLUMNS WHERE OWNER = ${ESQUEMA} AND TABLE_NAME = ${literalTexto(t)} ORDER BY COLUMN_ID`,
  chave: (t: string) =>
    `SELECT K.COLUMN_NAME, K.POSITION FROM ALL_CONSTRAINTS C JOIN ALL_CONS_COLUMNS K ON K.OWNER = C.OWNER AND K.CONSTRAINT_NAME = C.CONSTRAINT_NAME WHERE C.OWNER = ${ESQUEMA} AND C.CONSTRAINT_TYPE = 'P' AND C.TABLE_NAME = ${literalTexto(t)} ORDER BY K.POSITION`,
  indices: (t: string) =>
    `SELECT I.INDEX_NAME, I.UNIQUENESS, K.COLUMN_NAME, K.COLUMN_POSITION FROM ALL_INDEXES I JOIN ALL_IND_COLUMNS K ON K.INDEX_OWNER = I.OWNER AND K.INDEX_NAME = I.INDEX_NAME WHERE I.TABLE_OWNER = ${ESQUEMA} AND I.TABLE_NAME = ${literalTexto(t)} ORDER BY I.INDEX_NAME, K.COLUMN_POSITION`,
  /** Uma contagem agrupada por mês de DTREF: nenhuma linha de dado, só mês e contagem. */
  meses: (t: string) =>
    `SELECT TO_CHAR(DTREF, 'YYYY-MM') AS M, COUNT(*) AS N FROM ${t} GROUP BY TO_CHAR(DTREF, 'YYYY-MM') ORDER BY 1`,
  empresasDoMes: (t: string, mes: string) =>
    `SELECT CODEMP, COUNT(*) AS N FROM ${t} WHERE ${filtroDoMes('DTREF', mes)} GROUP BY CODEMP ORDER BY CODEMP`,
} as const

type Catalogo = Readonly<{ chave: Chave; somavel: string | null; dtrefPrimeiro: boolean; indices: number }>

async function catalogo(cx: Contexto, s: Sessao): Promise<Catalogo | null> {
  const t = cx.plano.tabela
  const colunas = await s.consultar(CATALOGO.colunas(t))
  const pk = await s.consultar(CATALOGO.chave(t))
  const indices = await s.consultar(CATALOGO.indices(t))
  cx.saida({ a0c: 'catalogo', colunas: colunas.classe.resultado, chave: pk.classe.resultado, indices: indices.classe.resultado })
  const tipos = new Map((colunas.consulta?.linhas ?? []).map((l) => [String(l.COLUMN_NAME), String(l.DATA_TYPE)]))
  const nomesChave = (pk.consulta?.linhas ?? []).map((l) => String(l.COLUMN_NAME))
  const chave: Chave = nomesChave.map((coluna) => ({ coluna, tipo: tipos.get(coluna) ?? 'outro' }))
  const porIndice = new Map<string, { unico: boolean; colunas: string[] }>()
  for (const l of indices.consulta?.linhas ?? []) {
    const nome = String(l.INDEX_NAME)
    const atual = porIndice.get(nome) ?? { unico: l.UNIQUENESS === 'UNIQUE', colunas: [] }
    atual.colunas.push(String(l.COLUMN_NAME))
    porIndice.set(nome, atual)
  }
  for (const [nome, i] of porIndice) cx.saida({ a0c: 'indice', indice: nomeSeguro(nome), unico: i.unico, colunas: i.colunas.map(nomeSeguro) })
  const somavel = [...tipos].find(([c, tipo]) => tipo === 'NUMBER' && !nomesChave.includes(c) && /^[A-Z][A-Z0-9_]*$/.test(c) && !c.startsWith('AD_'))?.[0] ?? null
  cx.saida({ a0c: 'tabela', tabela: t, colunas: tipos.size, chave: chave.map((c) => nomeSeguro(c.coluna)), indiceComDtrefNaFrente: [...porIndice.values()].some((i) => i.colunas[0] === 'DTREF') })
  if (chave.length === 0 || chave.some((c) => c.tipo === 'outro' || !/^[A-Z][A-Z0-9_]{0,29}$/.test(c.coluna))) return null
  return { chave, somavel, dtrefPrimeiro: [...porIndice.values()].some((i) => i.colunas[0] === 'DTREF'), indices: porIndice.size }
}

async function contagemPorMes(cx: Contexto, s: Sessao): Promise<MesContado[] | null> {
  const lido = await s.consultar(CATALOGO.meses(cx.plano.tabela), true)
  const linhas = lido.consulta?.linhas ?? []
  const meses = linhas.map((l) => ({ mes: String(l.M), n: Number(l.N) })).filter((m) => /^\d{4}-\d{2}$/.test(m.mes) && Number.isFinite(m.n))
  cx.saida({ a0c: 'contagem-por-mes', resultado: lido.classe.resultado, codigo: lido.classe.codigo, meses: meses.length, linhas: meses.reduce((a, m) => a + m.n, 0), ms: lido.ms })
  for (const m of meses) cx.saida({ a0c: 'mes', mes: m.mes, linhas: m.n })
  return lido.classe.resultado === 'OK' ? meses : null
}

// ---------------------------------------------------------------- o plano de execução

/** As colunas da chave que aparecem nos predicados de acesso e de filtro de cada operação: só 0 ou 1, nunca o texto (que traz valores). */
const marcas = (colunas: readonly string[]) =>
  colunas
    .flatMap((c) => [
      `CASE WHEN INSTR(ACCESS_PREDICATES, '"${c}"') > 0 THEN 1 ELSE 0 END AS A_${c}`,
      `CASE WHEN INSTR(FILTER_PREDICATES, '"${c}"') > 0 THEN 1 ELSE 0 END AS F_${c}`,
    ])
    .join(', ')

const lerPlano = (de: string, onde: string, colunas: readonly string[]) =>
  `SELECT ID, PARENT_ID, OPERATION, OPTIONS, OBJECT_NAME, COST, CARDINALITY, ${marcas(colunas)} FROM ${de} WHERE ${onde} ORDER BY ID`

function emitirPlano(cx: Contexto, alvo: string, fonte: string, linhas: readonly Record<string, unknown>[], colunas: readonly string[]) {
  for (const l of linhas)
    cx.saida({
      a0c: 'plano',
      alvo,
      fonte,
      id: Number(l.ID),
      pai: l.PARENT_ID === null || l.PARENT_ID === undefined ? null : Number(l.PARENT_ID),
      operacao: operacaoSegura(l.OPERATION),
      opcoes: operacaoSegura(l.OPTIONS),
      objeto: l.OBJECT_NAME === null || l.OBJECT_NAME === undefined ? null : nomeSeguro(l.OBJECT_NAME),
      custo: l.COST === null || l.COST === undefined ? null : Number(l.COST),
      cardinalidade: l.CARDINALITY === null || l.CARDINALITY === undefined ? null : Number(l.CARDINALITY),
      acesso: colunas.filter((c) => Number(l[`A_${c}`]) === 1),
      filtro: colunas.filter((c) => Number(l[`F_${c}`]) === 1),
    })
}

/**
 * O plano da instrução de uma página: tenta o EXPLAIN PLAN (o filtro do kit pode recusar, e a recusa
 * se registra) e lê o V$SQL_PLAN do cursor que a página deixou no Oracle, com os tempos do próprio Oracle
 * (V$SQL) para dizer quanto da página foi banco e quanto foi o resto.
 */
export async function planoDe(cx: Contexto, s: Sessao, alvo: string, texto: string, colunas: readonly string[]) {
  const explain = await s.consultar(`EXPLAIN PLAN FOR ${texto}`)
  cx.saida({ a0c: 'explain', alvo, resultado: explain.classe.resultado, codigo: explain.classe.codigo })
  if (explain.classe.resultado === 'OK') {
    const tabela = await s.consultar(lerPlano('PLAN_TABLE', '1 = 1', colunas))
    emitirPlano(cx, alvo, 'PLAN_TABLE', tabela.consulta?.linhas ?? [], colunas)
  }
  const trecho = texto.slice(texto.indexOf('FROM '), texto.indexOf('FROM ') + 400)
  const achado = await s.consultar(
    `SELECT SQL_ID, CHILD_NUMBER, PLAN_HASH_VALUE, EXECUTIONS, ELAPSED_TIME, CPU_TIME, USER_IO_WAIT_TIME, BUFFER_GETS, DISK_READS, ROWS_PROCESSED FROM V$SQL WHERE INSTR(SQL_TEXT, ${literalTexto(trecho)}) > 0 AND INSTR(SQL_TEXT, 'V$SQL') = 0 ORDER BY LAST_ACTIVE_TIME DESC FETCH FIRST 1 ROWS ONLY`,
  )
  const v = achado.consulta?.linhas[0]
  const id = v === undefined ? null : String(v.SQL_ID)
  cx.saida({
    a0c: 'v-sql',
    alvo,
    resultado: achado.classe.resultado,
    codigo: achado.classe.codigo,
    achou: v !== undefined,
    execucoes: v === undefined ? null : Number(v.EXECUTIONS),
    decorridoMs: v === undefined ? null : Math.round(Number(v.ELAPSED_TIME) / 1000),
    cpuMs: v === undefined ? null : Math.round(Number(v.CPU_TIME) / 1000),
    esperaIoMs: v === undefined ? null : Math.round(Number(v.USER_IO_WAIT_TIME) / 1000),
    buffers: v === undefined ? null : Number(v.BUFFER_GETS),
    leiturasDeDisco: v === undefined ? null : Number(v.DISK_READS),
    linhasProcessadas: v === undefined ? null : Number(v.ROWS_PROCESSED),
  })
  if (v === undefined || id === null || !/^[0-9a-z]{13}$/.test(id)) return
  const filho = Number(v.CHILD_NUMBER)
  const lido = await s.consultar(lerPlano('V$SQL_PLAN', `SQL_ID = '${id}' AND CHILD_NUMBER = ${Number.isInteger(filho) ? filho : 0}`, colunas))
  cx.saida({ a0c: 'plano-lido', alvo, resultado: lido.classe.resultado, operacoes: lido.consulta?.linhas.length ?? 0 })
  emitirPlano(cx, alvo, 'V$SQL_PLAN', lido.consulta?.linhas ?? [], colunas)
}

// ---------------------------------------------------------------- o protocolo

/** Por que a sonda parou, quando foi por sinal de carga: página lenta, 429, 504 ou pedido de parada. */
export const SINAIS_DE_CARGA = ['pagina-lenta', 'falha-OCUPADO', 'falha-INALCANCAVEL', 'sinal'] as const
export const cargaDe = (motivo: string | null): boolean => motivo !== null && (SINAIS_DE_CARGA as readonly string[]).includes(motivo)

const girar = <T>(lista: readonly T[], n: number): T[] => lista.map((_, i) => lista[(i + n) % lista.length] as T)

/** A fase A: as formas alternadas em blocos de uma página, começando cada rodada por uma forma diferente. */
async function faseA(cx: Contexto, s: Sessao, formas: readonly Forma[], soma: string | null) {
  const { plano, saida, relogio, freio } = cx
  const controle = formas[0]
  for (let rodada = 0; rodada < plano.paginasPorForma && freio.motivo === null; rodada += 1) {
    if (relogio() - cx.inicio > plano.faseAMs) {
      saida({ a0c: 'fase-a', motivo: 'teto-de-tempo-da-fase', rodadas: rodada })
      return
    }
    for (const f of girar(formas, rodada)) {
      if (freio.motivo !== null) return
      if (!pendente(f)) continue
      await lerPagina(cx, s, f, 'A')
      // O diagnóstico: a terceira página do controle, repetida com o cache quente, inteira e só contada.
      if (f === controle && f.paginas === 3 && f.sqlTerceira !== null && freio.motivo === null) await diagnostico(cx, s, f.sqlTerceira, soma)
    }
  }
  saida({ a0c: 'fase-a', motivo: 'fim', rodadas: plano.paginasPorForma })
}

/** O mesmo SELECT do controle outra vez (cache quente) e a mesma instrução só contada: separa banco, disco e gateway. */
async function diagnostico(cx: Contexto, s: Sessao, texto: string, soma: string | null) {
  for (const [forma, instrucao] of [['controle-repetido', texto], ['controle-contado', contagemDaPagina(texto, soma)]] as const) {
    const lido = await s.consultar(instrucao)
    if (lido.classe.resultado === 'PARADA') return
    cx.saida({ a0c: 'diagnostico', forma, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: forma === 'controle-contado' ? Number(lido.consulta?.linhas[0]?.N ?? Number.NaN) : (lido.consulta?.linhas.length ?? 0), ms: lido.ms })
  }
}

type Candidata = Readonly<{ nome: string; formas: readonly Forma[] }>

/** A taxa de uma candidata: linhas pela soma dos tempos das páginas de todas as suas formas. */
function taxaDe(c: Candidata): number | null {
  const linhas = c.formas.reduce((a, f) => a + f.linhas, 0)
  const ms = c.formas.reduce((a, f) => a + f.tempos.reduce((x, y) => x + y, 0), 0)
  return taxa(linhas, ms)
}

/** A fase B: 1, 2 e 3 sessões lendo cortes diferentes da mesma forma, em blocos alternados (1 2 3 3 2 1 ...). */
async function faseB(cx: Contexto, sessoes: readonly Sessao[], formas: readonly Forma[]) {
  const { plano, saida, relogio, freio } = cx
  const limite = Math.min(sessoes.length, formas.length)
  const porK: Record<number, { agregadas: number[]; porSessao: number[] }> = {}
  for (const k of plano.sequenciaB) {
    if (freio.motivo !== null) break
    if (k > limite) continue
    if (relogio() - cx.inicio > plano.faseBMs) {
      saida({ a0c: 'fase-b', motivo: 'teto-de-tempo-da-fase' })
      break
    }
    if (formas.slice(0, k).some((f) => !pendenteB(f))) {
      saida({ a0c: 'fase-b', motivo: 'corte-acabou' })
      break
    }
    const comeco = relogio()
    const lidas = await Promise.all(
      formas.slice(0, k).map(async (f, i) => {
        const paginas: Pagina[] = []
        for (let p = 0; p < plano.paginasPorBloco && freio.motivo === null && pendenteB(f); p += 1)
          paginas.push(await lerPagina(cx, sessoes[i] as Sessao, f, `B${k}`))
        return paginas
      }),
    )
    const parede = Math.round(relogio() - comeco)
    const feitas = lidas.flat().filter((p) => p.ok)
    const linhas = feitas.reduce((a, p) => a + p.linhas, 0)
    if (feitas.length === 0) break
    const soma = feitas.reduce((a, p) => a + p.ms, 0)
    const agregada = taxa(linhas, parede)
    const porSessao = taxa(linhas, soma)
    saida({ a0c: 'bloco', sessoes: k, paginas: feitas.length, linhas, paredeMs: parede, linhasPorSegundoAgregadas: agregada, linhasPorSegundoPorSessao: porSessao })
    const guarda = (porK[k] ??= { agregadas: [], porSessao: [] })
    if (agregada !== null) guarda.agregadas.push(agregada)
    if (porSessao !== null) guarda.porSessao.push(porSessao)
  }
  const mediana = (v: readonly number[]) => estatistica(v).p50
  for (const [k, g] of Object.entries(porK))
    saida({ a0c: 'sessoes', sessoes: Number(k), blocos: g.agregadas.length, medianaAgregada: mediana(g.agregadas), medianaPorSessao: mediana(g.porSessao), agregadas: g.agregadas })
}

const pendenteB = (f: Forma) => f.falha === null && !f.fim

export type Resposta = 'MEDIDO' | 'MEDIDO_PARCIAL' | 'SEM_CHAVE' | 'SEM_MES' | 'LOGIN_FALHOU'

/**
 * O protocolo, contra qualquer Sankhya (o real ou o falso), nesta ordem: (1) login; o catálogo da
 * tabela (colunas, chave, índices); a contagem por mês de DTREF; a escolha dos meses e da faixa de
 * empresas; (2) a fase A: o controle (a forma da A0b), um mês recente, um mês antigo, uma faixa de
 * empresas num mês, um mês pequeno sem ORDER BY, e um mês com a chave começando por DTREF (se há
 * índice assim), alternados; (3) o plano de execução do controle e da vencedora; (4) a fase B: a
 * vencedora com 1, 2 e 3 sessões; (5) o logout de toda sessão, também em erro. Qualquer sinal de
 * carga (página acima de `paginaLentaMs`, 429, 504, pedido de parada) para toda leitura nova.
 */
export async function cronometrar(
  executor: Executor,
  opened: OpenedConnection,
  plano: Plano,
  saida: Saida,
  relogio: () => number = () => performance.now(),
): Promise<Resposta> {
  const cx: Contexto = { executor, opened, plano, saida, relogio, inicio: relogio(), freio: { motivo: null } }
  const s1 = await abrirSessao(cx, 'S1')
  if (s1 === null) {
    saida({ a0c: 'veredito', resposta: 'LOGIN_FALHOU' })
    return 'LOGIN_FALHOU'
  }
  const abertas: Sessao[] = [s1]
  try {
    const resposta = await medida(cx, s1, abertas)
    saida({ a0c: 'veredito', resposta, motivo: cx.freio.motivo, logins: abertas.reduce((a, s) => a + s.logins(), 0), duracaoMs: Math.round(relogio() - cx.inicio) })
    return resposta
  } finally {
    for (const s of abertas) await s.fechar()
  }
}

async function medida(cx: Contexto, s1: Sessao, abertas: Sessao[]): Promise<Resposta> {
  const { plano, saida } = cx
  const cat = await catalogo(cx, s1)
  if (cat === null) return 'SEM_CHAVE'
  const historia = await contagemPorMes(cx, s1)
  if (historia === null) return 'MEDIDO_PARCIAL'
  const escolha = escolherMeses(historia, plano)
  const recente = escolha.recentes[0]
  if (recente === undefined) {
    saida({ a0c: 'meses', recentes: 0 })
    return 'SEM_MES'
  }
  const contagemDe = (mes: string) => historia.find((m) => m.mes === mes)?.n ?? null
  saida({
    a0c: 'meses',
    recentes: escolha.recentes.length,
    linhasRecentes: escolha.recentes.map(contagemDe),
    antigo: escolha.antigo !== null,
    mesesDoAntigoAteORecente: escolha.antigo === null ? null : mesesEntre(escolha.antigo, recente),
    linhasAntigo: escolha.antigo === null ? null : contagemDe(escolha.antigo),
    pequeno: escolha.pequeno !== null,
    linhasPequeno: escolha.pequeno?.n ?? null,
  })
  const empresas = await s1.consultar(CATALOGO.empresasDoMes(plano.tabela, recente))
  const contagens = (empresas.consulta?.linhas ?? []).map((l) => ({ empresa: Number(l.CODEMP), n: Number(l.N) })).filter((c) => Number.isFinite(c.empresa) && Number.isFinite(c.n))
  const fatias = fatiasDeEmpresas(contagens, plano.linhasPorFatia, 3)
  saida({ a0c: 'empresas', resultado: empresas.classe.resultado, empresas: contagens.length, fatias: fatias.map((f) => f.n) })
  const pk: Corte = { filtro: null, ordem: cat.chave, semOrdem: false }
  const dtrefNaFrente = [...cat.chave].sort((a, b) => (a.coluna === 'DTREF' ? -1 : b.coluna === 'DTREF' ? 1 : 0))
  const paginas = plano.paginasPorForma
  const mes = (m: string, ordem: Chave = cat.chave): Corte => ({ filtro: filtroDoMes('DTREF', m), ordem, semOrdem: false })
  const controle = novaForma('controle', pk, paginas)
  const mesRecente = novaForma('mes-recente', mes(recente), paginas)
  const mesAntigo = escolha.antigo === null ? null : novaForma('mes-antigo', mes(escolha.antigo), paginas)
  const faixa = fatias[0] === undefined ? null : novaForma('faixa-empresa', { filtro: filtroDaFatia(fatias[0], recente), ordem: cat.chave, semOrdem: false }, paginas)
  const semOrdem =
    escolha.pequeno === null
      ? null
      : novaForma('mes-sem-order-by', { filtro: filtroDoMes('DTREF', escolha.pequeno.mes), ordem: cat.chave, semOrdem: true }, Math.min(paginas, Math.ceil(escolha.pequeno.n / plano.paginaLinhas)))
  const dtrefPrimeiro = cat.dtrefPrimeiro ? novaForma('mes-dtref-primeiro', mes(recente, dtrefNaFrente), paginas) : null
  if (escolha.pequeno === null) saida({ a0c: 'sem-order-by', resultado: 'nao-coube', paginasMax: plano.paginasSemOrdemMax })
  const formas = [controle, mesRecente, mesAntigo, faixa, semOrdem, dtrefPrimeiro].filter((f): f is Forma => f !== null)

  await faseA(cx, s1, formas, cat.somavel)
  for (const f of formas) resumoDaForma(cx, f, 'A')
  const base = taxa(controle.linhas, controle.tempos.reduce((a, b) => a + b, 0))
  const candidatas: Candidata[] = [
    { nome: 'mes', formas: [mesRecente, ...(mesAntigo === null ? [] : [mesAntigo])] },
    ...(faixa === null ? [] : [{ nome: 'faixa-empresa', formas: [faixa] }]),
    ...(dtrefPrimeiro === null ? [] : [{ nome: 'mes-dtref-primeiro', formas: [dtrefPrimeiro] }]),
  ]
  const ranking = candidatas.map((c) => ({ nome: c.nome, taxa: taxaDe(c) })).filter((c) => c.taxa !== null)
  const vencedora = [...ranking].sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0))[0]
  saida({ a0c: 'ranking', controle: base, formas: ranking, vencedora: vencedora?.nome ?? null, razaoVencedoraControle: vencedora === undefined || base === null || vencedora.taxa === null ? null : Math.round((vencedora.taxa / base) * 100) / 100 })
  if (cx.freio.motivo !== null) return 'MEDIDO_PARCIAL'
  if (vencedora === undefined) return 'MEDIDO_PARCIAL'

  // O plano de execução do controle e da vencedora (a terceira página de cada uma).
  const colunasChave = cat.chave.map((c) => c.coluna)
  const primeiraDaVencedora = candidatas.find((c) => c.nome === vencedora.nome)?.formas[0]
  for (const [alvo, f] of [['controle', controle], ['vencedora', primeiraDaVencedora]] as const)
    if (f?.sqlTerceira != null && cx.freio.motivo === null) await planoDe(cx, s1, alvo, f.sqlTerceira, colunasChave)

  // A fase B: a vencedora em cortes diferentes (meses ou fatias), uma sessão por corte.
  const cortes: Forma[] = []
  if (vencedora.nome === 'faixa-empresa')
    fatias.forEach((fatia, i) => cortes.push(i === 0 && faixa !== null ? faixa : novaForma(`faixa-empresa-${i + 1}`, { filtro: filtroDaFatia(fatia, recente), ordem: cat.chave, semOrdem: false }, 1000)))
  else {
    const ordem = vencedora.nome === 'mes-dtref-primeiro' ? dtrefNaFrente : cat.chave
    escolha.recentes.forEach((m, i) => cortes.push(i === 0 && vencedora.nome === 'mes' ? mesRecente : i === 0 && dtrefPrimeiro !== null ? dtrefPrimeiro : novaForma(`${vencedora.nome}-${i + 1}`, mes(m, ordem), 1000)))
  }
  for (const f of cortes) f.maximo = 1000
  saida({ a0c: 'fase-b-plano', forma: vencedora.nome, cortes: cortes.length })
  for (let i = 1; i < cortes.length && cx.freio.motivo === null; i += 1) {
    const s = await abrirSessao(cx, `S${i + 1}`)
    if (s === null) {
      saida({ a0c: 'sessao', numero: i + 1, resultado: 'LOGIN_RECUSADO' })
      break
    }
    abertas.push(s)
  }
  await faseB(cx, abertas, cortes)
  for (const f of cortes) resumoDaForma(cx, f, 'B')
  return cx.freio.motivo === null ? 'MEDIDO' : 'MEDIDO_PARCIAL'
}

// ---------------------------------------------------------------- a escolha da conexão (como a A0b)

type Alvo = Readonly<{ companyId: CompanyId; id: ConnectionId; linkedAt: string; revision: number }>

const sha = (text: string) => createHash('sha256').update(text).digest('hex')

async function candidatasDoHub(database: Database): Promise<Alvo[]> {
  const found = await database.installationRead((tx) =>
    tx.execute(sql`select company_id from connectors.companies_with_seals()`),
  )
  const todas: Alvo[] = []
  for (const row of found.rows) {
    const companyId = CompanyId.parse(Object(row).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    const rows = await database.read(scope, (tx) =>
      tx.execute(sql`select id, linked_at, revision from connectors.connection
        where company_id = ${companyId} and connector_id = 'sankhya' and state = 'ACTIVE'`),
    )
    for (const each of rows.rows) {
      const r = Object(each)
      todas.push({ companyId, id: ConnectionId.parse(r.id), linkedAt: new Date(r.linked_at).toISOString(), revision: Number(r.revision) })
    }
  }
  return todas
}

async function movimento(database: Database, alvo: Alvo, desde: string, ate: string | null) {
  const scope = { kind: 'COMPANY', companyId: alvo.companyId, personId: null } as const
  return database.read(scope, async (tx) => {
    const fim = ate === null ? sql`statement_timestamp()` : sql`${ate}::timestamptz`
    const result = await tx.execute(sql`select
      (select count(*) from copies.copy_run r where r.company_id = ${alvo.companyId} and r.ended_at is null)::int as abertas,
      (select count(*) from copies.copy c where c.company_id = ${alvo.companyId} and c.claimed_until > statement_timestamp())::int as leases,
      (select count(*) from copies.copy_run r where r.company_id = ${alvo.companyId}
         and r.started_at between ${desde}::timestamptz and ${fim})::int as copias,
      (select count(*) from data.data_read d where d.company_id = ${alvo.companyId}
         and d.connection_id = ${alvo.id} and d.at between ${desde}::timestamptz and ${fim})::int as leituras`)
    const r = Object(result.rows[0])
    return { abertas: Number(r.abertas), leases: Number(r.leases), copias: Number(r.copias), leituras: Number(r.leituras) }
  })
}

async function abrir(database: Database, keys: SealKeys, alvo: Alvo, connector: Connector) {
  const scope = { kind: 'COMPANY', companyId: alvo.companyId, personId: null } as const
  const credential = await database.read(scope, async (tx) =>
    open(keys, sealContext({ id: alvo.id, companyId: alvo.companyId, connector }), await sealedOf(tx, alvo.id)),
  )
  const opened: OpenedConnection = { id: alvo.id, linkedAt: alvo.linkedAt, connector, credential, revision: alvo.revision, accountRef: null }
  return opened
}

export type Entrada = Readonly<{
  database: Database
  keys: SealKeys
  /** Só para a prova local: a origem do falso, no loopback. */
  origem?: string
  /** Prefixo do sha256 do id da conexão, para escolher entre várias. */
  prefixo?: string
  plano?: Plano
  saida: Saida
}>

export async function rodar(e: Entrada): Promise<number> {
  const connector = connectorOf('sankhya')
  if (connector === undefined) throw new Error('kit sem o Sankhya')
  const todas = await candidatasDoHub(e.database)
  const escolhidas = e.prefixo === undefined ? todas : todas.filter((c) => sha(c.id).startsWith(e.prefixo ?? ''))
  const alvo = escolhidas[0]
  if (escolhidas.length !== 1 || alvo === undefined) {
    e.saida({ a0c: 'recusa', motivo: 'conexao-nao-unica', candidatas: todas.length, prefixos: todas.map((c) => sha(c.id).slice(0, 12)) })
    return 3
  }
  const quieto = new Date(Date.now() - QUIETO_MIN * 60_000).toISOString()
  const antes = await movimento(e.database, alvo, quieto, null)
  e.saida({ a0c: 'antes', ...antes })
  // O Hub copiando a Metal Nobre agora (cópia aberta, posse de cópia, leitura ao vivo recente): a sonda não roda.
  if (antes.abertas > 0 || antes.leases > 0 || antes.leituras > 0) {
    e.saida({ a0c: 'recusa', motivo: 'hub-em-uso' })
    return 4
  }
  const opened = await abrir(e.database, e.keys, alvo, connector)
  const origins = new Map(e.origem === undefined ? [] : [[connector.id, e.origem] as const])
  const executor = createExecutor({ fetch, origins, log: silencioso, now: () => new Date() })
  const inicio = new Date().toISOString()
  const resposta = await cronometrar(executor, opened, e.plano ?? PLANO, e.saida)
  const depois = await movimento(e.database, alvo, inicio, new Date().toISOString())
  e.saida({ a0c: 'durante', copias: depois.copias, leituras: depois.leituras, limpo: depois.copias + depois.leituras === 0 })
  return resposta === 'MEDIDO' || resposta === 'MEDIDO_PARCIAL' ? 0 : 5
}

function erroSeguro(error: unknown): Linha {
  const name = error instanceof Error ? error.name : typeof error
  const code = Object(error).code
  return { a0c: 'erro', tipo: name, codigo: typeof code === 'string' ? codigoSeguro(code) : null }
}

async function main(): Promise<number> {
  const saida: Saida = (linha) => process.stdout.write(`${JSON.stringify(linha)}\n`)
  for (const sinal of ['SIGTERM', 'SIGINT'] as const)
    process.on(sinal, () => {
      pedidoDeParada.motivo = 'sinal'
    })
  const urlFile = process.env.HUB_DATABASE_URL_FILE
  const keysFile = process.env.HUB_SEAL_KEYS_FILE
  if (urlFile === undefined || keysFile === undefined) {
    saida({ a0c: 'recusa', motivo: 'sem-arquivos' })
    return 2
  }
  const origem = process.env.A0C_ORIGEM
  if (origem !== undefined && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origem)) {
    saida({ a0c: 'recusa', motivo: 'origem-so-loopback' })
    return 2
  }
  const prefixo = process.env.A0C_CONEXAO_SHA256
  if (prefixo !== undefined && !/^[0-9a-f]{8,64}$/.test(prefixo)) {
    saida({ a0c: 'recusa', motivo: 'prefixo-invalido' })
    return 2
  }
  let database: Database
  let keys: SealKeys
  try {
    database = openDatabase({ url: DatabaseUrl.parse(readSecretFile('HUB_DATABASE_URL_FILE', urlFile)), log: silencioso })
    keys = parseSealKeys(readSecretFile('HUB_SEAL_KEYS_FILE', keysFile))
  } catch (error) {
    saida(erroSeguro(error))
    return 2
  }
  try {
    return await rodar({ database, keys, saida, ...(origem && { origem }), ...(prefixo && { prefixo }) })
  } catch (error) {
    saida(erroSeguro(error))
    return 1
  } finally {
    await database.close()
  }
}

if (import.meta.main) process.exitCode = await main()
