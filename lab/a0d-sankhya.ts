// A0d: a leitura do kit por janela de mês (e pelo incremental) nas cinco tabelas fiscais do Sankhya, só leitura.
// A A0d mediu a TGFEFDVMRSTDIA por janela de mês de DTREF a ~3.200 linhas/s por sessão contra 450 pela chave
// composta, lendo `SELECT * FROM tabela WHERE mês ...` direto. A prova P2 pediu três coisas antes do cartão:
//   1. conferir que o Oracle trata o filtro de mês POR DENTRO da subconsulta que a `lerPagina` do kit
//      embrulha (`... FROM (SELECT cols FROM tabela WHERE mês) Q WHERE <chave> ORDER BY ... FETCH`) com o
//      mesmo plano da forma direta;
//   2. medir a TGFCTE (chave por DTCONTAGEM) e a TCBSAL (por REFERENCIA): contagem por mês, 5 páginas por
//      janela de mês num mês recente, o plano, e o mesmo com 3 sessões ao mesmo tempo;
//   3. a TGFLIV (DHALTER) e a TCBPLA (DTALTER) pelo incremental da coluna de alteração: 3 páginas do último mês.
//
// A instrução da página é a do kit: `pageSql` (kit, `sankhya/search-sql.ts`) com as colunas apelidadas
// `Q.COL AS Cn_M`, a consulta guardada como `Q`, a data da coluna de alteração e a chave "depois da última"
// no formato `((K1 > a) OR (K1 = a AND K2 > b))` da `pageStatement` (kit, `sankhya/copy-read.ts`). A prova local
// trava a igualdade com a `pageStatement` do kit. O kit limita a página a 500 linhas (`PAGE_ROWS`), por isso
// a forma `kit-500` é a que a `lerPagina` faria de verdade; `kit-grande` (4.999 linhas) é a mesma instrução com
// a página que o gateway aceita (a A0b/A0d mediram 5.000), e `direta` é a forma da A0d (SELECT *, 5.000 linhas).
//
// No máximo 15 minutos no total; qualquer sinal de carga (página acima de 30 s, 429, 504) para tudo.
// Roda dentro da imagem do Hub que está no ar, num contêiner avulso (lab/a0d-sankhya.sh), nunca no contêiner do
// Hub. Lê dois arquivos: a URL do banco do Hub (HUB_DATABASE_URL_FILE) e as chaves de selo (HUB_SEAL_KEYS_FILE).
// Abre a credencial selada de UMA conexão Sankhya com o código do próprio Hub e fala com o Sankhya só pelo
// executor do Hub e pela leitura `consultar` do kit (DbExplorerSP.executeQuery, um SELECT por chamada, julgado
// pelo filtro de leitura do kit).
//
// Nenhuma escrita: só SELECT. Imprime só linhas JSON com formas, classes de resposta, códigos, contagens, tempos
// e nomes do dicionário padrão do Oracle e do Sankhya. Nunca imprime célula de dado, valor de chave, código de
// empresa, token, credencial, mensagem do Sankhya, nome de empresa, de conexão nem id: o log do workflow é público.
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
import { pageSql } from '../packages/connectors/src/sankhya/search-sql.ts'

/** Uma tabela lida por janela de mês de uma data de negócio. */
export type TabelaMes = Readonly<{ nome: string; coluna: string; direta: boolean; sessoes: boolean }>
/** Uma tabela lida pelo incremental da coluna de alteração. */
export type TabelaAlterada = Readonly<{ nome: string; coluna: string }>

/** Tudo aqui é fixo no commit revisado; nada vem do ambiente. Os tempos contam do começo da sonda. */
export type Plano = Readonly<{
  /** Hoje em Brasília (AAAA-MM-DD): nenhum mês depois do corrente conta como mês. */
  hoje: string
  tabelasMes: readonly TabelaMes[]
  tabelasAlteradas: readonly TabelaAlterada[]
  /** A página do kit (`PAGE_ROWS`), a do gateway (4.999 + 1 linha de sobra = 5.000) e a da forma direta da A0d. */
  paginaKit: number
  paginaGrande: number
  paginaDireta: number
  /** Páginas de cada forma por janela de mês (5) e no incremental (3). */
  paginasPorForma: number
  paginasIncremental: number
  /** Mês escolhido: completo e com ao menos isto de linhas (5 páginas de 5.000). */
  minLinhasMes: number
  /** O incremental alarga a janela (30, 90, 365 dias) até haver linhas para as páginas. */
  diasIncremental: readonly number[]
  linhasIncremental: number
  /** Nenhuma rodada de formas de cada tabela de mês começa depois destes instantes (ms desde o começo). */
  fimDasFormasMs: readonly number[]
  fimDoIncrementalMs: number
  fimDasSessoesMs: number
  /** Nenhuma leitura nova depois disto, em nenhuma parte. */
  tetoLeituraMs: number
  /** Blocos das 1, 2 e 3 sessões (uma página por sessão por bloco), palíndromos. */
  sequenciaKit: readonly number[]
  sequenciaGrande: readonly number[]
  /** Prazo de cada chamada ao Sankhya. */
  prazoMs: number
  /** Renova o login quando faltar isto para o token vencer (o token vence aos 300 s, mesmo em uso). */
  folgaRenovacaoMs: number
  /** Uma página mais lenta que isto para a sonda inteira. */
  paginaLentaMs: number
}>

