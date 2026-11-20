// A0b: leitura cronometrada de uma tabela fiscal grande no Sankhya, só leitura, e o catálogo do
// Oracle das sete tabelas da A0 (o que o próprio usuário de integração enxerga). Versão final: depois
// da leitura cronometrada, lê o dicionário do Sankhya (TDDTAB e TDDCAM, só contagens) e mede se o
// token do gateway vence aos 300 s com chamadas chegando (passos A1 a C1 da seção 2.3 do estudo de
// causa raiz). No máximo 40 minutos no total; qualquer sinal de carga para tudo.
//
// Roda dentro da imagem do Hub que está no ar, num contêiner avulso (lab/a0b-sankhya.sh), nunca no
// contêiner do Hub, como a V17. Lê dois arquivos: a URL do banco do Hub (HUB_DATABASE_URL_FILE) e as
// chaves de selo (HUB_SEAL_KEYS_FILE). Abre a credencial selada de UMA conexão Sankhya com o código do
// próprio Hub e fala com o Sankhya só pelo executor do Hub e pela leitura `consultar` do kit
// (DbExplorerSP.executeQuery, um SELECT por chamada, julgado pelo filtro de leitura do kit).
//
// Nenhuma escrita: só SELECT. Imprime só linhas JSON com passos, classes de resposta, códigos,
// contagens, tempos e nomes do dicionário padrão do Oracle e do Sankhya. Nunca imprime célula de
// dado, token, credencial, mensagem do Sankhya, nome de empresa, de conexão nem id: o log do
// workflow do laboratório é público.
import { createHash } from 'node:crypto'
import { setTimeout as esperar } from 'node:timers/promises'
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

/** As sete tabelas da A0, e a grande que a leitura cronometrada lê (a escolha da Parte 1). */
export const TABELAS_A0 = [
  'TGFEFDVMRSTDIA',
  'TGFCTE',
  'TGFLIV',
  'TCBSAL',
  'TCBINT',
  'TGFNFE',
  'TCBPLA',
] as const

/** Duas tabelas do núcleo que têm DTALTER e estão na lista do log de alterações: o controle do catálogo. */
export const TABELAS_CONTROLE = ['TGFCAB', 'TGFITE'] as const

/** O teto e o tamanho de cada fase. Tudo aqui é fixo no commit revisado, nada vem do ambiente. */
export type Plano = Readonly<{
  tabela: string
  /** A coluna de data de negócio da janela, e a data em que a janela começa (AAAA-MM-DD). */
  janela: Readonly<{ coluna: string; desde: string }>
  /** Páginas no maior tamanho aceito, no máximo. */
  paginasGrandes: number
  /** Páginas de 500 linhas, para comparar com a conta da V7. */
  paginasPequenas: number
  /** Páginas da janela, no máximo. */
  paginasJanela: number
  /** O tamanho que se pede para descobrir o teto do gateway (pede-se este, e o dobro). */
  tamanhoPedido: number
  /** O teto de tempo da sonda inteira; passado, ela para na próxima página, faz logout e sai. */
  tetoMs: number
  /** Prazo de cada chamada ao Sankhya. */
  prazoMs: number
  /** Renova o login quando faltar isto para o token vencer. */
  folgaRenovacaoMs: number
  /** Uma página mais lenta que isto para a sonda inteira: o Oracle pode estar ordenando a tabela toda por página. */
  paginaLentaMs: number
  /** false: só a chave da tabela lida, sem o catálogo das sete, sem privilégios, sem ORA_ROWSCN nem Flashback. */
  catalogoCompleto: boolean
  /** Lê o dicionário do Sankhya (TDDTAB e TDDCAM) depois da leitura cronometrada. */
  dicionario: boolean
  /** O teto de tempo do dicionário, contado do começo dele (o da leitura cronometrada já passou). */
  tetoDicionarioMs: number
  /** Mede o token do gateway em uso (A1 a C1 da seção 2.3 do estudo de causa raiz). */
  token: boolean
  /** O teto da execução inteira: o passo do token só começa se couber nele. */
  tetoTotalMs: number
  /** O que o passo do token gasta no pior caso: A até 360 s, B até 320 s, C e as chamadas. */
  tokenPiorCasoMs: number
}>

export const PLANO: Plano = {
  tabela: 'TGFEFDVMRSTDIA',
  janela: { coluna: 'DTREF', desde: diasAtras(new Date(), 90) },
  paginasGrandes: 200,
  paginasPequenas: 20,
  paginasJanela: 60,
  tamanhoPedido: 5000,
  tetoMs: 25 * 60_000,
  prazoMs: 120_000,
  folgaRenovacaoMs: 60_000,
  paginaLentaMs: 30_000,
  catalogoCompleto: process.env.A0B_SO_TEMPO !== '1',
  dicionario: process.env.A0B_SO_TEMPO !== '1',
  tetoDicionarioMs: 2 * 60_000,
  token: process.env.A0B_SO_TEMPO !== '1',
  tetoTotalMs: 38 * 60_000,
  tokenPiorCasoMs: 12 * 60_000 + 20_000,
}

