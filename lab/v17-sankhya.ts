// V17: duas sessões do mesmo usuário de integração no Sankhya, ao mesmo tempo, só leitura.
//
// Roda dentro da imagem do Hub que está no ar, num contêiner avulso (lab/v17-sankhya.sh), nunca no
// contêiner do Hub. Lê dois arquivos: a URL do banco do Hub (HUB_DATABASE_URL_FILE) e as chaves de
// selo (HUB_SEAL_KEYS_FILE). Abre a credencial selada de UMA conexão Sankhya com o código do próprio
// Hub (`sealedOf`, `open`) e fala com o Sankhya pelo executor do próprio Hub (`createExecutor`), que
// redige os segredos e classifica as respostas como o Hub classifica.
//
// Imprime só linhas JSON com passos, códigos, status HTTP e tempos em milissegundos. Nunca imprime
// token, credencial, corpo de resposta, mensagem do Sankhya, nome de empresa, nome de conexão nem id.
// O log do workflow do laboratório é público (o repositório é público): é por isso.
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

/** Prazo de cada chamada ao Sankhya. */
const PRAZO_MS = 20_000
/** Prazo de cada logout, como o Hub (`limits.ts` LOGOUT_DEADLINE_MS) com folga. */
const PRAZO_LOGOUT_MS = 5_000
/** Rodadas de pares simultâneos em sessões diferentes. */
const RODADAS = 3
/** Uma leitura ao vivo do Hub nesta janela antes da sonda a cancela: alguém está usando. */
const QUIETO_MIN = 15

const silencioso = { info: () => undefined, error: () => undefined }

type Linha = Record<string, string | number | boolean | null | readonly unknown[]>

export type Saida = (linha: Linha) => void

/** O que um passo deixou: nunca o valor, só a classe da resposta. */
type Resultado = Readonly<{
  resultado: string
  status: number | null
  codigo: string | null
}>

type Passo = Resultado & Readonly<{ passo: string; inicioMs: number; fimMs: number }>

/** Um código do Sankhya só passa quando é um código: qualquer outro texto pode trazer dado. */
function codigoSeguro(code: string | null | undefined): string | null {
  if (code === null || code === undefined) return null
  return /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'outro'
}

function classe(answered: Answered<unknown> | Readonly<{ kind: 'UNREACHABLE' }>): Resultado {
  switch (answered.kind) {
    case 'OK':
      return { resultado: 'OK', status: null, codigo: null }
    case 'TOKEN_EXPIRED':
      return {
        resultado: 'TOKEN_ENCERRADO',
        status: answered.native.status,
        codigo: codigoSeguro(answered.native.code),
      }
    case 'AUTH_REFUSED':
      return {
        resultado: 'CHAVE_RECUSADA',
        status: answered.native.status,
        codigo: codigoSeguro(answered.native.code),
      }
    case 'UNREADABLE':
      return {
        resultado: answered.native.code === CONCURRENT_CALL ? 'CHAMADA_CONCORRENTE' : 'ILEGIVEL',
        status: answered.native.status,
        codigo: codigoSeguro(answered.native.code),
      }
    case 'REFUSED':
      return {
        resultado: 'RECUSADA',
        status: answered.native.status,
        codigo: codigoSeguro(answered.native.code),
      }
    case 'BUSY':
      return { resultado: 'OCUPADO', status: 429, codigo: null }
    case 'UNREACHABLE':
      return { resultado: 'INALCANCAVEL', status: null, codigo: null }
    default:
      return { resultado: 'OUTRO', status: null, codigo: null }
  }
}

type Leitura = Readonly<{ nome: string; operation: Operation<unknown, unknown>; input: unknown }>

/** As duas leituras: a da porta (a que a cópia usa, onde mora o "4") e a REST que o Testar usa. */
function leiturasDe(connector: Connector): { porta: Leitura; rest: Leitura } {
  const consultar = connector.readDoor?.consultar
  const empresas = connector.operations.find((each) => each.id === 'empresas')
  if (consultar === undefined || empresas === undefined) throw new Error('kit sem as leituras')
  return {
    // SELECT COUNT(*) AS N FROM TSIEMP: a sonda do próprio kit; a resposta é um número, descartado.
    porta: { nome: 'porta', operation: consultar, input: consultar.probe?.(new Map()) },
    rest: { nome: 'rest', operation: empresas, input: empresas.probe?.(new Map()) },
  }
}

/**
 * O protocolo, contra qualquer Sankhya (o real ou o falso do kit): dois logins com a mesma
 * credencial, leituras de cada sessão sozinha e ao mesmo tempo, um controle no mesmo token, os dois
 * logouts. Nunca devolve nem imprime token.
 */