export const PLANO: Plano = {
  hoje: new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
  tabelasMes: [
    { nome: 'TGFEFDVMRSTDIA', coluna: 'DTREF', direta: true, sessoes: false },
    { nome: 'TGFCTE', coluna: 'DTCONTAGEM', direta: false, sessoes: true },
    { nome: 'TCBSAL', coluna: 'REFERENCIA', direta: false, sessoes: true },
  ],
  tabelasAlteradas: [
    { nome: 'TGFLIV', coluna: 'DHALTER' },
    { nome: 'TCBPLA', coluna: 'DTALTER' },
  ],
  paginaKit: 500,
  paginaGrande: 4999,
  paginaDireta: 5000,
  paginasPorForma: 5,
  paginasIncremental: 3,
  minLinhasMes: 25_000,
  diasIncremental: [30, 90, 365],
  linhasIncremental: 1500,
  fimDasFormasMs: [3 * 60_000, 6 * 60_000, 8.5 * 60_000],
  fimDoIncrementalMs: 10 * 60_000,
  fimDasSessoesMs: 11.5 * 60_000,
  tetoLeituraMs: 12 * 60_000,
  sequenciaKit: [1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 1],
  sequenciaGrande: [1, 2, 3, 3, 2, 1],
  prazoMs: 120_000,
  folgaRenovacaoMs: 60_000,
  paginaLentaMs: 30_000,
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

// ---------------------------------------------------------------- a instrução: a do kit e a direta da A0d

export type Tipo = 'text' | 'numeric' | 'bigint' | 'date' | 'timestamp'
/** A letra do apelido de cada coluna da página (`C3_D`), como o kit a marca (`MARK`, copy-read.ts). */
const MARCA: Readonly<Record<Tipo, string>> = { text: 'T', numeric: 'N', bigint: 'B', date: 'D', timestamp: 'S' }

export type Coluna = Readonly<{ nome: string; tipo: Tipo }>
export type Tabela = Readonly<{
  nome: string
  colunas: readonly Coluna[]
  /** A chave primária com o tipo do Oracle, na ordem da chave. */
  chave: Chave
  excluidas: number
}>

/** O tipo do kit para uma coluna do Oracle; nenhum para o que a cópia não leria (LOB, LONG, RAW, XML). */
export function tipoDoKit(oracle: string): Tipo | null {
  if (oracle === 'NUMBER' || oracle === 'FLOAT' || oracle === 'BINARY_DOUBLE' || oracle === 'BINARY_FLOAT') return 'numeric'
  if (/^(VARCHAR2|NVARCHAR2|CHAR|NCHAR)$/.test(oracle)) return 'text'
  if (oracle === 'DATE' || oracle.startsWith('TIMESTAMP')) return 'timestamp'
  return null
}

const nomeDaColuna = (a: string) => /^[A-Z][A-Z0-9_]{0,29}$/.test(a)
const dataDoKit = (dia: string) => `TO_DATE('${dia}', 'YYYY-MM-DD')`

/** O apelido da coluna `at` da página: onde o valor da linha vem. */
export const apelido = (t: Tabela, at: number): string => `C${at}_${MARCA[(t.colunas[at] as Coluna).tipo]}`

/** Depois da última chave lida, em ordem de chave: `((K1 > a) OR (K1 = a AND K2 > b))`, como o `pastKey` do kit. */
export function depoisDaChaveDoKit(chave: Chave, ultima: Readonly<Record<string, unknown>> | null): string | undefined {
  if (ultima === null) return undefined
  const lits = chave.map(({ coluna, tipo }) => literal(ultima[coluna], tipo))
  const cada = chave.map(({ coluna }, at) =>
    [...chave.slice(0, at).map((antes, i) => `Q.${antes.coluna} = ${lits[i]}`), `Q.${coluna} > ${lits[at]}`].join(' AND '),
  )
  return `(${cada.map((parte) => `(${parte})`).join(' OR ')})`
}

/** De que coluna, a partir de que dia: a data de alteração da passada (`dates` do kit, sem janela). */
export type Desde = Readonly<{ coluna: string; dia: string }>

/**
 * A instrução de uma página do kit: a consulta guardada como `Q`, a data e a chave acrescentadas aqui,
 * uma linha a mais que `limite` (`EXTRA`). É a `pageStatement` do kit para uma chave que ela não aceita
 * (data, texto, mais de 4 colunas); a prova local trava a igualdade onde a do kit aceita.
 */
export function instrucaoDoKit(
  t: Tabela,
  origem: string,
  desde: Desde | null,
  ultima: Readonly<Record<string, unknown>> | null,
  limite: number,
): string {
  return pageSql({
    select: t.colunas.map(({ nome }, at) => `Q.${nome} AS ${apelido(t, at)}`),
    from: `(${origem}) Q`,
    where: [desde === null ? undefined : `Q.${desde.coluna} >= ${dataDoKit(desde.dia)}`, depoisDaChaveDoKit(t.chave, ultima)],
    order: t.chave.map(({ coluna }) => `Q.${coluna}`).join(', '),
    limit: limite,
  })
}

/** A consulta guardada do kit (`definition.source.sql`): as colunas da tabela, com o filtro de mês quando há. */
export const origemDaTabela = (t: Tabela, filtro: string | null): string =>
  `SELECT ${t.colunas.map(({ nome }) => nome).join(', ')} FROM ${t.nome}${filtro === null ? '' : ` WHERE ${filtro}`}`

/** Depois da última chave lida, com a primeira coluna à frente (a forma da A0b e da A0d, `SELECT *`). */
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

/** A instrução de uma página direta da A0d: SELECT * ordenado pela chave, depois da última lida. */
export function paginaDireta(
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

const mesInicio = (mes: string) => `TO_DATE('${mes}-01', 'YYYY-MM-DD')`

export function proximoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
}

export const filtroDoMes = (coluna: string, mes: string) =>
  `${coluna} >= ${mesInicio(mes)} AND ${coluna} < ${mesInicio(proximoMes(mes))}`

/** Há `dias` dias antes de `hoje` (AAAA-MM-DD), no mesmo formato. */
export function diasAntes(hoje: string, dias: number): string {
  const d = new Date(`${hoje}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dias)
  return d.toISOString().slice(0, 10)
}

export type MesContado = Readonly<{ mes: string; n: number }>

/**
 * Os meses lidos: completos (nunca o mais novo da tabela nem um depois de hoje), os maiores e mais recentes com
 * ao menos `minimo` linhas; sem nenhum assim, os maiores dos últimos seis completos.
 */
export function escolherRecentes(historia: readonly MesContado[], minimo: number, hoje: string, quantos = 3): string[] {
  const ordenada = historia.filter((m) => m.n > 0 && m.mes <= hoje.slice(0, 7)).sort((a, b) => (a.mes < b.mes ? -1 : 1))
  const completos = ordenada.slice(0, -1)
  const grandes = completos.filter((m) => m.n >= minimo).reverse()
  const base = grandes.length > 0 ? grandes : [...completos.slice(-6)].sort((a, b) => b.n - a.n)
  return base.slice(0, quantos).map((m) => m.mes)
}

// ---------------------------------------------------------------- as leituras: uma forma numa tabela

/** Uma forma em leitura: o que ela lê, onde parou, e o que mediu. Só a sonda a muda. */
export type Leitura = {
  tabela: Tabela
  /** O nome da forma: `kit-500`, `kit-grande`, `direta`. */
  forma: string
  estilo: 'kit' | 'direta'
  /** Linhas por página (o kit pede uma a mais, a `EXTRA`). */
  limite: number
  /** A consulta guardada (kit) ou o filtro (direta). */
  origem: string
  filtro: string | null
  desde: Desde | null
  maximo: number
  ultima: Record<string, unknown> | null
  paginas: number
  tempos: number[]
  linhas: number
  fim: boolean
  falha: string | null
  /** A instrução da última página lida, para o plano. */
  instrucao: string | null
  planoFeito: boolean
}

export function novaLeitura(
  tabela: Tabela,
  forma: string,
  estilo: 'kit' | 'direta',
  limite: number,
  maximo: number,
  onde: Readonly<{ filtro: string | null; desde: Desde | null }>,
): Leitura {
  return {
    tabela,
    forma,
    estilo,
    limite,
    origem: origemDaTabela(tabela, estilo === 'kit' ? onde.filtro : null),
    filtro: onde.filtro,
    desde: onde.desde,
    maximo,
    ultima: null,
    paginas: 0,
    tempos: [],
    linhas: 0,
    fim: false,
    falha: null,
    instrucao: null,
    planoFeito: false,
  }
}

export function instrucaoDaPagina(l: Leitura): string {
  return l.estilo === 'kit'
    ? instrucaoDoKit(l.tabela, l.origem, l.desde, l.ultima, l.limite)
    : paginaDireta(l.tabela.nome, l.tabela.chave, l.ultima, l.limite, l.filtro)
}

/** O valor de uma coluna da chave numa linha da resposta: pelo nome (direta) ou pelo apelido (kit). */
function valorDaChave(l: Leitura, linha: Readonly<Record<string, unknown>>, coluna: string): unknown {
  if (l.estilo === 'direta') return linha[coluna]
  const at = l.tabela.colunas.findIndex((c) => c.nome === coluna)
  return at === -1 ? undefined : linha[apelido(l.tabela, at)]
}

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
    saida({ a0d: 'logout', sessao: rotulo, resultado: r })
  }

  async function entrar(): Promise<boolean> {
    const comeco = relogio()
    const answered = await executor.login(opened, plano.prazoMs)
    logins += 1
    if (answered.kind !== 'TOKEN') {
      saida({ a0d: 'login', sessao: rotulo, resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : answered.kind, ms: Math.round(relogio() - comeco) })
      return false
    }
    const anterior = token
    token = answered.token
    emitidos.push(answered.token)
    venceEm = relogio() + answered.expiresInSeconds * 1000
    saida({ a0d: 'login', sessao: rotulo, resultado: 'OK', validadeS: answered.expiresInSeconds, ms: Math.round(relogio() - comeco), numero: logins })
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

/** Mediana, p90 e máximo de uma lista de tempos. */
export function estatistica(ms: readonly number[]) {
  const s = [...ms].sort((a, b) => a - b)
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? null
  return { n: s.length, p50: at(0.5), p90: at(0.9), max: s.at(-1) ?? null, soma: s.reduce((a, b) => a + b, 0) }
}

/** Linhas por segundo como a A0b mediu: linhas lidas pela soma dos tempos das páginas (uma sessão). */
export const taxa = (linhas: number, ms: number): number | null => (ms === 0 ? null : Math.round((linhas * 1000) / ms))

// ---------------------------------------------------------------- o catálogo e as contagens (só nomes padrão e números)

const ESQUEMA = "SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')"

export const CATALOGO = {
  colunas: (t: string) =>
    `SELECT COLUMN_NAME, DATA_TYPE, NULLABLE FROM ALL_TAB_COLUMNS WHERE OWNER = ${ESQUEMA} AND TABLE_NAME = ${literalTexto(t)} ORDER BY COLUMN_ID`,
  chave: (t: string) =>
    `SELECT K.COLUMN_NAME, K.POSITION FROM ALL_CONSTRAINTS C JOIN ALL_CONS_COLUMNS K ON K.OWNER = C.OWNER AND K.CONSTRAINT_NAME = C.CONSTRAINT_NAME WHERE C.OWNER = ${ESQUEMA} AND C.CONSTRAINT_TYPE = 'P' AND C.TABLE_NAME = ${literalTexto(t)} ORDER BY K.POSITION`,
  indices: (t: string) =>
    `SELECT I.INDEX_NAME, I.UNIQUENESS, K.COLUMN_NAME, K.COLUMN_POSITION FROM ALL_INDEXES I JOIN ALL_IND_COLUMNS K ON K.INDEX_OWNER = I.OWNER AND K.INDEX_NAME = I.INDEX_NAME WHERE I.TABLE_OWNER = ${ESQUEMA} AND I.TABLE_NAME = ${literalTexto(t)} ORDER BY I.INDEX_NAME, K.COLUMN_POSITION`,
  /** Uma contagem agrupada por mês: nenhuma linha de dado, só mês e contagem. */
  meses: (t: string, coluna: string) =>
    `SELECT TO_CHAR(${coluna}, 'YYYY-MM') AS M, COUNT(*) AS N FROM ${t} GROUP BY TO_CHAR(${coluna}, 'YYYY-MM') ORDER BY 1`,
  /** Quantas linhas o incremental traria: só a contagem. */
  desde: (t: string, coluna: string, dia: string) => `SELECT COUNT(*) AS N FROM ${t} WHERE ${coluna} >= ${dataDoKit(dia)}`,
} as const

/** As colunas da tabela, a chave e os índices. `null` quando a chave não é uma que a página por chave leia. */
async function catalogo(cx: Contexto, s: Sessao, nome: string, colunaData: string): Promise<Tabela | null> {
  const colunas = await s.consultar(CATALOGO.colunas(nome), true)
  const pk = await s.consultar(CATALOGO.chave(nome), true)
  const indices = await s.consultar(CATALOGO.indices(nome), true)
  const tipos = new Map((colunas.consulta?.linhas ?? []).map((l) => [String(l.COLUMN_NAME), String(l.DATA_TYPE)]))
  const nomesChave = (pk.consulta?.linhas ?? []).map((l) => String(l.COLUMN_NAME))
  const porIndice = new Map<string, { unico: boolean; colunas: string[] }>()
  for (const l of indices.consulta?.linhas ?? []) {
    const indice = String(l.INDEX_NAME)
    const atual = porIndice.get(indice) ?? { unico: l.UNIQUENESS === 'UNIQUE', colunas: [] }
    atual.colunas.push(String(l.COLUMN_NAME))
    porIndice.set(indice, atual)
  }
  const lidas: Coluna[] = []
  let excluidas = 0
  for (const [coluna, oracle] of tipos) {
    const base = tipoDoKit(oracle)
    if (base === null || !nomeDaColuna(coluna)) excluidas += 1
    else lidas.push({ nome: coluna, tipo: nomesChave.includes(coluna) && base === 'numeric' ? 'bigint' : base })
  }
  const chave: Chave = nomesChave.map((coluna) => ({ coluna, tipo: tipos.get(coluna) ?? 'outro' }))
  const chaveLegivel = chave.length > 0 && chave.every((c) => ['NUMBER', 'VARCHAR2', 'CHAR', 'DATE'].includes(c.tipo) && lidas.some((l) => l.nome === c.coluna))
  const dataLegivel = ['DATE'].includes(tipos.get(colunaData) ?? '') || (tipos.get(colunaData) ?? '').startsWith('TIMESTAMP')
  cx.saida({
    a0d: 'tabela',
    tabela: nome,
    colunasLidas: lidas.length,
    colunasExcluidas: excluidas,
    chave: chave.map((c) => `${nomeSeguro(c.coluna)}:${c.tipo}`),
    dataDeJanela: nomeSeguro(colunaData),
    catalogo: [colunas.classe.resultado, pk.classe.resultado, indices.classe.resultado],
    chaveLegivel,
    dataLegivel,
    indiceComAData: [...porIndice.values()].filter((i) => i.colunas.includes(colunaData)).map((i) => ({ unico: i.unico, colunas: i.colunas.map(nomeSeguro) })),
  })
  for (const [indice, i] of porIndice) cx.saida({ a0d: 'indice', tabela: nome, indice: nomeSeguro(indice), unico: i.unico, colunas: i.colunas.map(nomeSeguro) })
  if (!chaveLegivel || !dataLegivel) return null
  return { nome, colunas: lidas, chave, excluidas }
}

async function contagemPorMes(cx: Contexto, s: Sessao, tabela: string, coluna: string): Promise<MesContado[] | null> {
  const lido = await s.consultar(CATALOGO.meses(tabela, coluna), true)
  const linhas = lido.consulta?.linhas ?? []
  const meses = linhas.map((l) => ({ mes: String(l.M), n: Number(l.N) })).filter((m) => /^\d{4}-\d{2}$/.test(m.mes) && Number.isFinite(m.n))
  cx.saida({ a0d: 'contagem-por-mes', tabela, resultado: lido.classe.resultado, codigo: lido.classe.codigo, meses: meses.length, linhas: meses.reduce((a, m) => a + m.n, 0), ms: lido.ms })
  for (const m of meses) cx.saida({ a0d: 'mes', tabela, mes: m.mes, linhas: m.n })
  return lido.classe.resultado === 'OK' ? meses : null
}

// ---------------------------------------------------------------- o plano de execução

/** As colunas que aparecem nos predicados de acesso e de filtro de cada operação: só 0 ou 1, nunca o texto (que traz valores). */
const marcas = (colunas: readonly string[]) =>
  colunas
    .flatMap((c) => [
      `CASE WHEN INSTR(ACCESS_PREDICATES, '"${c}"') > 0 THEN 1 ELSE 0 END AS A_${c}`,
      `CASE WHEN INSTR(FILTER_PREDICATES, '"${c}"') > 0 THEN 1 ELSE 0 END AS F_${c}`,
    ])
    .join(', ')

const lerPlano = (de: string, onde: string, colunas: readonly string[]) =>
  `SELECT ID, PARENT_ID, OPERATION, OPTIONS, OBJECT_NAME, COST, CARDINALITY, ${marcas(colunas)} FROM ${de} WHERE ${onde} ORDER BY ID`

function emitirPlano(cx: Contexto, alvo: Alvo2, linhas: readonly Record<string, unknown>[], colunas: readonly string[]) {
  for (const l of linhas)
    cx.saida({
      a0d: 'plano',
      ...alvo,
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

type Alvo2 = Readonly<{ tabela: string; forma: string }>

const V_SQL = 'SQL_ID, CHILD_NUMBER, PLAN_HASH_VALUE, EXECUTIONS, ELAPSED_TIME, CPU_TIME, USER_IO_WAIT_TIME, BUFFER_GETS, DISK_READS, ROWS_PROCESSED'

/**
 * O plano da última página de uma leitura: acha o cursor que ela deixou no Oracle (o começo da instrução no
 * SQL_TEXT e o fim, com a chave e o FETCH, no SQL_FULLTEXT; sem o fim, só o começo, o mais recente), lê os
 * tempos do próprio Oracle (V$SQL) e o V$SQL_PLAN dele. O EXPLAIN PLAN o filtro do kit recusa (A0d).
 */
export async function planoDe(cx: Contexto, s: Sessao, l: Leitura): Promise<void> {
  l.planoFeito = true
  const texto = l.instrucao
  if (texto === null) return
  const alvo: Alvo2 = { tabela: l.tabela.nome, forma: l.forma }
  const colunas = [...new Set([...l.tabela.chave.map((c) => c.coluna), ...(l.desde ? [l.desde.coluna] : []), ...(l.filtro === null ? [] : [colunaDoFiltro(l.filtro)])])].filter(nomeDaColuna)
  const cabeca = literalTexto(texto.slice(0, 200))
  const filtroSql = (extra: string) => `SELECT ${V_SQL} FROM V$SQL WHERE INSTR(SQL_TEXT, ${cabeca}) > 0 ${extra}AND INSTR(SQL_TEXT, 'V$SQL') = 0 ORDER BY LAST_ACTIVE_TIME DESC FETCH FIRST 1 ROWS ONLY`
  let achado = await s.consultar(filtroSql(`AND INSTR(SQL_FULLTEXT, ${literalTexto(texto.slice(-300))}) > 0 `), true)
  let metodo = 'cauda'
  if (achado.consulta?.linhas[0] === undefined && achado.classe.resultado !== 'PARADA') {
    achado = await s.consultar(filtroSql(''), true)
    metodo = 'cabeca'
  }
  const v = achado.consulta?.linhas[0]
  const id = v === undefined ? null : String(v.SQL_ID)
  cx.saida({
    a0d: 'v-sql',
    ...alvo,
    metodo,
    resultado: achado.classe.resultado,
    codigo: achado.classe.codigo,
    achou: v !== undefined,
    hashDoPlano: v === undefined ? null : Number(v.PLAN_HASH_VALUE),
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
  const lido = await s.consultar(lerPlano('V$SQL_PLAN', `SQL_ID = '${id}' AND CHILD_NUMBER = ${Number.isInteger(filho) ? filho : 0}`, colunas), true)
  cx.saida({ a0d: 'plano-lido', ...alvo, resultado: lido.classe.resultado, operacoes: lido.consulta?.linhas.length ?? 0 })
  emitirPlano(cx, alvo, lido.consulta?.linhas ?? [], colunas)
}

/** A coluna do filtro de mês (`COL >= TO_DATE(...) AND COL < ...`): a primeira palavra. */
const colunaDoFiltro = (filtro: string): string => filtro.split(' ')[0] ?? ''

// ---------------------------------------------------------------- ler páginas

/** Por que a sonda parou, quando foi por sinal de carga: página lenta, 429, 504 ou pedido de parada. */
export const SINAIS_DE_CARGA = ['pagina-lenta', 'falha-OCUPADO', 'falha-INALCANCAVEL', 'sinal'] as const
export const cargaDe = (motivo: string | null): boolean => motivo !== null && (SINAIS_DE_CARGA as readonly string[]).includes(motivo)

export type Pagina = Readonly<{ ok: boolean; linhas: number; ms: number }>

/** Lê a próxima página de uma leitura numa sessão, cronometra, emite uma linha e avança a chave. */
export async function lerPagina(cx: Contexto, sessao: Sessao, l: Leitura, fase: string): Promise<Pagina> {
  const texto = instrucaoDaPagina(l)
  const lido = await sessao.consultar(texto)
  if (lido.classe.resultado === 'PARADA') return { ok: false, linhas: 0, ms: 0 }
  const todas = lido.consulta?.linhas ?? []
  const dados = l.estilo === 'kit' ? todas.filter((r) => r.EXTRA !== 'S') : todas
  const completo = lido.consulta?.completo ?? null
  const bytes = lido.consulta === null ? 0 : Buffer.byteLength(JSON.stringify(todas))
  cx.saida({ a0d: 'pagina', fase, tabela: l.tabela.nome, forma: l.forma, sessao: sessao.rotulo, pagina: l.paginas + 1, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: dados.length, completo, bytesAprox: bytes, ms: lido.ms })
  if (lido.classe.resultado !== 'OK') {
    l.falha = lido.classe.resultado
    return { ok: false, linhas: 0, ms: lido.ms }
  }
  l.paginas += 1
  l.tempos.push(lido.ms)
  l.linhas += dados.length
  l.instrucao = texto
  const mais = l.estilo === 'kit' ? dados.length < todas.length || completo === false : todas.length >= l.limite || completo === false
  if (!mais) l.fim = true
  const ultima = dados.at(-1)
  l.ultima = ultima === undefined ? null : Object.fromEntries(l.tabela.chave.map(({ coluna }) => [coluna, valorDaChave(l, ultima, coluna)]))
  if (mais && (l.ultima === null || Object.values(l.ultima).some((v) => v === null || v === undefined))) l.falha = 'chave-nula'
  return { ok: true, linhas: dados.length, ms: lido.ms }
}

const pendente = (l: Leitura) => l.falha === null && !l.fim && l.paginas < l.maximo
const girar = <T>(lista: readonly T[], n: number): T[] => lista.map((_, i) => lista[(i + n) % lista.length] as T)

function resumoDaLeitura(cx: Contexto, l: Leitura, fase: string) {
  const e = estatistica(l.tempos)
  cx.saida({ a0d: 'forma', fase, tabela: l.tabela.nome, forma: l.forma, paginas: e.n, linhas: l.linhas, motivo: l.falha ?? (l.fim ? 'fim-do-corte' : l.paginas >= l.maximo ? 'teto-de-paginas' : 'parada'), p50Ms: e.p50, p90Ms: e.p90, maxMs: e.max, linhasPorSegundo: taxa(l.linhas, e.soma), temposMs: l.tempos })
}

/** As formas de uma tabela alternadas, uma página por forma por rodada, a primeira girando; o plano de cada uma depois da 3ª página. */
async function formasAlternadas(cx: Contexto, s: Sessao, leituras: readonly Leitura[], fase: string, fimMs: number) {
  const { saida, relogio, freio } = cx
  const rodadas = Math.max(...leituras.map((l) => l.maximo))
  for (let rodada = 0; rodada < rodadas && freio.motivo === null; rodada += 1) {
    if (relogio() - cx.inicio > fimMs) {
      saida({ a0d: 'formas', fase, motivo: 'teto-de-tempo-da-parte', rodadas: rodada })
      return
    }
    for (const l of girar(leituras, rodada)) {
      if (freio.motivo !== null) return
      if (!pendente(l)) continue
      await lerPagina(cx, s, l, fase)
      if (!l.planoFeito && l.falha === null && (l.paginas === 3 || l.fim) && freio.motivo === null) await planoDe(cx, s, l)
    }
  }
  saida({ a0d: 'formas', fase, motivo: 'fim', rodadas: rodadas })
}

// ---------------------------------------------------------------- uma tabela por janela de mês

export type Lida = Readonly<{ def: TabelaMes; tabela: Tabela; recentes: readonly string[] }>

async function tabelaPorMes(cx: Contexto, s: Sessao, def: TabelaMes, fimMs: number): Promise<Lida | null> {
  const { plano, saida } = cx
  const tabela = await catalogo(cx, s, def.nome, def.coluna)
  if (tabela === null) return null
  const historia = await contagemPorMes(cx, s, def.nome, def.coluna)
  if (historia === null) return null
  const recentes = escolherRecentes(historia, plano.minLinhasMes, plano.hoje)
  const mes = recentes[0]
  const contagemDe = (m: string) => historia.find((h) => h.mes === m)?.n ?? null
  saida({ a0d: 'meses', tabela: def.nome, recentes: recentes.length, linhasRecentes: recentes.map(contagemDe), minLinhas: plano.minLinhasMes })
  if (mes === undefined) return null
  const onde = { filtro: filtroDoMes(def.coluna, mes), desde: null }
  const paginas = plano.paginasPorForma
  const leituras = [
    novaLeitura(tabela, 'kit-500', 'kit', plano.paginaKit, paginas, onde),
    novaLeitura(tabela, 'kit-grande', 'kit', plano.paginaGrande, paginas, onde),
    ...(def.direta ? [novaLeitura(tabela, 'direta', 'direta', plano.paginaDireta, paginas, onde)] : []),
  ]
  await formasAlternadas(cx, s, leituras, 'MES', fimMs)
  for (const l of leituras) resumoDaLeitura(cx, l, 'MES')
  return { def, tabela, recentes }
}

// ---------------------------------------------------------------- 1, 2 e 3 sessões lendo meses diferentes

/** `k` sessões lendo cortes diferentes, em blocos de uma página por sessão na ordem da sequência (1 2 3 3 2 1 ...). */
async function blocosDeSessoes(cx: Contexto, sessoes: readonly Sessao[], cortes: readonly Leitura[], sequencia: readonly number[], rotulo: Alvo2, fimMs: number) {
  const { saida, relogio, freio } = cx
  const limite = Math.min(sessoes.length, cortes.length)
  const porK: Record<number, { agregadas: number[]; porSessao: number[] }> = {}
  for (const k of sequencia) {
    if (freio.motivo !== null) break
    if (k > limite) continue
    if (relogio() - cx.inicio > fimMs) {
      saida({ a0d: 'sessoes', ...rotulo, motivo: 'teto-de-tempo-da-parte' })
      break
    }
    if (cortes.slice(0, k).some((l) => l.falha !== null || l.fim)) {
      saida({ a0d: 'sessoes', ...rotulo, motivo: 'corte-acabou' })
      break
    }
    const comeco = relogio()
    const lidas = await Promise.all(cortes.slice(0, k).map((l, i) => lerPagina(cx, sessoes[i] as Sessao, l, `S${k}`)))
    const parede = Math.round(relogio() - comeco)
    const feitas = lidas.filter((p) => p.ok)
    if (feitas.length === 0) break
    const linhas = feitas.reduce((a, p) => a + p.linhas, 0)
    const agregada = taxa(linhas, parede)
    const porSessao = taxa(linhas, feitas.reduce((a, p) => a + p.ms, 0))
    saida({ a0d: 'bloco', ...rotulo, sessoes: k, paginas: feitas.length, linhas, paredeMs: parede, linhasPorSegundoAgregadas: agregada, linhasPorSegundoPorSessao: porSessao })
    const guarda = (porK[k] ??= { agregadas: [], porSessao: [] })
    if (agregada !== null) guarda.agregadas.push(agregada)
    if (porSessao !== null) guarda.porSessao.push(porSessao)
  }
  for (const [k, g] of Object.entries(porK))
    saida({ a0d: 'sessoes', ...rotulo, sessoes: Number(k), blocos: g.agregadas.length, medianaAgregada: estatistica(g.agregadas).p50, medianaPorSessao: estatistica(g.porSessao).p50, agregadas: g.agregadas })
}

async function sessoesDaTabela(cx: Contexto, abertas: readonly Sessao[], lida: Lida) {
  const { plano } = cx
  for (const [forma, limite, sequencia] of [['kit-500', plano.paginaKit, plano.sequenciaKit], ['kit-grande', plano.paginaGrande, plano.sequenciaGrande]] as const) {
    if (cx.freio.motivo !== null) return
    const cortes = lida.recentes.map((mes) => novaLeitura(lida.tabela, forma, 'kit', limite, 1000, { filtro: filtroDoMes(lida.def.coluna, mes), desde: null }))
    cx.saida({ a0d: 'sessoes-plano', tabela: lida.def.nome, forma, cortes: cortes.length, sessoes: abertas.length })
    await blocosDeSessoes(cx, abertas, cortes, sequencia, { tabela: lida.def.nome, forma }, plano.fimDasSessoesMs)
    for (const l of cortes) resumoDaLeitura(cx, l, 'SESSOES')
  }
}

// ---------------------------------------------------------------- uma tabela pelo incremental da coluna de alteração

async function tabelaAlterada(cx: Contexto, s: Sessao, def: TabelaAlterada): Promise<boolean> {
  const { plano, saida } = cx
  const tabela = await catalogo(cx, s, def.nome, def.coluna)
  if (tabela === null) return false
  let escolhido: Readonly<{ dias: number; n: number }> | null = null
  for (const dias of plano.diasIncremental) {
    if (cx.freio.motivo !== null) return false
    const lido = await s.consultar(CATALOGO.desde(def.nome, def.coluna, diasAntes(plano.hoje, dias)), true)
    const n = Number(lido.consulta?.linhas[0]?.N ?? Number.NaN)
    saida({ a0d: 'alteradas', tabela: def.nome, dias, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: Number.isFinite(n) ? n : null, ms: lido.ms })
    if (!Number.isFinite(n)) return false
    escolhido = { dias, n }
    if (n >= plano.linhasIncremental) break
  }
  if (escolhido === null) return false
  saida({ a0d: 'incremental', tabela: def.nome, dias: escolhido.dias, linhas: escolhido.n, alvoLinhas: plano.linhasIncremental })
  const onde = { filtro: null, desde: { coluna: def.coluna, dia: diasAntes(plano.hoje, escolhido.dias) } }
  const leituras = [
    novaLeitura(tabela, 'kit-500', 'kit', plano.paginaKit, plano.paginasIncremental, onde),
    novaLeitura(tabela, 'kit-grande', 'kit', plano.paginaGrande, plano.paginasIncremental, onde),
  ]
  await formasAlternadas(cx, s, leituras, 'INC', plano.fimDoIncrementalMs)
  for (const l of leituras) resumoDaLeitura(cx, l, 'INC')
  return true
}

// ---------------------------------------------------------------- o protocolo

export type Resposta = 'MEDIDO' | 'MEDIDO_PARCIAL' | 'SEM_TABELA' | 'LOGIN_FALHOU'

/**
 * O protocolo, contra qualquer Sankhya (o real ou o falso), nesta ordem: (1) login; (2) cada tabela de mês:
 * catálogo, contagem por mês, as formas num mês recente e o plano delas; (3) cada tabela do incremental: a
 * contagem da janela, as formas e o plano; (4) as tabelas de mês com 1, 2 e 3 sessões; (5) o logout de toda
 * sessão, também em erro. Qualquer sinal de carga (página acima de `paginaLentaMs`, 429, 504, pedido de parada)
 * para toda leitura nova.
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
    saida({ a0d: 'veredito', resposta: 'LOGIN_FALHOU' })
    return 'LOGIN_FALHOU'
  }
  const abertas: Sessao[] = [s1]
  try {
    const resposta = await medida(cx, s1, abertas)
    saida({ a0d: 'veredito', resposta, motivo: cx.freio.motivo, logins: abertas.reduce((a, s) => a + s.logins(), 0), duracaoMs: Math.round(relogio() - cx.inicio) })
    return resposta
  } finally {
    for (const s of abertas) await s.fechar()
  }
}

async function medida(cx: Contexto, s1: Sessao, abertas: Sessao[]): Promise<Resposta> {
  const { plano, saida } = cx
  const lidas: Lida[] = []
  let falhas = 0
  for (const [i, def] of plano.tabelasMes.entries()) {
    if (cx.freio.motivo !== null) break
    const lida = await tabelaPorMes(cx, s1, def, plano.fimDasFormasMs[i] ?? plano.fimDoIncrementalMs)
    if (lida === null) {
      falhas += 1
      saida({ a0d: 'tabela-pulada', tabela: def.nome, parte: 'mes' })
    } else lidas.push(lida)
  }
  let alteradas = 0
  for (const def of plano.tabelasAlteradas) {
    if (cx.freio.motivo !== null) break
    if (await tabelaAlterada(cx, s1, def)) alteradas += 1
    else {
      falhas += 1
      saida({ a0d: 'tabela-pulada', tabela: def.nome, parte: 'incremental' })
    }
  }
  if (lidas.length === 0 && alteradas === 0 && cx.freio.motivo === null) return 'SEM_TABELA'
  const comSessoes = lidas.filter((l) => l.def.sessoes)
  for (let i = 1; i < 3 && comSessoes.length > 0 && cx.freio.motivo === null; i += 1) {
    const s = await abrirSessao(cx, `S${i + 1}`)
    if (s === null) {
      saida({ a0d: 'sessao', numero: i + 1, resultado: 'LOGIN_RECUSADO' })
      break
    }
    abertas.push(s)
  }
  for (const lida of comSessoes) await sessoesDaTabela(cx, abertas, lida)
  return cx.freio.motivo === null && falhas === 0 ? 'MEDIDO' : 'MEDIDO_PARCIAL'
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
    e.saida({ a0d: 'recusa', motivo: 'conexao-nao-unica', candidatas: todas.length, prefixos: todas.map((c) => sha(c.id).slice(0, 12)) })
    return 3
  }
  const quieto = new Date(Date.now() - QUIETO_MIN * 60_000).toISOString()
  const antes = await movimento(e.database, alvo, quieto, null)
  e.saida({ a0d: 'antes', ...antes })
  // O Hub copiando a Metal Nobre agora (cópia aberta, posse de cópia, leitura ao vivo recente): a sonda não roda.
  if (antes.abertas > 0 || antes.leases > 0 || antes.leituras > 0) {
    e.saida({ a0d: 'recusa', motivo: 'hub-em-uso' })
    return 4
  }
  const opened = await abrir(e.database, e.keys, alvo, connector)
  const origins = new Map(e.origem === undefined ? [] : [[connector.id, e.origem] as const])
  const executor = createExecutor({ fetch, origins, log: silencioso, now: () => new Date() })
  const inicio = new Date().toISOString()
  const resposta = await cronometrar(executor, opened, e.plano ?? PLANO, e.saida)
  const depois = await movimento(e.database, alvo, inicio, new Date().toISOString())
  e.saida({ a0d: 'durante', copias: depois.copias, leituras: depois.leituras, limpo: depois.copias + depois.leituras === 0 })
  return resposta === 'MEDIDO' || resposta === 'MEDIDO_PARCIAL' ? 0 : 5
}

function erroSeguro(error: unknown): Linha {
  const name = error instanceof Error ? error.name : typeof error
  const code = Object(error).code
  return { a0d: 'erro', tipo: name, codigo: typeof code === 'string' ? codigoSeguro(code) : null }
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
    saida({ a0d: 'recusa', motivo: 'sem-arquivos' })
    return 2
  }
  const origem = process.env.A0D_ORIGEM
  if (origem !== undefined && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origem)) {
    saida({ a0d: 'recusa', motivo: 'origem-so-loopback' })
    return 2
  }
  const prefixo = process.env.A0D_CONEXAO_SHA256
  if (prefixo !== undefined && !/^[0-9a-f]{8,64}$/.test(prefixo)) {
    saida({ a0d: 'recusa', motivo: 'prefixo-invalido' })
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