/** O dia `dias` antes de `agora`, AAAA-MM-DD (UTC): a janela de 3 meses que o estudo recomenda. */
export function diasAtras(agora: Date, dias: number): string {
  return new Date(agora.getTime() - dias * 86_400_000).toISOString().slice(0, 10)
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

/** Um valor de catálogo só passa quando é um dos valores conhecidos do Oracle. */
function enumSeguro(valor: unknown, conhecidos: readonly string[]): string {
  const v = String(valor)
  return conhecidos.includes(v) ? v : 'outro'
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
  // Uma chave nula não tem ordem: a passada para antes de chegar aqui (`chave-nula`).
  if (celula === null || celula === undefined) throw new Error('chave nula')
  if (typeof celula === 'number') return String(celula)
  const texto = String(celula)
  if (tipo === 'DATE' && DATA_SANKHYA.test(texto))
    return `TO_DATE(${literalTexto(texto)}, 'DDMMYYYY HH24:MI:SS')`
  if (tipo === 'NUMBER' && /^-?\d+(\.\d+)?$/.test(texto)) return texto
  return literalTexto(texto)
}

export type Chave = readonly Readonly<{ coluna: string; tipo: string }>[]

/** Depois da última chave lida, em ordem de chave, com a primeira coluna à frente para o índice. */
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

/** A instrução de uma página por chave: só as colunas da chave e uma contagem de bytes do nosso lado. */
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

const ESQUEMA = "SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')"
const lista = (tabelas: readonly string[]) => tabelas.map(literalTexto).join(', ')

/** As leituras do catálogo do Oracle: nenhuma toca uma linha das tabelas da empresa. */
export const CATALOGO = {
  tabelas: (t: readonly string[]) =>
    `SELECT TABLE_NAME, DEPENDENCIES, NUM_ROWS FROM ALL_TABLES WHERE OWNER = ${ESQUEMA} AND TABLE_NAME IN (${lista(t)})`,
  colunas: (t: readonly string[]) =>
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, NULLABLE FROM ALL_TAB_COLUMNS WHERE OWNER = ${ESQUEMA} AND TABLE_NAME IN (${lista(t)}) ORDER BY TABLE_NAME, COLUMN_ID`,
  chaves: (t: readonly string[]) =>
    `SELECT C.TABLE_NAME, C.CONSTRAINT_TYPE, K.COLUMN_NAME, K.POSITION FROM ALL_CONSTRAINTS C JOIN ALL_CONS_COLUMNS K ON K.OWNER = C.OWNER AND K.CONSTRAINT_NAME = C.CONSTRAINT_NAME WHERE C.OWNER = ${ESQUEMA} AND C.CONSTRAINT_TYPE = 'P' AND C.TABLE_NAME IN (${lista(t)}) ORDER BY C.TABLE_NAME, K.POSITION`,
  unicos: (t: readonly string[]) =>
    `SELECT I.TABLE_NAME, I.INDEX_NAME, K.COLUMN_NAME, K.COLUMN_POSITION FROM ALL_INDEXES I JOIN ALL_IND_COLUMNS K ON K.INDEX_OWNER = I.OWNER AND K.INDEX_NAME = I.INDEX_NAME WHERE I.TABLE_OWNER = ${ESQUEMA} AND I.UNIQUENESS = 'UNIQUE' AND I.TABLE_NAME IN (${lista(t)}) ORDER BY I.TABLE_NAME, I.INDEX_NAME, K.COLUMN_POSITION`,
  gatilhos: (t: readonly string[]) =>
    `SELECT TABLE_NAME, TRIGGER_NAME, STATUS, TRIGGERING_EVENT FROM ALL_TRIGGERS WHERE TABLE_OWNER = ${ESQUEMA} AND TABLE_NAME IN (${lista(t)})`,
  privilegios:
    "SELECT PRIVILEGE FROM SESSION_PRIVS WHERE PRIVILEGE IN ('FLASHBACK ANY TABLE', 'SELECT ANY TRANSACTION', 'LOGMINING', 'SELECT ANY DICTIONARY', 'EXECUTE ANY PROCEDURE')",
  banco: 'SELECT LOG_MODE, SUPPLEMENTAL_LOG_DATA_MIN, FLASHBACK_ON FROM V$DATABASE',
  rowscn: (tabela: string) =>
    `SELECT COUNT(*) AS N FROM (SELECT ORA_ROWSCN AS S FROM ${tabela} WHERE ROWNUM <= 1)`,
  flashback: (tabela: string) =>
    `SELECT COUNT(*) AS N FROM (SELECT 1 AS S FROM ${tabela} AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' MINUTE) WHERE ROWNUM <= 1)`,
} as const

const COLUNA_DE_ALTERACAO = /^(AD_)?D[HT]ALTER$|^DTALTPREV$|^DHALTREG$/

/** Lê o catálogo e devolve só o que é do dicionário padrão: classes, contagens e nomes padrão. */
async function catalogo(c: Conversa, plano: Plano, saida: Saida) {
  const todas = plano.catalogoCompleto ? [...TABELAS_A0, ...TABELAS_CONTROLE] : [plano.tabela]
  const tabelas = await c.consultar('catalogo tabelas', CATALOGO.tabelas(todas))
  // Uma tabela por chamada: a TGFCAB tem uns 450 campos, e o teto de linhas por resposta não é sabido.
  const porTabela: Record<string, unknown>[] = []
  let colunasOk = true
  for (const t of todas) {
    const lido = await c.consultar(`catalogo colunas ${t}`, CATALOGO.colunas([t]))
    colunasOk &&= lido.classe.resultado === 'OK' && lido.consulta?.completo !== false
    porTabela.push(...(lido.consulta?.linhas ?? []))
  }
  const colunas: Lido = { classe: { resultado: colunasOk ? 'OK' : 'INCOMPLETO', status: null, codigo: null }, consulta: { linhas: porTabela, completo: colunasOk }, ms: 0 }
  saida({ a0b: 'catalogo', parte: 'colunas', resultado: colunas.classe.resultado })
  for (const [parte, lido] of [['tabelas', tabelas]] as const)
    saida({ a0b: 'catalogo', parte, resultado: lido.classe.resultado, codigo: lido.classe.codigo })
  const chaves = await c.consultar('catalogo chaves', CATALOGO.chaves(todas))
  const unicos = await c.consultar('catalogo unicos', CATALOGO.unicos(todas))
  const gatilhos = await c.consultar('catalogo gatilhos', CATALOGO.gatilhos(todas))
  for (const [parte, lido] of [['chaves', chaves], ['unicos', unicos], ['gatilhos', gatilhos]] as const)
    saida({ a0b: 'catalogo', parte, resultado: lido.classe.resultado, codigo: lido.classe.codigo })
  const por = (lido: Lido, t: string) =>
    (lido.consulta?.linhas ?? []).filter((l) => String(l.TABLE_NAME) === t)
  const resumo: Record<string, Chave> = {}
  for (const t of todas) {
    const tab = por(tabelas, t)[0]
    const cols = por(colunas, t)
    const pk = por(chaves, t).map((l) => String(l.COLUMN_NAME))
    const tipoDe = new Map(cols.map((l) => [String(l.COLUMN_NAME), String(l.DATA_TYPE)]))
    const unico = por(unicos, t)
    // Um índice único só serve de chave se nenhuma coluna dele aceita NULL: NULL não se compara com > nem =.
    const naoNulas = new Set(cols.filter((l) => l.NULLABLE === 'N').map((l) => String(l.COLUMN_NAME)))
    const indices = [...new Set(unico.map((l) => String(l.INDEX_NAME)))]
    const semNulo = indices.find((nome) =>
      unico.filter((l) => String(l.INDEX_NAME) === nome).every((l) => naoNulas.has(String(l.COLUMN_NAME))),
    )
    const primeiroUnico = semNulo === undefined ? [] : unico.filter((l) => String(l.INDEX_NAME) === semNulo)
    const chaveUsada = pk.length > 0 ? pk : primeiroUnico.map((l) => String(l.COLUMN_NAME))
    resumo[t] = chaveUsada.map((coluna) => ({ coluna, tipo: tipoDe.get(coluna) ?? 'outro' }))
    const gat = por(gatilhos, t)
    saida({
      a0b: 'tabela',
      tabela: t,
      visivel: tab !== undefined,
      rowdependencies: tab === undefined ? null : enumSeguro(tab.DEPENDENCIES, ['ENABLED', 'DISABLED']),
      linhasEstatistica: tab === undefined || tab.NUM_ROWS === null ? null : Number(tab.NUM_ROWS),
      colunas: cols.length,
      colunasAD: cols.filter((l) => String(l.COLUMN_NAME).startsWith('AD_')).length,
      colunasDeAlteracao: cols.map((l) => String(l.COLUMN_NAME)).filter((n) => COLUNA_DE_ALTERACAO.test(n)).map(nomeSeguro),
      datas: cols
        .filter((l) => ['DATE', 'TIMESTAMP(6)'].includes(String(l.DATA_TYPE)))
        .map((l) => `${nomeSeguro(l.COLUMN_NAME)}${l.NULLABLE === 'N' ? ' NOT NULL' : ''}`),
      chavePrimaria: pk.map(nomeSeguro),
      chaveUnicaSemPk: pk.length === 0 ? primeiroUnico.map((l) => nomeSeguro(l.COLUMN_NAME)) : [],
      gatilhos: gat.length,
      gatilhosAtivos: gat.filter((l) => l.STATUS === 'ENABLED').length,
      gatilhosDeUpdate: gat.filter((l) => String(l.TRIGGERING_EVENT).includes('UPDATE')).length,
      // O log de alterações da API cria um gatilho TRG_<TABELA>_LOGTABOPER (resumo do buscador da Central de Ajuda).
      gatilhoLogtaboper: gat.some((l) => String(l.TRIGGER_NAME).includes('LOGTABOPER')),
    })
  }
  if (!plano.catalogoCompleto) return resumo
  const priv = await c.consultar('catalogo privilegios', CATALOGO.privilegios)
  saida({
    a0b: 'privilegios',
    resultado: priv.classe.resultado,
    tem: (priv.consulta?.linhas ?? []).map((l) => enumSeguro(l.PRIVILEGE, [
      'FLASHBACK ANY TABLE', 'SELECT ANY TRANSACTION', 'LOGMINING', 'SELECT ANY DICTIONARY', 'EXECUTE ANY PROCEDURE',
    ])),
  })
  const banco = await c.consultar('catalogo banco', CATALOGO.banco)
  const b = banco.consulta?.linhas[0]
  saida({
    a0b: 'banco',
    resultado: banco.classe.resultado,
    codigo: banco.classe.codigo,
    logMode: b === undefined ? null : enumSeguro(b.LOG_MODE, ['ARCHIVELOG', 'NOARCHIVELOG', 'MANUAL']),
    supplementalMin: b === undefined ? null : enumSeguro(b.SUPPLEMENTAL_LOG_DATA_MIN, ['YES', 'NO', 'IMPLICIT']),
    flashbackOn: b === undefined ? null : enumSeguro(b.FLASHBACK_ON, ['YES', 'NO', 'RESTORE POINT ONLY']),
  })
  for (const [passo, texto] of [
    ['ora_rowscn', CATALOGO.rowscn],
    ['flashback query', CATALOGO.flashback],
  ] as const) {
    const lido = await c.consultar(`${passo} ${PLANO_TABELA_PROVA}`, texto(PLANO_TABELA_PROVA))
    saida({ a0b: 'recurso', recurso: passo, tabela: PLANO_TABELA_PROVA, resultado: lido.classe.resultado, codigo: lido.classe.codigo })
  }
  return resumo
}

/** O ORA_ROWSCN e o Flashback são provados na tabela menor da A0, para não varrer uma grande. */
const PLANO_TABELA_PROVA = 'TCBPLA'

/** Um SIGTERM ou SIGINT (o `timeout` do `.sh`, ou o cancelamento do workflow) pede parada: nenhuma leitura nova, só os logouts. */
export const pedidoDeParada: { motivo: string | null } = { motivo: null }

/** O login, a renovação antes do vencimento, a parada, e o logout de todo token emitido. */
type Conversa = {
  consultar(passo: string, texto: string): Promise<Lido>
  /** Por que a sonda parou de ler (teto de tempo, 429, 504, sinal), ou null. */
  parada(): string | null
  /** Dá um teto novo de `ms` a partir de agora, depois de um teto de tempo; outra parada (carga, sinal) não se desfaz. */
  prorrogar(ms: number): void
  logins(): number
  fechar(): Promise<void>
}

const PARADA: Classe = { resultado: 'PARADA', status: null, codigo: null }

async function conversa(
  executor: Executor,
  opened: OpenedConnection,
  plano: Plano,
  saida: Saida,
  relogio: () => number,
): Promise<Conversa | null> {
  const consultar = opened.connector.readDoor?.consultar
  if (consultar === undefined) throw new Error('kit sem a leitura consultar')
  let token: BearerToken | null = null
  let venceEm = 0
  let logins = 0
  const emitidos: BearerToken[] = []
  let fimMs = relogio() + plano.tetoMs
  let parada: string | null = null

  async function entrar(): Promise<boolean> {
    const inicio = relogio()
    const answered = await executor.login(opened, plano.prazoMs)
    logins += 1
    if (answered.kind !== 'TOKEN') {
      saida({ a0b: 'login', resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : answered.kind, ms: Math.round(relogio() - inicio) })
      return false
    }
    const anterior = token
    token = answered.token
    emitidos.push(answered.token)
    venceEm = relogio() + answered.expiresInSeconds * 1000
    saida({ a0b: 'login', resultado: 'OK', validadeS: answered.expiresInSeconds, ms: Math.round(relogio() - inicio), numero: logins })
    // O token trocado termina já: uma sessão que expira sem logout fica pendurada no Sankhya.
    if (anterior !== null) await sair(anterior)
    return true
  }

  async function sair(t: BearerToken) {
    const i = emitidos.indexOf(t)
    if (i !== -1) emitidos.splice(i, 1)
    const r = (await executor.logout(opened, t, PRAZO_LOGOUT_MS)) ?? 'SEM_LOGOUT'
    saida({ a0b: 'logout', resultado: r })
  }

  if (!(await entrar())) return null

  async function chamar(texto: string): Promise<Answered<Consulta> | Readonly<{ kind: 'UNREACHABLE' }>> {
    if (token === null) return { kind: 'UNREACHABLE' }
    const op = consultar as Operation<{ sql: string }, Consulta>
    return executor.call(opened, token, op, { sql: texto } as never, plano.prazoMs) as never
  }

  return {
    async consultar(_passo, texto) {
      // O teto de tempo vale para toda leitura, não só para as páginas: catálogo e contagens também.
      if (parada === null && relogio() > fimMs) parada = 'teto-de-tempo'
      if (parada === null && pedidoDeParada.motivo !== null) parada = pedidoDeParada.motivo
      if (parada !== null) return { classe: PARADA, consulta: null, ms: 0 }
      if (relogio() > venceEm - plano.folgaRenovacaoMs) await entrar()
      const inicio = relogio()
      let answered = await chamar(texto)
      if (answered.kind === 'TOKEN_EXPIRED' && (await entrar())) answered = await chamar(texto)
      const ms = Math.round(relogio() - inicio)
      const c = classe(answered)
      // Um 429 ou um 504 (prazo de 2 minutos do gateway) encerra a sonda: não se insiste num ERP sob carga.
      if (c.resultado === 'OCUPADO' || c.resultado === 'INALCANCAVEL') parada = `falha-${c.resultado}`
      return { classe: c, consulta: answered.kind === 'OK' ? answered.value : null, ms }
    },
    parada: () => parada,
    prorrogar(ms) {
      if (parada === 'teto-de-tempo') parada = null
      fimMs = relogio() + ms
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

type Fase = Readonly<{ nome: string; linhasPorPagina: number; paginas: number; filtro: string | null }>

/** Lê páginas por chave até o fim, o teto de páginas ou o teto de tempo. Só conta e cronometra. */
async function passada(c: Conversa, plano: Plano, chave: Chave, fase: Fase, saida: Saida, relogio: () => number, inicio: number) {
  let ultima: Record<string, unknown> | null = null
  const tempos: number[] = []
  let linhas = 0
  let bytes = 0
  let motivo = 'teto-de-paginas'
  for (let pagina = 1; pagina <= fase.paginas; pagina += 1) {
    if (relogio() - inicio > plano.tetoMs) {
      motivo = 'teto-de-tempo'
      break
    }
    const lido = await c.consultar(`${fase.nome} ${pagina}`, paginaSql(plano.tabela, chave, ultima, fase.linhasPorPagina, fase.filtro))
    const recebidas = lido.consulta?.linhas ?? []
    const tamanho = lido.consulta === null ? 0 : Buffer.byteLength(JSON.stringify(recebidas))
    saida({ a0b: 'pagina', fase: fase.nome, pagina, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: recebidas.length, completo: lido.consulta?.completo ?? null, bytesAprox: tamanho, ms: lido.ms })
    if (lido.classe.resultado !== 'OK') {
      motivo = `falha-${lido.classe.resultado}`
      break
    }
    tempos.push(lido.ms)
    linhas += recebidas.length
    bytes += tamanho
    if (lido.ms > plano.paginaLentaMs) {
      motivo = 'pagina-lenta'
      break
    }
    if (recebidas.length < fase.linhasPorPagina && lido.consulta?.completo !== false) {
      motivo = 'fim-da-tabela'
      break
    }
    ultima = recebidas.at(-1) ?? null
    if (ultima !== null && chave.some(({ coluna }) => ultima?.[coluna] === null || ultima?.[coluna] === undefined)) {
      motivo = 'chave-nula'
      break
    }
  }
  const e = estatistica(tempos)
  saida({ a0b: 'fase', fase: fase.nome, motivo, linhasPorPagina: fase.linhasPorPagina, paginas: e.n, linhas, bytesAprox: bytes, p50Ms: e.p50, p90Ms: e.p90, maxMs: e.max, linhasPorSegundo: e.soma === 0 ? null : Math.round((linhas * 1000) / e.soma) })
  return { ...e, linhas, motivo }
}

// ---------------------------------------------------------------- o dicionário do Sankhya

const TDDTAB = 'TDDTAB'
const TDDCAM = 'TDDCAM'

/** As contagens do dicionário: nenhuma devolve nome nem valor de linha. `AD_` é o prefixo da empresa; ADICIONAL = 'S' o marca. */
export const DICIONARIO = [
  ['tabelas', TDDTAB, 'SELECT COUNT(*) AS N FROM TDDTAB'],
  ['tabelasAdicionais', TDDTAB, "SELECT COUNT(*) AS N FROM TDDTAB WHERE ADICIONAL = 'S'"],
  ['tabelasPrefixoAD', TDDTAB, "SELECT COUNT(*) AS N FROM TDDTAB WHERE SUBSTR(NOMETAB, 1, 3) = 'AD_'"],
  ['campos', TDDCAM, 'SELECT COUNT(*) AS N FROM TDDCAM'],
  ['camposTabelasDistintas', TDDCAM, 'SELECT COUNT(DISTINCT NOMETAB) AS N FROM TDDCAM'],
  ['camposAdicionais', TDDCAM, "SELECT COUNT(*) AS N FROM TDDCAM WHERE ADICIONAL = 'S'"],
  ['camposAdicionaisTabelasDistintas', TDDCAM, "SELECT COUNT(DISTINCT NOMETAB) AS N FROM TDDCAM WHERE ADICIONAL = 'S'"],
  ['camposPrefixoAD', TDDCAM, "SELECT COUNT(*) AS N FROM TDDCAM WHERE SUBSTR(NOMECAMPO, 1, 3) = 'AD_'"],
] as const

/** Uma página de cada tabela, só para saber quanto custa listar: conta linhas e bytes, não guarda nem imprime nenhuma. */
export const DICIONARIO_PAGINAS = [
  ['paginaTabelas', TDDTAB, 'SELECT NOMETAB, DESCRTAB, ADICIONAL FROM TDDTAB ORDER BY NOMETAB OFFSET 0 ROWS FETCH NEXT 500 ROWS ONLY'],
  ['paginaCampos', TDDCAM, 'SELECT NOMETAB, NOMECAMPO, DESCRCAMPO, TIPCAMPO, ADICIONAL FROM TDDCAM ORDER BY NOMETAB, NOMECAMPO OFFSET 0 ROWS FETCH NEXT 500 ROWS ONLY'],
] as const

/** Lê o dicionário pela mesma porta (`consultar`) que a descoberta usa. Grava só contagens, tempos e códigos. */
async function dicionario(c: Conversa, saida: Saida) {
  const legivel: Record<string, boolean> = { [TDDTAB]: false, [TDDCAM]: false }
  for (const [medida, tabela, texto] of DICIONARIO) {
    const lido = await c.consultar(`dicionario ${medida}`, texto)
    const n = Number(lido.consulta?.linhas[0]?.N ?? Number.NaN)
    if (lido.classe.resultado === 'OK' && Number.isFinite(n)) legivel[tabela] = true
    saida({ a0b: 'dicionario', medida, tabela, resultado: lido.classe.resultado, status: lido.classe.status, codigo: lido.classe.codigo, n: Number.isFinite(n) ? n : null, ms: lido.ms })
  }
  for (const [medida, tabela, texto] of DICIONARIO_PAGINAS) {
    const lido = await c.consultar(`dicionario ${medida}`, texto)
    const linhas = lido.consulta?.linhas ?? []
    saida({ a0b: 'dicionario', medida, tabela, resultado: lido.classe.resultado, status: lido.classe.status, codigo: lido.classe.codigo, linhas: linhas.length, completo: lido.consulta?.completo ?? null, bytesAprox: lido.consulta === null ? 0 : Buffer.byteLength(JSON.stringify(linhas)), ms: lido.ms })
  }
  saida({ a0b: 'dicionario', resultado: 'FIM', legivelTDDTAB: legivel[TDDTAB] ?? false, legivelTDDCAM: legivel[TDDCAM] ?? false, parada: c.parada() })
}

// ---------------------------------------------------------------- o token do gateway em uso

/** Espera `ms`, em fatias curtas, e para antes se pedirem a parada (SIGTERM do `timeout`). */
export type Dormir = (ms: number) => Promise<void>

export const dormirAteOSinal: Dormir = async (ms) => {
  const fim = Date.now() + ms
  while (pedidoDeParada.motivo === null && Date.now() < fim) await esperar(Math.min(500, fim - Date.now()))
}

/** Só os números `exp - iat` de um JWT; qualquer outra coisa, ou um token que não é JWT, dá null. Nada mais sai do token. */
export function validadeDoJwt(token: string): number | null {
  try {
    const miolo = token.split('.')[1]
    if (miolo === undefined) return null
    const { iat, exp } = JSON.parse(Buffer.from(miolo, 'base64url').toString('utf8')) as Record<string, unknown>
    return typeof iat === 'number' && typeof exp === 'number' ? exp - iat : null
  } catch {
    return null
  }
}

/**
 * O código de um erro do gateway, de onde o corpo o guarda. O gateway real põe o código em
 * `error.codigo` (o campo que a sonda de 2026-10-30 não leu) e o kit só lê `error.code`, `code` e
 * `mensagem.codigo`: aqui se leem todos. Só passa o que parece um código; a mensagem nunca sai.
 */
export function codigoDoCorpo(answered: unknown): string | null {
  const corpo = Object(Object(Object(answered).native).body)
  const candidatos = [Object(corpo.error).codigo, Object(corpo.error).code, Object(corpo.mensagem).codigo, Object(corpo.mensagem).code, corpo.code, corpo.codigo]
  const achado = candidatos.find((c): c is string => typeof c === 'string')
  return achado === undefined ? null : codigoSeguro(achado)
}

const A2_PASSO_S = 20
const A2_FIM_S = 360
const B_PARADO_S = 240
const B_FIM_S = 320

/**
 * Os passos A1 a C1 da seção 2.3 do estudo de causa raiz, só leituras (`GET /v1/empresas`, a
 * verificação do kit): A, um token com uma chamada a cada 20 s até o primeiro não-200 (ou 360 s); B,
 * um token parado, com leituras em 0, 240 e 320 s; C, o controle (leitura, logout, leitura). Grava só
 * segundos, status e códigos. Todo token emitido leva logout no fim, também ao parar por erro ou sinal.
 */
export async function tokenEmUso(executor: Executor, opened: OpenedConnection, plano: Plano, saida: Saida, relogio: () => number, dormir: Dormir) {
  const leitura = opened.connector.check as Operation<{ page: number }, unknown>
  const abertos = new Map<BearerToken, string>()
  let parou: string | null = null
  const segundos = (desde: number) => Math.round(((relogio() - desde) / 1000) * 10) / 10

  async function entrar(sessao: string): Promise<{ token: BearerToken; desde: number } | null> {
    const inicio = relogio()
    const answered = await executor.login(opened, plano.prazoMs)
    if (answered.kind !== 'TOKEN') {
      saida({ a0b: 'token', passo: `${sessao}1`, resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : answered.kind })
      parou = `login-${sessao}`
      return null
    }
    abertos.set(answered.token, sessao)
    saida({ a0b: 'token', passo: `${sessao}1`, resultado: 'OK', expiresIn: answered.expiresInSeconds, expMenosIat: validadeDoJwt(answered.token.reveal()), ms: Math.round(relogio() - inicio) })
    return { token: answered.token, desde: inicio }
  }

  async function ler(passo: string, token: BearerToken, desde: number): Promise<Classe> {
    const inicio = relogio()
    const answered = (await executor.call(opened, token, leitura, { page: 0 }, plano.prazoMs)) as Answered<unknown> | Readonly<{ kind: 'UNREACHABLE' }>
    const c = classe(answered)
    const codigo = answered.kind === 'OK' ? null : (c.codigo ?? codigoDoCorpo(answered))
    saida({ a0b: 'token', passo, segundos: segundos(desde), resultado: c.resultado, status: answered.kind === 'OK' ? 200 : c.status, codigo, ms: Math.round(relogio() - inicio) })
    if (c.resultado === 'OCUPADO' || c.resultado === 'INALCANCAVEL') parou = `falha-${c.resultado}`
    if (pedidoDeParada.motivo !== null) parou = pedidoDeParada.motivo
    return { ...c, codigo }
  }

  async function sair(passo: string, token: BearerToken, desde: number) {
    abertos.delete(token)
    const r = (await executor.logout(opened, token, PRAZO_LOGOUT_MS)) ?? 'SEM_LOGOUT'
    saida({ a0b: 'token', passo, segundos: segundos(desde), logout: r })
    return r
  }

  /** Espera até `alvoS` segundos do login; false se pediram a parada ou algo parou a medida. */
  async function ate(desde: number, alvoS: number) {
    const falta = alvoS * 1000 - (relogio() - desde)
    if (falta > 0) await dormir(falta)
    if (pedidoDeParada.motivo !== null) parou = pedidoDeParada.motivo
    return parou === null
  }

  try {
    // A: um token com chamadas chegando.
    const a = await entrar('A')
    if (a !== null) {
      let primeiro: Classe | null = null
      let primeiroS: number | null = null
      for (let t = 0; t <= A2_FIM_S && parou === null; t += A2_PASSO_S) {
        if (!(await ate(a.desde, t))) break
        const c = await ler(`A2-${t}`, a.token, a.desde)
        if (c.resultado !== 'OK') {
          primeiro = c
          primeiroS = segundos(a.desde)
          break
        }
      }
      if (parou === null || primeiro !== null) {
        // A3: assim que A2 deu o primeiro não-200, um logout com A (recusado se o token já venceu).
        await sair('A3', a.token, a.desde)
        const vence = primeiro !== null && primeiroS !== null && primeiroS >= 300 && primeiroS <= 320 && primeiro.status === 403
        saida({ a0b: 'token', passo: 'A', veredito: primeiro === null ? 'NAO_VENCEU_ATE_360' : vence ? 'VENCE_AOS_300_COM_USO' : 'OUTRO', primeiroNao200S: primeiroS, status: primeiro?.status ?? null, codigo: primeiro?.codigo ?? null })
      }
    }
    // B: um token parado.
    const b = parou === null ? await entrar('B') : null
    if (b !== null) {
      let ultima: Classe | null = null
      for (const [rotulo, alvoS] of [['B-0', 0], [`B-${B_PARADO_S}`, B_PARADO_S], [`B-${B_FIM_S}`, B_FIM_S]] as const) {
        if (!(await ate(b.desde, alvoS))) break
        ultima = await ler(rotulo, b.token, b.desde)
        if (parou !== null) break
      }
      // B faz logout se o último status for 200; com o token vencido, ele é recusado e não vale a chamada.
      if (ultima?.resultado === 'OK') await sair('B3', b.token, b.desde)
    }
    // C: o controle, já medido (200, logout, 401).
    const c = parou === null ? await entrar('C') : null
    if (c !== null) {
      await ler('C-antes', c.token, c.desde)
      if (parou === null) {
        await sair('C-logout', c.token, c.desde)
        await ler('C-depois', c.token, c.desde)
      }
    }
    if (parou !== null) saida({ a0b: 'token', passo: 'PARADO', motivo: parou })
  } finally {
    // Todo token que ficou aberto (erro, sinal, parada) leva logout.
    for (const [token, sessao] of [...abertos]) await sair(`${sessao}-fim`, token, relogio())
  }
}

/** Por que a leitura cronometrada parou, quando foi por sinal de carga: página lenta, 429, 504 ou pedido de parada. */
export const SINAIS_DE_CARGA = ['pagina-lenta', 'falha-OCUPADO', 'falha-INALCANCAVEL', 'sinal'] as const
export const cargaDe = (motivo: string | null): boolean => motivo !== null && (SINAIS_DE_CARGA as readonly string[]).includes(motivo)

type Medida = Readonly<{ resposta: string; motivo: string | null }>

/** A leitura cronometrada: o catálogo, o teto de linhas, a contagem, as páginas grandes e pequenas e a janela. */
async function medida(c: Conversa, plano: Plano, saida: Saida, relogio: () => number, inicio: number): Promise<Medida> {
  const chaves = await catalogo(c, plano, saida)
  const chave = chaves[plano.tabela] ?? []
  if (chave.length === 0) {
    saida({ a0b: 'veredito', resposta: 'SEM_CHAVE', motivo: c.parada(), tabela: plano.tabela })
    return { resposta: 'SEM_CHAVE', motivo: c.parada() }
  }
  // O teto do gateway: pede-se `tamanhoPedido` + 1 e o dobro, e conta-se o que voltou.
  // O teto é o maior número de linhas que uma resposta trouxe; nunca acima do dobro pedido.
  const recebidos: number[] = []
  for (const pedido of [plano.tamanhoPedido + 1, plano.tamanhoPedido * 2]) {
    const lido = await c.consultar(`teto ${pedido}`, paginaSql(plano.tabela, chave, null, pedido, null))
    const n = lido.consulta?.linhas.length ?? 0
    saida({ a0b: 'teto', pedido, resultado: lido.classe.resultado, codigo: lido.classe.codigo, linhas: n, completo: lido.consulta?.completo ?? null, ms: lido.ms })
    if (lido.classe.resultado === 'OK' && n > 0) recebidos.push(n)
  }
  const teto = recebidos.length === 0 ? plano.tamanhoPedido : Math.max(...recebidos)
  const contagem = await c.consultar('contagem', `SELECT COUNT(*) AS N FROM ${plano.tabela}`)
  const total = Number(contagem.consulta?.linhas[0]?.N ?? Number.NaN)
  saida({ a0b: 'contagem', tabela: plano.tabela, resultado: contagem.classe.resultado, linhas: Number.isFinite(total) ? total : null, ms: contagem.ms })
  const grandes = await passada(c, plano, chave, { nome: 'grandes', linhasPorPagina: teto, paginas: plano.paginasGrandes, filtro: null }, saida, relogio, inicio)
  // Toda parada que não seja o fim da tabela ou o teto de páginas faz o resultado parcial, e nada mais roda.
  const lenta = (f: { motivo: string }) =>
    c.parada() !== null || !['fim-da-tabela', 'teto-de-paginas'].includes(f.motivo)
  const pular = { n: 0, p50: null, p90: null, max: null, soma: 0, linhas: 0, motivo: 'pulada' }
  const pequenas = lenta(grandes) ? pular : await passada(c, plano, chave, { nome: 'pequenas', linhasPorPagina: 500, paginas: plano.paginasPequenas, filtro: null }, saida, relogio, inicio)
  const filtro = `${plano.janela.coluna} >= TO_DATE('${plano.janela.desde}', 'YYYY-MM-DD')`
  if (lenta(grandes) || lenta(pequenas)) {
    saida({ a0b: 'veredito', resposta: grandes.n > 0 ? 'MEDIDO_PARCIAL' : 'INCONCLUSIVO', motivo: c.parada() ?? (lenta(grandes) ? grandes.motivo : pequenas.motivo), tabela: plano.tabela, tetoLinhas: teto, linhasTabela: Number.isFinite(total) ? total : null, logins: c.logins(), duracaoMs: Math.round(relogio() - inicio) })
    return { resposta: grandes.n > 0 ? 'MEDIDO_PARCIAL' : 'INCONCLUSIVO', motivo: c.parada() ?? (lenta(grandes) ? grandes.motivo : pequenas.motivo) }
  }
  const naJanela = await c.consultar('contagem janela', `SELECT COUNT(*) AS N FROM ${plano.tabela} WHERE ${filtro}`)
  const totalJanela = Number(naJanela.consulta?.linhas[0]?.N ?? Number.NaN)
  saida({ a0b: 'contagem', tabela: plano.tabela, janelaDesde: plano.janela.desde, coluna: plano.janela.coluna, resultado: naJanela.classe.resultado, linhas: Number.isFinite(totalJanela) ? totalJanela : null, ms: naJanela.ms })
  const janela = await passada(c, plano, chave, { nome: 'janela', linhasPorPagina: teto, paginas: plano.paginasJanela, filtro }, saida, relogio, inicio)
  const parcial = c.parada() ?? (lenta(janela) ? janela.motivo : null)
  const projecao = (p50: number | null, porPagina: number, n: number) =>
    p50 === null || !Number.isFinite(n) ? null : Math.round((Math.ceil(n / porPagina) * p50) / 6_000) / 10
  saida({
    a0b: 'veredito',
    resposta: grandes.n === 0 ? 'INCONCLUSIVO' : parcial === null ? 'MEDIDO' : 'MEDIDO_PARCIAL',
    motivo: parcial,
    tabela: plano.tabela,
    tetoLinhas: teto,
    linhasTabela: Number.isFinite(total) ? total : null,
    minutosTabelaInteiraTeto: projecao(grandes.p50, teto, total),
    minutosTabelaInteira500: projecao(pequenas.p50, 500, total),
    minutosJanela: projecao(janela.p50, teto, totalJanela),
    logins: c.logins(),
    duracaoMs: Math.round(relogio() - inicio),
  })
  return { resposta: grandes.n === 0 ? 'INCONCLUSIVO' : parcial === null ? 'MEDIDO' : 'MEDIDO_PARCIAL', motivo: parcial }
}

/**
 * O protocolo, contra qualquer Sankhya (o real ou o falso), nesta ordem: (1) login; o catálogo das
 * sete tabelas; o teto de linhas por resposta; a contagem e as páginas grandes por chave; páginas de
 * 500; a janela por data de negócio; (2) o dicionário do Sankhya, só contagens; logout; (3) o token
 * do gateway em uso, com os logins e logouts próprios. Qualquer sinal de carga na primeira parte
 * (página acima de `paginaLentaMs`, 429, 504, pedido de parada) pula as duas seguintes. Nunca devolve
 * nem imprime célula, token ou mensagem.
 */
export async function cronometrar(
  executor: Executor,
  opened: OpenedConnection,
  plano: Plano,
  saida: Saida,
  relogio: () => number = () => performance.now(),
  dormir: Dormir = dormirAteOSinal,
) {
  const inicio = relogio()
  const c = await conversa(executor, opened, plano, saida, relogio)
  if (c === null) {
    saida({ a0b: 'veredito', resposta: 'LOGIN_FALHOU' })
    return 'LOGIN_FALHOU'
  }
  let feita: Medida
  try {
    feita = await medida(c, plano, saida, relogio, inicio)
    // Só o teto de tempo se desfaz para o dicionário; um sinal de carga encerra tudo.
    const carga = cargaDe(feita.motivo) || cargaDe(c.parada())
    if (plano.dicionario && !carga) {
      c.prorrogar(plano.tetoDicionarioMs)
      await dicionario(c, saida)
    } else if (plano.dicionario) saida({ a0b: 'dicionario', resultado: 'PULADO', motivo: c.parada() ?? feita.motivo })
  } finally {
    await c.fechar()
  }
  const carga = cargaDe(feita.motivo) || cargaDe(c.parada())
  if (plano.token) {
    const falta = plano.tetoTotalMs - (relogio() - inicio)
    if (carga || pedidoDeParada.motivo !== null) saida({ a0b: 'token', passo: 'PULADO', motivo: carga ? 'sinal-de-carga' : 'sinal' })
    else if (falta < plano.tokenPiorCasoMs) saida({ a0b: 'token', passo: 'PULADO', motivo: 'sem-tempo', faltamS: Math.round(falta / 1000), precisaS: Math.round(plano.tokenPiorCasoMs / 1000) })
    else await tokenEmUso(executor, opened, plano, saida, relogio, dormir)
  }
  return feita.resposta
}

// ---------------------------------------------------------------- a escolha da conexão (como a V17)

type Candidata = Readonly<{ companyId: CompanyId; id: ConnectionId; linkedAt: string; revision: number }>

const sha = (text: string) => createHash('sha256').update(text).digest('hex')

async function candidatas(database: Database): Promise<Candidata[]> {
  const found = await database.installationRead((tx) =>
    tx.execute(sql`select company_id from connectors.companies_with_seals()`),
  )
  const todas: Candidata[] = []
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

async function movimento(database: Database, alvo: Candidata, desde: string, ate: string | null) {
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

async function abrir(database: Database, keys: SealKeys, alvo: Candidata, connector: Connector) {
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
  const todas = await candidatas(e.database)
  const escolhidas = e.prefixo === undefined ? todas : todas.filter((c) => sha(c.id).startsWith(e.prefixo ?? ''))
  const alvo = escolhidas[0]
  if (escolhidas.length !== 1 || alvo === undefined) {
    e.saida({ a0b: 'recusa', motivo: 'conexao-nao-unica', candidatas: todas.length, prefixos: todas.map((c) => sha(c.id).slice(0, 12)) })
    return 3
  }
  const quieto = new Date(Date.now() - QUIETO_MIN * 60_000).toISOString()
  const antes = await movimento(e.database, alvo, quieto, null)
  e.saida({ a0b: 'antes', ...antes })
  if (antes.abertas > 0 || antes.leases > 0 || antes.leituras > 0) {
    e.saida({ a0b: 'recusa', motivo: 'hub-em-uso' })
    return 4
  }
  const opened = await abrir(e.database, e.keys, alvo, connector)
  const origins = new Map(e.origem === undefined ? [] : [[connector.id, e.origem] as const])
  const executor = createExecutor({ fetch, origins, log: silencioso, now: () => new Date() })
  const inicio = new Date().toISOString()
  const resposta = await cronometrar(executor, opened, e.plano ?? PLANO, e.saida)
  const depois = await movimento(e.database, alvo, inicio, new Date().toISOString())
  e.saida({ a0b: 'durante', copias: depois.copias, leituras: depois.leituras, limpo: depois.copias + depois.leituras === 0 })
  return resposta === 'MEDIDO' || resposta === 'MEDIDO_PARCIAL' ? 0 : 5
}

function erroSeguro(error: unknown): Linha {
  const name = error instanceof Error ? error.name : typeof error
  const code = Object(error).code
  return { a0b: 'erro', tipo: name, codigo: typeof code === 'string' ? codigoSeguro(code) : null }
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
    saida({ a0b: 'recusa', motivo: 'sem-arquivos' })
    return 2
  }
  const origem = process.env.A0B_ORIGEM
  if (origem !== undefined && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origem)) {
    saida({ a0b: 'recusa', motivo: 'origem-so-loopback' })
    return 2
  }
  const prefixo = process.env.A0B_CONEXAO_SHA256
  if (prefixo !== undefined && !/^[0-9a-f]{8,64}$/.test(prefixo)) {
    saida({ a0b: 'recusa', motivo: 'prefixo-invalido' })
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
