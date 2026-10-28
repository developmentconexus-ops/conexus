import type { Manifest } from '@conexus/app-contract'
import type { MigrationCause } from '@conexus/hub-api'
import { MigrationSubject } from '@conexus/hub-api'
import type { CreateFunctionStmt, Node } from 'libpg-query'
import { loadModule, parsePlPgSQLSync, parseSync } from 'libpg-query'

type AppMigration = Manifest['migrations'][number]

/** The statement the fixed list refuses: what may pass is what the outcome check sees (B, 2026-10-27). */
export type RuleBreak = Omit<Extract<MigrationCause, { kind: 'rule' }>, 'kind'>

/** Loads the parser's WASM; the Hub awaits it at start (libpg-query README: the `*Sync` need it). */
export function loadMigrationRule(): Promise<void> {
  return loadModule()
}

/** What the outcome check sees inside the transaction; every other node acts after it, or ends it. */
const ALLOWED = new Set([
  'CreateStmt',
  'IndexStmt',
  'InsertStmt',
  'UpdateStmt',
  'DeleteStmt',
  'TruncateStmt',
  'AlterTableStmt',
  'RenameStmt',
  'DropStmt',
  'CommentStmt',
  'CreateTrigStmt',
  'CreateFunctionStmt',
  'SelectStmt',
])
const ALTER_ALLOWED = new Set([
  'AT_AddColumn',
  'AT_DropColumn',
  'AT_AlterColumnType',
  'AT_ColumnDefault',
  'AT_DropNotNull',
  'AT_SetNotNull',
  'AT_AddConstraint',
  'AT_DropConstraint',
  'AT_ValidateConstraint',
])
const DROP_ALLOWED = new Set(['OBJECT_TABLE', 'OBJECT_INDEX'])
/** What a function's body may do when a trigger or a call runs it, after the transaction. */
const BODY_ALLOWED = new Set(['SelectStmt', 'InsertStmt'])
/** PL/pgSQL's nodes that run SQL built at run time, which no parser can read before. */
const DYNAMIC = ['PLpgSQL_stmt_dynexecute', 'PLpgSQL_stmt_dynfors', 'dynquery']
/** PL/pgSQL's `RAISE EXCEPTION`, and a bare `RAISE`: PostgreSQL's ERROR level. */
const ERROR_LEVEL = 21

/** What the person reads for a statement kind the list refuses; any other kind gets `OTHER`. */
const KIND_NAMES: Readonly<Record<string, string>> = {
  GrantStmt: 'dar ou tirar permissão de acesso',
  CreatePolicyStmt: 'criar regra de acesso por linha',
  RuleStmt: 'criar regra que reescreve comandos',
  AlterFunctionStmt: 'alterar uma função já criada',
  AlterDefaultPrivilegesStmt: 'mudar as permissões padrão',
  AlterSeqStmt: 'alterar uma sequência',
  DoStmt: 'rodar um bloco de código solto (DO)',
  ViewStmt: 'criar uma visão (view)',
  TransactionStmt: 'controlar a transação (BEGIN, COMMIT)',
  VariableSetStmt: 'mudar configuração do banco (SET)',
  DiscardStmt: 'descartar o estado da conexão',
  CreateTableAsStmt: 'criar tabela a partir de consulta',
  CreateEnumStmt: 'criar um tipo de lista (ENUM)',
  CreateSeqStmt: 'criar uma sequência (SEQUENCE)',
  CreateExtensionStmt: 'instalar uma extensão',
  CreateRoleStmt: 'criar um usuário do banco',
  AlterRoleStmt: 'alterar um usuário do banco',
  DropRoleStmt: 'apagar um usuário do banco',
  CreateSchemaStmt: 'criar um esquema',
  CreateDomainStmt: 'criar um tipo próprio (DOMAIN)',
  CompositeTypeStmt: 'criar um tipo composto',
  CopyStmt: 'copiar de ou para arquivo (COPY)',
  CallStmt: 'chamar um procedimento (CALL)',
  LockStmt: 'travar uma tabela (LOCK)',
  VacuumStmt: 'limpar o banco (VACUUM)',
  ExplainStmt: 'explicar um comando (EXPLAIN)',
  NotifyStmt: 'enviar aviso entre conexões (NOTIFY)',
  ListenStmt: 'escutar avisos entre conexões (LISTEN)',
  PrepareStmt: 'preparar um comando (PREPARE)',
  ExecuteStmt: 'rodar um comando preparado (EXECUTE)',
  ReindexStmt: 'refazer índices (REINDEX)',
  ClusterStmt: 'reordenar uma tabela (CLUSTER)',
  RefreshMatViewStmt: 'atualizar uma visão guardada',
}
const OTHER = 'um comando que o Conexus não confere'
/** The same for the `ALTER TABLE` pieces, `OBJECT_*` kinds, and the other reasons `refused` gives. */
const REASON_NAMES: Readonly<Record<string, string>> = {
  AT_EnableRowSecurity: 'ligar a segurança por linha',
  AT_ForceRowSecurity: 'forçar a segurança por linha',
  AT_SetUnLogged: 'tornar a tabela sem registro (UNLOGGED)',
  AT_ChangeOwner: 'trocar o dono da tabela',
  'CreateStmt u': 'criar tabela sem registro (UNLOGGED)',
  'CreateStmt t': 'criar tabela temporária',
  'DropStmt OBJECT_FUNCTION': 'apagar uma função',
  'DropStmt OBJECT_TRIGGER': 'apagar um gatilho',
  'DropStmt OBJECT_VIEW': 'apagar uma visão',
  'SelectStmt INTO': 'SELECT ... INTO, que cria uma tabela',
  'SECURITY DEFINER': 'função com o poder do dono (SECURITY DEFINER)',
  'body DeleteStmt': 'função que apaga linhas',
  'body UpdateStmt': 'função que muda linhas',
  'body ON CONFLICT DO UPDATE': 'função que muda linha existente (ON CONFLICT)',
  EXECUTE: 'SQL montado na hora (EXECUTE)',
  'RAISE EXCEPTION': 'erro lançado por um gatilho (RAISE EXCEPTION)',
  'RETURN not NEW': 'gatilho que não termina em RETURN NEW',
  ASSERT: 'conferência ASSERT num gatilho',
  sql_body: 'função com corpo BEGIN ATOMIC',
  NOT_ONE_STATEMENT: 'mais de um comando no mesmo item',
  UNREADABLE: 'um comando que o Conexus não consegue ler',
}

