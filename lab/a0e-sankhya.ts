// A0e: o gateway do Sankhya (DbExplorerSP.executeQuery) devolve coluna NUMBER(p,s) exata ou perde dígitos? Só leitura.
// O estudo do dinheiro exato (seção 5) deixou a pergunta: o gateway escreve o NUMBER como número do JSON (que o
// JSON.parse lê como double e perde dígitos acima de ~15) ou como texto exato? Se perde, a consulta da cópia precisa
// pedir o número como texto (`TO_CHAR` com a máscara da escala) e o kit muda a forma de ler.
//   1. as sondas de DUAL: onze literais inventados (de 1 a 31 dígitos), cada um como `CAST(lit AS NUMBER(p,s))`, lidos
//      na forma padrão (V) e como texto do Oracle (T) na MESMA linha; mostram como o gateway escreve o número no JSON
//      bruto (com aspas ou sem) e em que dígito o valor lido pelo kit deixa de ser o do Oracle. Não leem tabela nenhuma;
//   2. o catálogo (ALL_TAB_COLUMNS) escolhe, em TGFFIN, TGFCAB, TGFITE e TCBSAL, as colunas NUMBER com escala de maior
//      precisão (nomes padrão do dicionário; AD_ fora); para cada uma, as 30 primeiras linhas não nulas e não zero
//      (`FETCH FIRST`, sem ordem: nenhuma varredura inteira) pedidas nas duas formas na mesma linha, comparadas aqui;
//   3. a soma de uma coluna VLR de um mês completo (ou dos primeiros dias dele, se o mês passar de uma página): a soma
//      do Oracle em texto contra a soma, no processo, das linhas lidas (em texto exato, como o kit as lê, e em double).
//
// O corpo bruto da resposta é lido por um fetch que o embrulha (`comCaptura`) e nunca é impresso. O log do workflow é
// público: só contagens, códigos, tipos de coluna, p e s, formas (aspas ou sem), dígitos, e diferenças em unidades da
// última casa. Nenhum valor de linha, nenhuma soma em reais, nenhum código de empresa. As únicas células impressas são
// as das onze sondas de DUAL, que são constantes escritas neste arquivo.
//
// Nenhuma escrita: só SELECT, uma instrução por chamada, julgada pelo filtro de leitura do kit. Roda dentro da imagem do
// Hub que está no ar, num contêiner avulso (lab/a0e-sankhya.sh), nunca no contêiner do Hub, com só a URL do banco do Hub
// e as chaves de selo. Uma sessão, logout no fim também em erro ou sinal; página acima de 30 s, 429, 504 ou sinal para
// toda leitura nova.
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
const nomeDaColuna = (a: string) => /^[A-Z][A-Z0-9_]{0,29}$/.test(a)

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
    saida({ a0e: 'logout', sessao: rotulo, resultado: r })
  }

  async function entrar(): Promise<boolean> {
    const comeco = relogio()
    const answered = await executor.login(opened, plano.prazoMs)
    logins += 1
    if (answered.kind !== 'TOKEN') {
      saida({ a0e: 'login', sessao: rotulo, resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : answered.kind, ms: Math.round(relogio() - comeco) })
      return false
    }
    const anterior = token
    token = answered.token
    emitidos.push(answered.token)
    venceEm = relogio() + answered.expiresInSeconds * 1000
    saida({ a0e: 'login', sessao: rotulo, resultado: 'OK', validadeS: answered.expiresInSeconds, ms: Math.round(relogio() - comeco), numero: logins })
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


// ---------------------------------------------------------------- o plano (fixo no commit revisado; nada vem do ambiente)

/** Onde a soma do mês é tentada: a tabela, a coluna de data (a primeira que existir) e o que a coluna de dinheiro prefere. */
export type AlvoSoma = Readonly<{ tabela: string; datas: readonly string[] }>

export type Plano = Readonly<{
  /** Hoje em Brasília (AAAA-MM-DD): o mês da soma é um mês completo antes do corrente. */
  hoje: string
  tabelas: readonly string[]
  /** No máximo isto de colunas NUMBER com escala, as de maior precisão, e no máximo `porTabela` de cada tabela. */
  colunas: number
  porTabela: number
  /** Linhas por coluna na comparação (a página inicial da tabela, sem ordem). */
  linhasPorColuna: number
  somas: readonly AlvoSoma[]
  /** Janela da soma: o mês e, se passar do teto de linhas, os primeiros 15, 7, 3 e 1 dias dele; até `meses` meses para trás. */
  janelasDias: readonly (number | null)[]
  meses: number
  /** A soma lê todas as linhas da janela numa página só: abaixo do que o gateway devolve (5.000). */
  maxLinhasSoma: number
  /** Nenhuma leitura nova depois disto (ms desde o começo): a última leitura em curso leva até `prazoMs`. */
  tetoLeituraMs: number
  prazoMs: number
  folgaRenovacaoMs: number
  paginaLentaMs: number
}>

export const PLANO: Plano = {
  hoje: new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
  tabelas: ['TGFFIN', 'TGFCAB', 'TGFITE', 'TCBSAL'],
  colunas: 8,
  porTabela: 2,
  linhasPorColuna: 30,
  somas: [
    { tabela: 'TGFFIN', datas: ['DTNEG', 'DTVENC'] },
    { tabela: 'TGFCAB', datas: ['DTNEG'] },
    { tabela: 'TCBSAL', datas: ['REFERENCIA'] },
  ],
  janelasDias: [null, 15, 7, 3, 1],
  meses: 3,
  maxLinhasSoma: 4900,
  tetoLeituraMs: 5.5 * 60_000,
  prazoMs: 120_000,
  folgaRenovacaoMs: 60_000,
  paginaLentaMs: 30_000,
}

/** Só estes literais saem do processo com o valor: são inventados aqui, sem dado de empresa. */
export const SONDAS_DUAL = [
  '0.1',
  '123456789012345',
  '1234567890123456',
  '9007199254740993',
  '12345678901234567.89',
  '123456789012345678',
  '0.1234567890123456789',
  '1234567890123456789012345.123456',
  '-9007199254740993.01',
  '0.0000001',
  '100000000000000000000000',
] as const

// ---------------------------------------------------------------- decimal exato (BigInt), sem passar por double

const ESC = 60

/** A forma canônica de um decimal escrito como o JSON ou o Oracle o escrevem (com sinal, ponto, expoente); `null` se não é decimal. */
export function canon(entrada: string): string | null {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(entrada.trim())
  if (m === null) return null
  const inteiro = m[2] ?? ''
  const fracao = m[3] ?? ''
  if (inteiro === '' && fracao === '') return null
  const exp = Number(m[4] ?? 0)
  if (Math.abs(exp) > 400) return null
  const digitos = inteiro + fracao
  const ponto = inteiro.length + exp
  let ate: string
  let depois: string
  if (ponto <= 0) {
    ate = ''
    depois = '0'.repeat(-ponto) + digitos
  } else if (ponto >= digitos.length) {
    ate = digitos + '0'.repeat(ponto - digitos.length)
    depois = ''
  } else {
    ate = digitos.slice(0, ponto)
    depois = digitos.slice(ponto)
  }
  ate = ate.replace(/^0+/, '')
  depois = depois.replace(/0+$/, '')
  const corpo = (ate === '' ? '0' : ate) + (depois === '' ? '' : `.${depois}`)
  return corpo === '0' ? '0' : (m[1] === '-' ? '-' : '') + corpo
}

/** O decimal canônico como inteiro vezes 10^-60. */
export function exato(c: string): bigint | null {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(c)
  if (m === null) return null
  const f = m[3] ?? ''
  if (f.length > ESC) return null
  const n = BigInt((m[2] ?? '') + f.padEnd(ESC, '0'))
  return m[1] === '-' ? -n : n
}

/** Quantos dígitos o texto tem, sem sinal, sem ponto e sem os zeros à esquerda. */
export const digitos = (texto: string): number => texto.replace(/\D/g, '').replace(/^0+/, '').length

/** A diferença entre dois decimais exatos: em unidades da última casa da coluna e a ordem de grandeza (10^ordem) do módulo. */
export function diferenca(a: bigint, b: bigint, escala: number): Readonly<{ unidades: string; ordem: number | null }> {
  const d = a - b
  if (d === 0n) return { unidades: '0', ordem: null }
  const modulo = d < 0n ? -d : d
  return { unidades: (d / 10n ** BigInt(ESC - escala)).toString(), ordem: modulo.toString().length - 1 - ESC }
}

// ---------------------------------------------------------------- o JSON bruto da resposta, célula a célula

/** As células de `rows` como o gateway as escreveu (texto cru: com aspas se vieram como texto); `null` se o corpo não traz `rows`. */
export function celulasCruas(corpo: string): string[][] | null {
  const achou = /"rows"\s*:\s*\[/.exec(corpo)
  if (achou === null) return null
  let i = achou.index + achou[0].length
  const linhas: string[][] = []
  const pula = () => {
    while (i < corpo.length && /[\s,]/.test(corpo[i] ?? '')) i += 1
  }
  for (pula(); corpo[i] === '['; pula()) {
    i += 1
    const linha: string[] = []
    for (pula(); corpo[i] !== ']'; pula()) {
      if (i >= corpo.length) return null
      const ini = i
      if (corpo[i] === '"') {
        i += 1
        while (i < corpo.length && corpo[i] !== '"') i += corpo[i] === '\\' ? 2 : 1
        i += 1
      } else if (corpo[i] === '[' || corpo[i] === '{') {
        return null
      } else {
        while (i < corpo.length && !/[,\]\s]/.test(corpo[i] ?? '')) i += 1
      }
      linha.push(corpo.slice(ini, i))
    }
    i += 1
    linhas.push(linha)
  }
  return corpo[i] === ']' ? linhas : null
}

/** O fetch do executor, guardando o corpo da última resposta do DbExplorer. O corpo só é lido aqui, nunca impresso. */
export const ultimaResposta: { corpo: string | null } = { corpo: null }
export function comCaptura(base: typeof fetch): typeof fetch {
  return async (entrada, init) => {
    const resposta = await base(entrada, init)
    const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url
    if (url.includes('executeQuery')) ultimaResposta.corpo = await resposta.clone().text()
    return resposta
  }
}

type FormaCrua = 'aspas' | 'numero' | 'nulo' | 'outra'
const formaDe = (cru: string): FormaCrua => (cru === 'null' ? 'nulo' : cru.startsWith('"') ? 'aspas' : /^-?[\d.]/.test(cru) ? 'numero' : 'outra')

/** O valor decimal que uma célula crua diz (sem passar por double): com aspas ou sem. */
function decimalCru(cru: string): string | null {
  const t = cru.startsWith('"') ? (JSON.parse(cru) as string) : cru
  return canon(t)
}

// ---------------------------------------------------------------- a máscara, o catálogo e a escolha das colunas

/** A leitura do Oracle em texto, com o ponto decimal fixo, quaisquer que sejam as NLS da sessão. */
const NLS = 'NLS_NUMERIC_CHARACTERS=\'.,\''
const ate63 = (inteiros: number, escala: number) => Math.max(1, Math.min(inteiros, 62 - escala))

/** A máscara da escala: `FM9…90.0…0` (sem espaço, ao menos um dígito inteiro, todas as casas da escala). */
export function mascara(precisao: number, escala: number): string {
  const inteiros = ate63(precisao - escala, escala)
  return `FM${'9'.repeat(inteiros - 1)}0${escala > 0 ? `.${'0'.repeat(escala)}` : ''}`
}

const aTexto = (expr: string, m: string) => `TO_CHAR(${expr}, ${literalTexto(m)}, ${literalTexto(NLS)})`

export type ColunaNumero = Readonly<{ tabela: string; coluna: string; p: number; s: number }>
export type Dicionario = Readonly<{ tabela: string; coluna: string; tipo: string; p: number | null; s: number | null }>

export const CATALOGO = {
  numericas: (tabelas: readonly string[], datas: readonly string[]) =>
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_PRECISION, DATA_SCALE FROM ALL_TAB_COLUMNS WHERE OWNER = SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AND TABLE_NAME IN (${tabelas.map(literalTexto).join(', ')}) AND ((DATA_TYPE = 'NUMBER' AND DATA_SCALE > 0) OR (DATA_TYPE = 'DATE' AND COLUMN_NAME IN (${datas.map(literalTexto).join(', ')}))) ORDER BY TABLE_NAME, COLUMN_ID`,
} as const

const colunaPadrao = (nome: string) => nomeDaColuna(nome) && !nome.startsWith('AD_')

/** As colunas NUMBER com escala de maior precisão: no máximo `porTabela` de cada tabela e `colunas` no total. */
export function escolherColunas(dic: readonly Dicionario[], plano: Plano): ColunaNumero[] {
  const candidatas = dic
    .filter((d) => d.tipo === 'NUMBER' && d.p !== null && d.s !== null && d.s > 0 && d.s <= d.p && d.p <= 38 && colunaPadrao(d.coluna) && plano.tabelas.includes(d.tabela))
    .map((d) => ({ tabela: d.tabela, coluna: d.coluna, p: d.p as number, s: d.s as number }))
    .sort((a, b) => b.p - a.p || b.s - a.s || plano.tabelas.indexOf(a.tabela) - plano.tabelas.indexOf(b.tabela) || a.coluna.localeCompare(b.coluna))
  const porTabela = new Map<string, number>()
  const escolhidas: ColunaNumero[] = []
  for (const c of candidatas) {
    if (escolhidas.length >= plano.colunas) break
    const n = porTabela.get(c.tabela) ?? 0
    if (n >= plano.porTabela) continue
    porTabela.set(c.tabela, n + 1)
    escolhidas.push(c)
  }
  return escolhidas
}

export type Soma = Readonly<{ tabela: string; dinheiro: ColunaNumero; data: string }>

/** A primeira tabela do plano com uma coluna de data e uma de dinheiro (`VLR*`, a de maior precisão). */
export function escolherSoma(dic: readonly Dicionario[], plano: Plano): Soma | null {
  for (const alvo of plano.somas) {
    const data = alvo.datas.find((d) => dic.some((x) => x.tabela === alvo.tabela && x.coluna === d && x.tipo === 'DATE'))
    const dinheiro = dic
      .filter((d) => d.tabela === alvo.tabela && d.tipo === 'NUMBER' && d.p !== null && d.s !== null && d.s > 0 && d.s <= d.p && d.p <= 38 && colunaPadrao(d.coluna) && d.coluna.startsWith('VLR'))
      .map((d) => ({ tabela: d.tabela, coluna: d.coluna, p: d.p as number, s: d.s as number }))
      .sort((a, b) => b.p - a.p || a.coluna.localeCompare(b.coluna))[0]
    if (data !== undefined && dinheiro !== undefined) return { tabela: alvo.tabela, dinheiro, data }
  }
  return null
}

// ---------------------------------------------------------------- a comparação de uma consulta com `V` (padrão) e `T` (texto do Oracle)

export type Comparacao = Readonly<{
  linhas: number
  /** Como o gateway escreveu `V` no JSON bruto. */
  aspas: number
  numero: number
  nulo: number
  semCru: boolean
  /** Linhas cujo valor, como o kit o lê (JSON.parse), difere do texto do Oracle; e as que já diferem no JSON bruto. */
  difereLido: number
  difereCru: number
  /** Texto do Oracle que não é decimal (a máscara estourou): fora da conta. */
  invalidas: number
  maxDigitosOracle: number
  maxDigitosLido: number
  /** O primeiro dígito (1 = o mais à esquerda) em que o valor lido deixa de ser o do Oracle, o menor visto. */
  primeiroDigitoDiferente: number | null
  /** O texto do Oracle e o valor lido de cada linha, em decimal canônico, para as somas (nunca impressos). */
  oracle: readonly string[]
  lido: readonly string[]
}>

export function comparar(linhas: readonly Record<string, unknown>[], corpo: string | null, colV = 'V', colT = 'T'): Comparacao {
  const cru = corpo === null ? null : celulasCruas(corpo)
  const nomes = linhas[0] === undefined ? [] : Object.keys(linhas[0])
  const iV = nomes.indexOf(colV)
  const r = { aspas: 0, numero: 0, nulo: 0, difereLido: 0, difereCru: 0, invalidas: 0, maxDigitosOracle: 0, maxDigitosLido: 0 }
  let primeiro: number | null = null
  const oracle: string[] = []
  const lido: string[] = []
  for (const [k, l] of linhas.entries()) {
    const texto = canon(String(l[colT]))
    if (texto === null || !/^-?\d+(\.\d+)?$/.test(String(l[colT]).trim())) {
      r.invalidas += 1
      continue
    }
    const v = l[colV]
    const lidoTexto = typeof v === 'number' ? canon(String(v)) : typeof v === 'string' ? canon(v) : null
    r.maxDigitosOracle = Math.max(r.maxDigitosOracle, digitos(String(l[colT])))
    if (lidoTexto !== null) r.maxDigitosLido = Math.max(r.maxDigitosLido, digitos(lidoTexto))
    oracle.push(texto)
    lido.push(lidoTexto ?? '')
    if (lidoTexto !== texto) {
      r.difereLido += 1
      const a = texto.replace(/\D/g, '')
      const b = (lidoTexto ?? '').replace(/\D/g, '')
      let d = 0
      while (d < a.length && a[d] === b[d]) d += 1
      primeiro = primeiro === null ? d + 1 : Math.min(primeiro, d + 1)
    }
    const celula = cru?.[k]?.[iV]
    if (celula !== undefined) {
      const forma = formaDe(celula)
      if (forma === 'aspas') r.aspas += 1
      else if (forma === 'numero') r.numero += 1
      else if (forma === 'nulo') r.nulo += 1
      if (decimalCru(celula) !== texto) r.difereCru += 1
    }
  }
  return { linhas: linhas.length, ...r, semCru: cru === null || cru.length !== linhas.length, primeiroDigitoDiferente: primeiro, oracle, lido }
}

// ---------------------------------------------------------------- as leituras

const linhaDaSonda = (lit: string, n: number): Readonly<{ sql: string; p: number; s: number }> => {
  const [inteira = '', fracao = ''] = lit.replace('-', '').split('.')
  const p = Math.max(1, (inteira + fracao).replace(/^0+/, '').length, fracao.length)
  const s = fracao.length
  const como = `CAST(${lit} AS NUMBER(${p}, ${s}))`
  return { sql: `SELECT ${n} AS K, ${como} AS V, ${aTexto(como, mascara(p, s))} AS T FROM DUAL`, p, s }
}

async function sondasDual(cx: Contexto, s: Sessao): Promise<void> {
  for (const [n, lit] of SONDAS_DUAL.entries()) {
    if (cx.freio.motivo !== null) return
    const q = linhaDaSonda(lit, n + 1)
    ultimaResposta.corpo = null
    const lido = await s.consultar(q.sql, true)
    const c = comparar(lido.consulta?.linhas ?? [], ultimaResposta.corpo)
    const cru = ultimaResposta.corpo === null ? null : celulasCruas(ultimaResposta.corpo)
    cx.saida({
      a0e: 'dual',
      n: n + 1,
      resultado: lido.classe.resultado,
      codigo: lido.classe.codigo,
      p: q.p,
      s: q.s,
      digitos: digitos(lit),
      // O literal e a célula crua são inventados aqui: nenhum dado de empresa.
      literal: lit,
      cru: cru?.[0]?.[1] ?? null,
      forma: cru?.[0]?.[1] === undefined ? null : formaDe(cru[0][1]),
      lido: typeof lido.consulta?.linhas[0]?.V,
      difereLido: c.difereLido,
      difereCru: c.difereCru,
      primeiroDigitoDiferente: c.primeiroDigitoDiferente,
      ms: lido.ms,
    })
  }
}

async function dicionario(cx: Contexto, s: Sessao): Promise<Dicionario[] | null> {
  const datas = [...new Set(cx.plano.somas.flatMap((a) => a.datas))]
  const lido = await s.consultar(CATALOGO.numericas(cx.plano.tabelas, datas), true)
  const linhas = lido.consulta?.linhas ?? []
  const dic = linhas.map((l) => ({
    tabela: String(l.TABLE_NAME),
    coluna: String(l.COLUMN_NAME),
    tipo: String(l.DATA_TYPE),
    p: l.DATA_PRECISION === null || l.DATA_PRECISION === undefined ? null : Number(l.DATA_PRECISION),
    s: l.DATA_SCALE === null || l.DATA_SCALE === undefined ? null : Number(l.DATA_SCALE),
  }))
  cx.saida({
    a0e: 'catalogo',
    resultado: lido.classe.resultado,
    codigo: lido.classe.codigo,
    porTabela: cx.plano.tabelas.map((t) => ({ tabela: t, numericasComEscala: dic.filter((d) => d.tabela === t && d.tipo === 'NUMBER').length })),
    ms: lido.ms,
  })
  return lido.classe.resultado === 'OK' ? dic : null
}

async function colunasReais(cx: Contexto, s: Sessao, colunas: readonly ColunaNumero[]): Promise<void> {
  for (const c of colunas) {
    if (cx.freio.motivo !== null) return
    const sql = `SELECT ${c.coluna} AS V, ${aTexto(c.coluna, mascara(c.p, c.s))} AS T FROM ${c.tabela} WHERE ${c.coluna} IS NOT NULL AND ${c.coluna} <> 0 FETCH FIRST ${cx.plano.linhasPorColuna} ROWS ONLY`
    ultimaResposta.corpo = null
    const lido = await s.consultar(sql)
    const { oracle: _o, lido: _l, ...r } = comparar(lido.consulta?.linhas ?? [], ultimaResposta.corpo)
    cx.saida({ a0e: 'coluna', tabela: c.tabela, coluna: nomeSeguro(c.coluna), p: c.p, s: c.s, resultado: lido.classe.resultado, codigo: lido.classe.codigo, ...r, ms: lido.ms })
  }
}

const dia = (iso: string, mais: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + mais * 86_400_000).toISOString().slice(0, 10)
const inicioDoMes = (iso: string, mesesAtras: number): string => {
  const [a = 0, m = 1] = iso.split('-').map(Number)
  const total = a * 12 + (m - 1) - mesesAtras
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`
}

export const filtroDaJanela = (coluna: string, de: string, ate: string) =>
  `${coluna} >= TO_DATE('${de}', 'YYYY-MM-DD') AND ${coluna} < TO_DATE('${ate}', 'YYYY-MM-DD')`

async function contar(s: Sessao, soma: Soma, filtro: string): Promise<number | null> {
  const lido = await s.consultar(`SELECT COUNT(*) AS N FROM ${soma.tabela} WHERE ${filtro}`, true)
  const n = Number(lido.consulta?.linhas[0]?.N)
  return lido.classe.resultado === 'OK' && Number.isFinite(n) ? n : null
}

/** O mês completo mais recente (até `meses` para trás) que cabe numa página; senão os primeiros dias dele. */
async function janelaDaSoma(cx: Contexto, s: Sessao, soma: Soma): Promise<Readonly<{ filtro: string; dias: number; mes: boolean; linhas: number }> | null> {
  for (let atras = 1; atras <= cx.plano.meses; atras += 1) {
    const de = inicioDoMes(cx.plano.hoje, atras)
    const fim = inicioDoMes(cx.plano.hoje, atras - 1)
    for (const dias of cx.plano.janelasDias) {
      if (cx.freio.motivo !== null) return null
      const ate = dias === null ? fim : dia(de, dias)
      const filtro = filtroDaJanela(soma.data, de, ate)
      const n = await contar(s, soma, filtro)
      if (n === null) return null
      cx.saida({ a0e: 'janela', tabela: soma.tabela, mesesAtras: atras, dias: dias ?? 'mes', linhas: n })
      if (n === 0) break
      if (n <= cx.plano.maxLinhasSoma) return { filtro, dias: dias ?? Math.round((Date.parse(fim) - Date.parse(de)) / 86_400_000), mes: dias === null, linhas: n }
    }
  }
  return null
}

async function somaDoMes(cx: Contexto, s: Sessao, soma: Soma): Promise<void> {
  const janela = await janelaDaSoma(cx, s, soma)
  if (janela === null) {
    cx.saida({ a0e: 'soma', tabela: soma.tabela, resultado: 'SEM_JANELA', motivo: cx.freio.motivo })
    return
  }
  const c = soma.dinheiro
  const somaP = c.p + 10
  const mSoma = mascara(Math.min(somaP, 38 + c.s), c.s)
  const sSoma = await s.consultar(`SELECT ${aTexto(`SUM(${c.coluna})`, mSoma)} AS S, SUM(${c.coluna}) AS SN, COUNT(${c.coluna}) AS N FROM ${soma.tabela} WHERE ${janela.filtro}`)
  const corpoSoma = ultimaResposta.corpo
  ultimaResposta.corpo = null
  const lidas = await s.consultar(`SELECT ${c.coluna} AS V, ${aTexto(c.coluna, mascara(c.p, c.s))} AS T FROM ${soma.tabela} WHERE ${janela.filtro} AND ${c.coluna} IS NOT NULL`)
  const comp = comparar(lidas.consulta?.linhas ?? [], ultimaResposta.corpo)
  const l0 = sSoma.consulta?.linhas[0]
  const oracleSoma = l0 === undefined ? null : canon(String(l0.S))
  const eOracle = oracleSoma === null ? null : exato(oracleSoma)
  const linhasTexto = comp.oracle.map(exato)
  const linhasLido = comp.lido.map((x) => (x === '' ? null : exato(x)))
  const somaDe = (xs: readonly (bigint | null)[]) => (xs.some((x) => x === null) ? null : xs.reduce<bigint>((a, b) => a + (b as bigint), 0n))
  const doTexto = somaDe(linhasTexto)
  const doLido = somaDe(linhasLido)
  // O consumidor ingênuo: soma em double os números que o kit leu.
  const ingenuo = (lidas.consulta?.linhas ?? []).reduce((a, l) => a + Number(l.V), 0)
  const eIngenuo = exato(canon(String(ingenuo)) ?? '')
  const snLido = l0 === undefined ? null : typeof l0.SN === 'number' ? canon(String(l0.SN)) : typeof l0.SN === 'string' ? canon(l0.SN) : null
  const eSn = snLido === null ? null : exato(snLido)
  const crua = corpoSoma === null ? null : celulasCruas(corpoSoma)
  const dif = (x: bigint | null) => (x === null || eOracle === null ? null : diferenca(x, eOracle, c.s))
  cx.saida({
    a0e: 'soma',
    tabela: soma.tabela,
    coluna: nomeSeguro(c.coluna),
    p: c.p,
    s: c.s,
    resultado: sSoma.classe.resultado === 'OK' && lidas.classe.resultado === 'OK' ? 'OK' : `${sSoma.classe.resultado}/${lidas.classe.resultado}`,
    mes: janela.mes,
    dias: janela.dias,
    linhasDaJanela: janela.linhas,
    linhasLidas: comp.linhas,
    paginaCompleta: lidas.consulta?.completo ?? null,
    formaDaSomaNoGateway: crua?.[0]?.[1] === undefined ? null : formaDe(crua[0][1]),
    difereLido: comp.difereLido,
    difereCru: comp.difereCru,
    invalidas: comp.invalidas,
    // Diferenças contra a soma do Oracle em texto, em unidades da última casa (escala) e a ordem de grandeza (10^ordem) do módulo.
    linhasEmTextoVsOracle: dif(doTexto),
    linhasLidasExatasVsOracle: dif(doLido),
    linhasLidasSomadasEmDoubleVsOracle: dif(eIngenuo),
    somaDoGatewayNaFormaPadraoVsOracle: dif(eSn),
    msSoma: sSoma.ms,
    msLinhas: lidas.ms,
  })
}

// ---------------------------------------------------------------- o protocolo

export type Resposta = 'MEDIDO' | 'MEDIDO_PARCIAL' | 'LOGIN_FALHOU'

/** Contra qualquer Sankhya (o real ou o falso): login, as sondas de DUAL, as colunas reais, a soma do mês, e o logout, também em erro. */
export async function medir(
  executor: Executor,
  opened: OpenedConnection,
  plano: Plano,
  saida: Saida,
  relogio: () => number = () => performance.now(),
): Promise<Resposta> {
  const cx: Contexto = { executor, opened, plano, saida, relogio, inicio: relogio(), freio: { motivo: null } }
  const s = await abrirSessao(cx, 'S1')
  if (s === null) {
    saida({ a0e: 'veredito', resposta: 'LOGIN_FALHOU' })
    return 'LOGIN_FALHOU'
  }
  let completo = true
  try {
    await sondasDual(cx, s)
    const dic = await dicionario(cx, s)
    if (dic === null) completo = false
    else {
      const colunas = escolherColunas(dic, plano)
      saida({ a0e: 'colunas-escolhidas', colunas: colunas.map((c) => ({ tabela: c.tabela, coluna: nomeSeguro(c.coluna), p: c.p, s: c.s })) })
      if (colunas.length === 0) completo = false
      await colunasReais(cx, s, colunas)
      const soma = escolherSoma(dic, plano)
      if (soma === null) {
        completo = false
        saida({ a0e: 'soma', resultado: 'SEM_TABELA' })
      } else if (cx.freio.motivo === null) await somaDoMes(cx, s, soma)
    }
    const resposta = completo && cx.freio.motivo === null ? 'MEDIDO' : 'MEDIDO_PARCIAL'
    saida({ a0e: 'veredito', resposta, motivo: cx.freio.motivo, logins: s.logins(), duracaoMs: Math.round(relogio() - cx.inicio) })
    return resposta
  } finally {
    await s.fechar()
  }
}

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
    e.saida({ a0e: 'recusa', motivo: 'conexao-nao-unica', candidatas: todas.length, prefixos: todas.map((c) => sha(c.id).slice(0, 12)) })
    return 3
  }
  const quieto = new Date(Date.now() - QUIETO_MIN * 60_000).toISOString()
  const antes = await movimento(e.database, alvo, quieto, null)
  e.saida({ a0e: 'antes', ...antes })
  // O Hub copiando a Metal Nobre agora (cópia aberta, posse de cópia, leitura ao vivo recente): a sonda não roda.
  if (antes.abertas > 0 || antes.leases > 0 || antes.leituras > 0) {
    e.saida({ a0e: 'recusa', motivo: 'hub-em-uso' })
    return 4
  }
  const opened = await abrir(e.database, e.keys, alvo, connector)
  const origins = new Map(e.origem === undefined ? [] : [[connector.id, e.origem] as const])
  const executor = createExecutor({ fetch: comCaptura(fetch), origins, log: silencioso, now: () => new Date() })
  const inicio = new Date().toISOString()
  const resposta = await medir(executor, opened, e.plano ?? PLANO, e.saida)
  const depois = await movimento(e.database, alvo, inicio, new Date().toISOString())
  e.saida({ a0e: 'durante', copias: depois.copias, leituras: depois.leituras, limpo: depois.copias + depois.leituras === 0 })
  return resposta === 'MEDIDO' || resposta === 'MEDIDO_PARCIAL' ? 0 : 5
}

function erroSeguro(error: unknown): Linha {
  const name = error instanceof Error ? error.name : typeof error
  const code = Object(error).code
  return { a0e: 'erro', tipo: name, codigo: typeof code === 'string' ? codigoSeguro(code) : null }
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
    saida({ a0e: 'recusa', motivo: 'sem-arquivos' })
    return 2
  }
  const origem = process.env.A0E_ORIGEM
  if (origem !== undefined && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origem)) {
    saida({ a0e: 'recusa', motivo: 'origem-so-loopback' })
    return 2
  }
  const prefixo = process.env.A0E_CONEXAO_SHA256
  if (prefixo !== undefined && !/^[0-9a-f]{8,64}$/.test(prefixo)) {
    saida({ a0e: 'recusa', motivo: 'prefixo-invalido' })
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