export async function sondar(executor: Executor, opened: OpenedConnection, saida: Saida) {
  const t0 = performance.now()
  const agora = () => Math.round(performance.now() - t0)
  const passos: Passo[] = []
  const { porta, rest } = leiturasDe(opened.connector)
  const vivos = new Map<string, BearerToken>()
  // O token depois do seu logout, só para provar que o logout encerra (a leitura deve ser recusada).
  const encerrados = new Map<string, BearerToken>()

  function anota(passo: Passo) {
    passos.push(passo)
    saida({ v17: 'passo', ...passo })
    return passo
  }

  async function login(sessao: string): Promise<boolean> {
    const inicioMs = agora()
    const answered = await executor.login(opened, PRAZO_MS)
    if (answered.kind === 'TOKEN') {
      vivos.set(sessao, answered.token)
      anota({
        passo: `login ${sessao}`,
        inicioMs,
        fimMs: agora(),
        resultado: 'OK',
        status: null,
        codigo: null,
      })
      saida({ v17: 'validade', sessao, segundos: answered.expiresInSeconds })
      return true
    }
    const r =
      answered.kind === 'UNREACHABLE'
        ? { resultado: 'INALCANCAVEL', status: null, codigo: null }
        : {
            resultado: answered.kind === 'AUTH_REFUSED' ? 'CHAVE_RECUSADA' : 'ILEGIVEL',
            status: answered.native.status,
            codigo: codigoSeguro(answered.native.code),
          }
    anota({ passo: `login ${sessao}`, inicioMs, fimMs: agora(), ...r })
    return false
  }

  async function ler(passo: string, sessao: string, leitura: Leitura): Promise<Passo> {
    const token = vivos.get(sessao) ?? encerrados.get(sessao) ?? null
    const inicioMs = agora()
    if (token === null) throw new Error('sessão sem token')
    const answered = await executor.call(opened, token, leitura.operation, leitura.input, PRAZO_MS)
    return anota({
      passo: `${passo} [${leitura.nome}]`,
      inicioMs,
      fimMs: agora(),
      ...classe(answered),
    })
  }

  /** Duas leituras disparadas juntas; `sobrepostas` quando as duas estavam abertas ao mesmo tempo. */
  async function par(passo: string, a: [string, Leitura], b: [string, Leitura]) {
    const [x, y] = await Promise.all([
      ler(`${passo} ${a[0]}`, a[0], a[1]),
      ler(`${passo} ${b[0]}`, b[0], b[1]),
    ])
    const sobrepostas = Math.max(x.inicioMs, y.inicioMs) < Math.min(x.fimMs, y.fimMs)
    saida({ v17: 'par', passo, sobrepostas })
    return { x, y, sobrepostas }
  }

  async function logout(sessao: string): Promise<string> {
    const token = vivos.get(sessao)
    if (token === undefined) return 'SEM_TOKEN'
    vivos.delete(sessao)
    encerrados.set(sessao, token)
    const inicioMs = agora()
    const ended = (await executor.logout(opened, token, PRAZO_LOGOUT_MS)) ?? 'SEM_LOGOUT'
    anota({
      passo: `logout ${sessao}`,
      inicioMs,
      fimMs: agora(),
      resultado: ended,
      status: null,
      codigo: null,
    })
    return ended
  }

  try {
    if (!(await login('A'))) return veredito(saida, 'LOGIN_FALHOU', {})
    const antes = await ler('A sozinha, antes do login de B', 'A', porta)
    if (antes.resultado !== 'OK') return veredito(saida, 'LEITURA_FALHOU', {})
    if (!(await login('B'))) return veredito(saida, 'SEGUNDO_LOGIN_RECUSADO', {})
    const aposLoginB = await ler('A sozinha, depois do login de B', 'A', porta)
    // A caiu com o login de B: a resposta já está dada; nada de bater mais num token morto.
    if (aposLoginB.resultado === 'TOKEN_ENCERRADO' || aposLoginB.resultado === 'CHAVE_RECUSADA')
      return veredito(saida, 'SEGUNDO_LOGIN_DERRUBA_O_PRIMEIRO', { aSobreviveLoginB: false })
    const bSozinha = await ler('B sozinha', 'B', porta)
    const pares = []
    for (let rodada = 1; rodada <= RODADAS; rodada += 1) {
      // A rodada 2 junta a REST (o ao vivo) com a porta (a cópia), como o Hub e a tarefa fariam.
      const deB = rodada === 2 ? rest : porta
      pares.push(await par(`par ${rodada}`, ['A', porta], ['B', deB]))
    }
    // O controle: duas no MESMO token. O "4" aqui prova que a sobreposição chegou ao Sankhya.
    const controle = await par('controle mesmo token', ['A', porta], ['A', porta])
    await logout('A')
    const bAposLogoutA = await ler('B depois do logout de A', 'B', porta)
    const aAposLogoutA = await ler('A depois do seu logout', 'A', porta)
    await logout('B')
    const resultados = pares.flatMap(({ x, y }) => [x.resultado, y.resultado])
    const fatos = {
      aSobreviveLoginB: aposLoginB.resultado === 'OK',
      bSozinhaOk: bSozinha.resultado === 'OK',
      paresOk: resultados.every((each) => each === 'OK'),
      paresComConcorrencia: resultados.filter((each) => each === 'CHAMADA_CONCORRENTE').length,
      paresSobrepostos: pares.filter((each) => each.sobrepostas).length,
      controleConcorrente: [controle.x, controle.y].some(
        (each) => each.resultado === 'CHAMADA_CONCORRENTE',
      ),
      bSobreviveLogoutA: bAposLogoutA.resultado === 'OK',
      logoutEncerraA: aAposLogoutA.resultado !== 'OK',
    }
    return veredito(saida, julgar(fatos), fatos)
  } finally {
    // Nada fica aberto: uma sessão que expira sem logout fica pendurada no Sankhya (limits.ts:8).
    for (const sessao of [...vivos.keys()]) await logout(sessao)
  }

  function veredito(out: Saida, resposta: string, fatos: Record<string, boolean | number | null>) {
    const total = agora()
    out({ v17: 'veredito', resposta, ...fatos, duracaoMs: total })
    return { resposta, fatos, passos }
  }
}