/** The person's name for what `refused` found: one table, here, so the reason never shows a parser node. */
function plainOf(found: string): string {
  const named = REASON_NAMES[found] ?? KIND_NAMES[found]
  if (named !== undefined) return named
  if (found.startsWith('name ')) {
    return found.includes('.')
      ? `tabela de outro esquema (${found.slice(5)})`
      : `nome do Conexus (${found.slice(5)})`
  }
  if (found.startsWith('language ')) return `função em outra linguagem (${found.slice(9)})`
  if (found.startsWith('body ')) return 'função que faz mais que ler e inserir'
  if (found.startsWith('AT_')) return 'alteração de tabela que o Conexus não confere'
  if (found.startsWith('DropStmt ')) return 'apagar algo que não é tabela nem índice'
  return OTHER
}

/** The first statement of the pending migrations that the fixed list refuses, or none. */
export function ruleBreak(pending: readonly AppMigration[]): RuleBreak | undefined {
  for (const one of pending) {
    for (const [at, text] of one.statements.entries()) {
      const subject = refused(text)
      if (subject !== undefined) {
        return {
          migration: one.id,
          statement: at + 1,
          subject: plainOf(subject).slice(0, MigrationSubject.maxLength ?? undefined),
        }
      }
    }
  }
  return undefined
}

/** The parser's tree, or the error that kept it from reading: what it cannot read is refused. */
function readWith<T>(parse: (text: string) => T, text: string): { tree: T } | { unread: unknown } {
  try {
    return { tree: parse(text) }
  } catch (error) {
    return { unread: error }
  }
}

function refused(text: string): string | undefined {
  const read = readWith(parseSync, text)
  if (!('tree' in read)) return 'UNREADABLE'
  const stmts = read.tree.stmts ?? []
  // One statement per item (manifest.ts): a second would hide behind the first.
  if (stmts.length !== 1) return 'NOT_ONE_STATEMENT'
  const stmt = stmts[0]?.stmt
  const [kind = 'UNREADABLE'] = Object.keys(stmt ?? {})
  if (stmt === undefined || !ALLOWED.has(kind)) return kind
  const outside = outsideTheApp(stmt)
  return outside === undefined ? nodePower(stmt, text) : `name ${outside}`
}

/** What an allowed statement's own fields may not do. */
function nodePower(stmt: Node, text: string): string | undefined {
  if ('CreateStmt' in stmt) {
    const persistence = stmt.CreateStmt.relation?.relpersistence
    return persistence === 'p' ? undefined : `CreateStmt ${persistence}`
  }
  if ('AlterTableStmt' in stmt) {
    return (stmt.AlterTableStmt.cmds ?? [])
      .map((cmd) => ('AlterTableCmd' in cmd ? String(cmd.AlterTableCmd.subtype) : 'UNREADABLE'))
      .find((subtype) => !ALTER_ALLOWED.has(subtype))
  }
  if ('DropStmt' in stmt) {
    const removed = String(stmt.DropStmt.removeType)
    return DROP_ALLOWED.has(removed) ? undefined : `DropStmt ${removed}`
  }
  if ('SelectStmt' in stmt) {
    return stmt.SelectStmt.intoClause === undefined ? undefined : 'SelectStmt INTO'
  }
  if ('CreateFunctionStmt' in stmt) return functionPower(stmt.CreateFunctionStmt, text)
  return undefined
}