type Fatos = {
  aSobreviveLoginB: boolean
  bSozinhaOk: boolean
  paresOk: boolean
  paresComConcorrencia: number
  paresSobrepostos: number
  controleConcorrente: boolean
  bSobreviveLogoutA: boolean
  logoutEncerraA: boolean
}

/** A resposta da V17 a partir dos fatos, na ordem em que um descarta o seguinte. */
export function julgar(f: Fatos): string {
  if (!f.aSobreviveLoginB) return 'SEGUNDO_LOGIN_DERRUBA_O_PRIMEIRO'
  if (f.paresComConcorrencia > 0) return 'UMA_CHAMADA_POR_USUARIO'
  if (!f.bSozinhaOk || !f.paresOk) return 'INCONCLUSIVO'
  if (!f.bSobreviveLogoutA) return 'LOGOUT_DERRUBA_A_OUTRA'
  if (f.paresSobrepostos === 0) return 'INCONCLUSIVO'
  return f.controleConcorrente ? 'CONVIVEM' : 'CONVIVEM_SOBREPOSICAO_NAO_PROVADA'
}

type Candidata = Readonly<{
  companyId: CompanyId
  id: ConnectionId
  linkedAt: string
  revision: number
}>

const sha = (text: string) => createHash('sha256').update(text).digest('hex')

/** As conexões Sankhya ativas da instalação, com o selo ainda fechado. */
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
      todas.push({
        companyId,
        id: ConnectionId.parse(r.id),
        linkedAt: new Date(r.linked_at).toISOString(),
        revision: Number(r.revision),
      })
    }
  }
  return todas
}