type Tree = Readonly<Record<string, unknown>>

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null
}

/** Every object of a parse tree, depth first in source order, until `visit` names a problem. */
function firstIn(node: unknown, visit: (tree: Tree) => string | undefined): string | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = firstIn(item, visit)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (!isTree(node)) return undefined
  return visit(node) ?? firstIn(Object.values(node), visit)
}

/**
 * A table named with a schema, or by a name the Hub's transaction owns: the snapshot (`cx_`) or the
 * ledger. Either could fool the outcome check.
 */
function outsideTheApp(node: unknown): string | undefined {
  return firstIn(node, (tree) => {
    if (typeof tree.relname !== 'string') return undefined
    if (typeof tree.schemaname === 'string') return `${tree.schemaname}.${tree.relname}`
    const ours = /^cx_/i.test(tree.relname) || tree.relname === 'conexus_migration'
    return ours ? tree.relname : undefined
  })
}

/** A function's power: its language, `SECURITY DEFINER`, and what its body does. */
function functionPower(fn: CreateFunctionStmt, text: string): string | undefined {
  if (fn.sql_body !== undefined) return 'sql_body'
  const options = new Map(
    (fn.options ?? []).flatMap((option) =>
      'DefElem' in option ? [[option.DefElem.defname, option.DefElem.arg]] : [],
    ),
  )
  const language = Object(Object(options.get('language')).String).sval
  if (language !== 'sql' && language !== 'plpgsql') return `language ${language}`
  if (Object(Object(options.get('security')).Boolean).boolval === true) return 'SECURITY DEFINER'
  if (language === 'sql') {
    return bodyPower(String(Object(Object(Object(options.get('as')).List).items?.[0]).String?.sval))
  }
  const returnsTrigger = (fn.returnType?.names ?? []).some(
    (name) => 'String' in name && name.String.sval === 'trigger',
  )
  return plpgsqlPower(text, returnsTrigger)
}

/**
 * A body that changes another row: anything past reading and inserting, an upsert included, or a
 * name outside the app.
 */
function bodyPower(sql: string): string | undefined {
  const read = readWith(parseSync, sql)
  if (!('tree' in read)) return 'UNREADABLE'
  const outside = outsideTheApp(read.tree)
  if (outside !== undefined) return `name ${outside}`
  return firstIn(read.tree, (node) => {
    for (const [key, value] of Object.entries(node)) {
      // A node's kind starts upper case; `selectStmt` is a field of `InsertStmt`.
      if (/^[A-Z]\w*Stmt$/.test(key) && !BODY_ALLOWED.has(key)) return `body ${key}`
      if (key === 'onConflictClause' && Object(value).action === 'ONCONFLICT_UPDATE') {
        return 'body ON CONFLICT DO UPDATE'
      }
    }
    return undefined
  })
}

/**
 * A PL/pgSQL body's power: dynamic SQL, a statement that changes another row, an error or an
 * `ASSERT` that refuses the write, or a `RETURN` of anything but `NEW`, which drops or replaces a
 * trigger's row.
 */
function plpgsqlPower(statement: string, returnsTrigger: boolean): string | undefined {
  const read = readWith(parsePlPgSQLSync, statement)
  if (!('tree' in read)) return 'UNREADABLE'
  const fn = Object(Object(Object(read.tree).plpgsql_funcs)[0]).PLpgSQL_function
  const datums: unknown[] = Array.isArray(fn?.datums) ? fn.datums : []
  function isNew(varno: unknown) {
    return typeof varno === 'number' && Object(Object(datums[varno]).PLpgSQL_rec).refname === 'new'
  }
  // The `RETURN` PL/pgSQL adds after a last statement that is not one has no line: a trigger's
  // falls off its end there, an error that refuses the write.
  function returnsOther(ret: Tree) {
    return ret.lineno === undefined ? returnsTrigger : !isNew(ret.retvarno)
  }
  return firstIn(fn?.action, (node) => {
    if (DYNAMIC.some((key) => key in node)) return 'EXECUTE'
    if ('PLpgSQL_stmt_assert' in node) return 'ASSERT'
    const { PLpgSQL_stmt_raise: raise, PLpgSQL_stmt_return: ret, PLpgSQL_expr: expr } = node
    if (isTree(raise) && Number(raise.elog_level) >= ERROR_LEVEL) return 'RAISE EXCEPTION'
    if (isTree(ret) && returnsOther(ret)) return 'RETURN not NEW'
    // Mode 0 is a whole statement (`execsql`, `PERFORM`, a loop's query); the others are expressions.
    return isTree(expr) && (expr.parseMode ?? 0) === 0 ? bodyPower(String(expr.query)) : undefined
  })
}