/** O que o Hub está fazendo com a empresa agora: cópia aberta, cópia com lease, leitura ao vivo recente. */
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
         and d.connection_id = ${alvo.id} and d.at between ${desde}::timestamptz and ${fim})::int as leituras,
      (select floor(extract(epoch from statement_timestamp() - max(r.started_at)) / 60)::int
         from copies.copy_run r where r.company_id = ${alvo.companyId}) as ultima_copia_ha_min`)
    const r = Object(result.rows[0])
    return {
      abertas: Number(r.abertas),
      leases: Number(r.leases),
      copias: Number(r.copias),
      leituras: Number(r.leituras),
      ultimaCopiaHaMin: r.ultima_copia_ha_min === null ? null : Number(r.ultima_copia_ha_min),
    }
  })
}

async function abrir(database: Database, keys: SealKeys, alvo: Candidata, connector: Connector) {
  const scope = { kind: 'COMPANY', companyId: alvo.companyId, personId: null } as const
  const credential = await database.read(scope, async (tx) =>
    open(
      keys,
      sealContext({ id: alvo.id, companyId: alvo.companyId, connector }),
      await sealedOf(tx, alvo.id),
    ),
  )
  const opened: OpenedConnection = {
    id: alvo.id,
    linkedAt: alvo.linkedAt,
    connector,
    credential,
    revision: alvo.revision,
    accountRef: null,
  }
  return opened
}

export type Entrada = Readonly<{
  database: Database
  keys: SealKeys
  /** Só para a prova local: a origem do falso do kit, no loopback. */
  origem?: string
  /** Prefixo do sha256 do id da conexão, para escolher entre várias. */
  prefixo?: string
  saida: Saida
}>

/** Escolhe a conexão, confere que o Hub está quieto, roda o protocolo e confere de novo. Código de saída. */
export async function rodar(e: Entrada): Promise<number> {
  const connector = connectorOf('sankhya')
  if (connector === undefined) throw new Error('kit sem o Sankhya')
  const todas = await candidatas(e.database)
  const escolhidas =
    e.prefixo === undefined ? todas : todas.filter((c) => sha(c.id).startsWith(e.prefixo ?? ''))
  const alvo = escolhidas[0]
  if (escolhidas.length !== 1 || alvo === undefined) {
    // Só o prefixo do hash de cada id: nada que diga de que empresa é.
    e.saida({
      v17: 'recusa',
      motivo: 'conexao-nao-unica',
      candidatas: todas.length,
      prefixos: todas.map((c) => sha(c.id).slice(0, 12)),
    })
    return 3
  }
  const quieto = new Date(Date.now() - QUIETO_MIN * 60_000).toISOString()
  const antes = await movimento(e.database, alvo, quieto, null)
  e.saida({ v17: 'antes', ...antes })
  if (antes.abertas > 0 || antes.leases > 0 || antes.leituras > 0) {
    e.saida({ v17: 'recusa', motivo: 'hub-em-uso' })
    return 4
  }
  const opened = await abrir(e.database, e.keys, alvo, connector)
  const origins = new Map(e.origem === undefined ? [] : [[connector.id, e.origem] as const])
  const executor = createExecutor({ fetch, origins, log: silencioso, now: () => new Date() })
  const inicio = new Date().toISOString()
  const { resposta } = await sondar(executor, opened, e.saida)
  const depois = await movimento(e.database, alvo, inicio, new Date().toISOString())
  // Uma leitura ou cópia do Hub durante a sonda é uma terceira sessão: o resultado fica sob suspeita.
  e.saida({
    v17: 'durante',
    copias: depois.copias,
    leituras: depois.leituras,
    limpo: depois.copias + depois.leituras === 0,
  })
  return resposta === 'INCONCLUSIVO' || resposta.endsWith('FALHOU') ? 5 : 0
}

function erroSeguro(error: unknown): Linha {
  // Só o nome e o código: a mensagem de um erro do pg ou do fetch pode trazer o host ou a URL.
  const name = error instanceof Error ? error.name : typeof error
  const code = Object(error).code
  return { v17: 'erro', tipo: name, codigo: typeof code === 'string' ? codigoSeguro(code) : null }
}

async function main(): Promise<number> {
  const saida: Saida = (linha) => process.stdout.write(`${JSON.stringify(linha)}\n`)
  const urlFile = process.env.HUB_DATABASE_URL_FILE
  const keysFile = process.env.HUB_SEAL_KEYS_FILE
  if (urlFile === undefined || keysFile === undefined) {
    saida({ v17: 'recusa', motivo: 'sem-arquivos' })
    return 2
  }
  const origem = process.env.V17_ORIGEM
  if (origem !== undefined && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origem)) {
    saida({ v17: 'recusa', motivo: 'origem-so-loopback' })
    return 2
  }
  const prefixo = process.env.V17_CONEXAO_SHA256
  if (prefixo !== undefined && !/^[0-9a-f]{8,64}$/.test(prefixo)) {
    saida({ v17: 'recusa', motivo: 'prefixo-invalido' })
    return 2
  }
  let database: Database
  let keys: SealKeys
  try {
    database = openDatabase({
      url: DatabaseUrl.parse(readSecretFile('HUB_DATABASE_URL_FILE', urlFile)),
      log: silencioso,
    })
    keys = parseSealKeys(readSecretFile('HUB_SEAL_KEYS_FILE', keysFile))
  } catch (error) {
    saida(erroSeguro(error))
    return 2
  }
  try {
    return await rodar({
      database,
      keys,
      saida,
      ...(origem && { origem }),
      ...(prefixo && { prefixo }),
    })
  } catch (error) {
    saida(erroSeguro(error))
    return 1
  } finally {
    await database.close()
  }
}

if (import.meta.main) process.exitCode = await main()
